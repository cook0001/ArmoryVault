import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ModuleHost } from './ModuleHost';
import {
  AVAILABLE_MODULES,
  installModule as apiInstallModule,
  uninstallModule as apiUninstallModule,
  checkRemoteModules,
  deleteDiskModule,
  getModuleArchives as fetchModuleArchives,
  getInstalledDiskModules,
  getInstalledModuleIds,
} from './ModuleRegistry';
import {
  ArmoryModule,
  ModuleArchiveMetadata,
  ModuleCommand,
  ModuleNavItem,
  ModuleRoute,
} from './types';

const buildDynamicModule = (id: string, modData: any): ArmoryModule => ({
  manifest: {
    id,
    name: (modData as any).name || id,
    version: (modData as any).version || '1.0.0',
    minAppVersion: (modData as any).minAppVersion || '1.0.0',
    author: (modData as any).author || 'ArmoryVault',
    category: (modData as any).category || 'bench',
    description: (modData as any).description || '',
    dataKeys: (modData as any).dataKeys || [],
    entry: (modData as any).entry || 'module.bundle.js',
  },
  routes: [
    {
      path: `/${id}`,
      element: (() => (
        <ModuleHost moduleId={id} featureName={(modData as any).name || id} />
      )) as any,
    },
  ],
  navItems: [
    {
      label: (modData as any).name || id,
      path: `/${id}`,
      icon: null,
      group: (modData as any).category === 'compliance' ? 'vault' : 'tools',
    },
  ],
  commands: [
    {
      id: `search-module-${id}`,
      label: (modData as any).name || id,
      sublabel: (modData as any).description || 'Modular Extension',
      path: `/${id}`,
      keywords: [id, (modData as any).name || '', 'module', 'extension'],
    },
  ],
});

interface ModuleContextValue {
  installedModules: string[];
  diskModules: string[];
  availableModules: ArmoryModule[];
  remoteModules: Record<string, any>;
  isCheckingRemote: boolean;
  lastCheckedRemote: string | null;
  checkRemote: () => Promise<void>;
  isInstalled: (id: string) => boolean;
  isDownloaded: (id: string) => boolean;
  isDownloading: (id: string) => boolean;
  downloadProgress: Record<string, number>;
  installModule: (
    id: string,
    restoreData?: boolean
  ) => Promise<{ success: boolean; restoredRecords?: number; error?: string }>;
  downloadAndInstallModule: (
    id: string
  ) => Promise<{ success: boolean; restoredRecords?: number; error?: string }>;
  uninstallModule: (
    id: string,
    archiveData?: boolean,
    deleteFiles?: boolean
  ) => Promise<{ success: boolean; totalRecords?: number; error?: string }>;
  deleteDiskFiles: (id: string) => Promise<{ success: boolean }>;
  archives: Record<string, ModuleArchiveMetadata>;
  refreshArchives: () => Promise<void>;
  activeRoutes: ModuleRoute[];
  activeNavItems: ModuleNavItem[];
  activeCommands: ModuleCommand[];
  isModuleCenterOpen: boolean;
  targetModuleId?: string;
  openModuleCenter: (targetModuleId?: string) => void;
  closeModuleCenter: () => void;
  loading: boolean;
}

const ModuleContext = createContext<ModuleContextValue | undefined>(undefined);

export const ModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [installedModules, setInstalledModules] = useState<string[]>([]);
  const [diskModules, setDiskModules] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [archives, setArchives] = useState<Record<string, ModuleArchiveMetadata>>({});
  const [remoteModules, setRemoteModules] = useState<Record<string, any>>({});
  const [isCheckingRemote, setIsCheckingRemote] = useState(false);
  const [lastCheckedRemote, setLastCheckedRemote] = useState<string | null>(null);
  const [dynamicModules, setDynamicModules] = useState<ArmoryModule[]>([]);
  const [isModuleCenterOpen, setIsModuleCenterOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refreshInstalled = async () => {
    const ids = await getInstalledModuleIds();
    setInstalledModules(ids);
  };

  const refreshDiskModules = async () => {
    const disk = await getInstalledDiskModules();
    setDiskModules(disk);
  };

  const refreshArchives = async () => {
    const arch = await fetchModuleArchives();
    setArchives(arch || {});
  };

  const checkRemote = async () => {
    setIsCheckingRemote(true);
    try {
      const res = await checkRemoteModules();
      if (res.success && res.modules) {
        const modulesRecord: Record<string, any> = {};
        if (Array.isArray(res.modules)) {
          res.modules.forEach((m: any) => {
            if (m && m.id) modulesRecord[m.id] = m;
          });
        } else if (res.modules && typeof res.modules === 'object') {
          Object.assign(modulesRecord, res.modules);
        }

        setRemoteModules(modulesRecord);
        setLastCheckedRemote(res.lastChecked || new Date().toISOString());

        const localIds = new Set(AVAILABLE_MODULES.map((m) => m.manifest.id));
        const newDyn: ArmoryModule[] = [];
        for (const [id, modData] of Object.entries(modulesRecord)) {
          if (!localIds.has(id)) {
            newDyn.push(buildDynamicModule(id, modData));
          }
        }
        setDynamicModules(newDyn);
      }
    } catch (e) {
      console.warn('Error checking remote modules:', e);
    } finally {
      setIsCheckingRemote(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const [ids, disk, arch] = await Promise.all([
          getInstalledModuleIds(),
          getInstalledDiskModules(),
          fetchModuleArchives(),
        ]);
        if (mounted) {
          setInstalledModules(ids);
          setDiskModules(disk);
          setArchives(arch || {});

          // Pre-populate dynamic modules from disk for instant offline access
          const localIds = new Set(AVAILABLE_MODULES.map((m) => m.manifest.id));
          const diskDynamic: ArmoryModule[] = [];
          for (const dId of disk) {
            if (!localIds.has(dId) && window.api && window.api.getModuleBundle) {
              try {
                const b = await window.api.getModuleBundle(dId);
                if (b && b.success && b.manifest) {
                  diskDynamic.push(buildDynamicModule(dId, b.manifest));
                }
              } catch {}
            }
          }
          if (diskDynamic.length > 0) {
            setDynamicModules((prev) => {
              const existingIds = new Set(prev.map((m) => m.manifest.id));
              const additions = diskDynamic.filter((m) => !existingIds.has(m.manifest.id));
              return [...prev, ...additions];
            });
          }
        }
        checkRemote();
      } catch (e) {
        console.warn('Error initializing module state:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();

    // Listen for download progress from main process
    let unsubProgress: (() => void) | undefined;
    if (window.api && window.api.onModuleDownloadProgress) {
      unsubProgress = window.api.onModuleDownloadProgress((data) => {
        if (data && data.moduleId) {
          setDownloadProgress((prev) => ({
            ...prev,
            [data.moduleId]: data.percent,
          }));
        }
      });
    }

    // Listen for custom module center open events
    const handleOpenCenter = (e: Event) => {
      const customEvent = e as CustomEvent<{ moduleId?: string }>;
      openModuleCenter(customEvent.detail?.moduleId);
    };
    window.addEventListener('armoryvault-open-module-center', handleOpenCenter);

    return () => {
      mounted = false;
      if (unsubProgress) unsubProgress();
      window.removeEventListener('armoryvault-open-module-center', handleOpenCenter);
    };
  }, []);

  const isInstalled = (id: string) => installedModules.includes(id);
  const isDownloaded = (id: string) => diskModules.includes(id);
  const isDownloading = (id: string) =>
    downloadProgress[id] !== undefined && downloadProgress[id] < 100;

  const installModule = async (id: string, restoreData = true) => {
    const res = await apiInstallModule(id, restoreData);
    if (res.success) {
      await refreshInstalled();
      await refreshDiskModules();
      await refreshArchives();
    }
    return res;
  };

  const downloadAndInstallModule = async (id: string) => {
    setDownloadProgress((prev) => ({ ...prev, [id]: 5 }));
    try {
      if (window.api && window.api.downloadModule) {
        const dlRes = await window.api.downloadModule(id);
        if (!dlRes.success) {
          setDownloadProgress((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          return { success: false, error: dlRes.error || 'Failed to download module from GitHub' };
        }
      }
    } catch (e: any) {
      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return { success: false, error: e.message };
    }

    setDownloadProgress((prev) => ({ ...prev, [id]: 100 }));
    const installRes = await installModule(id, true);

    setTimeout(() => {
      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 1200);

    return installRes;
  };

  const uninstallModule = async (id: string, archiveData = true, deleteFiles = false) => {
    const res = await apiUninstallModule(id, archiveData, deleteFiles);
    if (res.success) {
      await refreshInstalled();
      await refreshDiskModules();
      await refreshArchives();
    }
    return res;
  };

  const deleteDiskFiles = async (id: string) => {
    const res = await deleteDiskModule(id);
    if (res.success) {
      await refreshDiskModules();
    }
    return res;
  };

  const openModuleCenter = (modId?: string) => {
    setTargetModuleId(modId);
    setIsModuleCenterOpen(true);
  };

  const closeModuleCenter = () => {
    setIsModuleCenterOpen(false);
    setTargetModuleId(undefined);
  };

  const availableModules = useMemo(() => {
    return [...AVAILABLE_MODULES, ...dynamicModules];
  }, [dynamicModules]);

  const activeRoutes = useMemo(() => {
    return availableModules
      .filter((m) => installedModules.includes(m.manifest.id))
      .flatMap((m) => m.routes);
  }, [availableModules, installedModules]);

  const activeNavItems = useMemo(() => {
    return availableModules
      .filter((m) => installedModules.includes(m.manifest.id))
      .flatMap((m) => m.navItems);
  }, [availableModules, installedModules]);

  const activeCommands = useMemo(() => {
    return availableModules
      .filter((m) => installedModules.includes(m.manifest.id))
      .flatMap((m) => m.commands || []);
  }, [availableModules, installedModules]);

  const value = {
    installedModules,
    diskModules,
    availableModules,
    remoteModules,
    isCheckingRemote,
    lastCheckedRemote,
    checkRemote,
    isInstalled,
    isDownloaded,
    isDownloading,
    downloadProgress,
    installModule,
    downloadAndInstallModule,
    uninstallModule,
    deleteDiskFiles,
    archives,
    refreshArchives,
    activeRoutes,
    activeNavItems,
    activeCommands,
    isModuleCenterOpen,
    targetModuleId,
    openModuleCenter,
    closeModuleCenter,
    loading,
  };

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
};

export const useModules = (): ModuleContextValue => {
  const ctx = useContext(ModuleContext);
  if (!ctx) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return ctx;
};
