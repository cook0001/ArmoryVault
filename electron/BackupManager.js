const fs = require('fs');
const path = require('path');

/**
 * BackupManager handles all backup and restore operations for the vault,
 * including date-stamped incremental backups and full zip archive backup/restore.
 */
class BackupManager {
  constructor(vault, configFn) {
    this.vault = vault; // VaultEncryption instance
    this._getConfig = configFn;
  }

  getBackupPath() {
    return this._getConfig().backupPath;
  }

  triggerBackup() {
    const backupPath = this.getBackupPath();
    if (!backupPath) return;
    if (fs.existsSync(this.vault.encPath)) {
      try {
        // Date-stamped backup: ArmoryVault_Backup_2026-08-16.enc
        const dateStr = new Date().toISOString().split('T')[0];
        const dest = path.join(backupPath, `ArmoryVault_Backup_${dateStr}.enc`);
        fs.copyFileSync(this.vault.encPath, dest);

        // Rotate: keep only the 5 most recent backups
        const MAX_BACKUPS = 5;
        const backupFiles = fs
          .readdirSync(backupPath)
          .filter((f) => f.startsWith('ArmoryVault_Backup_') && f.endsWith('.enc'))
          .sort()
          .reverse();

        if (backupFiles.length > MAX_BACKUPS) {
          backupFiles.slice(MAX_BACKUPS).forEach((oldFile) => {
            try {
              fs.unlinkSync(path.join(backupPath, oldFile));
            } catch (e) {
              console.error('Failed to remove old backup:', oldFile, e);
            }
          });
        }
      } catch (e) {
        console.error('Backup failed:', e);
      }
    }
  }

  createZipBackup(targetPath, photoDir, docDir) {
    if (!targetPath) {
      throw new Error('Target backup path is required.');
    }

    // Flush any pending in-memory changes to disk first
    this.vault.flushSync();

    const AdmZip = require('adm-zip');
    const zip = new AdmZip();

    // 1. Add database file(s)
    let hasDb = false;
    if (fs.existsSync(this.vault.encPath)) {
      zip.addLocalFile(this.vault.encPath);
      hasDb = true;
    }
    if (fs.existsSync(this.vault.dbPath)) {
      zip.addLocalFile(this.vault.dbPath);
      hasDb = true;
    }

    if (!hasDb) {
      throw new Error(
        'No active database found to archive. Please initialize or unlock the vault first.'
      );
    }

    // 2. Add photos folder if it exists
    if (fs.existsSync(photoDir)) {
      const photos = fs.readdirSync(photoDir);
      for (const file of photos) {
        if (file.startsWith('.')) continue; // skip hidden files like .DS_Store
        const fullPath = path.join(photoDir, file);
        try {
          if (fs.statSync(fullPath).isFile()) {
            zip.addLocalFile(fullPath, 'photos');
          }
        } catch (e) {
          console.warn('Could not add photo to zip:', fullPath, e);
        }
      }
    }

    // 3. Add documents folder if it exists
    if (fs.existsSync(docDir)) {
      const docs = fs.readdirSync(docDir);
      for (const file of docs) {
        if (file.startsWith('.')) continue; // skip hidden files like .DS_Store
        const fullPath = path.join(docDir, file);
        try {
          if (fs.statSync(fullPath).isFile()) {
            zip.addLocalFile(fullPath, 'documents');
          }
        } catch (e) {
          console.warn('Could not add document to zip:', fullPath, e);
        }
      }
    }

    // 4. Write zip file synchronously and safely
    zip.writeZip(targetPath);
    return true;
  }

  restoreBackup(sourcePath, photoDir, docDir) {
    if (!fs.existsSync(sourcePath)) {
      throw new Error('Backup file not found at ' + sourcePath);
    }

    const { app } = require('electron');

    // Flush any pending changes to current disk before restore
    this.vault.flushSync();

    // 1. Create a safety backup of current active enc file
    if (fs.existsSync(this.vault.encPath)) {
      const safetyBackupName = `firearms_inventory_pre_restore_${Date.now()}.enc.bak`;
      const safetyBackupPath = path.join(app.getPath('userData'), safetyBackupName);
      try {
        fs.copyFileSync(this.vault.encPath, safetyBackupPath);
      } catch (e) {
        console.error('Failed to create pre-restore safety backup:', e);
      }
    }

    const ext = path.extname(sourcePath).toLowerCase();

    if (ext === '.enc') {
      const content = fs.readFileSync(sourcePath, 'utf8');
      const parsed = JSON.parse(content);
      if (!parsed.encryptedData || !parsed.dataIv || !parsed.dataAuthTag) {
        throw new Error('Invalid encrypted backup file format.');
      }

      fs.copyFileSync(sourcePath, this.vault.encPath);
    } else if (ext === '.zip') {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(sourcePath);
      const zipEntries = zip.getEntries();

      const hasEnc = zipEntries.some(
        (e) =>
          e.entryName === 'firearms_inventory.enc' ||
          e.entryName.endsWith('/firearms_inventory.enc')
      );
      const hasJson = zipEntries.some(
        (e) =>
          e.entryName === 'firearms_inventory.json' ||
          e.entryName.endsWith('/firearms_inventory.json')
      );

      if (!hasEnc && !hasJson) {
        throw new Error(
          'Zip archive does not contain a valid database file (firearms_inventory.enc).'
        );
      }

      // Extract enc file
      if (hasEnc) {
        const encEntry = zipEntries.find(
          (e) =>
            e.entryName === 'firearms_inventory.enc' ||
            e.entryName.endsWith('/firearms_inventory.enc')
        );
        fs.writeFileSync(this.vault.encPath, encEntry.getData());
      } else if (hasJson) {
        const jsonEntry = zipEntries.find(
          (e) =>
            e.entryName === 'firearms_inventory.json' ||
            e.entryName.endsWith('/firearms_inventory.json')
        );
        fs.writeFileSync(this.vault.dbPath, jsonEntry.getData());
      }

      // Extract photos & documents
      zipEntries.forEach((entry) => {
        if (entry.entryName.startsWith('photos/') && !entry.isDirectory) {
          const filename = path.basename(entry.entryName);
          if (filename) {
            fs.writeFileSync(path.join(photoDir, filename), entry.getData());
          }
        } else if (entry.entryName.startsWith('documents/') && !entry.isDirectory) {
          const filename = path.basename(entry.entryName);
          if (filename) {
            fs.writeFileSync(path.join(docDir, filename), entry.getData());
          }
        }
      });
    } else {
      throw new Error('Unsupported backup file format. Please select an .enc or .zip file.');
    }

    // Reset cache
    this.vault._cache = null;
    this.vault._dirty = false;

    // Check if the current masterKey can decrypt the restored file
    if (this.vault.masterKey && fs.existsSync(this.vault.encPath)) {
      try {
        // Force cache reload with potentially new data
        this.vault._cache = null;
        this.vault.getData();
        return { success: true, requiresRelogin: false };
      } catch (e) {
        // Restored file has a different master key/password
        this.vault.lockVault();
        return { success: true, requiresRelogin: true };
      }
    }

    return { success: true, requiresRelogin: false };
  }
}

module.exports = BackupManager;
