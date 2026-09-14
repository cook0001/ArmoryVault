const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { app } = require('electron');
const AdmZip = require('adm-zip');

/**
 * ModuleManager handles downloading, unzipping, disk inspection,
 * and deletion of modular extensions from GitHub Releases.
 */
class ModuleManager {
  constructor() {
    this.installedDir = path.join(app.getPath('userData'), 'installed_modules');
    this.tempDir = path.join(app.getPath('userData'), 'temp_downloads');
    this.cacheFile = path.join(app.getPath('userData'), 'remote_modules_cache.json');
    this.devModulesDir = path.join(__dirname, '..', 'src', 'modules');
    this.catalogUrl =
      'https://raw.githubusercontent.com/cook0001/ArmoryVault-Modules/main/modules-index.json';
    this.catalogFallbackUrl =
      'https://github.com/cook0001/ArmoryVault-Modules/releases/latest/download/modules-index.json';

    if (!fs.existsSync(this.installedDir)) {
      fs.mkdirSync(this.installedDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Checks GitHub (cook0001/ArmoryVault-Modules) for the latest available modules catalog.
   * Caches results locally in userData/remote_modules_cache.json for offline resilience.
   */
  async checkRemoteModules() {
    let rawJson = null;

    try {
      rawJson = await this._fetchStringWithRedirects(this.catalogUrl);
    } catch (e1) {
      console.warn('Direct raw catalog fetch failed, trying release asset fallback:', e1.message);
      try {
        rawJson = await this._fetchStringWithRedirects(this.catalogFallbackUrl);
      } catch (e2) {
        console.warn('Fallback catalog fetch failed:', e2.message);
      }
    }

    if (rawJson) {
      try {
        const catalog = JSON.parse(rawJson);
        if (catalog && catalog.modules) {
          fs.writeFileSync(
            this.cacheFile,
            JSON.stringify({ ...catalog, cachedAt: new Date().toISOString() }, null, 2),
            'utf8'
          );
          return {
            success: true,
            modules: catalog.modules,
            version: catalog.version,
            repository: catalog.repository || 'cook0001/ArmoryVault-Modules',
            lastChecked: new Date().toISOString(),
            fromCache: false,
          };
        }
      } catch (parseErr) {
        console.warn('Error parsing remote modules catalog JSON:', parseErr);
      }
    }

    // Offline / Cached Fallback
    if (fs.existsSync(this.cacheFile)) {
      try {
        const cached = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
        return {
          success: true,
          modules: cached.modules || {},
          version: cached.version,
          repository: cached.repository || 'cook0001/ArmoryVault-Modules',
          lastChecked: cached.cachedAt || new Date().toISOString(),
          fromCache: true,
        };
      } catch {}
    }

    return {
      success: false,
      error: 'Unable to connect to GitHub modules repository and no cached catalog exists.',
      modules: {},
    };
  }

  /**
   * Scans userData/installed_modules/ and returns list of module IDs
   * that are physically installed on disk.
   */
  getInstalledDiskModules() {
    if (!fs.existsSync(this.installedDir)) return [];
    try {
      return fs
        .readdirSync(this.installedDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .filter((modId) => {
          const manifestPath = path.join(this.installedDir, modId, 'manifest.json');
          return fs.existsSync(manifestPath);
        });
    } catch (e) {
      console.warn('Error reading installed disk modules:', e);
      return [];
    }
  }

  /**
   * Deletes a module's files from disk.
   */
  deleteModuleFiles(moduleId) {
    const targetDir = path.join(this.installedDir, moduleId);
    if (fs.existsSync(targetDir)) {
      try {
        fs.rmSync(targetDir, { recursive: true, force: true });
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    return { success: true, message: 'Directory did not exist' };
  }

  /**
   * Downloads a module zip from GitHub Releases with live progress,
   * unzips it to userData/installed_modules/<moduleId>/, with offline/dev fallback.
   */
  async downloadModule(moduleId, webContents) {
    const appVersion = app.getVersion();
    const zipName = `module-${moduleId}.zip`;
    const targetDir = path.join(this.installedDir, moduleId);
    const tempZipPath = path.join(this.tempDir, zipName);

    const emitProgress = (percent, transferred = 0, total = 0) => {
      if (webContents && !webContents.isDestroyed()) {
        webContents.send('module-download-progress', {
          moduleId,
          percent: Math.min(100, Math.round(percent)),
          transferred,
          total,
        });
      }
    };

    emitProgress(5, 0, 100);

    // Check if we have cached catalog with a specific downloadUrl
    let releaseUrl = `https://github.com/cook0001/ArmoryVault-Modules/releases/download/v1.0.0/${zipName}`;
    if (fs.existsSync(this.cacheFile)) {
      try {
        const cached = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
        if (cached?.modules?.[moduleId]?.downloadUrl) {
          releaseUrl = cached.modules[moduleId].downloadUrl;
        }
      } catch {}
    }

    try {
      emitProgress(15, 0, 100);
      let downloadSuccess = false;
      try {
        downloadSuccess = await this._downloadFileWithRedirects(
          releaseUrl,
          tempZipPath,
          (progress) => {
            const mappedPercent = 20 + progress.percent * 0.65;
            emitProgress(mappedPercent, progress.transferred, progress.total);
          }
        );
      } catch (primaryErr) {
        // Try fallback to ArmoryVault core release tag
        const fallbackUrl = `https://github.com/cook0001/ArmoryVault/releases/download/v${appVersion}/${zipName}`;
        console.warn(
          `Primary download from ArmoryVault-Modules failed (${primaryErr.message}). Trying fallback: ${fallbackUrl}`
        );
        downloadSuccess = await this._downloadFileWithRedirects(
          fallbackUrl,
          tempZipPath,
          (progress) => {
            const mappedPercent = 20 + progress.percent * 0.65;
            emitProgress(mappedPercent, progress.transferred, progress.total);
          }
        );
      }

      if (downloadSuccess && fs.existsSync(tempZipPath)) {
        emitProgress(90, 0, 100);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const zip = new AdmZip(tempZipPath);
        zip.extractAllTo(targetDir, true);

        // Clean up temp download file
        try {
          fs.unlinkSync(tempZipPath);
        } catch {}

        // Write install stamp
        fs.writeFileSync(
          path.join(targetDir, 'installed.json'),
          JSON.stringify(
            {
              moduleId,
              installedAt: new Date().toISOString(),
              source: 'github-release',
              version: appVersion,
            },
            null,
            2
          ),
          'utf8'
        );

        emitProgress(100, 100, 100);
        return { success: true, moduleId };
      }
    } catch (netErr) {
      console.warn(
        `Remote download failed for ${moduleId} (${netErr.message}). Checking local fallback...`
      );
    }

    // ── Local Dev / Offline Fallback ──
    const localModDir = path.join(this.devModulesDir, moduleId);
    if (fs.existsSync(path.join(localModDir, 'manifest.json'))) {
      emitProgress(50, 50, 100);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Copy local module files
      fs.cpSync(localModDir, targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'installed.json'),
        JSON.stringify(
          {
            moduleId,
            installedAt: new Date().toISOString(),
            source: 'local-fallback',
            version: appVersion,
          },
          null,
          2
        ),
        'utf8'
      );

      emitProgress(100, 100, 100);
      return { success: true, moduleId, fromLocalFallback: true };
    }

    return {
      success: false,
      error: `Failed to download module ${moduleId} from GitHub release assets and no local module was found.`,
    };
  }

  /**
   * Helper to stream an HTTP/HTTPS download following 301/302 redirects (e.g. AWS S3).
   */
  _downloadFileWithRedirects(url, destPath, onProgress, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
      if (maxRedirects < 0) {
        return reject(new Error('Too many redirects while downloading module.'));
      }

      const client = url.startsWith('https') ? https : http;
      const req = client.get(
        url,
        {
          headers: {
            'User-Agent': 'ArmoryVault-Desktop',
            Accept: 'application/octet-stream, application/zip, */*',
          },
        },
        (res) => {
          // Handle HTTP redirects (GitHub releases redirect to AWS S3)
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return resolve(
              this._downloadFileWithRedirects(
                res.headers.location,
                destPath,
                onProgress,
                maxRedirects - 1
              )
            );
          }

          if (res.statusCode !== 200) {
            return reject(
              new Error(`Server returned HTTP ${res.statusCode}: ${res.statusMessage}`)
            );
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let transferredBytes = 0;
          const fileStream = fs.createWriteStream(destPath);

          res.on('data', (chunk) => {
            transferredBytes += chunk.length;
            const percent = totalBytes > 0 ? (transferredBytes / totalBytes) * 100 : 50;
            if (onProgress) {
              onProgress({ percent, transferred: transferredBytes, total: totalBytes });
            }
          });

          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close(() => resolve(true));
          });

          fileStream.on('error', (err) => {
            try {
              fs.unlinkSync(destPath);
            } catch {}
            reject(err);
          });
        }
      );

      req.on('error', (err) => {
        try {
          fs.unlinkSync(destPath);
        } catch {}
        reject(err);
      });

      req.setTimeout(30000, () => {
        req.destroy(new Error('Download connection timed out.'));
      });
    });
  }

  /**
   * Helper to fetch text / JSON following redirects.
   */
  _fetchStringWithRedirects(url, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
      if (maxRedirects < 0) {
        return reject(new Error('Too many redirects while fetching remote catalog.'));
      }

      const client = url.startsWith('https') ? https : http;
      const req = client.get(
        url,
        {
          headers: {
            'User-Agent': 'ArmoryVault-Desktop',
            Accept: 'application/json, text/plain, */*',
          },
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let redirectUrl = res.headers.location;
            if (!redirectUrl.startsWith('http')) {
              const urlObj = new URL(url);
              redirectUrl = `${urlObj.origin}${redirectUrl}`;
            }
            return resolve(this._fetchStringWithRedirects(redirectUrl, maxRedirects - 1));
          }

          if (res.statusCode !== 200) {
            return reject(
              new Error(`Server returned HTTP ${res.statusCode}: ${res.statusMessage}`)
            );
          }

          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(data));
        }
      );

      req.on('error', (err) => reject(err));
      req.setTimeout(12000, () => {
        req.destroy(new Error('Connection timed out while fetching remote catalog.'));
      });
    });
  }

  /**
   * Retrieves the executable JavaScript bundle, manifest, and styles for an installed module.
   */
  getModuleBundle(moduleId) {
    let modDir = path.join(this.installedDir, moduleId);
    let manifestPath = path.join(modDir, 'manifest.json');

    // Dev fallback if not found in installedDir
    if (!fs.existsSync(manifestPath)) {
      const devDir = path.join(this.devModulesDir, moduleId);
      if (fs.existsSync(path.join(devDir, 'manifest.json'))) {
        modDir = devDir;
        manifestPath = path.join(devDir, 'manifest.json');
      }
    }

    if (!fs.existsSync(manifestPath)) {
      return { success: false, error: `Module "${moduleId}" is not installed on disk.` };
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const entryFile = manifest.entry || 'module.bundle.js';
      const bundlePath = path.join(modDir, entryFile);
      const cssPath = path.join(modDir, manifest.styles || 'module.bundle.css');

      let jsCode = null;
      let cssCode = null;

      if (fs.existsSync(bundlePath)) {
        jsCode = fs.readFileSync(bundlePath, 'utf8');
      }

      if (fs.existsSync(cssPath)) {
        cssCode = fs.readFileSync(cssPath, 'utf8');
      }

      return {
        success: true,
        moduleId,
        manifest,
        hasBundle: !!jsCode,
        jsCode,
        cssCode,
      };
    } catch (err) {
      return { success: false, error: `Failed to read module bundle: ${err.message}` };
    }
  }
}

module.exports = ModuleManager;
