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
      encryptedMasterKey: encryptedMasterKey
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
      
      const derivedKey = crypto.pbkdf2Sync(password, Buffer.from(this.vaultMeta.salt, 'hex'), 100000, 32, 'sha256');
      const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, Buffer.from(this.vaultMeta.iv, 'hex'));
      decipher.setAuthTag(Buffer.from(this.vaultMeta.authTag, 'hex'));
      
      let masterKey = decipher.update(this.vaultMeta.encryptedMasterKey, 'hex');
      masterKey = Buffer.concat([Buffer.from(masterKey, 'hex'), decipher.final()]);
      
      // Test decryption to ensure it works
      const testDecipher = crypto.createDecipheriv('aes-256-gcm', masterKey, Buffer.from(filePayload.dataIv, 'hex'));
      testDecipher.setAuthTag(Buffer.from(filePayload.dataAuthTag, 'hex'));
      let decrypted = testDecipher.update(filePayload.encryptedData, 'hex', 'utf8');
      decrypted += testDecipher.final('utf8');

      this.masterKey = masterKey;
      return true;
    } catch (e) {
      console.error("Unlock failed:", e.message);
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
      const decipher = crypto.createDecipheriv('aes-256-gcm', masterKeyBuffer, Buffer.from(filePayload.dataIv, 'hex'));
      decipher.setAuthTag(Buffer.from(filePayload.dataAuthTag, 'hex'));
      let decrypted = decipher.update(filePayload.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      this.masterKey = masterKeyBuffer;
      return true;
    } catch(e) {
      return false;
    }
  }

  getData() {
    if (this.isLocked()) return { firearms: [], ammo: [] };
    if (!fs.existsSync(this.encPath)) return { firearms: [], ammo: [] };
    
    try {
      const filePayload = JSON.parse(fs.readFileSync(this.encPath, 'utf8'));
      if (!filePayload.encryptedData) return { firearms: [], ammo: [] };
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, Buffer.from(filePayload.dataIv, 'hex'));
      decipher.setAuthTag(Buffer.from(filePayload.dataAuthTag, 'hex'));
      let decrypted = decipher.update(filePayload.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const parsed = JSON.parse(decrypted);
      let data = { firearms: [], ammo: [], skus: {}, accessories: [], sync_queue: [] };
      if (Array.isArray(parsed)) {
        data.firearms = parsed;
      } else {
        data = { firearms: parsed.firearms || [], ammo: parsed.ammo || [], skus: parsed.skus || {}, accessories: parsed.accessories || [], sync_queue: parsed.sync_queue || [] };
      }
      
      // Migrate legacy mountedOnFirearmId to mounts array
      data.accessories = data.accessories.map(acc => {
        if (acc.mountedOnFirearmId && !acc.mounts) {
          acc.mounts = [{ firearmId: acc.mountedOnFirearmId, quantity: acc.quantity || 1 }];
          delete acc.mountedOnFirearmId;
        }
        return acc;
      });
      
      return data;
    } catch (e) {
      console.error(e);
      return { firearms: [], ammo: [] };
    }
  }

  saveData(dataObj) {
    if (this.isLocked()) throw new Error("Vault is locked");
    
    const jsonStr = JSON.stringify(dataObj);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    
    let encryptedData = cipher.update(jsonStr, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    const dataAuthTag = cipher.getAuthTag().toString('hex');
    
    const filePayload = {
      vault: this.vaultMeta,
      dataIv: iv.toString('hex'),
      dataAuthTag: dataAuthTag,
      encryptedData: encryptedData
    };
    
    fs.writeFileSync(this.encPath, JSON.stringify(filePayload, null, 2));
    this.triggerBackup();
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
      // Keep only one backup per day to avoid spamming, or just use one file name that overwrites
      const dest = path.join(backupPath, `ArmouryVault_Backup.enc`);
      try {
        fs.copyFileSync(this.encPath, dest);
      } catch (e) {
        console.error("Backup failed:", e);
      }
    }
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
    const newId = firearms.length > 0 ? Math.max(...firearms.map(f => f.id || 0)) + 1 : 1;
    firearms.push({ ...firearm, id: newId });
    this.saveFirearms(firearms);
    return newId;
  }

  updateFirearm(id, firearm) {
    const firearms = this.getFirearms();
    const index = firearms.findIndex(f => f.id === id);
    if (index !== -1) {
      firearms[index] = { ...firearm, id };
      this.saveFirearms(firearms);
    }
    return id;
  }

  deleteFirearm(id) {
    let firearms = this.getFirearms();
    firearms = firearms.filter(f => f.id !== id);
    this.saveFirearms(firearms);
    return id;
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
    const newId = ammoList.length > 0 ? Math.max(...ammoList.map(a => a.id || 0)) + 1 : 1;
    ammoList.push({ ...ammo, id: newId });
    this.saveAmmoList(ammoList);
    return newId;
  }

  updateAmmo(id, ammo) {
    const ammoList = this.getAmmo();
    const index = ammoList.findIndex(a => a.id === id);
    if (index !== -1) {
      ammoList[index] = { ...ammo, id };
      this.saveAmmoList(ammoList);
    }
    return id;
  }

  deleteAmmo(id) {
    let ammoList = this.getAmmo();
    ammoList = ammoList.filter(a => a.id !== id);
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
    const newId = list.length > 0 ? Math.max(...list.map(a => a.id || 0)) + 1 : 1;
    list.push({ ...accessory, id: newId });
    this.saveAccessoriesList(list);
    return newId;
  }

  updateAccessory(id, accessory) {
    const list = this.getAccessories();
    const index = list.findIndex(a => a.id === id);
    if (index !== -1) {
      list[index] = { ...accessory, id };
      this.saveAccessoriesList(list);
    }
    return id;
  }

  deleteAccessory(id) {
    let list = this.getAccessories();
    list = list.filter(a => a.id !== id);
    this.saveAccessoriesList(list);
    return id;
  }

  getSkus() {
    return this.getData().skus || {};
  }

  saveSkus(skus) {
    const data = this.getData();
    data.skus = skus;
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
    const newId = queue.length > 0 ? Math.max(...queue.map(i => i.id || 0)) + 1 : 1;
    queue.push({ ...item, id: newId });
    this.saveSyncQueue(queue);
    return newId;
  }

  removeSyncItem(id) {
    let queue = this.getSyncQueue();
    queue = queue.filter(i => i.id !== id);
    this.saveSyncQueue(queue);
    return id;
  }

  clearSyncQueue() {
    this.saveSyncQueue([]);
  }
}

module.exports = new Database();
