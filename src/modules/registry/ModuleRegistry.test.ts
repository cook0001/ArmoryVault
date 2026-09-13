import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AVAILABLE_MODULES,
  DEFAULT_INSTALLED_MODULES,
  deleteDiskModule,
  downloadModuleFile,
  getInstalledDiskModules,
  getInstalledModuleIds,
  getModuleArchives,
  installModule,
  uninstallModule,
} from './ModuleRegistry';

describe('ModuleRegistry', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset window.api mocks
    (window as any).api = {
      getConfig: vi.fn().mockResolvedValue(null),
      setConfig: vi.fn().mockResolvedValue(undefined),
      archiveModuleData: vi.fn().mockResolvedValue({
        success: true,
        totalRecords: 42,
        dataKeyCount: { components: 42 },
      }),
      restoreModuleData: vi.fn().mockResolvedValue({
        success: true,
        restoredRecords: 42,
      }),
      getModuleArchives: vi.fn().mockResolvedValue({
        reloading: {
          moduleId: 'reloading',
          archivedAt: '2026-09-13T12:00:00.000Z',
          totalRecords: 42,
        },
      }),
      downloadModule: vi.fn().mockResolvedValue({
        success: true,
        moduleId: 'reloading',
      }),
      deleteModuleFiles: vi.fn().mockResolvedValue({
        success: true,
      }),
      getInstalledDiskModules: vi.fn().mockResolvedValue(['ballistics']),
    };
  });

  it('exposes all 5 modular extensions with valid manifests', () => {
    expect(AVAILABLE_MODULES.length).toBe(5);
    const ids = AVAILABLE_MODULES.map((m) => m.manifest.id);
    expect(ids).toContain('reloading');
    expect(ids).toContain('maintenance');
    expect(ids).toContain('ballistics');
    expect(ids).toContain('nfa');
    expect(ids).toContain('boundbook');

    for (const mod of AVAILABLE_MODULES) {
      expect(mod.manifest.id).toBeDefined();
      expect(mod.manifest.name).toBeDefined();
      expect(mod.manifest.version).toBeDefined();
      expect(Array.isArray(mod.manifest.dataKeys)).toBe(true);
      expect(Array.isArray(mod.routes)).toBe(true);
      expect(Array.isArray(mod.navItems)).toBe(true);
    }
  });

  it('defaults to installing all modules if config is not yet set', async () => {
    const installed = await getInstalledModuleIds();
    expect(installed).toEqual(DEFAULT_INSTALLED_MODULES);
  });

  it('installs a module and triggers data restoration if archive exists', async () => {
    // Start with a subset
    (window as any).api.getConfig.mockResolvedValue(['ballistics']);

    const res = await installModule('reloading', true);
    expect(res.success).toBe(true);
    expect(res.restoredRecords).toBe(42);
    expect((window as any).api.restoreModuleData).toHaveBeenCalledWith('reloading');
    expect((window as any).api.setConfig).toHaveBeenCalledWith(
      'installed_modules',
      expect.arrayContaining(['ballistics', 'reloading'])
    );
  });

  it('uninstalls a module, archives its data keys to disk, and updates config', async () => {
    (window as any).api.getConfig.mockResolvedValue(['reloading', 'ballistics']);

    const res = await uninstallModule('reloading', true);
    expect(res.success).toBe(true);
    expect(res.totalRecords).toBe(42);

    const reloadingMod = AVAILABLE_MODULES.find((m) => m.manifest.id === 'reloading');
    expect((window as any).api.archiveModuleData).toHaveBeenCalledWith(
      'reloading',
      reloadingMod?.manifest.dataKeys
    );

    expect((window as any).api.setConfig).toHaveBeenCalledWith('installed_modules', ['ballistics']);
  });

  it('retrieves encrypted module archives from desktop api', async () => {
    const archives = await getModuleArchives();
    expect(archives.reloading).toBeDefined();
    expect(archives.reloading.totalRecords).toBe(42);
  });

  it('downloads a module package via desktop API', async () => {
    const res = await downloadModuleFile('reloading');
    expect(res.success).toBe(true);
    expect(res.moduleId).toBe('reloading');
    expect((window as any).api.downloadModule).toHaveBeenCalledWith('reloading');
  });

  it('uninstalls a module and deletes disk files when deleteFiles is true', async () => {
    (window as any).api.getConfig.mockResolvedValue(['reloading']);

    const res = await uninstallModule('reloading', true, true);
    expect(res.success).toBe(true);
    expect((window as any).api.deleteModuleFiles).toHaveBeenCalledWith('reloading');
  });

  it('deletes module files from disk via deleteDiskModule', async () => {
    const res = await deleteDiskModule('maintenance');
    expect(res.success).toBe(true);
    expect((window as any).api.deleteModuleFiles).toHaveBeenCalledWith('maintenance');
  });

  it('retrieves installed disk modules list from desktop api', async () => {
    const diskModules = await getInstalledDiskModules();
    expect(diskModules).toEqual(['ballistics']);
    expect((window as any).api.getInstalledDiskModules).toHaveBeenCalled();
  });
});
