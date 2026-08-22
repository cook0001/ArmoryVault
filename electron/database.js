const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const VaultEncryption = require('./VaultEncryption');
const BackupManager = require('./BackupManager');
const MediaManager = require('./MediaManager');

/**
 * Database is the unified facade that composes VaultEncryption, BackupManager,
 * and MediaManager. It maintains the same public API surface as the original
 * monolithic class so that main.js and preload.js require no changes.
 */
class Database {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'firearms_inventory.json'); // Legacy
    this.encPath = path.join(app.getPath('userData'), 'firearms_inventory.enc');
    this.photoDir = path.join(app.getPath('userData'), 'photos');
    this.docDir = path.join(app.getPath('userData'), 'documents');

    // Compose modules
    this.vault = new VaultEncryption(this.encPath, this.dbPath);
    this.backup = new BackupManager(this.vault, () => this.getConfig());
    this.media = new MediaManager(this.photoDir, this.docDir);
  }

  // ─── Vault Delegation ──────────────────────────────────────────────
  isVaultSetup() {
    return this.vault.isVaultSetup();
  }
  isLocked() {
    return this.vault.isLocked();
  }
  setupVault(password) {
    return this.vault.setupVault(password);
  }
  unlockVault(password) {
    return this.vault.unlockVault(password);
  }
  unlockWithRecoveryCode(code) {
    return this.vault.unlockWithRecoveryCode(code);
  }
  changePassword(currentPassword, newPassword, regenerateRecoveryKey) {
    return this.vault.changePassword(currentPassword, newPassword, regenerateRecoveryKey);
  }
  regenerateRecoveryKey(currentPassword) {
    return this.vault.regenerateRecoveryKey(currentPassword);
  }
  getRecoveryCode() {
    return this.vault.getRecoveryCode();
  }
  lockVault() {
    return this.vault.lockVault();
  }
  getData() {
    return this.vault.getData();
  }
  saveData(dataObj) {
    this.vault.saveData(dataObj);
    // Trigger backup after flush
    this.backup.triggerBackup();
  }
  flushSync() {
    return this.vault.flushSync();
  }
  getLastModified() {
    return this.vault.getLastModified();
  }

  // ─── Config ────────────────────────────────────────────────────────
  getConfig() {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return {};
  }

  setConfig(key, value) {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    const config = this.getConfig();
    config[key] = value;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  // ─── Companion API Pairing Token ─────────────────────────────────────
  generatePairingToken() {
    const token = crypto.randomBytes(32).toString('hex');
    this.setConfig('pairingToken', token);
    return token;
  }

  getPairingToken() {
    return this.getConfig().pairingToken || null;
  }

  validatePairingToken(token) {
    if (!token || typeof token !== 'string') return false;
    const stored = this.getPairingToken();
    if (!stored) return false;
    // Constant-time comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(Buffer.from(token, 'utf8'), Buffer.from(stored, 'utf8'));
    } catch (e) {
      return false;
    }
  }

  revokePairingToken() {
    this.setConfig('pairingToken', null);
  }

  // ─── Backup Delegation ─────────────────────────────────────────────
  getBackupPath() {
    return this.backup.getBackupPath();
  }
  setBackupPath(backupPath) {
    this.setConfig('backupPath', backupPath);
    this.backup.triggerBackup();
  }
  triggerBackup() {
    return this.backup.triggerBackup();
  }
  createZipBackup(targetPath) {
    return this.backup.createZipBackup(targetPath, this.photoDir, this.docDir);
  }
  restoreBackup(sourcePath) {
    return this.backup.restoreBackup(sourcePath, this.photoDir, this.docDir);
  }

  // ─── Media Delegation ──────────────────────────────────────────────
  savePhoto(sourcePath, filename) {
    return this.media.savePhoto(sourcePath, filename);
  }
  saveDocument(sourcePath, filename) {
    return this.media.saveDocument(sourcePath, filename);
  }

  // ─── Activity Logging ──────────────────────────────────────────────
  addActivityLog(entry) {
    const data = this.getData();
    if (!Array.isArray(data.activity_log)) {
      data.activity_log = [];
    }
    data.activity_log.push({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    });
    // Cap at 1000 most recent entries
    if (data.activity_log.length > 1000) {
      data.activity_log = data.activity_log.slice(-1000);
    }
    this.saveData(data);
  }

  getActivityLog() {
    const data = this.getData();
    return data.activity_log || [];
  }

  // ─── Firearms CRUD ─────────────────────────────────────────────────
  getFirearms() {
    return this.getData().firearms;
  }

  saveFirearms(firearms) {
    const data = this.getData();
    data.firearms = firearms;
    this.saveData(data);
  }

  addFirearm(firearm) {
    const data = this.getData();
    const newId = this.vault.getNextId('firearms');
    data.firearms.push({ ...firearm, id: newId });
    this.saveData(data);
    this.addActivityLog({
      action: 'add',
      entityType: 'firearm',
      entityId: newId,
      detail: `${firearm.make || ''} ${firearm.model || ''}`.trim(),
      source: 'desktop',
    });
    return newId;
  }

  updateFirearm(id, firearm) {
    const firearms = this.getFirearms();
    const index = firearms.findIndex((f) => f.id === id);
    if (index !== -1) {
      firearms[index] = { ...firearm, id };
      this.saveFirearms(firearms);
    }
    return id;
  }

  deleteFirearm(id) {
    const firearms = this.getFirearms();
    const target = firearms.find((f) => f.id === id);
    const remaining = firearms.filter((f) => f.id !== id);
    this.saveFirearms(remaining);
    if (target) {
      this.addActivityLog({
        action: 'delete',
        entityType: 'firearm',
        entityId: id,
        detail: `${target.make || ''} ${target.model || ''}`.trim(),
        source: 'desktop',
      });
    }
    return id;
  }

  logRangeSession(sessionData) {
    const { firearm_id, ammo_id, rounds_fired, date, notes, cost, location } = sessionData;
    const rounds = Number(rounds_fired) || 0;
    if (rounds <= 0) return { success: false, error: 'Rounds fired must be greater than 0' };

    const data = this.getData();
    let firearmRounds = 0;
    let ammoRemaining;

    // 1. Update firearm logs
    const firearmIndex = (data.firearms || []).findIndex((f) => f.id === Number(firearm_id));
    if (firearmIndex !== -1) {
      const firearm = data.firearms[firearmIndex];
      const logs = firearm.logs || [];
      const newLogId = logs.length > 0 ? Math.max(...logs.map((l) => l.id || 0)) + 1 : 1;

      let ammoName = '';
      if (ammo_id) {
        const ammo = (data.ammo || []).find((a) => a.id === Number(ammo_id));
        if (ammo) {
          ammoName = `${ammo.manufacturer ? ammo.manufacturer + ' ' : ''}${ammo.caliber}${ammo.grain ? ' ' + ammo.grain + 'gr' : ''}`;
        }
      }

      const newLog = {
        id: newLogId,
        date: date || new Date().toISOString().split('T')[0],
        type: 'Range',
        rounds_fired: rounds,
        ammo_used: ammoName || sessionData.ammo_name || '',
        cost: Number(cost) || 0,
        notes: [location ? `Location: ${location}` : '', notes].filter(Boolean).join(' - '),
      };

      logs.push(newLog);
      firearm.logs = logs;
      firearmRounds = logs
        .filter((l) => l.type === 'Range')
        .reduce((sum, l) => sum + (l.rounds_fired || 0), 0);
    }

    // 2. Deduct from ammo inventory if ammo_id provided
    if (ammo_id) {
      const ammoIndex = (data.ammo || []).findIndex((a) => a.id === Number(ammo_id));
      if (ammoIndex !== -1) {
        const currentCount = Number(data.ammo[ammoIndex].count) || 0;
        const newCount = Math.max(0, currentCount - rounds);
        data.ammo[ammoIndex].count = newCount;
        ammoRemaining = newCount;
      }
    }

    // 3. Increment round counts on all accessories mounted to this firearm
    if (firearm_id && Array.isArray(data.accessories)) {
      data.accessories.forEach((acc) => {
        if (
          acc.mounts &&
          Array.isArray(acc.mounts) &&
          acc.mounts.some((m) => m.firearmId === Number(firearm_id))
        ) {
          acc.round_count = (Number(acc.round_count) || 0) + rounds;
        }
      });
    }

    this.saveData(data);
    this.addActivityLog({
      action: 'range_session',
      entityType: 'firearm',
      entityId: Number(firearm_id),
      detail: `${rounds} rounds fired`,
      source: 'desktop',
    });
    return { success: true, firearm_rounds: firearmRounds, ammo_remaining: ammoRemaining };
  }

  completeMaintenanceTask(firearmId, taskId, logData) {
    const data = this.getData();
    const firearmIndex = (data.firearms || []).findIndex((f) => f.id === Number(firearmId));
    if (firearmIndex === -1) return false;

    const firearm = data.firearms[firearmIndex];
    const logs = firearm.logs || [];
    const newLogId = logs.length > 0 ? Math.max(...logs.map((l) => l.id || 0)) + 1 : 1;

    // Calculate current total rounds
    const currentRounds = logs
      .filter((l) => l.type === 'Range')
      .reduce((sum, l) => sum + (l.rounds_fired || 0), 0);

    // Append rich maintenance log
    const newLog = {
      id: newLogId,
      date: logData.date || new Date().toISOString().split('T')[0],
      type: 'Repair',
      installed_part_details: logData.part_details || logData.action_performed || '',
      repaired_part: logData.action_performed || '',
      cost: Number(logData.cost) || 0,
      notes: logData.notes || '',
    };
    logs.push(newLog);
    firearm.logs = logs;

    // Update maintenance schedule item
    if (firearm.maintenance_schedules && taskId) {
      const taskIndex = firearm.maintenance_schedules.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        firearm.maintenance_schedules[taskIndex].last_performed_rounds = currentRounds;
        firearm.maintenance_schedules[taskIndex].last_performed_date =
          logData.date || new Date().toISOString().split('T')[0];
      }
    }

    this.saveData(data);
    return true;
  }

  // ─── Ammo CRUD ─────────────────────────────────────────────────────
  getAmmo() {
    return this.getData().ammo;
  }

  saveAmmoList(ammoList) {
    const data = this.getData();
    data.ammo = ammoList;
    this.saveData(data);
  }

  addAmmo(ammo) {
    const data = this.getData();
    const newId = this.vault.getNextId('ammo');
    data.ammo.push({ ...ammo, id: newId });
    this.saveData(data);
    this.addActivityLog({
      action: 'add',
      entityType: 'ammo',
      entityId: newId,
      detail: `${ammo.manufacturer || ''} ${ammo.caliber || ''}`.trim(),
      source: 'desktop',
    });
    return newId;
  }

  updateAmmo(id, ammo) {
    const ammoList = this.getAmmo();
    const index = ammoList.findIndex((a) => a.id === id);
    if (index !== -1) {
      ammoList[index] = { ...ammo, id };
      this.saveAmmoList(ammoList);
    }
    return id;
  }

  deleteAmmo(id) {
    const ammoList = this.getAmmo();
    const target = ammoList.find((a) => a.id === id);
    const remaining = ammoList.filter((a) => a.id !== id);
    this.saveAmmoList(remaining);
    if (target) {
      this.addActivityLog({
        action: 'delete',
        entityType: 'ammo',
        entityId: id,
        detail: `${target.manufacturer || ''} ${target.caliber || ''}`.trim(),
        source: 'desktop',
      });
    }
    return id;
  }

  // ─── Accessories CRUD ──────────────────────────────────────────────
  getAccessories() {
    return this.getData().accessories || [];
  }

  saveAccessoriesList(accessoriesList) {
    const data = this.getData();
    data.accessories = accessoriesList;
    this.saveData(data);
  }

  addAccessory(accessory) {
    const data = this.getData();
    const newId = this.vault.getNextId('accessories');
    data.accessories.push({ ...accessory, id: newId });
    this.saveData(data);
    this.addActivityLog({
      action: 'add',
      entityType: 'accessory',
      entityId: newId,
      detail: `${accessory.manufacturer || ''} ${accessory.model || ''}`.trim(),
      source: 'desktop',
    });
    return newId;
  }

  updateAccessory(id, accessory) {
    const list = this.getAccessories();
    const index = list.findIndex((a) => a.id === id);
    if (index !== -1) {
      list[index] = { ...accessory, id };
      this.saveAccessoriesList(list);
    }
    return id;
  }

  deleteAccessory(id) {
    const list = this.getAccessories();
    const target = list.find((a) => a.id === id);
    const remaining = list.filter((a) => a.id !== id);
    this.saveAccessoriesList(remaining);
    if (target) {
      this.addActivityLog({
        action: 'delete',
        entityType: 'accessory',
        entityId: id,
        detail: `${target.manufacturer || ''} ${target.model || ''}`.trim(),
        source: 'desktop',
      });
    }
    return id;
  }

  // ─── Components CRUD ───────────────────────────────────────────────
  getComponents() {
    return this.getData().components || [];
  }

  saveComponentsList(componentsList) {
    const data = this.getData();
    data.components = componentsList;
    this.saveData(data);
  }

  addComponent(component) {
    const data = this.getData();
    const newId = this.vault.getNextId('components');
    data.components.push({ ...component, id: newId });
    this.saveData(data);
    return newId;
  }

  updateComponent(id, component) {
    const list = this.getComponents();
    const index = list.findIndex((c) => c.id === id);
    if (index !== -1) {
      list[index] = { ...component, id };
      this.saveComponentsList(list);
    }
    return id;
  }

  deleteComponent(id) {
    let list = this.getComponents();
    list = list.filter((c) => c.id !== id);
    this.saveComponentsList(list);
    return id;
  }

  // ─── SKUs ──────────────────────────────────────────────────────────
  getSkus() {
    const data = this.getData();
    return data && data.skus ? data.skus : {};
  }

  saveSkus(skus) {
    const data = this.getData();
    data.skus = { ...(data.skus || {}), ...(skus || {}) };
    this.saveData(data);
  }

  deleteSku(skuId) {
    const data = this.getData();
    if (data.skus && data.skus[skuId]) {
      delete data.skus[skuId];
      this.saveData(data);
    }
    return skuId;
  }

  // ─── Custom Schedule Presets ────────────────────────────────────────
  getCustomSchedulePresets() {
    const data = this.getData();
    return Array.isArray(data.custom_schedule_presets) ? data.custom_schedule_presets : [];
  }

  saveCustomSchedulePresets(presets) {
    const data = this.getData();
    data.custom_schedule_presets = Array.isArray(presets) ? presets : [];
    this.saveData(data);
    return true;
  }

  // ─── Handload Batch Manufacturing ──────────────────────────────────
  manufactureHandloadBatch(ammoId, quantity, deductions) {
    const data = this.getData();
    const ammoIndex = (data.ammo || []).findIndex((a) => a.id === Number(ammoId));
    if (ammoIndex === -1) {
      return { success: false, error: 'Ammunition recipe not found in inventory.' };
    }

    const batchCount = Number(quantity) || 0;
    if (batchCount <= 0) {
      return { success: false, error: 'Invalid batch quantity.' };
    }

    // 1. Deduct powder
    if (deductions.powderId && (deductions.powderAmount || deductions.powderAmountGrains)) {
      const comp = (data.components || []).find((c) => c.id === Number(deductions.powderId));
      if (comp) {
        let amountToDeduct = Number(deductions.powderAmount) || 0;
        if (deductions.powderAmountGrains) {
          const totalGrains = Number(deductions.powderAmountGrains) * batchCount;
          if (comp.weightUnit === 'oz') {
            amountToDeduct = totalGrains / 437.5;
          } else if (comp.weightUnit === 'grains' || comp.weightUnit === 'gr') {
            amountToDeduct = totalGrains;
          } else {
            // Default to lbs (7000 grains = 1 lb)
            amountToDeduct = totalGrains / 7000;
          }
        }
        comp.quantity = Math.max(
          0,
          Number((Number(comp.quantity || 0) - amountToDeduct).toFixed(4))
        );
      }
    }

    // 2. Deduct Primers
    if (deductions.primerId && (deductions.primerCount || batchCount)) {
      const primerDeduct = deductions.primerCount ? Number(deductions.primerCount) : batchCount;
      const comp = (data.components || []).find((c) => c.id === Number(deductions.primerId));
      if (comp) {
        comp.quantity = Math.max(0, Math.round(Number(comp.quantity || 0) - primerDeduct));
      }
    }

    // 3. Deduct Brass / Cases
    if (deductions.brassId && (deductions.brassCount || batchCount)) {
      const brassDeduct = deductions.brassCount ? Number(deductions.brassCount) : batchCount;
      const comp = (data.components || []).find((c) => c.id === Number(deductions.brassId));
      if (comp) {
        comp.quantity = Math.max(0, Math.round(Number(comp.quantity || 0) - brassDeduct));
      }
    }

    // 4. Deduct Bullets / Projectiles
    if (deductions.bulletId && (deductions.bulletCount || batchCount)) {
      const bulletDeduct = deductions.bulletCount ? Number(deductions.bulletCount) : batchCount;
      const comp = (data.components || []).find((c) => c.id === Number(deductions.bulletId));
      if (comp) {
        comp.quantity = Math.max(0, Math.round(Number(comp.quantity || 0) - bulletDeduct));
      }
    }

    // 5. Increment Ammo Inventory
    const currentAmmoCount = Number(data.ammo[ammoIndex].count) || 0;
    const newCount = currentAmmoCount + batchCount;
    data.ammo[ammoIndex].count = newCount;

    this.saveData(data);
    this.addActivityLog({
      action: 'manufacture',
      entityType: 'ammo',
      entityId: Number(ammoId),
      detail: `Manufactured ${batchCount} rounds`,
      source: 'desktop',
    });
    return { success: true, newAmmoCount: newCount };
  }

  // ─── Sync Queue ────────────────────────────────────────────────────
  getSyncQueue() {
    return this.getData().sync_queue || [];
  }

  saveSyncQueue(queue) {
    const data = this.getData();
    data.sync_queue = queue;
    this.saveData(data);
  }

  addSyncItem(item) {
    const data = this.getData();
    const newId = this.vault.getNextId('sync_queue');
    data.sync_queue = data.sync_queue || [];
    data.sync_queue.push({ ...item, id: newId });
    this.saveData(data);
    return newId;
  }

  removeSyncItem(id) {
    let queue = this.getSyncQueue();
    queue = queue.filter((i) => i.id !== id);
    this.saveSyncQueue(queue);
    return id;
  }

  clearSyncQueue() {
    this.saveSyncQueue([]);
  }

  // ─── Storage Locations ──────────────────────────────────────────────
  getStorageLocations() {
    const data = this.getData();
    return data.storage_locations || [];
  }

  saveStorageLocations(list) {
    const data = this.getData();
    data.storage_locations = list;
    this.saveData(data);
  }

  addStorageLocation(loc) {
    const data = this.getData();
    const newId = this.vault.getNextId('storage_locations');
    data.storage_locations = data.storage_locations || [];
    data.storage_locations.push({ ...loc, id: newId });
    this.saveData(data);
    return newId;
  }

  updateStorageLocation(id, loc) {
    const list = this.getStorageLocations();
    const index = list.findIndex((l) => l.id === id);
    if (index !== -1) {
      list[index] = { ...loc, id };
      this.saveStorageLocations(list);
    }
    return id;
  }

  deleteStorageLocation(id) {
    let list = this.getStorageLocations();
    list = list.filter((l) => l.id !== id);
    this.saveStorageLocations(list);
    return id;
  }

  // ─── Chronograph Strings ────────────────────────────────────────────
  getChronoStrings() {
    const data = this.getData();
    return data.chrono_strings || [];
  }

  saveChronoStrings(list) {
    const data = this.getData();
    data.chrono_strings = list;
    this.saveData(data);
  }

  addChronoString(cs) {
    const data = this.getData();
    const newId = this.vault.getNextId('chrono_strings');
    data.chrono_strings = data.chrono_strings || [];
    data.chrono_strings.push({ ...cs, id: newId });
    this.saveData(data);
    return newId;
  }

  deleteChronoString(id) {
    let list = this.getChronoStrings();
    list = list.filter((c) => c.id !== id);
    this.saveChronoStrings(list);
    return id;
  }

  // ─── Target Analyses ────────────────────────────────────────────────
  getTargetAnalyses() {
    const data = this.getData();
    return data.target_analyses || [];
  }

  saveTargetAnalyses(list) {
    const data = this.getData();
    data.target_analyses = list;
    this.saveData(data);
  }

  addTargetAnalysis(ta) {
    const data = this.getData();
    const newId = this.vault.getNextId('target_analyses');
    data.target_analyses = data.target_analyses || [];
    data.target_analyses.push({ ...ta, id: newId });
    this.saveData(data);
    return newId;
  }

  deleteTargetAnalysis(id) {
    let list = this.getTargetAnalyses();
    list = list.filter((t) => t.id !== id);
    this.saveTargetAnalyses(list);
    return id;
  }

  // ─── Load Ladder Tests ──────────────────────────────────────────────
  getLoadLadderTests() {
    const data = this.getData();
    return data.load_ladder_tests || [];
  }

  saveLoadLadderTests(list) {
    const data = this.getData();
    data.load_ladder_tests = list;
    this.saveData(data);
  }

  addLoadLadderTest(lt) {
    const data = this.getData();
    const newId = this.vault.getNextId('load_ladder_tests');
    data.load_ladder_tests = data.load_ladder_tests || [];
    data.load_ladder_tests.push({ ...lt, id: newId });
    this.saveData(data);
    return newId;
  }

  updateLoadLadderTest(id, lt) {
    const list = this.getLoadLadderTests();
    const index = list.findIndex((l) => l.id === id);
    if (index !== -1) {
      list[index] = { ...lt, id };
      this.saveLoadLadderTests(list);
    }
    return id;
  }

  deleteLoadLadderTest(id) {
    let list = this.getLoadLadderTests();
    list = list.filter((l) => l.id !== id);
    this.saveLoadLadderTests(list);
    return id;
  }

  // ─── Ballistic Profiles ────────────────────────────────────────────
  getBallisticProfiles() {
    const data = this.getData();
    return data.ballistic_profiles || [];
  }

  saveBallisticProfiles(list) {
    const data = this.getData();
    data.ballistic_profiles = list;
    this.saveData(data);
  }

  addBallisticProfile(bp) {
    const data = this.getData();
    const newId = this.vault.getNextId('ballistic_profiles');
    data.ballistic_profiles = data.ballistic_profiles || [];
    data.ballistic_profiles.push({ ...bp, id: newId });
    this.saveData(data);
    return newId;
  }

  updateBallisticProfile(id, bp) {
    const list = this.getBallisticProfiles();
    const index = list.findIndex((b) => b.id === id);
    if (index !== -1) {
      list[index] = { ...bp, id };
      this.saveBallisticProfiles(list);
    }
    return id;
  }

  deleteBallisticProfile(id) {
    let list = this.getBallisticProfiles();
    list = list.filter((b) => b.id !== id);
    this.saveBallisticProfiles(list);
    return id;
  }
}

module.exports = new Database();
