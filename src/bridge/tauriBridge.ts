import { invoke, isTauri } from '@tauri-apps/api/core';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { platform as getOsPlatform } from '@tauri-apps/plugin-os';
import { writeText as copyToClipboard } from '@tauri-apps/plugin-clipboard-manager';
import { setupMockBackend } from '../mockBackend';
import type {
  Accessory,
  Ammo,
  CustomSkuDatabase,
  Firearm,
  ReloadingComponent,
} from '../types';

/**
 * Initializes the API bridge for Tauri desktop execution.
 * When running inside a native Tauri window, native Tauri commands (invoke)
 * and plugins are called. Any methods still pending native implementation
 * gracefully fall back to the mock storage layer so the entire UI remains functional.
 */
export async function setupDesktopBridge(): Promise<void> {
  // If window.api is already provided (e.g. Electron preload), do nothing
  if (typeof window === 'undefined' || window.api) {
    return;
  }

  // First initialize standard fallback implementations
  setupMockBackend();
  const fallbackApi = (window.api || {}) as NonNullable<Window['api']>;

  if (isTauri()) {
    console.log('[TauriBridge] Native Tauri runtime detected. Attaching native commands.');

    window.api = {
      ...fallbackApi,

      // Core system / platform info
      getPlatform: () => {
        try {
          const os = getOsPlatform();
          return os === 'macos' ? 'darwin' : os === 'windows' ? 'win32' : 'linux';
        } catch {
          return 'darwin';
        }
      },

      // Vault / Authentication
      isVaultSetup: async () => {
        try {
          return await invoke<boolean>('is_vault_setup');
        } catch {
          return fallbackApi.isVaultSetup();
        }
      },
      isVaultLocked: async () => {
        try {
          return await invoke<boolean>('is_vault_locked');
        } catch {
          return fallbackApi.isVaultLocked();
        }
      },
      setupVault: async (password: string) => {
        try {
          return await invoke<string>('setup_vault', { password });
        } catch {
          return fallbackApi.setupVault(password);
        }
      },
      unlockVault: async (password: string) => {
        try {
          return await invoke<boolean>('unlock_vault', { password });
        } catch {
          return fallbackApi.unlockVault(password);
        }
      },
      unlockWithRecoveryCode: async (code: string) => {
        try {
          return await invoke<boolean>('unlock_with_recovery_code', { code });
        } catch {
          return fallbackApi.unlockWithRecoveryCode(code);
        }
      },
      lockVault: async () => {
        try {
          await invoke('lock_vault');
        } catch {
          await fallbackApi.lockVault();
        }
      },
      getRecoveryCode: async () => {
        try {
          return await invoke<string | null>('get_recovery_code');
        } catch {
          return fallbackApi.getRecoveryCode();
        }
      },

      // Firearms CRUD
      getFirearms: async () => {
        try {
          return await invoke<Firearm[]>('get_firearms');
        } catch {
          return fallbackApi.getFirearms();
        }
      },
      addFirearm: async (firearm: Firearm) => {
        try {
          return await invoke<number>('add_firearm', { firearm });
        } catch {
          return fallbackApi.addFirearm(firearm);
        }
      },
      updateFirearm: async (id: number, firearm: Firearm) => {
        try {
          return await invoke<number>('update_firearm', { id, firearm });
        } catch {
          return fallbackApi.updateFirearm(id, firearm);
        }
      },
      deleteFirearm: async (id: number) => {
        try {
          return await invoke<number>('delete_firearm', { id });
        } catch {
          return fallbackApi.deleteFirearm(id);
        }
      },

      // Ammunition CRUD
      getAmmo: async () => {
        try {
          return await invoke<Ammo[]>('get_ammo');
        } catch {
          return fallbackApi.getAmmo();
        }
      },
      addAmmo: async (ammo: Ammo) => {
        try {
          return await invoke<number>('add_ammo', { ammo });
        } catch {
          return fallbackApi.addAmmo(ammo);
        }
      },
      updateAmmo: async (id: number, ammo: Ammo) => {
        try {
          return await invoke<number>('update_ammo', { id, ammo });
        } catch {
          return fallbackApi.updateAmmo(id, ammo);
        }
      },
      deleteAmmo: async (id: number) => {
        try {
          return await invoke<number>('delete_ammo', { id });
        } catch {
          return fallbackApi.deleteAmmo(id);
        }
      },

      // Accessories CRUD
      getAccessories: async () => {
        try {
          return await invoke<Accessory[]>('get_accessories');
        } catch {
          return fallbackApi.getAccessories();
        }
      },
      addAccessory: async (accessory: Accessory) => {
        try {
          return await invoke<number>('add_accessory', { accessory });
        } catch {
          return fallbackApi.addAccessory(accessory);
        }
      },
      updateAccessory: async (id: number, accessory: Accessory) => {
        try {
          return await invoke<number>('update_accessory', { id, accessory });
        } catch {
          return fallbackApi.updateAccessory(id, accessory);
        }
      },
      deleteAccessory: async (id: number) => {
        try {
          return await invoke<number>('delete_accessory', { id });
        } catch {
          return fallbackApi.deleteAccessory(id);
        }
      },

      // Reloading Components CRUD
      getComponents: async () => {
        try {
          return await invoke<ReloadingComponent[]>('get_components');
        } catch {
          return fallbackApi.getComponents();
        }
      },
      addComponent: async (component: ReloadingComponent) => {
        try {
          return await invoke<number>('add_component', { component });
        } catch {
          return fallbackApi.addComponent(component);
        }
      },
      updateComponent: async (id: number, component: ReloadingComponent) => {
        try {
          return await invoke<number>('update_component', { id, component });
        } catch {
          return fallbackApi.updateComponent(id, component);
        }
      },
      deleteComponent: async (id: number) => {
        try {
          return await invoke<number>('delete_component', { id });
        } catch {
          return fallbackApi.deleteComponent(id);
        }
      },

      // Custom SKUs Catalog
      getSkus: async () => {
        try {
          return await invoke<CustomSkuDatabase>('get_skus');
        } catch {
          return fallbackApi.getSkus();
        }
      },
      saveSkus: async (skus: CustomSkuDatabase) => {
        try {
          return await invoke<boolean>('save_skus', { skus });
        } catch {
          return fallbackApi.saveSkus(skus);
        }
      },
      deleteSku: async (skuId: string) => {
        try {
          return await invoke<string>('delete_sku', { skuId });
        } catch {
          return fallbackApi.deleteSku(skuId);
        }
      },

      // Storage Locations
      getStorageLocations: async () => {
        try {
          return await invoke<any[]>('get_storage_locations');
        } catch {
          return fallbackApi.getStorageLocations();
        }
      },
      addStorageLocation: async (loc: any) => {
        try {
          return await invoke<any>('add_storage_location', { location: loc });
        } catch {
          return fallbackApi.addStorageLocation(loc);
        }
      },
      deleteStorageLocation: async (id: number) => {
        try {
          await invoke('delete_storage_location', { id: id.toString() });
          return id;
        } catch {
          return fallbackApi.deleteStorageLocation(id);
        }
      },

      // Activity Audit Log
      getActivityLog: async () => {
        try {
          return await invoke<any[]>('get_activity_log');
        } catch {
          return fallbackApi.getActivityLog ? fallbackApi.getActivityLog() : [];
        }
      },

      // Media & Photos
      saveBase64Photo: async (base64Data: string, filename: string) => {
        try {
          return await invoke<string>('save_base64_photo', { base64Data, filename });
        } catch {
          return fallbackApi.saveBase64Photo(base64Data, filename);
        }
      },
      saveBase64Document: async (base64Data: string, filename: string) => {
        try {
          return await invoke<string>('save_base64_document', { base64Data, filename });
        } catch {
          return fallbackApi.saveBase64Document(base64Data, filename);
        }
      },

      // File Dialogs
      selectCSVFile: async () => {
        if (fallbackApi.selectCSVFile) {
          return fallbackApi.selectCSVFile();
        }
        return null;
      },

      // System / LAN Sync Info
      getLocalIp: async () => {
        try {
          return await invoke<string>('get_local_ip');
        } catch {
          return '127.0.0.1';
        }
      },
      getAllLocalIps: async () => {
        if (fallbackApi.getAllLocalIps) {
          return fallbackApi.getAllLocalIps();
        }
        return [{ name: 'Default', address: '127.0.0.1', score: 100, isVirtual: false }];
      },
    };
  }
}
