import { create } from 'zustand';
import type { Accessory, Ammo, Firearm, ReloadingComponent, StorageLocation } from '../types';

export interface VaultStoreState {
  firearms: Firearm[];
  ammoList: Ammo[];
  accessories: Accessory[];
  components: ReloadingComponent[];
  storageLocations: StorageLocation[];
  isLoading: boolean;
  isLoaded: boolean;

  setFirearms: (firearms: Firearm[] | ((prev: Firearm[]) => Firearm[])) => void;
  setAmmoList: (ammoList: Ammo[] | ((prev: Ammo[]) => Ammo[])) => void;
  setAccessories: (accessories: Accessory[] | ((prev: Accessory[]) => Accessory[])) => void;
  setComponents: (components: ReloadingComponent[] | ((prev: ReloadingComponent[]) => ReloadingComponent[])) => void;
  setStorageLocations: (locs: StorageLocation[] | ((prev: StorageLocation[]) => StorageLocation[])) => void;

  refreshData: (force?: boolean) => Promise<void>;
}

export const useVaultStore = create<VaultStoreState>((set, get) => ({
  firearms: [],
  ammoList: [],
  accessories: [],
  components: [],
  storageLocations: [],
  isLoading: true,
  isLoaded: false,

  setFirearms: (updater) =>
    set((state) => ({
      firearms: typeof updater === 'function' ? updater(state.firearms) : updater,
    })),

  setAmmoList: (updater) =>
    set((state) => ({
      ammoList: typeof updater === 'function' ? updater(state.ammoList) : updater,
    })),

  setAccessories: (updater) =>
    set((state) => ({
      accessories: typeof updater === 'function' ? updater(state.accessories) : updater,
    })),

  setComponents: (updater) =>
    set((state) => ({
      components: typeof updater === 'function' ? updater(state.components) : updater,
    })),

  setStorageLocations: (updater) =>
    set((state) => ({
      storageLocations: typeof updater === 'function' ? updater(state.storageLocations) : updater,
    })),

  refreshData: async (_force = false) => {
    if (typeof window === 'undefined' || !window.api) {
      set({ isLoading: false });
      return;
    }

    try {
      const isLocked = await window.api.isVaultLocked();
      if (isLocked) {
        set({
          firearms: [],
          ammoList: [],
          accessories: [],
          components: [],
          storageLocations: [],
          isLoading: false,
          isLoaded: true,
        });
        return;
      }

      set({ isLoading: true });

      const [fList, aList, accList, compList, locList] = await Promise.all([
        window.api.getFirearms(),
        window.api.getAmmo(),
        window.api.getAccessories(),
        window.api.getComponents(),
        window.api.getStorageLocations ? window.api.getStorageLocations() : Promise.resolve([]),
      ]);

      set({
        firearms: Array.isArray(fList) ? fList : [],
        ammoList: Array.isArray(aList) ? aList : [],
        accessories: Array.isArray(accList) ? accList : [],
        components: Array.isArray(compList) ? compList : [],
        storageLocations: Array.isArray(locList) ? locList : [],
        isLoading: false,
        isLoaded: true,
      });
    } catch (err) {
      console.error('[useVaultStore] Failed to fetch inventory:', err);
      set({ isLoading: false });
    }
  },
}));
