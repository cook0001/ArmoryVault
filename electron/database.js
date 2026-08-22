const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

class Database {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'firearms_inventory.json'); // Legacy
    this.encPath = path.join(app.getPath('userData'), 'firearms_inventory.enc');
    this.photoDir = path.join(app.getPath('userData'), 'photos');
    this.docDir = path.join(app.getPath('userData'), 'documents');

    if (!fs.existsSync(this.photoDir)) {
      fs.mkdirSync(this.photoDir, { recursive: true });
    }
    if (!fs.existsSync(this.docDir)) {
      fs.mkdirSync(this.docDir, { recursive: true });
    }

    this.masterKey = null;
    this.vaultMeta = null;

    // In-memory cache for performance — avoids decrypting the entire vault on every CRUD call
    this._cache = null;
    this._dirty = false;
    this._flushTimer = null;
    this._FLUSH_DELAY_MS = 2000;
  }

  isVaultSetup() {
    return fs.existsSync(this.encPath);
  }

  isLocked() {
    return this.masterKey === null;
  }

  setupVault(password) {
    const masterKey = crypto.randomBytes(32);
    const recoveryCode = masterKey.toString('hex'); // 64 char recovery code

    const salt = crypto.randomBytes(16);
    const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
    let encryptedMasterKey = cipher.update(masterKey, 'utf8', 'hex');
    encryptedMasterKey += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    this.masterKey = masterKey;
    this.vaultMeta = {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag,
      encryptedMasterKey: encryptedMasterKey,
    };

    // Migration: If legacy JSON exists, encrypt it into the new file.
    let dataToEncrypt = [];
    if (fs.existsSync(this.dbPath)) {
      try {
        dataToEncrypt = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
        fs.renameSync(this.dbPath, this.dbPath + '.bak'); // Backup plaintext just in case for now
      } catch (e) {}
    }

    this.saveFirearms(dataToEncrypt);
    return recoveryCode;
  }

  unlockVault(password) {
    if (!fs.existsSync(this.encPath)) return false;
    try {
      const filePayload = JSON.parse(fs.readFileSync(this.encPath, 'utf8'));
      this.vaultMeta = filePayload.vault;

      const derivedKey = crypto.pbkdf2Sync(
        password,
        Buffer.from(this.vaultMeta.salt, 'hex'),
        100000,
        32,
        'sha256'
      );
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        derivedKey,
        Buffer.from(this.vaultMeta.iv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(this.vaultMeta.authTag, 'hex'));

      let masterKey = decipher.update(this.vaultMeta.encryptedMasterKey, 'hex');
      masterKey = Buffer.concat([Buffer.from(masterKey, 'hex'), decipher.final()]);

      // Test decryption to ensure it works
      const testDecipher = crypto.createDecipheriv(
        'aes-256-gcm',
        masterKey,
        Buffer.from(filePayload.dataIv, 'hex')
      );
      testDecipher.setAuthTag(Buffer.from(filePayload.dataAuthTag, 'hex'));
      let decrypted = testDecipher.update(filePayload.encryptedData, 'hex', 'utf8');
      decrypted += testDecipher.final('utf8');

      this.masterKey = masterKey;
      return true;
    } catch (e) {
      console.error('Unlock failed:', e.message);
      return false;
    }
  }

  unlockWithRecoveryCode(code) {
    if (!fs.existsSync(this.encPath)) return false;
    try {
      const filePayload = JSON.parse(fs.readFileSync(this.encPath, 'utf8'));
      this.vaultMeta = filePayload.vault;

      const masterKeyBuffer = Buffer.from(code, 'hex');
      if (masterKeyBuffer.length !== 32) return false;

      // Test decryption
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        masterKeyBuffer,
        Buffer.from(filePayload.dataIv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(filePayload.dataAuthTag, 'hex'));
      let decrypted = decipher.update(filePayload.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      this.masterKey = masterKeyBuffer;
      return true;
    } catch (e) {
      return false;
    }
  }

  changePassword(currentPassword, newPassword, regenerateRecoveryKey = false) {
    if (this.isLocked() || !this.masterKey) {
      return { success: false, error: 'Vault must be unlocked to change password.' };
    }
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    try {
      if (!this.vaultMeta) {
        if (!fs.existsSync(this.encPath)) {
          return { success: false, error: 'Vault file not found.' };
        }
        const filePayload = JSON.parse(fs.readFileSync(this.encPath, 'utf8'));
        this.vaultMeta = filePayload.vault;
      }

      // Verify current password if provided
      if (currentPassword) {
        const derivedKey = crypto.pbkdf2Sync(
          currentPassword,
          Buffer.from(this.vaultMeta.salt, 'hex'),
          100000,
          32,
          'sha256'
        );
        const decipher = crypto.createDecipheriv(
          'aes-256-gcm',
          derivedKey,
          Buffer.from(this.vaultMeta.iv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(this.vaultMeta.authTag, 'hex'));

        let decryptedKey;
        try {
          decryptedKey = Buffer.concat([
            decipher.update(Buffer.from(this.vaultMeta.encryptedMasterKey, 'hex')),
            decipher.final(),
          ]);
        } catch (err) {
          return { success: false, error: 'Current password is incorrect.' };
        }

        if (!decryptedKey || !decryptedKey.equals(this.masterKey)) {
          return { success: false, error: 'Current password is incorrect.' };
        }
      }

      // Handle re-keying if requested
      let targetMasterKey = this.masterKey;
      let newRecoveryCode = null;

      if (regenerateRecoveryKey) {
        targetMasterKey = crypto.randomBytes(32);
        newRecoveryCode = targetMasterKey.toString('hex');
      }

      // Re-encrypt the master key with new password
      const newSalt = crypto.randomBytes(16);
      const newDerivedKey = crypto.pbkdf2Sync(newPassword, newSalt, 100000, 32, 'sha256');
      const newIv = crypto.randomBytes(12);

      const cipher = crypto.createCipheriv('aes-256-gcm', newDerivedKey, newIv);
      let encryptedMasterKey = cipher.update(targetMasterKey, null, 'hex');
      encryptedMasterKey += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      this.masterKey = targetMasterKey;
      this.vaultMeta = {
        salt: newSalt.toString('hex'),
        iv: newIv.toString('hex'),
        authTag: authTag,
        encryptedMasterKey: encryptedMasterKey,
      };

      // Load cache if needed and flush to disk
      this.getData();
      this._dirty = true;
      this.flushSync();

      return {
        success: true,
        newRecoveryCode: newRecoveryCode,
        message: regenerateRecoveryKey
          ? 'Master password updated and new recovery key generated successfully!'
          : 'Master password updated successfully!',
      };
    } catch (e) {
      console.error('Password change error:', e);
      return { success: false, error: e.message || 'Failed to update master password.' };
    }
  }

  regenerateRecoveryKey(currentPassword) {
    if (this.isLocked() || !this.masterKey) {
      return { success: false, error: 'Vault must be unlocked to regenerate recovery key.' };
    }

    try {
      if (!this.vaultMeta) {
        if (!fs.existsSync(this.encPath)) {
          return { success: false, error: 'Vault file not found.' };
        }
        const filePayload = JSON.parse(fs.readFileSync(this.encPath, 'utf8'));
        this.vaultMeta = filePayload.vault;
      }

      // Verify current password
      const derivedKey = crypto.pbkdf2Sync(
        currentPassword,
        Buffer.from(this.vaultMeta.salt, 'hex'),
        100000,
        32,
        'sha256'
      );
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        derivedKey,
        Buffer.from(this.vaultMeta.iv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(this.vaultMeta.authTag, 'hex'));

      let decryptedKey;
      try {
        decryptedKey = Buffer.concat([
          decipher.update(Buffer.from(this.vaultMeta.encryptedMasterKey, 'hex')),
          decipher.final(),
        ]);
      } catch (err) {
        return { success: false, error: 'Current password is incorrect.' };
      }

      if (!decryptedKey || !decryptedKey.equals(this.masterKey)) {
        return { success: false, error: 'Current password is incorrect.' };
      }

      // Generate new 32-byte master key
      const newMasterKey = crypto.randomBytes(32);
      const newRecoveryCode = newMasterKey.toString('hex');

      // Re-encrypt new master key with current password
      const newSalt = crypto.randomBytes(16);
      const newDerivedKey = crypto.pbkdf2Sync(currentPassword, newSalt, 100000, 32, 'sha256');
      const newIv = crypto.randomBytes(12);

      const cipher = crypto.createCipheriv('aes-256-gcm', newDerivedKey, newIv);
      let encryptedMasterKey = cipher.update(newMasterKey, null, 'hex');
      encryptedMasterKey += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      this.masterKey = newMasterKey;
      this.vaultMeta = {
        salt: newSalt.toString('hex'),
        iv: newIv.toString('hex'),
        authTag: authTag,
        encryptedMasterKey: encryptedMasterKey,
      };

      // Re-encrypt entire database under the new master key
      this.getData();
      this._dirty = true;
      this.flushSync();

      return {
        success: true,
        newRecoveryCode: newRecoveryCode,
        message: 'New recovery key generated and vault re-keyed successfully!',
      };
    } catch (e) {
      console.error('Regenerate recovery key error:', e);
      return { success: false, error: e.message || 'Failed to regenerate recovery key.' };
    }
  }

  getRecoveryCode() {
    if (this.isLocked() || !this.masterKey) return null;
    return this.masterKey.toString('hex');
  }

  lockVault() {
    this.flushSync(); // Persist any pending writes before locking
    this.masterKey = null;
    this._cache = null;
    this._dirty = false;
    if (this._flushTimer) clearTimeout(this._flushTimer);
  }

  getData() {
    const emptySchema = {
      firearms: [],
      ammo: [],
      skus: {},
      accessories: [],
      components: [],
      sync_queue: [],
      storage_locations: [],
      chrono_strings: [],
      target_analyses: [],
      load_ladder_tests: [],
      ballistic_profiles: [],
    };
    if (this.isLocked()) return emptySchema;

    // Return the in-memory cache if available
    if (this._cache) return this._cache;

    if (!fs.existsSync(this.encPath)) return emptySchema;

    try {
      const filePayload = JSON.parse(fs.readFileSync(this.encPath, 'utf8'));
      if (!filePayload.encryptedData) return emptySchema;

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.masterKey,
        Buffer.from(filePayload.dataIv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(filePayload.dataAuthTag, 'hex'));
      let decrypted = decipher.update(filePayload.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const parsed = JSON.parse(decrypted);
      let data = {
        firearms: [],
        ammo: [],
        skus: {},
        accessories: [],
        components: [],
        sync_queue: [],
        storage_locations: [],
        chrono_strings: [],
        target_analyses: [],
        load_ladder_tests: [],
        ballistic_profiles: [],
      };
      if (Array.isArray(parsed)) {
        data.firearms = parsed;
      } else if (parsed && typeof parsed === 'object') {
        data = {
          ...data,
          ...parsed,
          firearms: parsed.firearms || [],
          ammo: parsed.ammo || [],
          skus: parsed.skus || {},
          accessories: parsed.accessories || [],
          components: parsed.components || [],
          sync_queue: parsed.sync_queue || [],
          storage_locations: parsed.storage_locations || [],
          chrono_strings: parsed.chrono_strings || [],
          target_analyses: parsed.target_analyses || [],
          load_ladder_tests: parsed.load_ladder_tests || [],
          ballistic_profiles: parsed.ballistic_profiles || [],
        };
      }

      // Migrate legacy mountedOnFirearmId to mounts array
      data.accessories = data.accessories.map((acc) => {
        if (acc.mountedOnFirearmId && !acc.mounts) {
          acc.mounts = [{ firearmId: acc.mountedOnFirearmId, quantity: acc.quantity || 1 }];
          delete acc.mountedOnFirearmId;
        }
        return acc;
      });

      // Populate the in-memory cache
      this._cache = data;
      return data;
    } catch (e) {
      console.error(e);
      return emptySchema;
    }
  }

  saveData(dataObj) {
    if (this.isLocked()) throw new Error('Vault is locked');

    // Update the in-memory cache immediately
    this._cache = dataObj;
    this._dirty = true;

    // Debounce the expensive disk write — resets on each call
    if (this._flushTimer) clearTimeout(this._flushTimer);
    this._flushTimer = setTimeout(() => this._flushToDisk(), this._FLUSH_DELAY_MS);
  }

  _flushToDisk() {
    if (!this._dirty || !this._cache) return;
    try {
      const jsonStr = JSON.stringify(this._cache);
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

      let encryptedData = cipher.update(jsonStr, 'utf8', 'hex');
      encryptedData += cipher.final('hex');
      const dataAuthTag = cipher.getAuthTag().toString('hex');

      const filePayload = {
        vault: this.vaultMeta,
        dataIv: iv.toString('hex'),
        dataAuthTag: dataAuthTag,
        encryptedData: encryptedData,
      };

      fs.writeFileSync(this.encPath, JSON.stringify(filePayload, null, 2));
      this._dirty = false;
      this.triggerBackup();
    } catch (e) {
      console.error('Failed to flush vault to disk:', e);
    }
  }

  flushSync() {
    if (this._flushTimer) clearTimeout(this._flushTimer);
    this._flushToDisk();
  }

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

  getBackupPath() {
    return this.getConfig().backupPath;
  }

  setBackupPath(backupPath) {
    this.setConfig('backupPath', backupPath);
    this.triggerBackup();
  }

  triggerBackup() {
    const backupPath = this.getBackupPath();
    if (!backupPath) return;
    if (fs.existsSync(this.encPath)) {
      try {
        // Date-stamped backup: ArmoryVault_Backup_2026-08-16.enc
        const dateStr = new Date().toISOString().split('T')[0];
        const dest = path.join(backupPath, `ArmoryVault_Backup_${dateStr}.enc`);
        fs.copyFileSync(this.encPath, dest);

        // Rotate: keep only the 5 most recent backups
        const MAX_BACKUPS = 5;
        const backupFiles = fs
          .readdirSync(backupPath)
          .filter((f) => f.startsWith('ArmoryVault_Backup_') && f.endsWith('.enc'))
          .sort()
          .reverse();

        if (backupFiles.length > MAX_BACKUPS) {
          backupFiles.slice(MAX_BACKUPS).forEach((oldFile) => {
            try {
              fs.unlinkSync(path.join(backupPath, oldFile));
            } catch (e) {
              console.error('Failed to remove old backup:', oldFile, e);
            }
          });
        }
      } catch (e) {
        console.error('Backup failed:', e);
      }
    }
  }

  createZipBackup(targetPath) {
    if (!targetPath) {
      throw new Error('Target backup path is required.');
    }

    // Flush any pending in-memory changes to disk first
    this.flushSync();

    const AdmZip = require('adm-zip');
    const zip = new AdmZip();

    // 1. Add database file(s)
    let hasDb = false;
    if (fs.existsSync(this.encPath)) {
      zip.addLocalFile(this.encPath);
      hasDb = true;
    }
    if (fs.existsSync(this.dbPath)) {
      zip.addLocalFile(this.dbPath);
      hasDb = true;
    }

    if (!hasDb) {
      throw new Error(
        'No active database found to archive. Please initialize or unlock the vault first.'
      );
    }

    // 2. Add photos folder if it exists
    if (fs.existsSync(this.photoDir)) {
      const photos = fs.readdirSync(this.photoDir);
      for (const file of photos) {
        if (file.startsWith('.')) continue; // skip hidden files like .DS_Store
        const fullPath = path.join(this.photoDir, file);
        try {
          if (fs.statSync(fullPath).isFile()) {
            zip.addLocalFile(fullPath, 'photos');
          }
        } catch (e) {
          console.warn('Could not add photo to zip:', fullPath, e);
        }
      }
    }

    // 3. Add documents folder if it exists
    if (fs.existsSync(this.docDir)) {
      const docs = fs.readdirSync(this.docDir);
      for (const file of docs) {
        if (file.startsWith('.')) continue; // skip hidden files like .DS_Store
        const fullPath = path.join(this.docDir, file);
        try {
          if (fs.statSync(fullPath).isFile()) {
            zip.addLocalFile(fullPath, 'documents');
          }
        } catch (e) {
          console.warn('Could not add document to zip:', fullPath, e);
        }
      }
    }

    // 4. Write zip file synchronously and safely
    zip.writeZip(targetPath);
    return true;
  }

  restoreBackup(sourcePath) {
    if (!fs.existsSync(sourcePath)) {
      throw new Error('Backup file not found at ' + sourcePath);
    }

    // Flush any pending changes to current disk before restore
    this.flushSync();

    // 1. Create a safety backup of current active enc file
    if (fs.existsSync(this.encPath)) {
      const safetyBackupName = `firearms_inventory_pre_restore_${Date.now()}.enc.bak`;
      const safetyBackupPath = path.join(app.getPath('userData'), safetyBackupName);
      try {
        fs.copyFileSync(this.encPath, safetyBackupPath);
      } catch (e) {
        console.error('Failed to create pre-restore safety backup:', e);
      }
    }

    const ext = path.extname(sourcePath).toLowerCase();

    if (ext === '.enc') {
      const content = fs.readFileSync(sourcePath, 'utf8');
      const parsed = JSON.parse(content);
      if (!parsed.encryptedData || !parsed.dataIv || !parsed.dataAuthTag) {
        throw new Error('Invalid encrypted backup file format.');
      }

      fs.copyFileSync(sourcePath, this.encPath);
    } else if (ext === '.zip') {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(sourcePath);
      const zipEntries = zip.getEntries();

      const hasEnc = zipEntries.some(
        (e) =>
          e.entryName === 'firearms_inventory.enc' ||
          e.entryName.endsWith('/firearms_inventory.enc')
      );
      const hasJson = zipEntries.some(
        (e) =>
          e.entryName === 'firearms_inventory.json' ||
          e.entryName.endsWith('/firearms_inventory.json')
      );

      if (!hasEnc && !hasJson) {
        throw new Error(
          'Zip archive does not contain a valid database file (firearms_inventory.enc).'
        );
      }

      // Extract enc file
      if (hasEnc) {
        const encEntry = zipEntries.find(
          (e) =>
            e.entryName === 'firearms_inventory.enc' ||
            e.entryName.endsWith('/firearms_inventory.enc')
        );
        fs.writeFileSync(this.encPath, encEntry.getData());
      } else if (hasJson) {
        const jsonEntry = zipEntries.find(
          (e) =>
            e.entryName === 'firearms_inventory.json' ||
            e.entryName.endsWith('/firearms_inventory.json')
        );
        fs.writeFileSync(this.dbPath, jsonEntry.getData());
      }

      // Extract photos & documents
      zipEntries.forEach((entry) => {
        if (entry.entryName.startsWith('photos/') && !entry.isDirectory) {
          const filename = path.basename(entry.entryName);
          if (filename) {
            fs.writeFileSync(path.join(this.photoDir, filename), entry.getData());
          }
        } else if (entry.entryName.startsWith('documents/') && !entry.isDirectory) {
          const filename = path.basename(entry.entryName);
          if (filename) {
            fs.writeFileSync(path.join(this.docDir, filename), entry.getData());
          }
        }
      });
    } else {
      throw new Error('Unsupported backup file format. Please select an .enc or .zip file.');
    }

    // Reset cache
    this._cache = null;
    this._dirty = false;

    // Check if the current masterKey can decrypt the restored file
    if (this.masterKey && fs.existsSync(this.encPath)) {
      try {
        const filePayload = JSON.parse(fs.readFileSync(this.encPath, 'utf8'));
        this.vaultMeta = filePayload.vault;
        const decipher = crypto.createDecipheriv(
          'aes-256-gcm',
          this.masterKey,
          Buffer.from(filePayload.dataIv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(filePayload.dataAuthTag, 'hex'));
        let decrypted = decipher.update(filePayload.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        const parsed = JSON.parse(decrypted);
        let data = {
          firearms: [],
          ammo: [],
          skus: {},
          accessories: [],
          components: [],
          sync_queue: [],
          storage_locations: [],
          chrono_strings: [],
          target_analyses: [],
          load_ladder_tests: [],
          ballistic_profiles: [],
        };
        if (Array.isArray(parsed)) {
          data.firearms = parsed;
        } else if (parsed && typeof parsed === 'object') {
          data = {
            ...data,
            ...parsed,
            firearms: parsed.firearms || [],
            ammo: parsed.ammo || [],
            skus: parsed.skus || {},
            accessories: parsed.accessories || [],
            components: parsed.components || [],
            sync_queue: parsed.sync_queue || [],
            storage_locations: parsed.storage_locations || [],
            chrono_strings: parsed.chrono_strings || [],
            target_analyses: parsed.target_analyses || [],
            load_ladder_tests: parsed.load_ladder_tests || [],
            ballistic_profiles: parsed.ballistic_profiles || [],
          };
        }
        this._cache = data;
        return { success: true, requiresRelogin: false };
      } catch (e) {
        // Restored file has a different master key/password
        this.lockVault();
        return { success: true, requiresRelogin: true };
      }
    }

    return { success: true, requiresRelogin: false };
  }

  getFirearms() {
    return this.getData().firearms;
  }

  saveFirearms(firearms) {
    const data = this.getData();
    data.firearms = firearms;
    this.saveData(data);
  }

  addFirearm(firearm) {
    const firearms = this.getFirearms();
    const newId = firearms.length > 0 ? Math.max(...firearms.map((f) => f.id || 0)) + 1 : 1;
    firearms.push({ ...firearm, id: newId });
    this.saveFirearms(firearms);
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
    let firearms = this.getFirearms();
    firearms = firearms.filter((f) => f.id !== id);
    this.saveFirearms(firearms);
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

  getAmmo() {
    return this.getData().ammo;
  }

  saveAmmoList(ammoList) {
    const data = this.getData();
    data.ammo = ammoList;
    this.saveData(data);
  }

  addAmmo(ammo) {
    const ammoList = this.getAmmo();
    const newId = ammoList.length > 0 ? Math.max(...ammoList.map((a) => a.id || 0)) + 1 : 1;
    ammoList.push({ ...ammo, id: newId });
    this.saveAmmoList(ammoList);
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
    let ammoList = this.getAmmo();
    ammoList = ammoList.filter((a) => a.id !== id);
    this.saveAmmoList(ammoList);
    return id;
  }

  getAccessories() {
    return this.getData().accessories || [];
  }

  saveAccessoriesList(accessoriesList) {
    const data = this.getData();
    data.accessories = accessoriesList;
    this.saveData(data);
  }

  addAccessory(accessory) {
    const list = this.getAccessories();
    const newId = list.length > 0 ? Math.max(...list.map((a) => a.id || 0)) + 1 : 1;
    list.push({ ...accessory, id: newId });
    this.saveAccessoriesList(list);
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
    let list = this.getAccessories();
    list = list.filter((a) => a.id !== id);
    this.saveAccessoriesList(list);
    return id;
  }

  getComponents() {
    return this.getData().components || [];
  }

  saveComponentsList(componentsList) {
    const data = this.getData();
    data.components = componentsList;
    this.saveData(data);
  }

  addComponent(component) {
    const list = this.getComponents();
    const newId = list.length > 0 ? Math.max(...list.map((c) => c.id || 0)) + 1 : 1;
    list.push({ ...component, id: newId });
    this.saveComponentsList(list);
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
      const comp = (data.reloading_components || []).find(
        (c) => c.id === Number(deductions.powderId)
      );
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
      const comp = (data.reloading_components || []).find(
        (c) => c.id === Number(deductions.primerId)
      );
      if (comp) {
        comp.quantity = Math.max(0, Math.round(Number(comp.quantity || 0) - primerDeduct));
      }
    }

    // 3. Deduct Brass / Cases
    if (deductions.brassId && (deductions.brassCount || batchCount)) {
      const brassDeduct = deductions.brassCount ? Number(deductions.brassCount) : batchCount;
      const comp = (data.reloading_components || []).find(
        (c) => c.id === Number(deductions.brassId)
      );
      if (comp) {
        comp.quantity = Math.max(0, Math.round(Number(comp.quantity || 0) - brassDeduct));
      }
    }

    // 4. Deduct Bullets / Projectiles
    if (deductions.bulletId && (deductions.bulletCount || batchCount)) {
      const bulletDeduct = deductions.bulletCount ? Number(deductions.bulletCount) : batchCount;
      const comp = (data.reloading_components || []).find(
        (c) => c.id === Number(deductions.bulletId)
      );
      if (comp) {
        comp.quantity = Math.max(0, Math.round(Number(comp.quantity || 0) - bulletDeduct));
      }
    }

    // 5. Increment Ammo Inventory
    const currentAmmoCount = Number(data.ammo[ammoIndex].count) || 0;
    const newCount = currentAmmoCount + batchCount;
    data.ammo[ammoIndex].count = newCount;

    this.saveData(data);
    return { success: true, newAmmoCount: newCount };
  }

  savePhoto(sourcePath, filename) {
    const destPath = path.join(this.photoDir, filename);
    try {
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        return `file://${destPath}`;
      }
      return null;
    } catch (error) {
      console.error('Failed to save photo:', error);
      return null;
    }
  }

  saveDocument(sourcePath, filename) {
    const destPath = path.join(this.docDir, filename);
    try {
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        return `file://${destPath}`;
      }
      return null;
    } catch (error) {
      console.error('Failed to save document:', error);
      return null;
    }
  }
  getSyncQueue() {
    return this.getData().sync_queue || [];
  }

  saveSyncQueue(queue) {
    const data = this.getData();
    data.sync_queue = queue;
    this.saveData(data);
  }

  addSyncItem(item) {
    const queue = this.getSyncQueue();
    const newId = queue.length > 0 ? Math.max(...queue.map((i) => i.id || 0)) + 1 : 1;
    queue.push({ ...item, id: newId });
    this.saveSyncQueue(queue);
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
    const list = this.getStorageLocations();
    const newId = list.length > 0 ? Math.max(...list.map((l) => l.id || 0)) + 1 : 1;
    list.push({ ...loc, id: newId });
    this.saveStorageLocations(list);
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
    const list = this.getChronoStrings();
    const newId = list.length > 0 ? Math.max(...list.map((c) => c.id || 0)) + 1 : 1;
    list.push({ ...cs, id: newId });
    this.saveChronoStrings(list);
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
    const list = this.getTargetAnalyses();
    const newId = list.length > 0 ? Math.max(...list.map((t) => t.id || 0)) + 1 : 1;
    list.push({ ...ta, id: newId });
    this.saveTargetAnalyses(list);
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
    const list = this.getLoadLadderTests();
    const newId = list.length > 0 ? Math.max(...list.map((l) => l.id || 0)) + 1 : 1;
    list.push({ ...lt, id: newId });
    this.saveLoadLadderTests(list);
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
    const list = this.getBallisticProfiles();
    const newId = list.length > 0 ? Math.max(...list.map((b) => b.id || 0)) + 1 : 1;
    list.push({ ...bp, id: newId });
    this.saveBallisticProfiles(list);
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
