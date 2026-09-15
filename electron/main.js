const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./database');
const ModuleManager = require('./ModuleManager');
const log = require('electron-log');
const isDev = !app.isPackaged;
const { autoUpdater } = require('electron-updater');

const moduleManager = new ModuleManager();

// Prevent EPIPE crashes when stdout/stderr pipe closes (e.g. concurrently dies)
process.stdout?.on?.('error', (err) => {
  if (err.code !== 'EPIPE') throw err;
});
process.stderr?.on?.('error', (err) => {
  if (err.code !== 'EPIPE') throw err;
});

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
  {
    scheme: 'local-file',
    privileges: { secure: true, standard: true, supportFetchAPI: true, bypassCSP: true },
  },
]);

let mainWindow;

function createWindow() {
  const iconPath = path.join(__dirname, '../build/icon.png');
  const windowConfig = {
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      backgroundThrottling: true,
    },
  };

  if (fs.existsSync(iconPath)) {
    windowConfig.icon = iconPath;
  }

  mainWindow = new BrowserWindow(windowConfig);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadURL('app://-/index.html');
  }

  mainWindow.webContents.on('console-message', (event, ...args) => {
    const msg =
      typeof event === 'object' && event?.message !== undefined ? event.message : args[1] || event;
    const src =
      typeof event === 'object' && event?.sourceId !== undefined ? event.sourceId : args[3] || '';
    const ln =
      typeof event === 'object' && event?.lineNumber !== undefined
        ? event.lineNumber
        : args[2] || '';
    console.log(`[Renderer] ${msg}${src ? ` (${src}:${ln})` : ''}`);
  });
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('app', (request, callback) => {
    let url = request.url.replace(/^app:\/\/[^/]+\//, '');
    if (!url || url === '/') url = 'index.html';
    url = url.split('?')[0].split('#')[0];
    callback({ path: path.normalize(path.join(__dirname, '../dist', url)) });
  });

  protocol.registerFileProtocol('local-file', (request, callback) => {
    let url = request.url;
    const isThumb = url.includes('thumb=1');
    url = url.split('?')[0];

    // Strip local-file:// or local-file:///
    url = url.replace(/^local-file:\/+/, '');
    // Strip file:// or file:/// or file/// (browser sometimes strips the colon)
    url = url.replace(/^(file:\/+)|(file\/+)/, '');

    // Ensure absolute path
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    let resolvedPath = url;
    try {
      resolvedPath = decodeURIComponent(url);
    } catch {}

    if (isThumb) {
      const dir = path.dirname(resolvedPath);
      const filename = path.basename(resolvedPath);
      const thumbPath = path.join(dir, `thumb_${filename}`);
      if (fs.existsSync(thumbPath)) {
        return callback({ path: thumbPath });
      }
      // Trigger async thumbnail generation with sharp if available
      if (db.media && typeof db.media._generateThumbnail === 'function') {
        db.media._generateThumbnail(resolvedPath, filename).catch(() => {});
      }
    }

    return callback({ path: resolvedPath });
  });

  // Background thumbnail backfill for existing media (runs after 3s idle delay)
  setTimeout(() => {
    if (db.media && typeof db.media.backfillThumbnails === 'function') {
      db.media.backfillThumbnails().catch(() => {});
    }
  }, 3000);

  if (process.platform === 'darwin' && isDev) {
    try {
      app.dock.setIcon(path.join(__dirname, '../build/icon.png'));
    } catch (e) {
      console.log('Icon not found, skipping dock icon set');
    }
  }

  const { session } = require('electron');
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });

  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      if (permission === 'media') {
        return true;
      }
      return false;
    }
  );

  ipcMain.handle('is-vault-setup', () => db.isVaultSetup());
  ipcMain.handle('is-vault-locked', () => db.isLocked());
  ipcMain.handle('setup-vault', (_, password) => db.setupVault(password));
  ipcMain.handle('unlock-vault', (_, password) => db.unlockVault(password));
  ipcMain.handle('unlock-with-recovery-code', (_, code) => db.unlockWithRecoveryCode(code));
  ipcMain.handle('change-password', (_, { currentPassword, newPassword, regenerateRecoveryKey }) =>
    db.changePassword(currentPassword, newPassword, regenerateRecoveryKey)
  );
  ipcMain.handle('regenerate-recovery-key', (_, { currentPassword }) =>
    db.regenerateRecoveryKey(currentPassword)
  );
  ipcMain.handle('get-recovery-code', () => db.getRecoveryCode());
  ipcMain.handle('lock-vault', () => db.lockVault());

  ipcMain.handle('get-firearms', () => db.getFirearms());
  ipcMain.handle('add-firearm', (_, firearm) => db.addFirearm(firearm));
  ipcMain.handle('import-firearms-batch', (_, firearmsList, updatesList) =>
    db.importFirearmsBatch(firearmsList, updatesList)
  );
  ipcMain.handle('update-firearm', (_, id, firearm) => db.updateFirearm(id, firearm));
  ipcMain.handle('delete-firearm', (_, id) => db.deleteFirearm(id));

  ipcMain.handle('get-ammo', () => db.getAmmo());
  ipcMain.handle('add-ammo', (_, ammo) => db.addAmmo(ammo));
  ipcMain.handle('import-ammo-batch', (_, ammoList, updatesList) =>
    db.importAmmoBatch(ammoList, updatesList)
  );
  ipcMain.handle('update-ammo', (_, id, ammo) => db.updateAmmo(id, ammo));
  ipcMain.handle('delete-ammo', (_, id) => db.deleteAmmo(id));

  ipcMain.handle('get-accessories', () => db.getAccessories());
  ipcMain.handle('add-accessory', (_, acc) => db.addAccessory(acc));
  ipcMain.handle('import-accessories-batch', (_, accessoriesList) =>
    db.importAccessoriesBatch(accessoriesList)
  );
  ipcMain.handle('update-accessory', (_, id, acc) => db.updateAccessory(id, acc));
  ipcMain.handle('delete-accessory', (_, id) => db.deleteAccessory(id));

  ipcMain.handle('get-components', () => db.getComponents());
  ipcMain.handle('add-component', (_, comp) => db.addComponent(comp));
  ipcMain.handle('import-components-batch', (_, componentsList) =>
    db.importComponentsBatch(componentsList)
  );
  ipcMain.handle('update-component', (_, id, comp) => db.updateComponent(id, comp));
  ipcMain.handle('delete-component', (_, id) => db.deleteComponent(id));

  ipcMain.handle('get-skus', () => db.getSkus());
  ipcMain.handle('save-skus', (_, skus) => {
    db.saveSkus(skus);
    return true;
  });
  ipcMain.handle('delete-sku', (_, skuId) => db.deleteSku(skuId));
  ipcMain.handle('export-skus-catalog', () => db.exportSkusCatalog());
  ipcMain.handle('import-skus-catalog', (_, data, mode) => db.importSkusCatalog(data, mode));

  ipcMain.handle('get-sync-queue', () => db.getSyncQueue());
  ipcMain.handle('remove-sync-item', (_, id) => {
    const res = db.removeSyncItem(id);
    if (mainWindow) mainWindow.webContents.send('sync-received');
    return res;
  });
  ipcMain.handle('clear-sync-queue', () => {
    db.clearSyncQueue();
    if (mainWindow) mainWindow.webContents.send('sync-received');
    return true;
  });

  // ─── Storage Locations ──────────────────────────────────────────────
  ipcMain.handle('get-storage-locations', () => db.getStorageLocations());
  ipcMain.handle('add-storage-location', (_, loc) => db.addStorageLocation(loc));
  ipcMain.handle('update-storage-location', (_, id, loc) => db.updateStorageLocation(id, loc));
  ipcMain.handle('delete-storage-location', (_, id) => db.deleteStorageLocation(id));

  // ─── Chronograph Strings ────────────────────────────────────────────
  ipcMain.handle('get-chrono-strings', () => db.getChronoStrings());
  ipcMain.handle('add-chrono-string', (_, cs) => db.addChronoString(cs));
  ipcMain.handle('delete-chrono-string', (_, id) => db.deleteChronoString(id));

  // ─── Target Analyses ────────────────────────────────────────────────
  ipcMain.handle('get-target-analyses', () => db.getTargetAnalyses());
  ipcMain.handle('add-target-analysis', (_, ta) => db.addTargetAnalysis(ta));
  ipcMain.handle('delete-target-analysis', (_, id) => db.deleteTargetAnalysis(id));

  // ─── Load Ladder Tests ──────────────────────────────────────────────
  ipcMain.handle('get-load-ladder-tests', () => db.getLoadLadderTests());
  ipcMain.handle('add-load-ladder-test', (_, lt) => db.addLoadLadderTest(lt));
  ipcMain.handle('update-load-ladder-test', (_, id, lt) => db.updateLoadLadderTest(id, lt));
  ipcMain.handle('delete-load-ladder-test', (_, id) => db.deleteLoadLadderTest(id));

  // ─── Ballistic Profiles ────────────────────────────────────────────
  ipcMain.handle('get-ballistic-profiles', () => db.getBallisticProfiles());
  ipcMain.handle('add-ballistic-profile', (_, bp) => db.addBallisticProfile(bp));
  ipcMain.handle('update-ballistic-profile', (_, id, bp) => db.updateBallisticProfile(id, bp));
  ipcMain.handle('delete-ballistic-profile', (_, id) => db.deleteBallisticProfile(id));

  ipcMain.handle('get-activity-log', () => db.getActivityLog());

  ipcMain.handle('log-range-session', (_, data) => {
    const res = db.logRangeSession(data);
    if (mainWindow) mainWindow.webContents.send('sync-received');
    return res;
  });

  ipcMain.handle('complete-maintenance-task', (_, firearmId, taskId, logData) => {
    const res = db.completeMaintenanceTask(firearmId, taskId, logData);
    if (mainWindow) mainWindow.webContents.send('sync-received');
    return res;
  });

  ipcMain.handle('get-custom-schedule-presets', () => db.getCustomSchedulePresets());
  ipcMain.handle('save-custom-schedule-presets', (_, presets) =>
    db.saveCustomSchedulePresets(presets)
  );
  ipcMain.handle('manufacture-handload-batch', (_, ammoId, quantity, deductions) => {
    const res = db.manufactureHandloadBatch(ammoId, quantity, deductions);
    if (mainWindow) mainWindow.webContents.send('sync-received');
    return res;
  });

  ipcMain.handle('save-photo', (_, sourcePath, filename) => db.savePhoto(sourcePath, filename));
  ipcMain.handle('save-base64-photo', (_, base64Data, filename) => {
    try {
      const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const fs = require('fs');
      const path = require('path');
      const destPath = path.join(db.photoDir, filename);
      fs.writeFileSync(destPath, base64Image, { encoding: 'base64' });
      return destPath;
    } catch (e) {
      console.error(e);
      return null;
    }
  });
  ipcMain.handle('save-document', (_, sourcePath, filename) =>
    db.saveDocument(sourcePath, filename)
  );
  ipcMain.handle('save-base64-document', (_, base64Data, filename) => {
    try {
      const base64Doc = base64Data.replace(/^data:[^;]+;base64,/, '');
      const fs = require('fs');
      const path = require('path');
      const destPath = path.join(db.docDir, filename);
      fs.writeFileSync(destPath, base64Doc, { encoding: 'base64' });
      return destPath;
    } catch (e) {
      console.error('Failed to save base64 document:', e);
      return null;
    }
  });

  ipcMain.handle('get-backup-folder', () => db.getBackupPath());
  ipcMain.handle('create-zip-backup', async () => {
    try {
      const defaultDate = new Date().toISOString().split('T')[0];
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Full Backup Archive (.zip)',
        defaultPath: `ArmoryVault_Full_Backup_${defaultDate}.zip`,
        filters: [{ name: 'Zip Archives (*.zip)', extensions: ['zip'] }],
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      db.createZipBackup(filePath);
      return { success: true, filePath };
    } catch (e) {
      console.error('Error creating zip backup:', e);
      return { success: false, error: e.message || String(e) };
    }
  });
  ipcMain.handle('select-backup-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Backup Folder',
    });
    if (!canceled && filePaths.length > 0) {
      db.setBackupPath(filePaths[0]);
      return filePaths[0];
    }
    return null;
  });

  ipcMain.handle('restore-backup', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Backup File to Restore',
      properties: ['openFile'],
      filters: [
        { name: 'ArmoryVault Backups (*.enc, *.zip)', extensions: ['enc', 'zip'] },
        { name: 'Encrypted Vault (*.enc)', extensions: ['enc'] },
        { name: 'Full Zip Archive (*.zip)', extensions: ['zip'] },
      ],
    });
    if (canceled || !filePaths || filePaths.length === 0) {
      return { canceled: true };
    }

    try {
      const result = db.restoreBackup(filePaths[0]);
      return { success: true, filePath: filePaths[0], ...result };
    } catch (e) {
      console.error('Failed to restore backup:', e);
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('get-config', (_, key) => {
    return db.getConfig(key);
  });

  ipcMain.handle('set-config', (_, key, value) => {
    db.setConfig(key, value);
  });

  ipcMain.handle('archive-module-data', async (_, moduleId, dataKeys) => {
    return db.archiveModuleData(moduleId, dataKeys);
  });

  ipcMain.handle('restore-module-data', async (_, moduleId) => {
    return db.restoreModuleData(moduleId);
  });

  ipcMain.handle('get-module-archives', async () => {
    return db.getModuleArchives();
  });

  ipcMain.handle('download-module', async (event, moduleId) => {
    return moduleManager.downloadModule(moduleId, event.sender);
  });

  ipcMain.handle('delete-module-files', async (_, moduleId) => {
    return moduleManager.deleteModuleFiles(moduleId);
  });

  ipcMain.handle('get-installed-disk-modules', async () => {
    return moduleManager.getInstalledDiskModules();
  });

  ipcMain.handle('check-remote-modules', async () => {
    return moduleManager.checkRemoteModules();
  });

  ipcMain.handle('get-module-bundle', async (_, moduleId) => {
    return moduleManager.getModuleBundle(moduleId);
  });

  ipcMain.handle('select-csv-file', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Select CSV / TSV File to Import',
        properties: ['openFile'],
        filters: [
          { name: 'CSV & Spreadsheets (*.csv, *.tsv, *.txt)', extensions: ['csv', 'tsv', 'txt'] },
          { name: 'CSV Spreadsheets (*.csv)', extensions: ['csv'] },
          { name: 'All Files (*.*)', extensions: ['*'] },
        ],
      });
      if (!canceled && filePaths.length > 0) {
        const filePath = filePaths[0];
        const content = require('fs').readFileSync(filePath, 'utf-8');
        return { name: path.basename(filePath), path: filePath, content };
      }
      return null;
    } catch (e) {
      console.error('select-csv-file error:', e);
      return null;
    }
  });

  ipcMain.handle('select-and-save-document', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select Document',
      properties: ['openFile'],
      filters: [{ name: 'Documents', extensions: ['pdf', 'jpg', 'jpeg', 'png'] }],
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
    console.log('Main: select-and-save-photo called');
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Photo',
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }],
      });
      console.log('Dialog result:', { canceled, filePaths });
      if (!canceled && filePaths.length > 0) {
        const savedPaths = [];
        for (const sourcePath of filePaths) {
          const ext = path.extname(sourcePath);
          const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(2)}${ext}`;
          const savedPath = db.savePhoto(sourcePath, filename);
          if (savedPath) {
            savedPaths.push(savedPath);
          }
        }
        return savedPaths.length > 0 ? savedPaths : null;
      }
      return null;
    } catch (e) {
      console.error('Main: error in select-and-save-photo', e);
      return null;
    }
  });

  ipcMain.handle('save-qr-image', async (_, { itemName, qrDataUrl }) => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Save QR Code',
        defaultPath: `QR_${itemName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`,
        filters: [{ name: 'Images', extensions: ['png'] }],
      });
      if (filePath) {
        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
        require('fs').writeFileSync(filePath, base64Data, 'base64');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Save QR failed', e);
      return false;
    }
  });

  ipcMain.handle('lookup-upc', async (_, upc) => {
    try {
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.error('UPC fetch error', e);
      return null;
    }
  });

  ipcMain.handle('open-external-file', async (_, filePath) => {
    const cleanPath = filePath.startsWith('file://') ? filePath.replace('file://', '') : filePath;
    return await shell.openPath(cleanPath);
  });

  ipcMain.handle('open-url', async (_, url) => {
    return await shell.openExternal(url);
  });

  ipcMain.handle('export-data', async (_, dataString, filename) => {
    try {
      const ext =
        filename && filename.includes('.') ? filename.split('.').pop().toLowerCase() : 'csv';
      let filterName = 'CSV Spreadsheet (*.csv)';
      if (ext === 'json') filterName = 'JSON Document (*.json)';
      else if (ext === 'txt') filterName = 'Text Document (*.txt)';
      else if (ext === 'csv') filterName = 'CSV Spreadsheet (*.csv)';
      else filterName = `${ext.toUpperCase()} File (*.${ext})`;

      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Data',
        defaultPath: filename || 'export.csv',
        filters: [
          { name: filterName, extensions: [ext] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (!canceled && filePath) {
        require('fs').writeFileSync(filePath, dataString, 'utf-8');
        return filePath;
      }
      return null;
    } catch (err) {
      console.error('Error exporting data', err);
      return null;
    }
  });

  ipcMain.handle('read-file-buffer', async (_, filePath) => {
    try {
      const fs = require('fs');
      let targetPath = filePath;
      if (filePath.startsWith('file://')) targetPath = filePath.substring(7);
      try {
        targetPath = decodeURI(targetPath);
      } catch (e) {}
      if (fs.existsSync(targetPath)) {
        return fs.readFileSync(targetPath); // Returns a Buffer (Uint8Array) directly over IPC
      }
      return null;
    } catch (err) {
      console.error('Error reading file buffer:', err);
      return null;
    }
  });

  ipcMain.handle('read-file-base64', async (_, filePath) => {
    console.log('Handling read-file-base64', filePath);
    try {
      const fs = require('fs');
      let targetPath = filePath;
      if (filePath.startsWith('file://')) targetPath = filePath.substring(7);
      try {
        targetPath = decodeURI(targetPath);
      } catch (e) {}
      console.log('Target path:', targetPath);
      if (fs.existsSync(targetPath)) {
        const data = fs.readFileSync(targetPath, 'base64');
        console.log('Read success, length:', data.length);
        return data;
      } else {
        console.log('File not found:', targetPath);
      }
      return null;
    } catch (err) {
      console.error('Error reading file as base64', err);
      return null;
    }
  });

  ipcMain.handle('print-qr-label', async (_, { itemName, itemDetails, qrDataUrl }) => {
    return new Promise((resolve, reject) => {
      const win = new BrowserWindow({ show: false });
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page { size: 4in 2in; margin: 0; }
            body { font-family: sans-serif; margin: 0; padding: 0.25in; display: flex; align-items: center; justify-content: space-between; }
            .info { flex: 1; margin-right: 10px; }
            .title { font-size: 14pt; font-weight: bold; margin-bottom: 5px; }
            .details { font-size: 10pt; color: #333; }
            .qr-code { width: 1.25in; height: 1.25in; }
          </style>
        </head>
        <body>
          <div class="info">
            <div class="title">${itemName}</div>
            <div class="details">${itemDetails.replace(/\n/g, '<br/>')}</div>
          </div>
          <img src="${qrDataUrl}" class="qr-code" />
        </body>
        </html>
      `;

      win
        .loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
        .then(() => {
          setTimeout(() => {
            win.webContents.print(
              { silent: false, printBackground: true },
              async (success, errorType) => {
                if (!success) {
                  console.log('Print failed', errorType);
                  const { response } = await dialog.showMessageBox({
                    type: 'warning',
                    buttons: ['Save as PDF', 'Cancel'],
                    title: 'Print Failed',
                    message:
                      'Failed to print the QR label. Would you like to save it as a PDF instead?',
                  });

                  if (response === 0) {
                    const fs = require('fs');
                    const pdfPath = await dialog.showSaveDialog({
                      title: 'Save QR Label as PDF',
                      defaultPath: `QR_Label_${itemName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
                      filters: [{ name: 'PDF', extensions: ['pdf'] }],
                    });
                    if (!pdfPath.canceled && pdfPath.filePath) {
                      try {
                        const pdfData = await win.webContents.printToPDF({
                          printBackground: true,
                          pageSize: 'Letter',
                        });
                        fs.writeFileSync(pdfPath.filePath, pdfData);
                        resolve(true);
                      } catch (e) {
                        console.error('Failed to save PDF', e);
                        resolve(false);
                      }
                    } else {
                      resolve(false);
                    }
                  } else {
                    resolve(false);
                  }
                } else {
                  resolve(true);
                }
                win.close();
              }
            );
          }, 500);
        })
        .catch((err) => {
          console.error('Failed to load QR html', err);
          resolve(false);
          win.close();
        });
    });
  });

  ipcMain.handle('generate-insurance-report', async (_, data) => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Save Insurance Report PDF',
        defaultPath: `Armory_Vault_Insurance_Report.pdf`,
        filters: [{ name: 'PDFs', extensions: ['pdf'] }],
      });

      if (!filePath) return null;

      const fs = require('fs');

      const firearmRows = (data.firearms || [])
        .map(
          (f) => `
        <tr>
          <td>${f.make} ${f.model}</td>
          <td>${f.caliber || '-'}</td>
          <td>${f.serial_number || '-'}</td>
          <td>${f.is_nfa ? f.nfa_type || 'Yes' : '-'}</td>
          <td>$${f.purchase_price ? Number(f.purchase_price).toFixed(2) : '0.00'}</td>
        </tr>
      `
        )
        .join('');

      const accessoryRows = (data.accessories || [])
        .map(
          (a) => `
        <tr>
          <td>${a.manufacturer} ${a.model} (${a.type})</td>
          <td>-</td>
          <td>${a.serialNumber || '-'}</td>
          <td>${a.is_nfa ? a.nfa_type || 'Yes' : '-'}</td>
          <td>$${a.value ? (Number(a.value) * (a.quantity || 1)).toFixed(2) : '0.00'}</td>
        </tr>
      `
        )
        .join('');

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
              h1 { text-align: center; color: #111; margin-bottom: 5px; font-size: 2rem; }
              h2 { text-align: center; color: #555; margin-top: 0; font-size: 1.1rem; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
              th { background-color: #f5f5f5; color: #111; font-weight: bold; }
              .total { text-align: right; font-size: 1.5rem; font-weight: bold; margin-top: 30px; border-top: 2px solid #333; padding-top: 10px; }
            </style>
          </head>
          <body>
            <h1>Armory Vault Insurance Report</h1>
            <h2>Generated on ${new Date().toLocaleDateString()}</h2>
            
            <h3>Firearms</h3>
            <table>
              <thead>
                <tr>
                  <th>Make/Model</th>
                  <th>Caliber</th>
                  <th>Serial Number</th>
                  <th>NFA</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${firearmRows}
              </tbody>
            </table>

            <h3>Accessories</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Caliber</th>
                  <th>Serial Number</th>
                  <th>NFA</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${accessoryRows}
              </tbody>
            </table>

            <div class="total">
              Total Insured Value: $${Number(data.totalValue || 0).toFixed(2)}
            </div>
          </body>
        </html>
      `;

      const pdfWindow = new BrowserWindow({
        show: false,
        webPreferences: { nodeIntegration: false },
      });
      await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      const pdfData = await pdfWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: 'Letter',
      });

      fs.writeFileSync(filePath, pdfData);
      pdfWindow.close();
      return filePath;
    } catch (error) {
      console.error('Error generating insurance report:', error);
      throw error;
    }
  });

  const getTypstBinary = () => {
    if (process.env.TYPST_BIN && fs.existsSync(process.env.TYPST_BIN)) {
      return process.env.TYPST_BIN;
    }
    const candidates = ['/usr/local/bin/typst', '/opt/homebrew/bin/typst', '/usr/bin/typst'];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  };

  const getArmsTraderDbPath = () => {
    const candidates = [
      path.resolve(__dirname, '../../../armstrader.store/armstrader.sqlite'),
      path.resolve(__dirname, '../../armstrader.store/armstrader.sqlite'),
      path.resolve(app.getPath('userData'), 'armstrader.sqlite'),
      '/Users/danielc/Documents/armstrader.store/armstrader.sqlite',
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return null;
  };

  ipcMain.handle('generate-bill-of-sale', async (_, data) => {
    try {
      const { execFile } = require('child_process');

      // Prompt user to save external copy
      const defaultFilename =
        `Bill_of_Sale_${data.make || 'Firearm'}_${data.model || 'Transfer'}.pdf`.replace(
          /\s+/g,
          '_'
        );
      const { filePath } = await dialog.showSaveDialog({
        title: 'Save Bill of Sale PDF',
        defaultPath: defaultFilename,
        filters: [{ name: 'PDFs', extensions: ['pdf'] }],
      });

      if (!filePath) return null; // User cancelled save dialog

      const templatePath = path.join(__dirname, 'templates', 'bill_of_sale.typ');
      const typstBin = getTypstBinary();

      const typstPayload = {
        doc_id: data.doc_id || `AV-BOS-${Date.now().toString().slice(-6)}`,
        date: data.sold_date || data.date || new Date().toISOString().split('T')[0],
        price: data.sold_price
          ? `$${parseFloat(data.sold_price).toFixed(2)}`
          : data.price
            ? `$${parseFloat(data.price).toFixed(2)}`
            : '$0.00',
        payment_method: data.payment_method || 'Cash / Private Transfer',
        city: data.city || '',
        county: data.county || '',
        state: data.state || '',
        make: data.make || 'N/A',
        model: data.model || 'N/A',
        serial: data.serial_number || data.serial || 'N/A',
        caliber: data.caliber || 'N/A',
        action_type: data.action_type || data.firearm_type || 'N/A',
        accessories: data.accessories || data.sale_notes || '',
        seller_name: data.seller_name || '',
        seller_address: data.seller_address || '',
        seller_city_state_zip: data.seller_city_state_zip || '',
        seller_phone: data.seller_phone || '',
        seller_id: data.seller_id || '',
        seller_id_exp: data.seller_id_exp || '',
        buyer_name: data.sold_to_name || data.buyer_name || '',
        buyer_address: data.buyer_address || '',
        buyer_city_state_zip: data.buyer_city_state_zip || '',
        buyer_phone: data.buyer_phone || '',
        buyer_id: data.buyer_id || '',
        buyer_id_exp: data.buyer_id_exp || '',
        ffl_required: Boolean(data.ffl_required),
      };

      let pdfGenerated = false;

      // 1. High-Performance Zero-Bloat Local Typst Compilation
      if (typstBin && fs.existsSync(templatePath)) {
        try {
          await new Promise((resolve, reject) => {
            execFile(
              typstBin,
              [
                'compile',
                '--root',
                '/',
                templatePath,
                filePath,
                '--input',
                `data=${JSON.stringify(typstPayload)}`,
              ],
              (err, stdout, stderr) => {
                if (err) return reject(new Error(stderr || err.message));
                resolve(stdout);
              }
            );
          });
          pdfGenerated = true;
        } catch (typstErr) {
          console.warn('Local Typst compilation fallback triggered:', typstErr.message);
        }
      }

      // 2. ArmsTrader API Bridge Fallback (when typst cli absent but online)
      if (!pdfGenerated && typeof fetch === 'function') {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const response = await fetch('https://armstrader.store/api/bill-of-sale/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(typstPayload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
            pdfGenerated = true;
          }
        } catch (apiErr) {
          console.warn(
            'ArmsTrader PDF bridge offline, falling back to Electron HTML renderer:',
            apiErr.message
          );
        }
      }

      // 3. Resilient Built-in Electron HTML printToPDF Fallback
      if (!pdfGenerated) {
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 24px 36px; color: #1e293b; line-height: 1.5; }
                h1 { text-align: center; color: #0f172a; margin-bottom: 4px; font-size: 1.6rem; letter-spacing: 0.05em; }
                h2 { text-align: center; color: #64748b; margin-top: 0; font-size: 0.95rem; margin-bottom: 20px; font-weight: 500; }
                .section { margin-bottom: 16px; padding: 14px 18px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc; }
                .section h3 { margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; color: #0f172a; font-size: 1rem; }
                .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.9rem; }
                .row span { font-weight: 600; color: #475569; width: 140px; }
                .val { color: #0f172a; font-weight: 500; }
                .signatures { margin-top: 36px; display: flex; justify-content: space-between; gap: 40px; }
                .sig-block { flex: 1; }
                .sig-line { border-bottom: 1px solid #0f172a; height: 35px; margin-bottom: 5px; }
                .sig-label { font-size: 0.8rem; color: #64748b; }
              </style>
            </head>
            <body>
              <h1>FIREARM BILL OF SALE & TRANSFER RECORD</h1>
              <h2>Private Party Intrastate Firearm Transfer Documentation</h2>
              
              <div class="section">
                <h3>Firearm Information</h3>
                <div class="row"><span>Make:</span> <div class="val">${typstPayload.make}</div></div>
                <div class="row"><span>Model:</span> <div class="val">${typstPayload.model}</div></div>
                <div class="row"><span>Serial Number:</span> <div class="val">${typstPayload.serial}</div></div>
                <div class="row"><span>Caliber:</span> <div class="val">${typstPayload.caliber}</div></div>
                <div class="row"><span>Type:</span> <div class="val">${typstPayload.action_type}</div></div>
              </div>

              <div class="section">
                <h3>Sale Details</h3>
                <div class="row"><span>Date of Sale:</span> <div class="val">${typstPayload.date}</div></div>
                <div class="row"><span>Sale Price:</span> <div class="val">${typstPayload.price}</div></div>
                <div class="row"><span>Payment Method:</span> <div class="val">${typstPayload.payment_method}</div></div>
                <div class="row"><span>Notes / Accessories:</span> <div class="val">${typstPayload.accessories || 'None'}</div></div>
              </div>

              <div style="display: flex; gap: 16px;">
                <div class="section" style="flex: 1;">
                  <h3>Seller (Transferor)</h3>
                  <div class="row"><span>Name:</span> <div class="val">${typstPayload.seller_name || '_________________________'}</div></div>
                  <div class="row"><span>ID / CCW:</span> <div class="val">${typstPayload.seller_id || 'On File'}</div></div>
                </div>
                <div class="section" style="flex: 1;">
                  <h3>Buyer (Transferee)</h3>
                  <div class="row"><span>Name:</span> <div class="val">${typstPayload.buyer_name || '_________________________'}</div></div>
                  <div class="row"><span>ID / CCW:</span> <div class="val">${typstPayload.buyer_id || 'On File'}</div></div>
                </div>
              </div>

              <p style="font-size: 0.8rem; color: #64748b; margin-top: 24px;">
                By signing below, the Seller certifies lawful ownership and receipt of consideration. The Buyer certifies they are not prohibited under federal or state law (18 U.S.C. § 922) from purchasing or possessing firearms.
              </p>

              <div class="signatures">
                <div class="sig-block">
                  <div class="sig-line"></div>
                  <div class="sig-label">Seller Signature & Date</div>
                </div>
                <div class="sig-block">
                  <div class="sig-line"></div>
                  <div class="sig-label">Buyer Signature & Date</div>
                </div>
              </div>
            </body>
          </html>
        `;

        const win = new BrowserWindow({ show: false });
        await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

        const pdfBuffer = await win.webContents.printToPDF({
          printBackground: true,
          pageSize: 'Letter',
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        });

        fs.writeFileSync(filePath, pdfBuffer);
        win.close();
      }

      // Also copy external PDF into encrypted vault document directory for audit trail
      const vaultFilename =
        `Bill_of_Sale_${data.make || 'Firearm'}_${data.model || 'Record'}_${Date.now()}.pdf`.replace(
          /\s+/g,
          '_'
        );
      const vaultDestPath = path.join(db.docDir, vaultFilename);
      fs.copyFileSync(filePath, vaultDestPath);

      return `file://${vaultDestPath}`;
    } catch (e) {
      console.error('Failed to generate Bill of Sale:', e);
      return null;
    }
  });

  ipcMain.handle('generate-armory-binder', async (_, data = {}) => {
    try {
      const defaultFilename = `Armory_Insurance_Appraisal_${new Date().toISOString().split('T')[0]}.pdf`;
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Armory Insurance Appraisal & Catalog Binder',
        defaultPath: path.join(app.getPath('documents'), defaultFilename),
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      });

      if (canceled || !filePath) return null;

      // Privacy Protection: If maskSerials is enabled, redact firearm & NFA serial numbers
      // ensuring full serial numbers are never passed to external bridges or compiled output
      const sanitizedData = {
        ...data,
        firearms: (data.firearms || []).map((f) => ({
          ...f,
          serial_number:
            data.maskSerials && f.serial_number
              ? String(f.serial_number).length > 4
                ? `***-${String(f.serial_number).slice(-4)}`
                : '***-REDACTED'
              : f.serial_number,
        })),
        nfa_items: (data.nfa_items || []).map((n) => ({
          ...n,
          serial:
            data.maskSerials && n.serial
              ? String(n.serial).length > 4
                ? `***-${String(n.serial).slice(-4)}`
                : '***-REDACTED'
              : n.serial,
        })),
      };

      const templatePath = path.join(__dirname, 'templates', 'armory_binder.typ');
      let typstBin = null;
      if (fs.existsSync('/usr/local/bin/typst')) typstBin = '/usr/local/bin/typst';
      else if (fs.existsSync('/opt/homebrew/bin/typst')) typstBin = '/opt/homebrew/bin/typst';

      let pdfGenerated = false;

      // 1. High-Performance Zero-Bloat Local Typst Compilation
      if (typstBin && fs.existsSync(templatePath)) {
        try {
          await new Promise((resolve, reject) => {
            execFile(
              typstBin,
              [
                'compile',
                '--root',
                '/',
                templatePath,
                filePath,
                '--input',
                `data=${JSON.stringify(sanitizedData)}`,
              ],
              (err, stdout, stderr) => {
                if (err) return reject(new Error(stderr || err.message));
                resolve(stdout);
              }
            );
          });
          pdfGenerated = true;
        } catch (typstErr) {
          console.warn('Local Typst compilation fallback triggered for binder:', typstErr.message);
        }
      }

      // 2. ArmsTrader Ephemeral Typst API Bridge Fallback (Zero Server Storage, TLS 1.3)
      if (!pdfGenerated && data.allowCloudBridge !== false && typeof fetch === 'function') {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const response = await fetch('https://armstrader.store/api/armory-binder/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sanitizedData),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
            pdfGenerated = true;
          } else {
            console.warn(`ArmsTrader binder bridge returned HTTP ${response.status}`);
          }
        } catch (apiErr) {
          console.warn(
            'ArmsTrader binder bridge unavailable, falling back to Electron HTML renderer:',
            apiErr.message
          );
        }
      }

      // 3. Resilient Built-in Electron HTML printToPDF Fallback (100% Offline)
      if (!pdfGenerated) {
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px 36px; color: #0f172a; line-height: 1.5; }
                h1 { font-size: 1.4rem; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
                .summary { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
                .item { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 8px; }
              </style>
            </head>
            <body>
              <h1>ARMORY VALUATION & INSURANCE MANIFEST</h1>
              <div class="summary">
                <p><strong>Total Insured Replacement Value:</strong> $${sanitizedData.total_valuation || '0.00'}</p>
                <p><strong>Owner:</strong> ${sanitizedData.owner_name || 'Vault Record'} &bull; <strong>Date:</strong> ${sanitizedData.date || new Date().toLocaleDateString()}</p>
              </div>
              <h2>Firearms Schedule</h2>
              ${(sanitizedData.firearms || [])
                .map(
                  (f) => `
                <div class="item">
                  <strong>${f.make} ${f.model}</strong> (${f.caliber}) &bull; Serial: <code>${f.serial_number}</code>
                  <br/>Condition: ${f.condition} &bull; Replacement Value: $${f.replacement_price || '0.00'}
                  ${f.notes ? `<br/>Notes: ${f.notes}` : ''}
                </div>
              `
                )
                .join('')}
            </body>
          </html>
        `;

        const win = new BrowserWindow({ show: false });
        await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
        const pdfBuffer = await win.webContents.printToPDF({
          printBackground: true,
          pageSize: 'Letter',
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        });
        fs.writeFileSync(filePath, pdfBuffer);
        win.close();
      }

      // Archive copy into vault document directory
      const vaultFilename = `Insurance_Binder_${Date.now()}.pdf`;
      const vaultDestPath = path.join(db.docDir, vaultFilename);
      fs.copyFileSync(filePath, vaultDestPath);

      return `file://${vaultDestPath}`;
    } catch (e) {
      console.error('Failed to generate Armory Binder:', e);
      return null;
    }
  });

  ipcMain.handle('generate-work-order', async (_, data = {}) => {
    try {
      const woNum =
        data.work_order_number ||
        `WO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const defaultFilename = `Armorer_Work_Order_${woNum}.pdf`;
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Armorer Work Order & Service Certificate',
        defaultPath: path.join(app.getPath('documents'), defaultFilename),
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      });

      if (canceled || !filePath) return null;

      // Privacy: If maskSerials is enabled, redact firearm serial number
      const sanitizedData = {
        ...data,
        work_order_number: woNum,
        firearm: data.firearm
          ? {
              ...data.firearm,
              serial_number:
                data.maskSerials && data.firearm.serial_number
                  ? String(data.firearm.serial_number).length > 4
                    ? `***-${String(data.firearm.serial_number).slice(-4)}`
                    : '***-REDACTED'
                  : data.firearm.serial_number,
            }
          : {},
      };

      const templatePath = path.join(__dirname, 'templates', 'armorer_work_order.typ');
      let typstBin = null;
      if (fs.existsSync('/usr/local/bin/typst')) typstBin = '/usr/local/bin/typst';
      else if (fs.existsSync('/opt/homebrew/bin/typst')) typstBin = '/opt/homebrew/bin/typst';

      let pdfGenerated = false;

      // 1. High-Performance Zero-Bloat Local Typst Compilation
      if (typstBin && fs.existsSync(templatePath)) {
        try {
          await new Promise((resolve, reject) => {
            execFile(
              typstBin,
              [
                'compile',
                '--root',
                '/',
                templatePath,
                filePath,
                '--input',
                `data=${JSON.stringify(sanitizedData)}`,
              ],
              (err, stdout, stderr) => {
                if (err) return reject(new Error(stderr || err.message));
                resolve(stdout);
              }
            );
          });
          pdfGenerated = true;
        } catch (typstErr) {
          console.warn(
            'Local Typst compilation fallback triggered for work order:',
            typstErr.message
          );
        }
      }

      // 2. ArmsTrader Ephemeral Typst API Bridge Fallback (Zero Server Storage, TLS 1.3)
      if (!pdfGenerated && data.allowCloudBridge !== false && typeof fetch === 'function') {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const response = await fetch('https://armstrader.store/api/work-order/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sanitizedData),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
            pdfGenerated = true;
          } else {
            console.warn(`ArmsTrader work order bridge returned HTTP ${response.status}`);
          }
        } catch (apiErr) {
          console.warn(
            'ArmsTrader work order bridge unavailable, falling back to Electron HTML renderer:',
            apiErr.message
          );
        }
      }

      // 3. Resilient Built-in Electron HTML printToPDF Fallback (100% Offline)
      if (!pdfGenerated) {
        const firearmInfo = sanitizedData.firearm || {};
        const serviceInfo = sanitizedData.service_item || {};
        const partsList = sanitizedData.parts_replaced || [];
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px 36px; color: #0f172a; line-height: 1.5; }
                h1 { font-size: 1.4rem; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
                .badge { display: inline-block; background: #0f172a; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
                .summary { background: #f0f9ff; border: 1px solid #0284c7; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85rem; }
                th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
                th { background: #0f172a; color: #fff; }
                .cert-box { margin-top: 24px; border: 1px solid #334155; padding: 12px; border-radius: 6px; background: #fafafa; }
              </style>
            </head>
            <body>
              <span class="badge">ARMORER SERVICE CERTIFICATE</span>
              <h1>ARMORER WORK ORDER & SERVICE REPORT</h1>
              <div class="summary">
                <p><strong>Work Order:</strong> ${sanitizedData.work_order_number} &bull; <strong>Date:</strong> ${sanitizedData.date || new Date().toLocaleDateString()} &bull; <strong>Armorer:</strong> ${sanitizedData.armorer_name || 'Staff Armorer'}</p>
                <p><strong>Firearm:</strong> ${firearmInfo.make || ''} ${firearmInfo.model || ''} (${firearmInfo.caliber || 'N/A'}) &bull; <strong>Serial:</strong> <code>${firearmInfo.serial_number || 'N/A'}</code> &bull; <strong>Rounds:</strong> ${firearmInfo.round_count || 0}</p>
                <p><strong>Service:</strong> ${serviceInfo.task_name || 'General Maintenance'} (${serviceInfo.category || 'Maintenance'}) &bull; <strong>Completed:</strong> ${serviceInfo.completed_date || sanitizedData.date}</p>
              </div>
              <h3>Service Notes</h3>
              <p>${serviceInfo.notes || 'Service performed in accordance with factory specifications.'}</p>
              ${
                partsList.length > 0
                  ? `
                <h3>Parts Replaced</h3>
                <table>
                  <tr><th>Part Name</th><th>Part Number</th><th>Manufacturer</th><th>Cost</th></tr>
                  ${partsList
                    .map(
                      (p) =>
                        `<tr><td>${p.name}</td><td>${p.part_number || '—'}</td><td>${p.manufacturer || 'OEM'}</td><td>$${p.cost || '0.00'}</td></tr>`
                    )
                    .join('')}
                </table>
              `
                  : ''
              }
              <div class="cert-box">
                <p style="font-size: 0.8rem; color: #475569;"><strong>CERTIFICATION:</strong> I certify that this firearm has been inspected, serviced, and function tested to armorer specifications.</p>
                <div style="margin-top: 20px; display: flex; justify-content: space-between;">
                  <div>__________________________<br/><small>Certified Armorer Signature</small></div>
                  <div>__________________________<br/><small>Date of Inspection</small></div>
                </div>
              </div>
            </body>
          </html>
        `;

        const win = new BrowserWindow({ show: false });
        await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
        const pdfBuffer = await win.webContents.printToPDF({
          printBackground: true,
          pageSize: 'Letter',
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        });
        fs.writeFileSync(filePath, pdfBuffer);
        win.close();
      }

      // Archive copy into vault document directory
      const vaultFilename = `Work_Order_${Date.now()}.pdf`;
      const vaultDestPath = path.join(db.docDir, vaultFilename);
      fs.copyFileSync(filePath, vaultDestPath);

      return `file://${vaultDestPath}`;
    } catch (e) {
      console.error('Failed to generate Armorer Work Order:', e);
      return null;
    }
  });

  // ─── FFL & Range Directory Lookups ──────────────────────────────────────────
  ipcMain.handle('lookup-ffl', async (_, params = {}) => {
    try {
      const { zip, state, limit = 25 } = params;
      const cleanLimit = Math.min(100, Math.max(1, Number(limit) || 25));

      // Always query the live ArmsTrader.store API directly so FFL licensee data stays continuously updated with the ATF database
      const queryParam =
        zip && zip.trim()
          ? `zip=${encodeURIComponent(zip.trim())}`
          : state && state.trim()
            ? `state=${encodeURIComponent(state.trim())}`
            : '';

      if (!queryParam) {
        return {
          success: false,
          data: [],
          message: 'Please provide a ZIP code or state for FFL lookup.',
        };
      }

      const res = await fetch(
        `https://armstrader.store/api/ffl/search?${queryParam}&limit=${cleanLimit}`,
        {
          signal: AbortSignal.timeout(8000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          count: data.count || data.data?.length || 0,
          source: 'cloud_api',
          data: data.data || [],
          center: data.center,
        };
      }

      const errJson = await res.json().catch(() => null);
      return {
        success: false,
        data: [],
        error: errJson?.error || `ArmsTrader API error (HTTP ${res.status})`,
      };
    } catch (e) {
      console.error('Error looking up FFLs from ArmsTrader API:', e);
      return {
        success: false,
        data: [],
        error:
          e.name === 'TimeoutError'
            ? 'ArmsTrader FFL service timed out. Check your internet connection.'
            : e.message || 'Unable to connect to ArmsTrader FFL directory.',
      };
    }
  });

  ipcMain.handle('lookup-ranges', async (_, params = {}) => {
    try {
      const { zip, state, limit = 25 } = params;
      const cleanLimit = Math.min(100, Math.max(1, Number(limit) || 25));
      const dbPath = getArmsTraderDbPath();

      if (dbPath && fs.existsSync('/usr/bin/sqlite3')) {
        const { execFile } = require('child_process');
        let query = '';
        if (state && /^[A-Za-z]{2}$/.test(state.trim())) {
          const cleanState = state.trim().toUpperCase();
          query = `SELECT id, name, trade_name, range_type, street, city, state, zip, phone, lane_fee, fee_type, amenities, is_public FROM shooting_ranges WHERE UPPER(state) = '${cleanState}' ORDER BY city ASC, name ASC LIMIT ${cleanLimit};`;
        } else if (zip && /^\d{3,5}$/.test(zip.trim())) {
          const cleanZip = zip.trim();
          query = `SELECT id, name, trade_name, range_type, street, city, state, zip, phone, lane_fee, fee_type, amenities, is_public FROM shooting_ranges WHERE zip LIKE '${cleanZip}%' ORDER BY zip ASC, name ASC LIMIT ${cleanLimit};`;
        } else {
          query = `SELECT id, name, trade_name, range_type, street, city, state, zip, phone, lane_fee, fee_type, amenities, is_public FROM shooting_ranges LIMIT ${cleanLimit};`;
        }

        const rows = await new Promise((resolve) => {
          execFile('/usr/bin/sqlite3', ['-json', dbPath, query], (err, stdout) => {
            if (err || !stdout.trim()) return resolve([]);
            try {
              resolve(JSON.parse(stdout.trim()));
            } catch {
              resolve([]);
            }
          });
        });

        if (rows && rows.length > 0) {
          return { success: true, count: rows.length, source: 'local_database', data: rows };
        }
      }

      // Network fallback to ArmsTrader API
      if (typeof fetch === 'function') {
        const queryParam = zip
          ? `zip=${encodeURIComponent(zip)}`
          : state
            ? `state=${encodeURIComponent(state)}`
            : '';
        if (queryParam) {
          const res = await fetch(
            `https://armstrader.store/api/ranges/search?${queryParam}&limit=${cleanLimit}`
          );
          if (res.ok) {
            const data = await res.json();
            return { ...data, source: 'cloud_api' };
          }
        }
      }

      return { success: false, data: [], message: 'No ranges found or query invalid' };
    } catch (e) {
      console.error('Error looking up ranges:', e);
      return { success: false, data: [], error: e.message };
    }
  });

  ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall();
  });

  function getInstalledModulesList() {
    const config = db.getConfig ? db.getConfig() : {};
    if (Array.isArray(config.installed_modules)) {
      return config.installed_modules;
    }
    if (moduleManager && typeof moduleManager.getInstalledDiskModules === 'function') {
      const disk = moduleManager.getInstalledDiskModules();
      if (Array.isArray(disk) && disk.length > 0) {
        return disk;
      }
    }
    return [];
  }

  function getNetworkInterfacesInfo() {
    const interfaces = os.networkInterfaces();
    const candidates = [];

    for (const [name, ifaces] of Object.entries(interfaces)) {
      if (!ifaces) continue;
      const lowerName = name.toLowerCase();

      // Blacklist virtual, tunnel, and internal bridge adapters
      const isVirtual =
        lowerName.startsWith('utun') ||
        lowerName.startsWith('tun') ||
        lowerName.startsWith('tap') ||
        lowerName.startsWith('awdl') ||
        lowerName.startsWith('llw') ||
        lowerName.startsWith('bridge') ||
        lowerName.startsWith('docker') ||
        lowerName.startsWith('veth') ||
        lowerName.startsWith('tailscale') ||
        lowerName.startsWith('virbr') ||
        lowerName.startsWith('vmnet') ||
        lowerName.startsWith('vboxnet');

      for (const iface of ifaces) {
        if (iface.family === 'IPv4' && !iface.internal && iface.address) {
          const addr = iface.address;
          let score = 0;

          // Standard private subnets
          if (addr.startsWith('192.168.')) score += 100;
          else if (addr.startsWith('10.')) score += 80;
          else if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(addr)) score += 70;
          else score += 10;

          // Physical NIC name bonus
          if (/^(en\d+|eth\d+|wlan\d+|wl\w+|wi-fi|ethernet)/i.test(name)) {
            score += 50;
          }

          // Penalize virtual adapters
          if (isVirtual) {
            score -= 200;
          }

          candidates.push({
            name,
            address: addr,
            score,
            isVirtual,
          });
        }
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates;
  }

  function getPrioritizedLocalIp() {
    const candidates = getNetworkInterfacesInfo();
    return candidates.length > 0 ? candidates[0].address : '127.0.0.1';
  }

  ipcMain.handle('get-local-ip', () => {
    return getPrioritizedLocalIp();
  });

  ipcMain.handle('get-all-local-ips', () => {
    return getNetworkInterfacesInfo();
  });

  ipcMain.handle('get-pairing-token', () => {
    let token = db.getPairingToken();
    if (!token) {
      token = db.generatePairingToken();
    }
    return token;
  });

  ipcMain.handle('revoke-pairing-token', () => {
    db.revokePairingToken();
    return true;
  });

  ipcMain.handle('get-pairing-info', () => {
    const primaryIp = getPrioritizedLocalIp();
    const candidates = getNetworkInterfacesInfo();
    const fallbackIps = candidates
      .filter((c) => c.address !== primaryIp && !c.isVirtual)
      .map((c) => c.address);
    let token = db.getPairingToken();
    if (!token) {
      token = db.generatePairingToken();
    }
    const hostname = os.hostname();
    const port = 3456;
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    const fallbacksParam =
      fallbackIps.length > 0 ? `&fallbacks=${encodeURIComponent(fallbackIps.join(','))}` : '';
    const hostParam = `&host=${encodeURIComponent(hostname)}`;
    const qrData = `armoryvault://sync?ip=${primaryIp}&port=${port}${tokenParam}${fallbacksParam}${hostParam}`;

    return {
      primaryIp,
      fallbackIps,
      hostname,
      port,
      token,
      qrData,
      interfaces: candidates,
    };
  });

  function startLocalServer() {
    const expressApp = express();
    expressApp.use(cors({ origin: true, credentials: true }));
    expressApp.use(express.json({ limit: '50mb' }));

    // ─── Rate Limiting ─────────────────────────────────────────────────
    const readLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests. Please try again later.' },
    });

    const writeLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many write requests. Please try again later.' },
    });

    // ─── Authentication Middleware ──────────────────────────────────────
    const authenticateCompanion = (req, res, next) => {
      const serverToken = db.getPairingToken();
      if (!serverToken) {
        // Vault has no pairing token generated yet — allow request
        return next();
      }

      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        return res
          .status(401)
          .json({ success: false, error: 'Authentication required. Please pair your device.' });
      }

      if (!db.validatePairingToken(token)) {
        return res.status(403).json({
          success: false,
          error: 'Invalid or expired pairing token. Please re-pair your device.',
        });
      }

      next();
    };

    // ─── Public Endpoints (No Auth Required) ───────────────────────────
    expressApp.get('/api/ping', readLimiter, (req, res) => {
      const userAgent = req.headers['user-agent'] || '';
      const deviceName =
        req.query?.device ||
        (userAgent.includes('iPhone')
          ? 'iPhone'
          : userAgent.includes('Android')
            ? 'Android Device'
            : 'Mobile Companion');
      console.log('Received ping from companion client:', deviceName);
      if (mainWindow) {
        mainWindow.webContents.send('device-paired', { deviceName, timestamp: Date.now() });
      }
      res.json({
        status: 'ok',
        device: os.hostname(),
        isLocked: db.isLocked(),
        requiresAuth: !!db.getPairingToken(),
        installedModules: getInstalledModulesList(),
      });
    });

    expressApp.post('/api/pair', writeLimiter, (req, res) => {
      const deviceName = req.body?.deviceName || req.body?.device || 'Mobile Companion App';
      console.log('Received device pairing request from:', deviceName);

      // Get existing token or generate a new one
      let token = db.getPairingToken();
      if (!token) {
        token = db.generatePairingToken();
      }

      if (mainWindow) {
        mainWindow.webContents.send('device-paired', { deviceName, timestamp: Date.now() });
      }
      res.json({
        success: true,
        vaultName: 'ArmoryVault',
        host: os.hostname(),
        isLocked: db.isLocked(),
        pairingToken: token,
        installedModules: getInstalledModulesList(),
      });
    });

    expressApp.get('/api/pair', readLimiter, (req, res) => {
      const deviceName = req.query?.device || req.query?.deviceName || 'Mobile Companion App';
      console.log('Received device pairing ping from:', deviceName);
      if (mainWindow) {
        mainWindow.webContents.send('device-paired', { deviceName, timestamp: Date.now() });
      }
      res.json({
        success: true,
        vaultName: 'ArmoryVault',
        host: os.hostname(),
        isLocked: db.isLocked(),
        requiresAuth: !!db.getPairingToken(),
        installedModules: getInstalledModulesList(),
      });
    });

    expressApp.get('/api/modules', readLimiter, (req, res) => {
      res.json({
        success: true,
        installedModules: getInstalledModulesList(),
      });
    });

    // ─── Authenticated Endpoints ──────────────────────────────────────
    expressApp.post('/api/vault/lock', authenticateCompanion, writeLimiter, (req, res) => {
      console.log('Received remote vault lock request from mobile companion app');
      try {
        db.lockVault();
        if (mainWindow) {
          mainWindow.webContents.send('vault-locked');
        }
        res.json({ success: true, isLocked: true });
      } catch (e) {
        console.error('Remote vault lock error:', e);
        res.status(500).json({ success: false, error: e.message });
      }
    });

    expressApp.post('/api/lock', authenticateCompanion, writeLimiter, (req, res) => {
      try {
        db.lockVault();
        if (mainWindow) {
          mainWindow.webContents.send('vault-locked');
        }
        res.json({ success: true, isLocked: true });
      } catch (e) {
        console.error('Remote lock error:', e);
        res.status(500).json({ success: false, error: e.message });
      }
    });

    expressApp.get('/api/inventory/summary', authenticateCompanion, readLimiter, (req, res) => {
      try {
        const userAgent = req.headers['user-agent'] || '';
        const deviceName =
          req.query?.device ||
          (userAgent.includes('iPhone')
            ? 'iPhone'
            : userAgent.includes('Android')
              ? 'Android Device'
              : 'Mobile Companion');
        if (mainWindow) {
          mainWindow.webContents.send('device-paired', { deviceName, timestamp: Date.now() });
        }

        if (db.isLocked()) {
          return res.json({
            success: false,
            isLocked: true,
            firearms: 0,
            ammo: 0,
            components: 0,
            error: 'Vault is locked',
          });
        }
        const firearms = db.getFirearms() || [];
        const ammo = db.getAmmo() || [];
        const components = db.getComponents() || [];
        res.json({
          success: true,
          isLocked: false,
          firearms: firearms.length,
          ammo: ammo.reduce((acc, a) => acc + (Number(a.count) || 0), 0),
          components: components.length,
          installedModules: getInstalledModulesList(),
        });
      } catch (e) {
        console.error('Summary error:', e);
        res.status(500).json({ success: false, error: e.message });
      }
    });

    expressApp.get('/api/inventory/cache', authenticateCompanion, readLimiter, (req, res) => {
      try {
        const userAgent = req.headers['user-agent'] || '';
        const deviceName =
          req.query?.device ||
          (userAgent.includes('iPhone')
            ? 'iPhone'
            : userAgent.includes('Android')
              ? 'Android Device'
              : 'Mobile Companion');
        if (mainWindow) {
          mainWindow.webContents.send('device-paired', { deviceName, timestamp: Date.now() });
        }

        if (db.isLocked()) {
          return res.json({
            success: false,
            isLocked: true,
            firearms: [],
            ammo: [],
            components: [],
            skus: {},
            error: 'Vault is locked',
          });
        }
        const firearms = db.getFirearms() || [];
        const ammo = db.getAmmo() || [];
        const components = db.getComponents() || [];
        const accessories = db.getAccessories ? db.getAccessories() || [] : [];
        const storageLocations = db.getStorageLocations ? db.getStorageLocations() || [] : [];
        const skus = db.getSkus() || {};
        const config = db.getConfig ? db.getConfig() : {};
        const optics = db.getModuleData
          ? db.getModuleData('optics_vault_inventory', [])
          : config.optics_vault_inventory || [];
        res.json({
          success: true,
          isLocked: false,
          firearms: firearms.map((f) => ({
            id: f.id,
            make: f.make,
            model: f.model,
            caliber: f.caliber,
            serial_number: f.serial_number,
            type: f.type,
            barrel_length: f.barrel_length,
            action: f.action,
            finish: f.finish,
            condition: f.condition,
            purchase_price: f.purchase_price,
            purchase_date: f.purchase_date,
            purchase_location: f.purchase_location,
            storageLocationId: f.storageLocationId,
            notes: f.notes,
            image_path: f.image_path,
            photos: f.photos,
            // ATF Bound Book acquisition & disposition fields
            acquire_date: f.acquire_date,
            acquired_from_name: f.acquired_from_name,
            acquired_from_address: f.acquired_from_address,
            acquired_from_ffl: f.acquired_from_ffl,
            acquire_license_type: f.acquire_license_type,
            sold_date: f.sold_date,
            sold_to_name: f.sold_to_name,
            sold_to_address: f.sold_to_address,
            sold_to_ffl: f.sold_to_ffl,
            sold_price: f.sold_price,
            is_sold: Boolean(f.is_sold),
            // NFA compliance fields
            is_nfa: Boolean(f.is_nfa),
            nfa_type: f.nfa_type,
            nfa_tax_stamp_number: f.nfa_tax_stamp_number,
            nfa_trust_name: f.nfa_trust_name,
            nfa_form_type: f.nfa_form_type,
            nfa_approval_date: f.nfa_approval_date,
            // Telemetry & Logs
            logs: f.logs || [],
            maintenance_schedules: f.maintenance_schedules || [],
            total_rounds: (f.logs || [])
              .filter((l) => l.type === 'Range')
              .reduce((sum, l) => sum + (l.rounds_fired || 0), 0),
          })),
          ammo: ammo.map((a) => ({
            id: a.id,
            caliber: a.caliber,
            type: a.type,
            category: a.category,
            count: a.count,
            manufacturer: a.manufacturer,
            bullet_manufacturer: a.bullet_manufacturer,
            grain: a.grain,
            projectile: a.projectile,
            shell_length: a.shell_length,
            shot_size: a.shot_size,
            oz_payload: a.oz_payload,
            pellet_count: a.pellet_count,
            powder: a.powder,
            powderCharge: a.powderCharge,
            primer: a.primer,
            primer_type: a.primer_type,
            notes: a.notes,
            upc_code: a.upc_code,
            isPlusP: Boolean(a.isPlusP),
            storageLocationId: a.storageLocationId,
            costPerRound: a.costPerRound,
          })),
          components: components.map((c) => ({
            id: c.id,
            type: c.type,
            manufacturer: c.manufacturer,
            name: c.name,
            quantity: c.quantity,
            caliber: c.caliber,
          })),
          accessories: accessories.map((acc) => ({
            id: acc.id,
            name: acc.name,
            type: acc.type,
            manufacturer: acc.manufacturer,
            model: acc.model,
            serialNumber: acc.serialNumber,
            value: acc.value,
            firearm_id: acc.firearm_id,
            quantity: acc.quantity,
            is_nfa: Boolean(acc.is_nfa),
            notes: acc.notes,
            storageLocationId: acc.storageLocationId,
          })),
          storageLocations,
          skus,
          optics,
          installedModules: getInstalledModulesList(),
          reloadingRecipes: db.getModuleData
            ? db.getModuleData('handload_recipes', [])
            : config.handload_recipes || config.reloading_recipes || [],
          savedRanges: db.getModuleData
            ? db.getModuleData('saved_ranges', [])
            : config.saved_ranges || [],
          maintenanceSchedules: db.getModuleData
            ? db.getModuleData('custom_schedule_presets', [])
            : config.custom_schedule_presets || [],
        });
      } catch (e) {
        console.error('Inventory cache error:', e);
        res.status(500).json({ success: false, error: e.message });
      }
    });

    expressApp.post('/api/sync', authenticateCompanion, writeLimiter, (req, res) => {
      console.log('Received sync payload from mobile:', req.body);
      try {
        // Input validation
        const items = req.body.items;
        if (!Array.isArray(items)) {
          return res
            .status(400)
            .json({ success: false, error: 'Invalid payload: items must be an array.' });
        }
        if (items.length > 100) {
          return res
            .status(400)
            .json({ success: false, error: 'Batch too large: maximum 100 items per sync.' });
        }
        for (const item of items) {
          if (!item.type || typeof item.type !== 'string') {
            return res
              .status(400)
              .json({ success: false, error: 'Invalid item: each item must have a type field.' });
          }
          if (!item.timestamp || typeof item.timestamp !== 'string') {
            return res.status(400).json({
              success: false,
              error: 'Invalid item: each item must have a timestamp field.',
            });
          }
        }

        // Deduplication: check existing queue for duplicate timestamp+type+upcOrId
        const existingQueue = db.getSyncQueue();
        let processed = 0;
        let skipped = 0;
        for (const item of items) {
          const isDuplicate = existingQueue.some(
            (existing) =>
              existing.timestamp === item.timestamp &&
              existing.type === item.type &&
              (existing.upcOrId || '') === (item.upcOrId || '')
          );
          if (isDuplicate) {
            skipped++;
          } else {
            db.addSyncItem(item);
            processed++;
          }
        }

        const userAgent = req.headers['user-agent'] || '';
        const deviceName =
          req.body?.device ||
          (userAgent.includes('iPhone')
            ? 'iPhone'
            : userAgent.includes('Android')
              ? 'Android Device'
              : 'Mobile Companion');

        // Let the renderer know data has changed and device is active
        if (mainWindow) {
          mainWindow.webContents.send('device-paired', { deviceName, timestamp: Date.now() });
          mainWindow.webContents.send('sync-received');
        }
        res.json({ success: true, processed, skipped });
      } catch (e) {
        console.error('Sync error:', e);
        res.status(500).json({ success: false, error: e.message });
      }
    });

    // ─── Mobile Companion: Chrono String Sync ───────────────────────────
    expressApp.post('/api/chrono', authenticateCompanion, writeLimiter, (req, res) => {
      console.log('Received chrono string from mobile:', req.body);
      try {
        const cs = req.body;
        if (!cs || !Array.isArray(cs.shotVelocities) || cs.shotVelocities.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid chrono data: shotVelocities must be a non-empty array of numbers.',
          });
        }
        if (cs.shotVelocities.some((v) => typeof v !== 'number' || isNaN(v))) {
          return res.status(400).json({
            success: false,
            error: 'Invalid chrono data: all velocities must be valid numbers.',
          });
        }
        if (cs && cs.shotVelocities) {
          db.addChronoString(cs);
          if (mainWindow) {
            mainWindow.webContents.send('sync-received');
          }
        }
        res.json({ success: true });
      } catch (e) {
        console.error('Chrono sync error:', e);
        res.status(500).json({ success: false, error: e.message });
      }
    });

    // ─── Mobile Companion: Target Analysis Sync ─────────────────────────
    expressApp.post('/api/target-analysis', authenticateCompanion, writeLimiter, (req, res) => {
      console.log('Received target analysis from mobile:', req.body);
      try {
        const ta = req.body;
        if (!ta || typeof ta.shotsCount !== 'number' || typeof ta.groupSizeInches !== 'number') {
          return res.status(400).json({
            success: false,
            error: 'Invalid target analysis: shotsCount and groupSizeInches are required numbers.',
          });
        }
        if (ta) {
          db.addTargetAnalysis(ta);
          if (mainWindow) {
            mainWindow.webContents.send('sync-received');
          }
        }
        res.json({ success: true });
      } catch (e) {
        console.error('Target analysis sync error:', e);
        res.status(500).json({ success: false, error: e.message });
      }
    });

    // ─── Mobile Companion: Read Storage Locations ───────────────────────
    expressApp.get('/api/storage-locations', authenticateCompanion, readLimiter, (req, res) => {
      try {
        if (db.isLocked()) {
          return res.json({ success: false, isLocked: true, locations: [] });
        }
        const locations = db.getStorageLocations() || [];
        res.json({ success: true, locations });
      } catch (e) {
        console.error('Storage locations error:', e);
        res.status(500).json({ success: false, error: e.message });
      }
    });

    // ─── Mobile Companion: Read Ballistic Profiles ──────────────────────
    expressApp.get('/api/ballistic-profiles', authenticateCompanion, readLimiter, (req, res) => {
      try {
        if (db.isLocked()) {
          return res.json({ success: false, isLocked: true, profiles: [] });
        }
        const profiles = db.getBallisticProfiles() || [];
        res.json({ success: true, profiles });
      } catch (e) {
        console.error('Ballistic profiles error:', e);
        res.status(500).json({ success: false, error: e.message });
      }
    });

    const PORT = 3456;
    expressApp.listen(PORT, '0.0.0.0', () => {
      console.log(`Mobile Companion API listening on port ${PORT}`);
    });
  }

  startLocalServer();
  createWindow();

  if (process.platform === 'darwin') {
    autoUpdater.autoDownload = false;
  }

  autoUpdater.on('update-available', (info) => {
    if (process.platform === 'darwin') {
      // Trick the frontend into showing the "Download Mac Update" button immediately
      mainWindow.webContents.send('updater-event', { type: 'update-downloaded', data: info });
    } else {
      mainWindow.webContents.send('updater-event', { type: 'update-available', data: info });
    }
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

app.on('before-quit', () => {
  db.flushSync();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
