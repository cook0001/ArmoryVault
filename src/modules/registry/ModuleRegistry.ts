import ballisticsModule from '../ballistics';
import boundbookModule from '../boundbook';
import labelsModule from '../labels';
import maintenanceModule from '../maintenance';
import nfaModule from '../nfa';
import opticsModule from '../optics';
import rangesModule from '../ranges';
import reloadingModule from '../reloading';
import { ArmoryModule, ModuleArchiveMetadata } from './types';

export const AVAILABLE_MODULES: ArmoryModule[] = [
  reloadingModule,
  maintenanceModule,
  ballisticsModule,
  nfaModule,
  boundbookModule,
  opticsModule,
  rangesModule,
  labelsModule,
];

const CONFIG_KEY = 'installed_modules';
export const DEFAULT_INSTALLED_MODULES: string[] = [];

export async function getInstalledModuleIds(): Promise<string[]> {
  try {
    if (window.api && window.api.getConfig) {
      const saved = await window.api.getConfig(CONFIG_KEY);
      if (Array.isArray(saved)) {
        return saved;
      }
      // If never configured, save and return defaults (empty)
      if (window.api.setConfig) {
        await window.api.setConfig(CONFIG_KEY, DEFAULT_INSTALLED_MODULES);
      }
      return DEFAULT_INSTALLED_MODULES;
    }
  } catch (e) {
    console.warn('Failed to read installed modules from desktop config:', e);
  }

  // Fallback to localStorage for browser/tests
  try {
    const raw = localStorage.getItem('av_installed_modules');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    localStorage.setItem('av_installed_modules', JSON.stringify(DEFAULT_INSTALLED_MODULES));
  } catch {}
  return DEFAULT_INSTALLED_MODULES;
}

export async function saveInstalledModuleIds(ids: string[]): Promise<void> {
  try {
    if (window.api && window.api.setConfig) {
      await window.api.setConfig(CONFIG_KEY, ids);
    }
  } catch (e) {
    console.warn('Failed to save installed modules to desktop config:', e);
  }
  try {
    localStorage.setItem('av_installed_modules', JSON.stringify(ids));
  } catch {}
}

export async function installModule(
  moduleId: string,
  restoreData = true
): Promise<{ success: boolean; restoredRecords?: number; error?: string }> {
  const current = await getInstalledModuleIds();
  if (!current.includes(moduleId)) {
    const updated = [...current, moduleId];
    await saveInstalledModuleIds(updated);
  }

  let restoredRecords = 0;
  if (restoreData && window.api && window.api.restoreModuleData) {
    try {
      const res = await window.api.restoreModuleData(moduleId);
      if (res && res.success) {
        restoredRecords = res.restoredRecords || 0;
      }
    } catch (e: any) {
      console.warn(`Failed to restore data for module ${moduleId}:`, e);
    }
  }

  const mod = AVAILABLE_MODULES.find((m) => m.manifest.id === moduleId);
  if (mod && mod.onInstall) {
    try {
      await mod.onInstall();
    } catch (e) {
      console.warn(`Error running onInstall hook for ${moduleId}:`, e);
    }
  }

  return { success: true, restoredRecords };
}

export async function uninstallModule(
  moduleId: string,
  archiveData = true,
  deleteFiles = false
): Promise<{ success: boolean; totalRecords?: number; error?: string }> {
  const mod = AVAILABLE_MODULES.find((m) => m.manifest.id === moduleId);
  let totalRecords = 0;

  if (archiveData && mod && mod.manifest.dataKeys && mod.manifest.dataKeys.length > 0) {
    if (window.api && window.api.archiveModuleData) {
      try {
        const res = await window.api.archiveModuleData(moduleId, mod.manifest.dataKeys);
        if (res && res.success) {
          totalRecords = res.totalRecords || 0;
        }
      } catch (e: any) {
        console.warn(`Failed to archive data for module ${moduleId}:`, e);
      }
    }
  }

  if (deleteFiles && window.api && window.api.deleteModuleFiles) {
    try {
      await window.api.deleteModuleFiles(moduleId);
    } catch (e) {
      console.warn(`Failed to delete disk files for module ${moduleId}:`, e);
    }
  }

  if (mod && mod.onUninstall) {
    try {
      await mod.onUninstall();
    } catch (e) {
      console.warn(`Error running onUninstall hook for ${moduleId}:`, e);
    }
  }

  const current = await getInstalledModuleIds();
  const updated = current.filter((id) => id !== moduleId);
  await saveInstalledModuleIds(updated);

  return { success: true, totalRecords };
}

export async function downloadModuleFile(
  moduleId: string
): Promise<{ success: boolean; moduleId?: string; error?: string }> {
  if (window.api && window.api.downloadModule) {
    try {
      return await window.api.downloadModule(moduleId);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
  return { success: true, moduleId };
}

export async function deleteDiskModule(moduleId: string): Promise<{ success: boolean }> {
  if (window.api && window.api.deleteModuleFiles) {
    try {
      return await window.api.deleteModuleFiles(moduleId);
    } catch (e) {
      console.warn(`Failed to delete disk files for ${moduleId}:`, e);
    }
  }
  return { success: true };
}

export async function getInstalledDiskModules(): Promise<string[]> {
  if (window.api && window.api.getInstalledDiskModules) {
    try {
      return await window.api.getInstalledDiskModules();
    } catch (e) {
      console.warn('Failed to retrieve disk modules:', e);
    }
  }
  return DEFAULT_INSTALLED_MODULES;
}

export async function getModuleArchives(): Promise<Record<string, ModuleArchiveMetadata>> {
  if (window.api && window.api.getModuleArchives) {
    try {
      return await window.api.getModuleArchives();
    } catch (e) {
      console.warn('Failed to retrieve module archives:', e);
    }
  }
  return {};
}

export async function checkRemoteModules(): Promise<{
  success: boolean;
  modules?: Record<string, any>;
  version?: string;
  repository?: string;
  lastChecked?: string;
  fromCache?: boolean;
  error?: string;
}> {
  if (window.api && window.api.checkRemoteModules) {
    try {
      return await window.api.checkRemoteModules();
    } catch (e: any) {
      console.warn('Failed to check remote modules:', e);
      return { success: false, error: e.message };
    }
  }
  return { success: true, modules: {} };
}
