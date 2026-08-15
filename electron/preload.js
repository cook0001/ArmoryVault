const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getFirearms: () => ipcRenderer.invoke('get-firearms'),
  addFirearm: (firearm) => ipcRenderer.invoke('add-firearm', firearm),
  updateFirearm: (id, firearm) => ipcRenderer.invoke('update-firearm', id, firearm),
  deleteFirearm: (id) => ipcRenderer.invoke('delete-firearm', id),
  savePhoto: (sourcePath, filename) => ipcRenderer.invoke('save-photo', sourcePath, filename),
  exportData: (dataString, filename) => ipcRenderer.invoke('export-data', dataString, filename),
  onUpdateMessage: (callback) => ipcRenderer.on('updater-event', (_, data) => callback(data)),
  restartApp: () => ipcRenderer.send('restart-app')
});
