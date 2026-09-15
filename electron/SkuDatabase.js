const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * SkuDatabase handles dedicated AES-256-GCM encryption, decryption,
 * in-memory caching, and debounced atomic persistence for custom SKUs and barcodes.
 */
class SkuDatabase {
  constructor(encPath) {
    this.encPath = encPath;
    this.masterKey = null;
    this.vaultMeta = null;

    this._cache = null; // Map / Object of SKUs: { [barcode]: CustomSkuItem }
    this._dirty = false;
    this._flushTimer = null;
    this._FLUSH_DELAY_MS = 1500;
    this._pendingWriteCount = 0;
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
    this._pendingWriteCount = 0;
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
    const skus = this.getSkus();
    return Object.keys(skus).length > 0;
  }

  _load() {
    if (this.isLocked()) return {};
    if (this._cache) return this._cache;
    if (!fs.existsSync(this.encPath)) {
      this._cache = {};
      return this._cache;
    }

    try {
      const filePayload = JSON.parse(fs.readFileSync(this.encPath, 'utf8'));
      if (!filePayload.encryptedData) {
        this._cache = {};
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
      this._cache = parsed && typeof parsed === 'object' ? parsed.skus || parsed : {};
      return this._cache;
    } catch (e) {
      console.error('Failed to decrypt SkuDatabase:', e);
      this._cache = {};
      return this._cache;
    }
  }

  getSkus() {
    if (this.isLocked()) return {};
    return this._load();
  }

  saveSkus(newSkus) {
    if (this.isLocked()) throw new Error('SKU database is locked');
    const current = this._load();
    const updated = { ...(current || {}), ...(newSkus || {}) };
    this._cache = updated;
    this._dirty = true;
    this._pendingWriteCount++;

    if (this._pendingWriteCount >= 3) {
      this._flushToDisk();
      return updated;
    }

    this._scheduleFlush();
    return updated;
  }

  deleteSku(skuId) {
    if (this.isLocked()) throw new Error('SKU database is locked');
    const current = this._load();
    const normalized = String(skuId).trim().toUpperCase();
    if (current && (current[normalized] || current[skuId])) {
      delete current[normalized];
      delete current[skuId];
      this._dirty = true;
      this._scheduleFlush();
    }
    return skuId;
  }

  exportCatalogJson() {
    const skus = this.getSkus();
    return {
      format: 'armoryvault_sku_catalog',
      version: 1,
      exportedAt: new Date().toISOString(),
      itemCount: Object.keys(skus).length,
      skus,
    };
  }

  importCatalogJson(importedData, mode = 'merge') {
    if (this.isLocked()) throw new Error('SKU database is locked');
    const incomingSkus = importedData?.skus || importedData;
    if (!incomingSkus || typeof incomingSkus !== 'object') {
      throw new Error('Invalid SKU catalog payload.');
    }

    if (mode === 'overwrite') {
      this._cache = { ...incomingSkus };
    } else {
      this._cache = { ...(this._load() || {}), ...incomingSkus };
    }
    this._dirty = true;
    this.flushSync();
    return {
      success: true,
      count: Object.keys(this._cache).length,
    };
  }

  _scheduleFlush() {
    if (this._flushTimer) clearTimeout(this._flushTimer);
    this._flushTimer = setTimeout(() => this._flushToDisk(), this._FLUSH_DELAY_MS);
  }

  _flushToDisk() {
    if (!this._dirty || !this._cache || !this.masterKey) return;
    try {
      const payloadObj = {
        schemaVersion: 1,
        lastModified: Date.now(),
        skus: this._cache,
      };
      const jsonStr = JSON.stringify(payloadObj);
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

      const tmpPath = this.encPath + '.tmp';
      fs.writeFileSync(tmpPath, JSON.stringify(filePayload, null, 2));
      fs.renameSync(tmpPath, this.encPath);

      this._dirty = false;
      this._pendingWriteCount = 0;
    } catch (e) {
      console.error('Failed to flush SkuDatabase to disk:', e);
    }
  }

  flushSync() {
    if (this._flushTimer) clearTimeout(this._flushTimer);
    this._flushToDisk();
  }
}

module.exports = SkuDatabase;
