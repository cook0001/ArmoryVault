const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const log = require('electron-log');
const isDev = !app.isPackaged;
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
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
      nodeIntegration: false
    }
  };
  
  if (fs.existsSync(iconPath)) {
    windowConfig.icon = iconPath;
  }

  mainWindow = new BrowserWindow(windowConfig);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadURL('app://-/index.html');
  }

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`);
  });
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('app', (request, callback) => {
    let url = request.url.replace(/^app:\/\/[^/]+\//, '');
    if (!url || url === '/') url = 'index.html';
    url = url.split('?')[0].split('#')[0];
    callback({ path: path.normalize(path.join(__dirname, '../dist', url)) });
  });

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

  ipcMain.handle('get-accessories', () => db.getAccessories());
  ipcMain.handle('add-accessory', (_, acc) => db.addAccessory(acc));
  ipcMain.handle('update-accessory', (_, id, acc) => db.updateAccessory(id, acc));
  ipcMain.handle('delete-accessory', (_, id) => db.deleteAccessory(id));

  ipcMain.handle('get-skus', () => db.getSkus());
  ipcMain.handle('save-skus', (_, skus) => { db.saveSkus(skus); return true; });
  ipcMain.handle('delete-sku', (_, skuId) => db.deleteSku(skuId));

  ipcMain.handle('save-photo', (_, sourcePath, filename) => db.savePhoto(sourcePath, filename));
  ipcMain.handle('save-document', (_, sourcePath, filename) => db.saveDocument(sourcePath, filename));
  
  ipcMain.handle('get-backup-folder', () => db.getBackupPath());
  ipcMain.handle('select-backup-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Backup Folder'
    });
    if (!canceled && filePaths.length > 0) {
      db.setBackupPath(filePaths[0]);
      return filePaths[0];
    }
    return null;
  });

  ipcMain.handle('get-config', (_, key) => {
    const config = db.getConfig();
    return config[key];
  });
  
  ipcMain.handle('set-config', (_, key, value) => {
    db.setConfig(key, value);
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
    const cleanPath = filePath.startsWith('file://') ? filePath.replace('file://', '') : filePath;
    return await shell.openPath(cleanPath);
  });

  ipcMain.handle('open-url', async (_, url) => {
    return await shell.openExternal(url);
  });

  ipcMain.handle('export-data', async (_, dataString, filename) => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Export Data',
        defaultPath: filename,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (filePath) {
        require('fs').writeFileSync(filePath, dataString);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Export failed:', e);
      return false;
    }
  });

  ipcMain.handle('read-file-base64', async (_, filePath) => {
    try {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'base64');
        return data;
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
      
      win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      
      win.webContents.on('did-finish-load', () => {
        win.webContents.print({ silent: false, printBackground: true }, async (success, errorType) => {
          if (!success) {
            console.log('Print failed', errorType);
            const { response } = await dialog.showMessageBox({
              type: 'warning',
              buttons: ['Save as PDF', 'Cancel'],
              defaultId: 0,
              cancelId: 1,
              title: 'Print Failed',
              message: `Could not send to printer. Would you like to save the label as a PDF instead?`
            });
            
            if (response === 0) {
              try {
                const { filePath } = await dialog.showSaveDialog({
                  title: 'Save QR Label PDF',
                  defaultPath: `QR_Label_${itemName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                  filters: [{ name: 'PDFs', extensions: ['pdf'] }]
                });
                if (filePath) {
                  const pdfWin = new BrowserWindow({ show: false });
                  await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
                  
                  const fs = require('fs');
                  const pdfData = await pdfWin.webContents.printToPDF({
                    marginsType: 1,
                    printBackground: true,
                    pageSize: 'Letter'
                  });
                  fs.writeFileSync(filePath, pdfData);
                  pdfWin.close();
                  resolve(true);
                } else {
                  resolve(false);
                }
              } catch(e) {
                console.error(e);
                resolve(false);
              }
            } else {
              resolve(false);
            }
          } else {
            resolve(true);
          }
          win.close();
        });
      });
    });
  });

  ipcMain.handle('generate-insurance-report', async (_, data) => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Save Insurance Report PDF',
        defaultPath: `Armory_Vault_Insurance_Report.pdf`,
        filters: [{ name: 'PDFs', extensions: ['pdf'] }]
      });

      if (!filePath) return null;

      const fs = require('fs');

      const firearmRows = (data.firearms || []).map(f => `
        <tr>
          <td>${f.make} ${f.model}</td>
          <td>${f.caliber || '-'}</td>
          <td>${f.serial_number || '-'}</td>
          <td>${f.is_nfa ? f.nfa_type || 'Yes' : '-'}</td>
          <td>$${f.purchase_price ? Number(f.purchase_price).toFixed(2) : '0.00'}</td>
        </tr>
      `).join('');

      const accessoryRows = (data.accessories || []).map(a => `
        <tr>
          <td>${a.manufacturer} ${a.model} (${a.type})</td>
          <td>-</td>
          <td>${a.serialNumber || '-'}</td>
          <td>${a.is_nfa ? a.nfa_type || 'Yes' : '-'}</td>
          <td>$${a.value ? (Number(a.value) * (a.quantity || 1)).toFixed(2) : '0.00'}</td>
        </tr>
      `).join('');

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

      const pdfWindow = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false } });
      await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      const pdfData = await pdfWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: 'Letter'
      });

      fs.writeFileSync(filePath, pdfData);
      pdfWindow.close();
      return filePath;
    } catch (error) {
      console.error('Error generating insurance report:', error);
      throw error;
    }
  });

  ipcMain.handle('generate-bill-of-sale', async (_, data) => {
    try {
      // First, prompt user to save external copy if they want (optional, but standard for a bill of sale)
      const { filePath } = await dialog.showSaveDialog({
        title: 'Save Bill of Sale PDF',
        defaultPath: `Bill_of_Sale_${data.make}_${data.model}.pdf`.replace(/\s+/g, '_'),
        filters: [{ name: 'PDFs', extensions: ['pdf'] }]
      });

      if (!filePath) return null; // Cancelled

      const fs = require('fs');
      const path = require('path');

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px 40px; color: #333; line-height: 1.5; }
              h1 { text-align: center; color: #111; margin-bottom: 5px; font-size: 1.8rem; }
              h2 { text-align: center; color: #555; margin-top: 0; font-size: 1.1rem; margin-bottom: 20px; }
              .section { margin-bottom: 20px; padding: 15px 20px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; }
              .section h3 { margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px; color: #222; font-size: 1.1rem; }
              .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.95rem; }
              .row span { font-weight: bold; color: #555; width: 140px; display: inline-block; }
              .val { color: #000; font-weight: 500; }
              .signatures { margin-top: 40px; display: flex; justify-content: space-between; gap: 40px; }
              .sig-block { flex: 1; }
              .sig-line { border-bottom: 1px solid #000; height: 35px; margin-bottom: 5px; }
              .sig-label { font-size: 0.85rem; color: #555; }
            </style>
          </head>
          <body>
            <h1>FIREARM BILL OF SALE</h1>
            <h2>Private Transfer</h2>
            
            <div class="section">
              <h3>Firearm Information</h3>
              <div class="row"><span>Make:</span> <div class="val">${data.make || 'N/A'}</div></div>
              <div class="row"><span>Model:</span> <div class="val">${data.model || 'N/A'}</div></div>
              <div class="row"><span>Serial Number:</span> <div class="val">${data.serial_number || 'N/A'}</div></div>
              <div class="row"><span>Caliber:</span> <div class="val">${data.caliber || 'N/A'}</div></div>
              <div class="row"><span>Type:</span> <div class="val">${data.firearm_type || 'N/A'}</div></div>
            </div>

            <div class="section">
              <h3>Sale Details</h3>
              <div class="row"><span>Date of Sale:</span> <div class="val">${data.sold_date || 'N/A'}</div></div>
              <div class="row"><span>Sale Price:</span> <div class="val">$${parseFloat(data.sold_price || 0).toFixed(2)}</div></div>
              <div class="row"><span>Notes:</span> <div class="val">${data.sale_notes || 'None'}</div></div>
            </div>

            <div class="section" style="background: transparent; border: none; padding: 0;">
              <div style="display: flex; gap: 20px;">
                <div class="section" style="flex: 1;">
                  <h3>Seller Information</h3>
                  <div class="row"><span>Name:</span> <div class="val">${data.seller_name || '_________________________'}</div></div>
                </div>
                <div class="section" style="flex: 1;">
                  <h3>Buyer Information</h3>
                  <div class="row"><span>Name:</span> <div class="val">${data.sold_to_name || '_________________________'}</div></div>
                </div>
              </div>
            </div>

            <p style="font-size: 0.9rem; color: #666; margin-top: 30px;">
              By signing below, the Seller acknowledges receipt of the funds, and the Buyer acknowledges receipt of the firearm described above. 
              The Seller certifies that they are the lawful owner of the firearm and have the legal right to sell it. 
              The Buyer certifies that they are legally allowed to purchase and possess a firearm.
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
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
      });

      // Write to external file selected by user
      fs.writeFileSync(filePath, pdfBuffer);

      // Also save to the vault!
      const vaultFilename = `Bill_of_Sale_${data.make}_${data.model}_${Date.now()}.pdf`.replace(/\s+/g, '_');
      const vaultDestPath = path.join(db.docDir, vaultFilename);
      fs.writeFileSync(vaultDestPath, pdfBuffer);

      win.close();

      return `file://${vaultDestPath}`;
    } catch (e) {
      console.error('Failed to generate Bill of Sale:', e);
      return null;
    }
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
