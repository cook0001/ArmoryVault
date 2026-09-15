import type { StorageLocation } from '../types';
import type { StorageItemType } from './StorageSync';

export interface StorageIndex {
  firearmStorageMap: Map<number, StorageLocation>;
  accessoryStorageMap: Map<number, StorageLocation>;
  ammoStorageMap: Map<number, StorageLocation>;
  componentStorageMap: Map<number, StorageLocation>;
  getLocation: (type: StorageItemType, itemId: number | undefined) => StorageLocation | undefined;
}

/**
 * Builds O(1) constant-time lookup maps from an array of StorageLocations.
 * Eliminates O(locations * items) scans during card rendering and search filtering.
 */
export function buildStorageIndex(locations: StorageLocation[] = []): StorageIndex {
  const firearmStorageMap = new Map<number, StorageLocation>();
  const accessoryStorageMap = new Map<number, StorageLocation>();
  const ammoStorageMap = new Map<number, StorageLocation>();
  const componentStorageMap = new Map<number, StorageLocation>();

  for (const loc of locations) {
    if (loc.firearmIds) {
      for (const id of loc.firearmIds) {
        firearmStorageMap.set(id, loc);
      }
    }
    if (loc.accessoryIds) {
      for (const id of loc.accessoryIds) {
        accessoryStorageMap.set(id, loc);
      }
    }
    if (loc.ammoIds) {
      for (const id of loc.ammoIds) {
        ammoStorageMap.set(id, loc);
      }
    }
    if (loc.componentIds) {
      for (const id of loc.componentIds) {
        componentStorageMap.set(id, loc);
      }
    }
  }

  const getLocation = (
    type: StorageItemType,
    itemId: number | undefined
  ): StorageLocation | undefined => {
    if (!itemId) return undefined;
    switch (type) {
      case 'firearm':
        return firearmStorageMap.get(itemId);
      case 'accessory':
        return accessoryStorageMap.get(itemId);
      case 'ammo':
        return ammoStorageMap.get(itemId);
      case 'component':
        return componentStorageMap.get(itemId);
      default:
        return undefined;
    }
  };

  return {
    firearmStorageMap,
    accessoryStorageMap,
    ammoStorageMap,
    componentStorageMap,
    getLocation,
  };
}
