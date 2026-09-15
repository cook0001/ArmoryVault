const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * ActivityLogDatabase manages an isolated, encrypted audit trail (activity_log.enc)
 * decoupled from the primary firearms vault (firearms_inventory.enc).
 *
 * Prevents frequent user actions (editing ammo count, mounting an optic, syncing)
 * from constantly dirtying and re-encrypting the entire firearms database.
 */
class ActivityLogDatabase {
  constructor(encPath) {
    this.encPath = encPath;
    this.masterKey = null;
    this.vaultMeta = null;

    this._cache = null; // Array of log objects: ActivityLogEntry[]
    this._dirty = false;
    this._flushTimer = null;
    this._FLUSH_DELAY_MS = 2000;
    this.MAX_LOG_ENTRIES = 1000;
  }

  hasEncryptedFile() {
    return fs.existsSync(this.encPath);
  }

  isLocked() {
    return this.masterKey === null;
  }

  unlock(masterKey, vaultMeta) {
    this.masterKey = masterKey;
    this.vaultMeta = vaultMeta;
    this._cache = null;
    this._dirty = false;
    return this._load();
  }

  lock() {
    this.flushSync();
    this.masterKey = null;
    this.vaultMeta = null;
    this._cache = null;
    this._dirty = false;
    if (this._flushTimer) clearTimeout(this._flushTimer);
  }

  updateVaultMeta(newVaultMeta, newMasterKey) {
    this.vaultMeta = newVaultMeta;
    if (newMasterKey) this.masterKey = newMasterKey;
    if (this._cache) {
      this._dirty = true;
      this.flushSync();
    }
  }

  hasData() {
    const list = this.getEntries();
    return Array.isArray(list) && list.length > 0;
  }

  _load() {
    if (this.isLocked()) return [];
    if (this._cache) return this._cache;
    if (!fs.existsSync(this.encPath)) {
      this._cache = [];
      return this._cache;
    }

    try {
      const filePayload = JSON.parse(fs.readFileSync(this.encPath, 'utf8'));
      if (!filePayload.encryptedData) {
        this._cache = [];
        return this._cache;
      }

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.masterKey,
        Buffer.from(filePayload.dataIv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(filePayload.dataAuthTag, 'hex'));
      let decrypted = decipher.update(filePayload.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const parsed = JSON.parse(decrypted);
      this._cache = Array.isArray(parsed)
        ? parsed
        : parsed && Array.isArray(parsed.activity_log)
          ? parsed.activity_log
          : [];
      return this._cache;
    } catch (e) {
      console.error('Failed to decrypt ActivityLogDatabase:', e);
      this._cache = [];
      return this._cache;
    }
  }

  getEntries() {
    if (this.isLocked()) return [];
    return this._load();
  }

  saveEntries(entries) {
    if (this.isLocked()) return false;
    let list = Array.isArray(entries) ? [...entries] : [];
    if (list.length > this.MAX_LOG_ENTRIES) {
      list = list.slice(-this.MAX_LOG_ENTRIES);
    }
    this._cache = list;
    this._dirty = true;
    this._scheduleFlush();
    return true;
  }

  addEntry(entry) {
    if (this.isLocked()) return false;
    const current = this.getEntries();
    current.push({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    });

    if (current.length > this.MAX_LOG_ENTRIES) {
      this._cache = current.slice(-this.MAX_LOG_ENTRIES);
    } else {
      this._cache = current;
    }

    this._dirty = true;
    this._scheduleFlush();
    return true;
  }

  clearLog() {
    if (this.isLocked()) return false;
    this._cache = [];
    this._dirty = true;
    this.flushSync();
    return true;
  }

  _scheduleFlush() {
    if (this._flushTimer) return;
    this._flushTimer = setTimeout(() => {
      this._flushTimer = null;
      this.flushSync();
    }, this._FLUSH_DELAY_MS);
  }

  flushSync() {
    if (!this._dirty || this.isLocked() || !this._cache) return;
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }

    try {
      const plaintext = JSON.stringify({
        schemaVersion: 1,
        activity_log: this._cache,
        lastModified: Date.now(),
      });

      const dataIv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, dataIv);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const dataAuthTag = cipher.getAuthTag().toString('hex');

      const payload = {
        schemaVersion: 1,
        dataIv: dataIv.toString('hex'),
        dataAuthTag: dataAuthTag,
        encryptedData: encrypted,
        vault: this.vaultMeta,
      };

      const tempPath = `${this.encPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf8');
      fs.renameSync(tempPath, this.encPath);

      this._dirty = false;
    } catch (e) {
      console.error('Failed to flush ActivityLogDatabase to disk:', e);
    }
  }
}

module.exports = ActivityLogDatabase;
