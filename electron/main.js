const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

const isDev = !app.isPackaged;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, '../build/icon.png'));
  }

  const { session } = require('electron');
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'media') {
      return true;
    }
    return false;
  });

  ipcMain.handle('is-vault-setup', () => db.isVaultSetup());
  ipcMain.handle('is-vault-locked', () => db.isLocked());
  ipcMain.handle('setup-vault', (_, password) => db.setupVault(password));
  ipcMain.handle('unlock-vault', (_, password) => db.unlockVault(password));
  ipcMain.handle('unlock-with-recovery-code', (_, code) => db.unlockWithRecoveryCode(code));

  ipcMain.handle('get-firearms', () => db.getFirearms());
  ipcMain.handle('add-firearm', (_, firearm) => db.addFirearm(firearm));
  ipcMain.handle('update-firearm', (_, id, firearm) => db.updateFirearm(id, firearm));
  ipcMain.handle('delete-firearm', (_, id) => db.deleteFirearm(id));
  
  ipcMain.handle('get-ammo', () => db.getAmmo());
  ipcMain.handle('add-ammo', (_, ammo) => db.addAmmo(ammo));
  ipcMain.handle('update-ammo', (_, id, ammo) => db.updateAmmo(id, ammo));
  ipcMain.handle('delete-ammo', (_, id) => db.deleteAmmo(id));

  ipcMain.handle('get-skus', () => db.getSkus());
  ipcMain.handle('save-skus', (_, skus) => { db.saveSkus(skus); return true; });
  ipcMain.handle('delete-sku', (_, skuId) => db.deleteSku(skuId));

  ipcMain.handle('save-photo', (_, sourcePath, filename) => db.savePhoto(sourcePath, filename));
  ipcMain.handle('save-document', (_, sourcePath, filename) => db.saveDocument(sourcePath, filename));
  
  ipcMain.handle('get-backup-folder', () => db.getBackupPath());
  ipcMain.handle('select-backup-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select Backup Folder',
      properties: ['openDirectory', 'createDirectory']
    });
    if (!canceled && filePaths.length > 0) {
      db.setBackupPath(filePaths[0]);
      return filePaths[0];
    }
    return null;
  });

  ipcMain.handle('select-and-save-document', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select Document',
      properties: ['openFile'],
      filters: [{ name: 'Documents', extensions: ['pdf', 'jpg', 'jpeg', 'png'] }]
    });
    if (!canceled && filePaths.length > 0) {
      const sourcePath = filePaths[0];
      const ext = path.extname(sourcePath);
      const filename = `doc_${Date.now()}${ext}`;
      const savedPath = db.saveDocument(sourcePath, filename);
      if (savedPath) {
        return { name: path.basename(sourcePath), path: savedPath };
      }
    }
    return null;
  });

  ipcMain.handle('select-and-save-photo', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select Photo',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }]
    });
    if (!canceled && filePaths.length > 0) {
      const sourcePath = filePaths[0];
      const ext = path.extname(sourcePath);
      const filename = `photo_${Date.now()}${ext}`;
      const savedPath = db.savePhoto(sourcePath, filename);
      if (savedPath) {
        return savedPath;
      }
    }
    return null;
  });

  ipcMain.handle('lookup-upc', async (_, upc) => {
    try {
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.error("UPC fetch error", e);
      return null;
    }
  });

  ipcMain.handle('open-external-file', async (_, filePath) => {
    // Strip file:// prefix if present
    const cleanPath = filePath.startsWith('file://') ? filePath.replace('file://', '') : filePath;
    return await shell.openPath(cleanPath);
  });

  ipcMain.handle('export-data', async (_, dataString, filename) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Data',
      defaultPath: filename,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });
    if (!canceled && filePath) {
      fs.writeFileSync(filePath, dataString);
      return true;
    }
    return false;
  });

  ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall();
  });

  createWindow();

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('updater-event', { type: 'update-available', data: info });
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send('updater-event', { type: 'download-progress', data: progressObj });
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('updater-event', { type: 'update-downloaded', data: info });
  });

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
