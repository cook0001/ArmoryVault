const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const VaultEncryption = require('./VaultEncryption');
const SkuDatabase = require('./SkuDatabase');
const ActivityLogDatabase = require('./ActivityLogDatabase');
const ModuleDataManager = require('./ModuleDataManager');
const BackupManager = require('./BackupManager');
const MediaManager = require('./MediaManager');

function sanitizeCurrency(val, fallback = null) {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return Number.isNaN(val) ? fallback : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleaned);
    return Number.isNaN(num) ? fallback : num;
  }
  return fallback;
}

function sanitizeFirearm(firearm) {
  if (!firearm || typeof firearm !== 'object') return firearm;
  const clone = { ...firearm };
  if (clone.purchase_price !== undefined) {
    clone.purchase_price = sanitizeCurrency(clone.purchase_price, null);
  }
  if (clone.sold_price !== undefined) {
    clone.sold_price = sanitizeCurrency(clone.sold_price, null);
  }
  if (Array.isArray(clone.logs)) {
    clone.logs = clone.logs.map((log) => {
      if (!log || typeof log !== 'object') return log;
      const l = { ...log };
      if (l.cost !== undefined) {
        l.cost = sanitizeCurrency(l.cost, 0);
      }
      return l;
    });
  }
  return clone;
}

function sanitizeAccessory(acc) {
  if (!acc || typeof acc !== 'object') return acc;
  const clone = { ...acc };
  if (clone.value !== undefined) {
    clone.value = sanitizeCurrency(clone.value, null);
  }
  return clone;
}

function sanitizeComponent(comp) {
  if (!comp || typeof comp !== 'object') return comp;
  const clone = { ...comp };
  if (clone.cost !== undefined) {
    clone.cost = sanitizeCurrency(clone.cost, undefined);
  }
  return clone;
}

function sanitizeAmmo(ammo) {
  if (!ammo || typeof ammo !== 'object') return ammo;
  const clone = { ...ammo };
  if (clone.costPerRound !== undefined) {
    clone.costPerRound = sanitizeCurrency(clone.costPerRound, undefined);
  }
  if (clone.boxPrice !== undefined) {
    clone.boxPrice = sanitizeCurrency(clone.boxPrice, undefined);
  }
  return clone;
}

/**
 * Database is the unified facade that composes VaultEncryption, BackupManager,
 * MediaManager, and SkuDatabase. It maintains the same public API surface as the original
 * monolithic class so that main.js and preload.js require no changes.
 */
class Database {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'firearms_inventory.json'); // Legacy
    this.encPath = path.join(app.getPath('userData'), 'firearms_inventory.enc');
    this.skuDbPath = path.join(app.getPath('userData'), 'skus_database.enc');
    this.activityLogPath = path.join(app.getPath('userData'), 'activity_log.enc');
    this.moduleDataDir = path.join(app.getPath('userData'), 'module_data');
    this.photoDir = path.join(app.getPath('userData'), 'photos');
    this.docDir = path.join(app.getPath('userData'), 'documents');

    // Compose modules
    this.vault = new VaultEncryption(this.encPath, this.dbPath);
    this.skuDatabase = new SkuDatabase(this.skuDbPath);
    this.activityLogDatabase = new ActivityLogDatabase(this.activityLogPath);
    this.moduleDataManager = new ModuleDataManager(this.moduleDataDir);
    this.backup = new BackupManager(
      this.vault,
      () => this.getConfig(),
      this.skuDatabase,
      this.activityLogDatabase,
      this.moduleDataManager
    );
    this.media = new MediaManager(this.photoDir, this.docDir);

    // Auto-migrate module data from config.json to dedicated files on startup
    this._migrateModuleDataFromConfig();
  }

  // ─── Vault Delegation ──────────────────────────────────────────────
  isVaultSetup() {
    return this.vault.isVaultSetup();
  }
  isLocked() {
    return this.vault.isLocked();
  }
  setupVault(password) {
    const code = this.vault.setupVault(password);
    if (this.vault.masterKey) {
      this.skuDatabase.unlock(this.vault.masterKey, this.vault.vaultMeta);
      this.activityLogDatabase.unlock(this.vault.masterKey, this.vault.vaultMeta);
      this._migrateLegacySkusIfAny();
      this._migrateLegacyActivityLogIfAny();
    }
    return code;
  }
  unlockVault(password) {
    const ok = this.vault.unlockVault(password);
    if (ok && this.vault.masterKey) {
      this.skuDatabase.unlock(this.vault.masterKey, this.vault.vaultMeta);
      this.activityLogDatabase.unlock(this.vault.masterKey, this.vault.vaultMeta);
      this._migrateLegacySkusIfAny();
      this._migrateLegacyActivityLogIfAny();
    }
    return ok;
  }
  unlockWithRecoveryCode(code) {
    const ok = this.vault.unlockWithRecoveryCode(code);
    if (ok && this.vault.masterKey) {
      this.skuDatabase.unlock(this.vault.masterKey, this.vault.vaultMeta);
      this.activityLogDatabase.unlock(this.vault.masterKey, this.vault.vaultMeta);
      this._migrateLegacySkusIfAny();
      this._migrateLegacyActivityLogIfAny();
    }
    return ok;
  }
  changePassword(currentPassword, newPassword, regenerateRecoveryKey) {
    const res = this.vault.changePassword(currentPassword, newPassword, regenerateRecoveryKey);
    if (res && res.success && this.vault.masterKey) {
      this.skuDatabase.updateVaultMeta(this.vault.vaultMeta, this.vault.masterKey);
      this.activityLogDatabase.updateVaultMeta(this.vault.vaultMeta, this.vault.masterKey);
    }
    return res;
  }
  regenerateRecoveryKey(currentPassword) {
    return this.vault.regenerateRecoveryKey(currentPassword);
  }
  getRecoveryCode() {
    return this.vault.getRecoveryCode();
  }
  lockVault() {
    this.skuDatabase.lock();
    this.activityLogDatabase.lock();
    return this.vault.lockVault();
  }

  _migrateLegacySkusIfAny() {
    try {
      if (!this.skuDatabase.hasData()) {
        const vaultData = this.vault.getData();
        if (vaultData && vaultData.skus && Object.keys(vaultData.skus).length > 0) {
          console.log(
            `[SkuDatabase] Migrating ${Object.keys(vaultData.skus).length} legacy SKUs into skus_database.enc`
          );
          this.skuDatabase.saveSkus(vaultData.skus);
          this.skuDatabase.flushSync();
          delete vaultData.skus;
          this.vault.saveData(vaultData);
          this.vault.flushSync();
        }
      }
    } catch (e) {
      console.error('[SkuDatabase] Migration error:', e);
    }
  }

  _migrateLegacyActivityLogIfAny() {
    try {
      if (!this.activityLogDatabase.hasData()) {
        const vaultData = this.vault.getData();
        if (
          vaultData &&
          Array.isArray(vaultData.activity_log) &&
          vaultData.activity_log.length > 0
        ) {
          console.log(
            `[ActivityLogDatabase] Migrating ${vaultData.activity_log.length} legacy activity log entries into activity_log.enc`
          );
          this.activityLogDatabase.saveEntries(vaultData.activity_log);
          this.activityLogDatabase.flushSync();
          delete vaultData.activity_log;
          this.vault.saveData(vaultData);
          this.vault.flushSync();
        }
      }
    } catch (e) {
      console.error('[ActivityLogDatabase] Migration error:', e);
    }
  }

  _migrateModuleDataFromConfig() {
    try {
      const configPath = path.join(app.getPath('userData'), 'config.json');
      if (!fs.existsSync(configPath)) return;
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const { migratedKeys, cleanedConfig } = this.moduleDataManager.migrateFromConfig(raw);
      if (migratedKeys && migratedKeys.length > 0) {
        console.log(
          `[ModuleDataManager] Migrated keys to dedicated files in module_data/: ${migratedKeys.join(', ')}`
        );
        fs.writeFileSync(configPath, JSON.stringify(cleanedConfig, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[ModuleDataManager] Migration error:', e);
    }
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

  // ─── Config & Module Data ─────────────────────────────────────────
  getConfig(key) {
    if (key && this.moduleDataManager && this.moduleDataManager.isModuleDataKey(key)) {
      return this.moduleDataManager.getData(key);
    }
    const configPath = path.join(app.getPath('userData'), 'config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return key ? parsed[key] : parsed;
    }
    return key ? undefined : {};
  }

  setConfig(key, value) {
    if (this.moduleDataManager && this.moduleDataManager.isModuleDataKey(key)) {
      return this.moduleDataManager.setData(key, value);
    }
    const configPath = path.join(app.getPath('userData'), 'config.json');
    const config = this.getConfig();
    config[key] = value;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  getModuleData(key, fallback = []) {
    return this.moduleDataManager ? this.moduleDataManager.getData(key, fallback) : fallback;
  }

  setModuleData(key, data) {
    return this.moduleDataManager ? this.moduleDataManager.setData(key, data) : false;
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
    } catch (_e) {
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
    if (this.activityLogDatabase) {
      return this.activityLogDatabase.addEntry(entry);
    }
  }

  getActivityLog() {
    if (this.activityLogDatabase) {
      return this.activityLogDatabase.getEntries();
    }
    return [];
  }

  clearActivityLog() {
    if (this.activityLogDatabase) {
      return this.activityLogDatabase.clearLog();
    }
    return false;
  }

  // ─── Firearms CRUD ─────────────────────────────────────────────────
  getFirearms() {
    const list = this.getData().firearms || [];
    return list.map(sanitizeFirearm);
  }

  saveFirearms(firearms) {
    const data = this.getData();
    data.firearms = (firearms || []).map(sanitizeFirearm);
    this.saveData(data);
  }

  addFirearm(firearm) {
    const data = this.getData();
    const newId = this.vault.getNextId('firearms');
    const sanitized = sanitizeFirearm({ ...firearm, id: newId });
    data.firearms.push(sanitized);
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

  importFirearmsBatch(firearmsList, updatesList = []) {
    const data = this.getData();
    if (!data.firearms) data.firearms = [];

    if (Array.isArray(updatesList)) {
      for (const update of updatesList) {
        const idx = data.firearms.findIndex((f) => f.id === update.existingId);
        if (idx !== -1) {
          data.firearms[idx] = sanitizeFirearm({
            ...data.firearms[idx],
            ...update.updatedItem,
            id: update.existingId,
          });
        }
      }
    }

    const insertedIds = [];
    if (Array.isArray(firearmsList)) {
      for (const f of firearmsList) {
        const newId = this.vault.getNextId('firearms');
        const sanitized = sanitizeFirearm({ ...f, id: newId });
        data.firearms.push(sanitized);
        insertedIds.push(newId);
      }
    }

    this.saveData(data);
    this.addActivityLog({
      action: 'import',
      entityType: 'firearm',
      entityId: insertedIds.length + (updatesList ? updatesList.length : 0),
      detail: `Imported ${insertedIds.length} firearms (${updatesList ? updatesList.length : 0} updated) from CSV`,
      source: 'desktop',
    });

    return {
      insertedCount: insertedIds.length,
      updatedCount: updatesList ? updatesList.length : 0,
    };
  }

  updateFirearm(id, firearm) {
    const firearms = this.getFirearms();
    const index = firearms.findIndex((f) => f.id === id);
    if (index !== -1) {
      firearms[index] = sanitizeFirearm({ ...firearm, id });
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
    const list = this.getData().ammo || [];
    return list.map(sanitizeAmmo);
  }

  saveAmmoList(ammoList) {
    const data = this.getData();
    data.ammo = (ammoList || []).map(sanitizeAmmo);
    this.saveData(data);
  }

  addAmmo(ammo) {
    const data = this.getData();
    const newId = this.vault.getNextId('ammo');
    const sanitized = sanitizeAmmo({ ...ammo, id: newId });
    data.ammo.push(sanitized);
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

  importAmmoBatch(ammoList, updatesList = []) {
    const data = this.getData();
    if (!data.ammo) data.ammo = [];

    if (Array.isArray(updatesList)) {
      for (const update of updatesList) {
        const idx = data.ammo.findIndex((a) => a.id === update.existingId);
        if (idx !== -1) {
          data.ammo[idx] = sanitizeAmmo({
            ...data.ammo[idx],
            ...update.updatedItem,
            id: update.existingId,
          });
        }
      }
    }

    const insertedIds = [];
    if (Array.isArray(ammoList)) {
      for (const a of ammoList) {
        const newId = this.vault.getNextId('ammo');
        const sanitized = sanitizeAmmo({ ...a, id: newId });
        data.ammo.push(sanitized);
        insertedIds.push(newId);
      }
    }

    this.saveData(data);
    this.addActivityLog({
      action: 'import',
      entityType: 'ammo',
      entityId: insertedIds.length + (updatesList ? updatesList.length : 0),
      detail: `Imported ${insertedIds.length} ammo boxes (${updatesList ? updatesList.length : 0} updated) from CSV`,
      source: 'desktop',
    });

    return {
      insertedCount: insertedIds.length,
      updatedCount: updatesList ? updatesList.length : 0,
    };
  }

  updateAmmo(id, ammo) {
    const ammoList = this.getAmmo();
    const index = ammoList.findIndex((a) => a.id === id);
    if (index !== -1) {
      ammoList[index] = sanitizeAmmo({ ...ammo, id });
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
    const list = this.getData().accessories || [];
    return list.map(sanitizeAccessory);
  }

  saveAccessoriesList(accessoriesList) {
    const data = this.getData();
    data.accessories = (accessoriesList || []).map(sanitizeAccessory);
    this.saveData(data);
  }

  addAccessory(accessory) {
    const data = this.getData();
    const newId = this.vault.getNextId('accessories');
    const sanitized = sanitizeAccessory({ ...accessory, id: newId });
    data.accessories.push(sanitized);
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

  importAccessoriesBatch(accessoriesList) {
    const data = this.getData();
    if (!data.accessories) data.accessories = [];

    const insertedIds = [];
    if (Array.isArray(accessoriesList)) {
      for (const acc of accessoriesList) {
        const newId = this.vault.getNextId('accessories');
        const sanitized = sanitizeAccessory({ ...acc, id: newId });
        data.accessories.push(sanitized);
        insertedIds.push(newId);
      }
    }

    this.saveData(data);
    this.addActivityLog({
      action: 'import',
      entityType: 'accessory',
      entityId: insertedIds.length,
      detail: `Imported ${insertedIds.length} accessories from CSV`,
      source: 'desktop',
    });

    return { insertedCount: insertedIds.length };
  }

  updateAccessory(id, accessory) {
    const list = this.getAccessories();
    const index = list.findIndex((a) => a.id === id);
    if (index !== -1) {
      list[index] = sanitizeAccessory({ ...accessory, id });
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
    const list = this.getData().components || [];
    return list.map(sanitizeComponent);
  }

  saveComponentsList(componentsList) {
    const data = this.getData();
    data.components = (componentsList || []).map(sanitizeComponent);
    this.saveData(data);
  }

  addComponent(component) {
    const data = this.getData();
    const newId = this.vault.getNextId('components');
    const sanitized = sanitizeComponent({ ...component, id: newId });
    data.components.push(sanitized);
    this.saveData(data);
    return newId;
  }

  importComponentsBatch(componentsList) {
    const data = this.getData();
    if (!data.components) data.components = [];

    const insertedIds = [];
    if (Array.isArray(componentsList)) {
      for (const c of componentsList) {
        const newId = this.vault.getNextId('components');
        const sanitized = sanitizeComponent({ ...c, id: newId });
        data.components.push(sanitized);
        insertedIds.push(newId);
      }
    }

    this.saveData(data);
    this.addActivityLog({
      action: 'import',
      entityType: 'component',
      entityId: insertedIds.length,
      detail: `Imported ${insertedIds.length} reloading components from CSV`,
      source: 'desktop',
    });

    return { insertedCount: insertedIds.length };
  }

  updateComponent(id, component) {
    const list = this.getComponents();
    const index = list.findIndex((c) => c.id === id);
    if (index !== -1) {
      list[index] = sanitizeComponent({ ...component, id });
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
    if (this.isLocked()) {
      return {};
    }
    return this.skuDatabase.getSkus();
  }

  saveSkus(skus) {
    if (this.isLocked()) throw new Error('Vault is locked');
    const res = this.skuDatabase.saveSkus(skus);
    this.backup.triggerBackup();
    return res;
  }

  deleteSku(skuId) {
    if (this.isLocked()) throw new Error('Vault is locked');
    const res = this.skuDatabase.deleteSku(skuId);
    this.backup.triggerBackup();
    return res;
  }

  exportSkusCatalog() {
    if (this.isLocked()) throw new Error('Vault is locked');
    return this.skuDatabase.exportCatalogJson();
  }

  importSkusCatalog(catalogData, mode = 'merge') {
    if (this.isLocked()) throw new Error('Vault is locked');
    const res = this.skuDatabase.importCatalogJson(catalogData, mode);
    this.backup.triggerBackup();
    return res;
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

  // ─── Module Data Archiving & Restoration ──────────────────────────
  archiveModuleData(moduleId, dataKeys) {
    const data = this.getData();
    if (!data) return { success: false, error: 'Vault is locked' };

    const extracted = {};
    let totalRecords = 0;
    const dataKeyCount = {};

    for (const key of dataKeys) {
      if (data[key] !== undefined && data[key] !== null) {
        extracted[key] = data[key];
        const count = Array.isArray(data[key])
          ? data[key].length
          : typeof data[key] === 'object'
            ? Object.keys(data[key]).length
            : 1;
        dataKeyCount[key] = count;
        totalRecords += count;
        delete data[key]; // Prune from active database!
      }
    }

    const archivesDir = path.join(app.getPath('userData'), 'module_archives');
    if (!fs.existsSync(archivesDir)) {
      fs.mkdirSync(archivesDir, { recursive: true });
    }

    const archivePath = path.join(archivesDir, `${moduleId}.enc`);
    const archivePayload = {
      moduleId,
      archivedAt: new Date().toISOString(),
      dataKeyCount,
      totalRecords,
      data: extracted,
    };

    const payloadStr = JSON.stringify(archivePayload);

    // Save encrypted using active masterKey if available
    if (this.vault.masterKey) {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.vault.masterKey, iv);
      let enc = cipher.update(payloadStr, 'utf8', 'hex');
      enc += cipher.final('hex');
      const tag = cipher.getAuthTag().toString('hex');

      fs.writeFileSync(
        archivePath,
        JSON.stringify({
          iv: iv.toString('hex'),
          tag,
          ciphertext: enc,
          metadata: {
            moduleId,
            archivedAt: archivePayload.archivedAt,
            totalRecords,
            dataKeyCount,
          },
        }),
        'utf8'
      );
    } else {
      fs.writeFileSync(
        archivePath,
        JSON.stringify({
          plaintext: true,
          ...archivePayload,
          metadata: {
            moduleId,
            archivedAt: archivePayload.archivedAt,
            totalRecords,
            dataKeyCount,
          },
        }),
        'utf8'
      );
    }

    // Save pruned database to disk
    this.saveData(data);
    return { success: true, totalRecords, dataKeyCount };
  }

  restoreModuleData(moduleId) {
    const archivesDir = path.join(app.getPath('userData'), 'module_archives');
    const archivePath = path.join(archivesDir, `${moduleId}.enc`);
    if (!fs.existsSync(archivePath)) {
      return { success: false, error: 'No archive found for this module.' };
    }

    let payload;
    try {
      const raw = fs.readFileSync(archivePath, 'utf8');
      const parsed = JSON.parse(raw);

      if (parsed.plaintext) {
        payload = parsed;
      } else if (this.vault.masterKey && parsed.ciphertext) {
        const decipher = crypto.createDecipheriv(
          'aes-256-gcm',
          this.vault.masterKey,
          Buffer.from(parsed.iv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(parsed.tag, 'hex'));
        let dec = decipher.update(parsed.ciphertext, 'hex', 'utf8');
        dec += decipher.final('utf8');
        payload = JSON.parse(dec);
      } else {
        return { success: false, error: 'Vault is locked. Unlock to decrypt archive.' };
      }
    } catch (e) {
      return { success: false, error: 'Failed to decrypt module archive: ' + e.message };
    }

    const data = this.getData();
    if (!data) return { success: false, error: 'Vault is locked.' };

    if (payload && payload.data) {
      for (const [k, v] of Object.entries(payload.data)) {
        data[k] = v;
      }
      this.saveData(data);
    }

    return {
      success: true,
      restoredRecords: payload.totalRecords || 0,
      archivedAt: payload.archivedAt,
    };
  }

  getModuleArchives() {
    const archivesDir = path.join(app.getPath('userData'), 'module_archives');
    if (!fs.existsSync(archivesDir)) return {};
    const files = fs.readdirSync(archivesDir).filter((f) => f.endsWith('.enc'));
    const result = {};
    for (const f of files) {
      try {
        const fullPath = path.join(archivesDir, f);
        const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const modId = path.basename(f, '.enc');
        result[modId] = parsed.metadata || {
          moduleId: modId,
          archivedAt: parsed.archivedAt,
          totalRecords: parsed.totalRecords,
          dataKeyCount: parsed.dataKeyCount,
        };
      } catch (e) {
        console.warn('Error reading module archive metadata:', f, e);
      }
    }
    return result;
  }
}

module.exports = new Database();
