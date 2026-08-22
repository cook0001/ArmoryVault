/**
 * StorageSync — Canonical storage location utilities for ArmoryVault Desktop.
 * Mobile mirror: ArmoryVault_Companion_Nightly/utils/storageCapacity.ts
 * Keep capacity logic and URI parsing in sync across both platforms.
 */
import type { StorageLocation } from '../types';

export type StorageItemType = 'firearm' | 'accessory' | 'ammo' | 'component';

/**
 * Finds which StorageLocation contains the specified item ID.
 */
export const getItemStorageLocation = (
  type: StorageItemType,
  itemId: number | undefined,
  locations: StorageLocation[]
): StorageLocation | undefined => {
  if (!itemId || !locations || locations.length === 0) return undefined;

  return locations.find((loc) => {
    switch (type) {
      case 'firearm':
        return loc.firearmIds?.includes(itemId);
      case 'accessory':
        return loc.accessoryIds?.includes(itemId);
      case 'ammo':
        return loc.ammoIds?.includes(itemId);
      case 'component':
        return loc.componentIds?.includes(itemId);
      default:
        return false;
    }
  });
};

/**
 * Assigns an item to a target storage location, automatically unassigning it from any previous container.
 * Passing null/undefined/0 as targetLocationId unassigns the item completely.
 */
export const assignItemToStorage = (
  type: StorageItemType,
  itemId: number,
  targetLocationId: number | null | undefined,
  locations: StorageLocation[]
): StorageLocation[] => {
  if (!itemId) return locations;

  return locations.map((loc) => {
    const isTarget = targetLocationId && loc.id === targetLocationId;
    const updated = { ...loc };

    switch (type) {
      case 'firearm': {
        const existing = (loc.firearmIds || []).filter((id) => id !== itemId);
        if (isTarget) existing.push(itemId);
        updated.firearmIds = existing;
        break;
      }
      case 'accessory': {
        const existing = (loc.accessoryIds || []).filter((id) => id !== itemId);
        if (isTarget) existing.push(itemId);
        updated.accessoryIds = existing;
        break;
      }
      case 'ammo': {
        const existing = (loc.ammoIds || []).filter((id) => id !== itemId);
        if (isTarget) existing.push(itemId);
        updated.ammoIds = existing;
        break;
      }
      case 'component': {
        const existing = (loc.componentIds || []).filter((id) => id !== itemId);
        if (isTarget) existing.push(itemId);
        updated.componentIds = existing;
        break;
      }
    }

    return updated;
  });
};

/**
 * Completely removes an item reference across all storage locations (e.g. when item is deleted).
 */
export const removeItemFromAllStorage = (
  type: StorageItemType,
  itemId: number,
  locations: StorageLocation[]
): StorageLocation[] => {
  return assignItemToStorage(type, itemId, null, locations);
};

/**
 * Persists updated storage locations to backend storage.
 */
export const saveStorageLocations = async (locations: StorageLocation[]): Promise<boolean> => {
  if (window.api && window.api.updateStorageLocation) {
    await Promise.all(
      locations
        .filter((loc) => typeof loc.id === 'number')
        .map((loc) => window.api.updateStorageLocation(loc.id!, loc))
    );
    return true;
  }
  return false;
};

/**
 * Returns clean theme colors for storage container types.
 */
export const getStorageTypeTheme = (type: string) => {
  switch (type) {
    case 'Safe':
      return {
        text: '#34d399',
        bg: 'rgba(52, 211, 153, 0.15)',
        border: 'rgba(52, 211, 153, 0.35)',
      };
    case 'Cabinet':
      return {
        text: '#60a5fa',
        bg: 'rgba(96, 165, 250, 0.15)',
        border: 'rgba(96, 165, 250, 0.35)',
      };
    case 'AmmoCan':
      return {
        text: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.35)',
      };
    case 'Case':
      return {
        text: '#a78bfa',
        bg: 'rgba(167, 139, 250, 0.15)',
        border: 'rgba(167, 139, 250, 0.35)',
      };
    case 'Vehicle':
      return {
        text: '#f87171',
        bg: 'rgba(248, 113, 113, 0.15)',
        border: 'rgba(248, 113, 113, 0.35)',
      };
    default:
      return {
        text: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.15)',
        border: 'rgba(148, 163, 184, 0.35)',
      };
  }
};

export interface StorageCapacityUtilization {
  mode: 'firearms' | 'ammo' | 'all';
  used: number;
  max: number | null;
  percent: number | null;
  unitLabel: string;
  isOverCapacity: boolean;
  totalItems: number;
  firearmsCount: number;
  accessoriesCount: number;
  ammoCount: number;
  componentsCount: number;
  summaryText: string;
}

/**
 * Calculates storage capacity utilization based on container type and configured capacity mode.
 * For Safes, Cabinets, Pistol Cases, and Vehicle Vaults, capacity defaults to Firearms/Guns Only
 * so accessories, ammo, and powders do not artificially consume primary firearm slots.
 */
export const getStorageCapacityUtilization = (
  location: StorageLocation,
  firearmsCount: number,
  accessoriesCount: number,
  ammoCount: number,
  componentsCount: number
): StorageCapacityUtilization => {
  let mode: 'firearms' | 'ammo' | 'all' = location.capacityMode || 'firearms';
  if (!location.capacityMode) {
    if (location.type === 'AmmoCan') {
      mode = 'ammo';
    } else if (location.type === 'Other') {
      mode = 'all';
    } else {
      mode = 'firearms';
    }
  }

  const totalItems = firearmsCount + accessoriesCount + ammoCount + componentsCount;
  let used = 0;
  let unitLabel = 'Guns';

  if (mode === 'firearms') {
    used = firearmsCount;
    unitLabel = location.type === 'Case' ? 'Firearms' : 'Guns';
  } else if (mode === 'ammo') {
    used = ammoCount;
    unitLabel = 'Ammo Lots';
  } else {
    used = totalItems;
    unitLabel = 'Items';
  }

  const max =
    typeof location.capacity === 'number' && location.capacity > 0 ? location.capacity : null;
  const percent = max !== null ? Math.min(100, Math.round((used / max) * 100)) : null;
  const isOverCapacity = max !== null && used > max;

  const parts: string[] = [];
  if (firearmsCount > 0) parts.push(`${firearmsCount} ${firearmsCount === 1 ? 'Gun' : 'Guns'}`);
  if (accessoriesCount > 0)
    parts.push(`${accessoriesCount} ${accessoriesCount === 1 ? 'Acc' : 'Accs'}`);
  if (ammoCount > 0) parts.push(`${ammoCount} Ammo`);
  if (componentsCount > 0)
    parts.push(`${componentsCount} ${componentsCount === 1 ? 'Powder' : 'Powders'}`);

  return {
    mode,
    used,
    max,
    percent,
    unitLabel,
    isOverCapacity,
    totalItems,
    firearmsCount,
    accessoriesCount,
    ammoCount,
    componentsCount,
    summaryText: parts.length > 0 ? parts.join(' • ') : 'Empty',
  };
};

/**
 * Parses a storage URI/code (from QR scan, typed input, or barcode)
 * and returns the numeric storage location ID if valid.
 *
 * Supported formats:
 * - armoryvault://storage/{id}
 * - armoryvault://location/{id}
 * - AV-STORAGE-{id}
 * - AV-LOCATION-{id}
 * - storage:{id} / location:{id}
 * - storage/{id} / location/{id}
 */
export const parseStorageUri = (input?: string | null): number | null => {
  if (!input || typeof input !== 'string') return null;
  const clean = input.trim();

  // Match armoryvault://storage/{id} or armoryvault://location/{id}
  const avMatch = clean.match(/^armoryvault:\/\/(?:storage|location)\/(\d+)$/i);
  if (avMatch) {
    const id = parseInt(avMatch[1], 10);
    return isNaN(id) ? null : id;
  }

  // Match AV-STORAGE-{id} or AV-LOCATION-{id}
  const avPrefixMatch = clean.match(/^AV-(?:STORAGE|LOCATION)-(\d+)$/i);
  if (avPrefixMatch) {
    const id = parseInt(avPrefixMatch[1], 10);
    return isNaN(id) ? null : id;
  }

  // Match storage:{id} or location:{id} or storage/{id} or location/{id}
  const simpleMatch = clean.match(/^(?:storage|location)[:/](\d+)$/i);
  if (simpleMatch) {
    const id = parseInt(simpleMatch[1], 10);
    return isNaN(id) ? null : id;
  }

  return null;
};
