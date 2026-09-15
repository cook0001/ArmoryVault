import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Accessory, Ammo, Firearm, ReloadingComponent, StorageLocation } from '../types';

export interface VaultDataContextType {
  firearms: Firearm[];
  ammoList: Ammo[];
  accessories: Accessory[];
  components: ReloadingComponent[];
  storageLocations: StorageLocation[];
  isLoading: boolean;
  isLoaded: boolean;
  refreshData: (force?: boolean) => Promise<void>;
  setFirearms: React.Dispatch<React.SetStateAction<Firearm[]>>;
  setAmmoList: React.Dispatch<React.SetStateAction<Ammo[]>>;
  setAccessories: React.Dispatch<React.SetStateAction<Accessory[]>>;
  setComponents: React.Dispatch<React.SetStateAction<ReloadingComponent[]>>;
  setStorageLocations: React.Dispatch<React.SetStateAction<StorageLocation[]>>;
}

const defaultContext: VaultDataContextType = {
  firearms: [],
  ammoList: [],
  accessories: [],
  components: [],
  storageLocations: [],
  isLoading: false,
  isLoaded: false,
  refreshData: async () => {},
  setFirearms: () => {},
  setAmmoList: () => {},
  setAccessories: () => {},
  setComponents: () => {},
  setStorageLocations: () => {},
};

const VaultDataContext = createContext<VaultDataContextType>(defaultContext);

export const useVaultData = (): VaultDataContextType => {
  return useContext(VaultDataContext);
};

export const VaultDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [ammoList, setAmmoList] = useState<Ammo[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [components, setComponents] = useState<ReloadingComponent[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const inFlightPromiseRef = useRef<Promise<void> | null>(null);

  const refreshData = useCallback(async (force = false) => {
    if (!window.api) {
      setIsLoading(false);
      return;
    }

    if (inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    inFlightPromiseRef.current = (async () => {
      try {
        const [firearmData, ammoData, accsData, compsData, locsData] = await Promise.all([
          window.api.getFirearms ? window.api.getFirearms() : Promise.resolve([]),
          window.api.getAmmo ? window.api.getAmmo() : Promise.resolve([]),
          window.api.getAccessories ? window.api.getAccessories() : Promise.resolve([]),
          window.api.getComponents ? window.api.getComponents() : Promise.resolve([]),
          window.api.getStorageLocations ? window.api.getStorageLocations() : Promise.resolve([]),
        ]);

        setFirearms(firearmData || []);
        setAmmoList(ammoData || []);
        setAccessories(accsData || []);
        setComponents(compsData || []);
        setStorageLocations(locsData || []);
        setIsLoaded(true);
      } catch (err) {
        console.error('[VaultDataContext] Error refreshing vault data:', err);
      } finally {
        setIsLoading(false);
        inFlightPromiseRef.current = null;
      }
    })();

    return inFlightPromiseRef.current;
  }, []);

  useEffect(() => {
    refreshData();

    const handleReload = () => {
      refreshData(true);
    };

    window.addEventListener('armoryvault-reload', handleReload);

    let unsubscribeSync: (() => void) | undefined;
    if (window.api?.onSyncReceived) {
      unsubscribeSync = window.api.onSyncReceived(() => {
        refreshData(true);
      });
    }

    return () => {
      window.removeEventListener('armoryvault-reload', handleReload);
      if (unsubscribeSync) {
        unsubscribeSync();
      }
    };
  }, [refreshData]);

  const value: VaultDataContextType = {
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

  return <VaultDataContext.Provider value={value}>{children}</VaultDataContext.Provider>;
};
