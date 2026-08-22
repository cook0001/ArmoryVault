const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * VaultEncryption handles all encryption, decryption, key management,
 * and the in-memory cache for the encrypted vault data store.
 */
class VaultEncryption {
  constructor(encPath, dbPath) {
    this.encPath = encPath;
    this.dbPath = dbPath;

    this.masterKey = null;
    this.vaultMeta = null;

    // In-memory cache for performance — avoids decrypting the entire vault on every CRUD call
    this._cache = null;
    this._dirty = false;
    this._flushTimer = null;
    this._FLUSH_DELAY_MS = 3000;
    this._pendingWriteCount = 0;

    // Schema versioning
    this.CURRENT_SCHEMA_VERSION = 2;
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

    // Initialize with proper schema
    const emptySchema = this._getEmptySchema();
    if (Array.isArray(dataToEncrypt)) {
      emptySchema.firearms = dataToEncrypt;
    }
    this.saveData(emptySchema);
    this.flushSync();
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
    this._pendingWriteCount = 0;
    if (this._flushTimer) clearTimeout(this._flushTimer);
  }

  _getEmptySchema() {
    return {
      schemaVersion: this.CURRENT_SCHEMA_VERSION,
      _nextId: {},
      _lastModified: Date.now(),
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
      activity_log: [],
    };
  }

  /**
   * Runs schema migrations on decrypted data to bring it up to CURRENT_SCHEMA_VERSION.
   */
  _runMigrations(data) {
    let version = data.schemaVersion || 0;

    // Migration: v0 (legacy) → v1: Add schemaVersion marker
    if (version < 1) {
      data.schemaVersion = 1;
      version = 1;
    }

    // Migration: v1 → v2: Add _nextId counters, _lastModified, activity_log
    if (version < 2) {
      // Compute _nextId from existing max IDs
      const maxId = (arr) => (arr && arr.length > 0 ? Math.max(...arr.map((x) => x.id || 0)) : 0);
      data._nextId = {
        firearms: maxId(data.firearms) + 1,
        ammo: maxId(data.ammo) + 1,
        accessories: maxId(data.accessories) + 1,
        components: maxId(data.components) + 1,
        sync_queue: maxId(data.sync_queue) + 1,
        storage_locations: maxId(data.storage_locations) + 1,
        chrono_strings: maxId(data.chrono_strings) + 1,
        target_analyses: maxId(data.target_analyses) + 1,
        load_ladder_tests: maxId(data.load_ladder_tests) + 1,
        ballistic_profiles: maxId(data.ballistic_profiles) + 1,
      };
      data._lastModified = Date.now();
      if (!Array.isArray(data.activity_log)) {
        data.activity_log = [];
      }
      data.schemaVersion = 2;
      version = 2;
    }

    return data;
  }

  getData() {
    const emptySchema = this._getEmptySchema();
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
      let data = { ...emptySchema };
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
          activity_log: parsed.activity_log || [],
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

      // Run schema migrations
      const preVersion = data.schemaVersion || 0;
      data = this._runMigrations(data);
      if (data.schemaVersion !== preVersion) {
        this._dirty = true;
      }

      // Populate the in-memory cache
      this._cache = data;

      // Auto-flush if migration occurred
      if (this._dirty) {
        this._scheduleFlush();
      }

      return data;
    } catch (e) {
      console.error(e);
      return emptySchema;
    }
  }

  saveData(dataObj) {
    if (this.isLocked()) throw new Error('Vault is locked');

    // Update modification timestamp
    dataObj._lastModified = Date.now();

    // Update the in-memory cache immediately
    this._cache = dataObj;
    this._dirty = true;
    this._pendingWriteCount++;

    // If many rapid mutations are batched, flush immediately to prevent data loss
    if (this._pendingWriteCount >= 5) {
      this._flushToDisk();
      return;
    }

    this._scheduleFlush();
  }

  _scheduleFlush() {
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

      // Atomic write: write to temp file, then rename
      const tmpPath = this.encPath + '.tmp';
      fs.writeFileSync(tmpPath, JSON.stringify(filePayload, null, 2));
      fs.renameSync(tmpPath, this.encPath);

      this._dirty = false;
      this._pendingWriteCount = 0;
    } catch (e) {
      console.error('Failed to flush vault to disk:', e);
    }
  }

  flushSync() {
    if (this._flushTimer) clearTimeout(this._flushTimer);
    this._flushToDisk();
  }

  getLastModified() {
    const data = this.getData();
    return data._lastModified || null;
  }

  /**
   * Gets the next auto-increment ID for a given entity type.
   * Uses the _nextId counters introduced in schema v2.
   */
  getNextId(entityType) {
    const data = this.getData();
    if (!data._nextId) {
      data._nextId = {};
    }
    if (typeof data._nextId[entityType] !== 'number') {
      // Fallback: compute from existing items
      const entities = data[entityType];
      data._nextId[entityType] =
        Array.isArray(entities) && entities.length > 0
          ? Math.max(...entities.map((x) => x.id || 0)) + 1
          : 1;
    }
    const id = data._nextId[entityType];
    data._nextId[entityType] = id + 1;
    return id;
  }
}

module.exports = VaultEncryption;
