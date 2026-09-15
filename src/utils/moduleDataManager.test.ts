import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const ModuleDataManager = require('../../electron/ModuleDataManager');

describe('ModuleDataManager Layer Tests', () => {
  let tempDir: string;
  let moduleDataDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'av-module-data-test-'));
    moduleDataDir = path.join(tempDir, 'module_data');
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('initializes module_data directory and recognizes module keys', () => {
    const mgr = new ModuleDataManager(moduleDataDir);
    expect(fs.existsSync(moduleDataDir)).toBe(true);

    expect(mgr.isModuleDataKey('saved_ranges')).toBe(true);
    expect(mgr.isModuleDataKey('handload_recipes')).toBe(true);
    expect(mgr.isModuleDataKey('reloading_recipes')).toBe(true);
    expect(mgr.isModuleDataKey('optics_vault_inventory')).toBe(true);
    expect(mgr.isModuleDataKey('saved_label_templates')).toBe(true);
    expect(mgr.isModuleDataKey('custom_schedule_presets')).toBe(true);

    // Non-module keys
    expect(mgr.isModuleDataKey('backupPath')).toBe(false);
    expect(mgr.isModuleDataKey('pairingToken')).toBe(false);
  });

  it('performs CRUD operations for module data with dedicated JSON files', () => {
    const mgr = new ModuleDataManager(moduleDataDir);

    // Empty fallback
    expect(mgr.getData('saved_ranges', [])).toEqual([]);

    // Save ranges
    const ranges = [
      { id: '1', name: 'Thunder Valley Precision', state: 'OH', distance: '1000 yd' },
      { id: '2', name: 'Black Creek Gun Club', state: 'VA', distance: '100 yd' },
    ];
    expect(mgr.setData('saved_ranges', ranges)).toBe(true);

    // Verify file created on disk
    const expectedFile = path.join(moduleDataDir, 'saved_ranges.json');
    expect(fs.existsSync(expectedFile)).toBe(true);

    // Verify fresh instance reads the data
    const freshMgr = new ModuleDataManager(moduleDataDir);
    expect(freshMgr.getData('saved_ranges')).toEqual(ranges);
  });

  it('migrates module keys from config.json and prunes them from the config', () => {
    const mgr = new ModuleDataManager(moduleDataDir);

    const legacyConfig = {
      backupPath: '/path/to/backups',
      pairingToken: 'secret-token-123',
      installed_modules: ['ranges', 'optics'],
      saved_ranges: [{ id: 'r1', name: 'Local Range' }],
      optics_vault_inventory: [{ id: 'o1', make: 'Vortex', model: 'Razor HD Gen III' }],
      handload_recipes: [{ id: 'rec1', caliber: '6.5 Creedmoor', powder: 'H4350' }],
    };

    const { migratedKeys, cleanedConfig } = mgr.migrateFromConfig(legacyConfig);

    expect(migratedKeys).toContain('saved_ranges');
    expect(migratedKeys).toContain('optics_vault_inventory');
    expect(migratedKeys).toContain('handload_recipes');

    // Config should be cleaned of module data
    expect(cleanedConfig.backupPath).toBe('/path/to/backups');
    expect(cleanedConfig.pairingToken).toBe('secret-token-123');
    expect(cleanedConfig.installed_modules).toEqual(['ranges', 'optics']);
    expect(cleanedConfig.saved_ranges).toBeUndefined();
    expect(cleanedConfig.optics_vault_inventory).toBeUndefined();
    expect(cleanedConfig.handload_recipes).toBeUndefined();

    // Data should now exist in dedicated module files
    expect(mgr.getData('saved_ranges')).toEqual([{ id: 'r1', name: 'Local Range' }]);
    expect(mgr.getData('optics_vault_inventory')).toEqual([
      { id: 'o1', make: 'Vortex', model: 'Razor HD Gen III' },
    ]);
    expect(mgr.getData('handload_recipes')).toEqual([
      { id: 'rec1', caliber: '6.5 Creedmoor', powder: 'H4350' },
    ]);
  });

  it('exports module data to CSV format for spreadsheets', () => {
    const mgr = new ModuleDataManager(moduleDataDir);
    const recipes = [
      { caliber: '6.5 Creedmoor', bullet: '140gr ELD-M', powder: 'H4350', chargeWeight: 41.5 },
      { caliber: '.308 Win', bullet: '168gr BTHP', powder: 'Varget', chargeWeight: 43.0 },
    ];
    mgr.setData('handload_recipes', recipes);

    const csv = mgr.exportToCsv('handload_recipes');
    expect(csv).toContain('caliber,bullet,powder,chargeWeight');
    expect(csv).toContain('6.5 Creedmoor,140gr ELD-M,H4350,41.5');
    expect(csv).toContain('.308 Win,168gr BTHP,Varget,43');
  });

  it('returns all active files for inclusion in backups', () => {
    const mgr = new ModuleDataManager(moduleDataDir);
    mgr.setData('saved_ranges', [{ id: '1' }]);
    mgr.setData('optics_vault_inventory', [{ id: '2' }]);

    const files = mgr.getAllFiles();
    expect(files.length).toBe(2);
    const filenames = files.map((f: any) => f.filename);
    expect(filenames).toContain('saved_ranges.json');
    expect(filenames).toContain('optics_inventory.json');
  });
});
