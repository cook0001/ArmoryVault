const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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

  ipcMain.handle('get-firearms', () => db.getFirearms());
  ipcMain.handle('add-firearm', (_, firearm) => db.addFirearm(firearm));
  ipcMain.handle('update-firearm', (_, id, firearm) => db.updateFirearm(id, firearm));
  ipcMain.handle('delete-firearm', (_, id) => db.deleteFirearm(id));
  ipcMain.handle('save-photo', (_, sourcePath, filename) => db.savePhoto(sourcePath, filename));
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
