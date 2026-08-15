const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  isVaultSetup: () => ipcRenderer.invoke('is-vault-setup'),
  isVaultLocked: () => ipcRenderer.invoke('is-vault-locked'),
  setupVault: (password) => ipcRenderer.invoke('setup-vault', password),
  unlockVault: (password) => ipcRenderer.invoke('unlock-vault', password),
  unlockWithRecoveryCode: (code) => ipcRenderer.invoke('unlock-with-recovery-code', code),
  
  getFirearms: () => ipcRenderer.invoke('get-firearms'),
  addFirearm: (firearm) => ipcRenderer.invoke('add-firearm', firearm),
  updateFirearm: (id, firearm) => ipcRenderer.invoke('update-firearm', id, firearm),
  deleteFirearm: (id) => ipcRenderer.invoke('delete-firearm', id),
  
  getAmmo: () => ipcRenderer.invoke('get-ammo'),
  addAmmo: (ammo) => ipcRenderer.invoke('add-ammo', ammo),
  updateAmmo: (id, ammo) => ipcRenderer.invoke('update-ammo', id, ammo),
  deleteAmmo: (id) => ipcRenderer.invoke('delete-ammo', id),
  
  getAccessories: () => ipcRenderer.invoke('get-accessories'),
  addAccessory: (acc) => ipcRenderer.invoke('add-accessory', acc),
  updateAccessory: (id, acc) => ipcRenderer.invoke('update-accessory', id, acc),
  deleteAccessory: (id) => ipcRenderer.invoke('delete-accessory', id),

  getSkus: () => ipcRenderer.invoke('get-skus'),
  saveSkus: (skus) => ipcRenderer.invoke('save-skus', skus),
  deleteSku: (skuId) => ipcRenderer.invoke('delete-sku', skuId),
  
  savePhoto: (sourcePath, filename) => ipcRenderer.invoke('save-photo', sourcePath, filename),
  saveDocument: (sourcePath, filename) => ipcRenderer.invoke('save-document', sourcePath, filename),
  
  getBackupFolder: () => ipcRenderer.invoke('get-backup-folder'),
  selectBackupFolder: () => ipcRenderer.invoke('select-backup-folder'),
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),
  
  selectAndSaveDocument: () => ipcRenderer.invoke('select-and-save-document'),
  selectAndSavePhoto: () => ipcRenderer.invoke('select-and-save-photo'),
  openExternalFile: (filePath) => ipcRenderer.invoke('open-external-file', filePath),
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  generateBillOfSale: (data) => ipcRenderer.invoke('generate-bill-of-sale', data),
  generateInsuranceReport: (data) => ipcRenderer.invoke('generate-insurance-report', data),
  printQRLabel: (data) => ipcRenderer.invoke('print-qr-label', data),
  readFileBase64: (filePath) => ipcRenderer.invoke('read-file-base64', filePath),
  lookupUPC: (upc) => ipcRenderer.invoke('lookup-upc', upc),
  
  exportData: (dataString, filename) => ipcRenderer.invoke('export-data', dataString, filename),
  onUpdateMessage: (callback) => ipcRenderer.on('updater-event', (_, data) => callback(data)),
  restartApp: () => ipcRenderer.send('restart-app'),
  getPlatform: () => process.platform
});
