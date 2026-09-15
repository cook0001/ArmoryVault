import React, { useEffect } from 'react';
import { useVaultStore } from '../store/vaultStore';
import type { Accessory, Ammo, Firearm, ReloadingComponent, StorageLocation } from '../types';

export interface VaultDataContextType {
  firearms: Firearm[];
  ammoList: Ammo[];
  accessories: Accessory[];
  components: ReloadingComponent[];
  storageLocations: StorageLocation[];
  isLoading: boolean;
  isLoaded: boolean;
  refreshData: (force?: boolean) => Promise<void>;
  setFirearms: (firearms: Firearm[] | ((prev: Firearm[]) => Firearm[])) => void;
  setAmmoList: (ammoList: Ammo[] | ((prev: Ammo[]) => Ammo[])) => void;
  setAccessories: (accessories: Accessory[] | ((prev: Accessory[]) => Accessory[])) => void;
  setComponents: (components: ReloadingComponent[] | ((prev: ReloadingComponent[]) => ReloadingComponent[])) => void;
  setStorageLocations: (locs: StorageLocation[] | ((prev: StorageLocation[]) => StorageLocation[])) => void;
}

export const useVaultData = (): VaultDataContextType => {
  const firearms = useVaultStore((s) => s.firearms);
  const ammoList = useVaultStore((s) => s.ammoList);
  const accessories = useVaultStore((s) => s.accessories);
  const components = useVaultStore((s) => s.components);
  const storageLocations = useVaultStore((s) => s.storageLocations);
  const isLoading = useVaultStore((s) => s.isLoading);
  const isLoaded = useVaultStore((s) => s.isLoaded);
  const refreshData = useVaultStore((s) => s.refreshData);
  const setFirearms = useVaultStore((s) => s.setFirearms);
  const setAmmoList = useVaultStore((s) => s.setAmmoList);
  const setAccessories = useVaultStore((s) => s.setAccessories);
  const setComponents = useVaultStore((s) => s.setComponents);
  const setStorageLocations = useVaultStore((s) => s.setStorageLocations);

  return {
    firearms,
    ammoList,
    accessories,
    components,
    storageLocations,
    isLoading,
    isLoaded,
    refreshData,
    setFirearms,
    setAmmoList,
    setAccessories,
    setComponents,
    setStorageLocations,
  };
};

export const VaultDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const refreshData = useVaultStore((s) => s.refreshData);

  useEffect(() => {
    refreshData();

    const handleReload = () => {
      refreshData(true);
    };

    window.addEventListener('armoryvault-reload', handleReload);

    return () => {
      window.removeEventListener('armoryvault-reload', handleReload);
    };
  }, [refreshData]);

  return <>{children}</>;
};
