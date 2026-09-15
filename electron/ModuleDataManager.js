const fs = require('fs');
const path = require('path');

/**
 * ModuleDataManager manages dedicated plaintext JSON / CSV storage files
 * for extension modules in `userData/module_data/`.
 *
 * Keeps non-sensitive module data (saved shooting ranges, handload recipes,
 * optic specifications, label templates, maintenance presets) out of `config.json`
 * and out of the encrypted vault, giving users direct, readable access to their module files.
 */
class ModuleDataManager {
  constructor(dataDir) {
    this.dataDir = dataDir;

    // Ensure module_data directory exists
    if (!fs.existsSync(this.dataDir)) {
      try {
        fs.mkdirSync(this.dataDir, { recursive: true });
      } catch (e) {
        console.warn('Failed to create module_data directory:', e);
      }
    }

    // Mapping of legacy config/module keys to dedicated filenames
    this.keyMap = {
      saved_ranges: 'saved_ranges.json',
      handload_recipes: 'reloading_recipes.json',
      reloading_recipes: 'reloading_recipes.json',
      optics_vault_inventory: 'optics_inventory.json',
      saved_label_templates: 'label_templates.json',
      custom_schedule_presets: 'maintenance_presets.json',
    };

    // In-memory cache to avoid disk reads on hot loops
    this._cache = {};
  }

  isModuleDataKey(key) {
    return Object.hasOwn(this.keyMap, key);
  }

  getFilenameForKey(key) {
    return this.keyMap[key] || `${key}.json`;
  }

  getFilePathForKey(key) {
    return path.join(this.dataDir, this.getFilenameForKey(key));
  }

  getData(key, fallback = []) {
    const filename = this.getFilenameForKey(key);
    if (this._cache[filename] !== undefined) {
      return this._cache[filename];
    }

    const filePath = this.getFilePathForKey(key);
    if (!fs.existsSync(filePath)) {
      this._cache[filename] = fallback;
      return fallback;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      this._cache[filename] = parsed;
      return parsed;
    } catch (e) {
      console.warn(`Failed to read module data file for ${key}:`, e);
      this._cache[filename] = fallback;
      return fallback;
    }
  }

  setData(key, data) {
    const filename = this.getFilenameForKey(key);
    this._cache[filename] = data;

    const filePath = this.getFilePathForKey(key);
    const tempPath = `${filePath}.tmp`;

    try {
      // Atomic write: write to temp file then rename
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, filePath);
      return true;
    } catch (e) {
      console.error(`Failed to write module data file for ${key}:`, e);
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch {}
      return false;
    }
  }

  /**
   * Automatically migrates module keys found in config.json to their respective
   * files in userData/module_data/, then removes those keys from config.json.
   */
  migrateFromConfig(config) {
    if (!config || typeof config !== 'object') {
      return { migratedKeys: [], cleanedConfig: config };
    }

    const migratedKeys = [];
    const cleanedConfig = { ...config };

    for (const [key, filename] of Object.entries(this.keyMap)) {
      if (cleanedConfig[key] !== undefined) {
        const filePath = path.join(this.dataDir, filename);

        // If file doesn't already exist on disk, migrate data from config
        if (!fs.existsSync(filePath)) {
          this.setData(key, cleanedConfig[key]);
          migratedKeys.push(key);
        }

        // Prune the key from config object
        delete cleanedConfig[key];
      }
    }

    return { migratedKeys, cleanedConfig };
  }

  /**
   * Returns all active module data files for inclusion in backups.
   */
  getAllFiles() {
    if (!fs.existsSync(this.dataDir)) return [];
    try {
      return fs
        .readdirSync(this.dataDir)
        .filter((file) => !file.startsWith('.') && !file.endsWith('.tmp'))
        .map((file) => ({
          filename: file,
          filePath: path.join(this.dataDir, file),
        }));
    } catch (e) {
      console.warn('Failed to list module data files:', e);
      return [];
    }
  }

  /**
   * Converts array of objects into standard CSV string for easy spreadsheet export.
   */
  exportToCsv(key) {
    const data = this.getData(key, []);
    if (!Array.isArray(data) || data.length === 0) return '';

    // Collect all unique keys across all records
    const headers = Array.from(
      new Set(
        data.reduce((acc, row) => {
          if (row && typeof row === 'object') {
            Object.keys(row).forEach((k) => acc.push(k));
          }
          return acc;
        }, [])
      )
    );

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(escapeCsv).join(',');
    const rowLines = data.map((row) => headers.map((h) => escapeCsv(row[h])).join(','));

    return [headerLine, ...rowLines].join('\n');
  }
}

module.exports = ModuleDataManager;
