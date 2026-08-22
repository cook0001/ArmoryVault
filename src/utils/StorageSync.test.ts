import { describe, expect, it } from 'vitest';
import { StorageLocation } from '../types';
import {
  assignItemToStorage,
  getItemStorageLocation,
  getStorageCapacityUtilization,
  getStorageTypeTheme,
  removeItemFromAllStorage,
} from './StorageSync';

describe('StorageSync Utility', () => {
  const mockLocations: StorageLocation[] = [
    {
      id: 1,
      name: 'Main Gun Safe',
      type: 'Safe',
      capacity: 20,
      firearmIds: [101, 102],
      accessoryIds: [201],
      ammoIds: [301],
      componentIds: [401],
    },
    {
      id: 2,
      name: 'Ammo Can Alpha',
      type: 'AmmoCan',
      capacity: 5,
      firearmIds: [],
      accessoryIds: [],
      ammoIds: [302],
      componentIds: [],
    },
  ];

  describe('getItemStorageLocation', () => {
    it('finds the storage location for a firearm', () => {
      const loc = getItemStorageLocation('firearm', 101, mockLocations);
      expect(loc).toBeDefined();
      expect(loc?.name).toBe('Main Gun Safe');
    });

    it('finds the storage location for an accessory', () => {
      const loc = getItemStorageLocation('accessory', 201, mockLocations);
      expect(loc).toBeDefined();
      expect(loc?.name).toBe('Main Gun Safe');
    });

    it('finds the storage location for ammo', () => {
      const loc = getItemStorageLocation('ammo', 302, mockLocations);
      expect(loc).toBeDefined();
      expect(loc?.name).toBe('Ammo Can Alpha');
    });

    it('finds the storage location for a component', () => {
      const loc = getItemStorageLocation('component', 401, mockLocations);
      expect(loc).toBeDefined();
      expect(loc?.name).toBe('Main Gun Safe');
    });

    it('returns undefined if item is unassigned or not found', () => {
      const loc = getItemStorageLocation('firearm', 999, mockLocations);
      expect(loc).toBeUndefined();
    });
  });

  describe('assignItemToStorage', () => {
    it('moves an item from one container to another', () => {
      // Move ammo 301 from Safe (1) to Ammo Can (2)
      const updated = assignItemToStorage('ammo', 301, 2, mockLocations);
      const safe = updated.find((l) => l.id === 1);
      const ammoCan = updated.find((l) => l.id === 2);

      expect(safe?.ammoIds).not.toContain(301);
      expect(ammoCan?.ammoIds).toContain(301);
    });

    it('assigns a newly added item', () => {
      const updated = assignItemToStorage('firearm', 105, 1, mockLocations);
      const safe = updated.find((l) => l.id === 1);
      expect(safe?.firearmIds).toContain(105);
    });

    it('unassigns an item when targetLocationId is null', () => {
      const updated = assignItemToStorage('firearm', 101, null, mockLocations);
      const safe = updated.find((l) => l.id === 1);
      expect(safe?.firearmIds).not.toContain(101);
    });
  });

  describe('removeItemFromAllStorage', () => {
    it('removes an item from all storage containers on item deletion', () => {
      const updated = removeItemFromAllStorage('accessory', 201, mockLocations);
      const safe = updated.find((l) => l.id === 1);
      expect(safe?.accessoryIds).not.toContain(201);
    });
  });

  describe('getStorageCapacityUtilization', () => {
    it('defaults to firearms/guns capacity for Safes and ignores auxiliary accessories/ammo in capacity percent', () => {
      const safe: StorageLocation = {
        name: 'Liberty Safe 24',
        type: 'Safe',
        capacity: 24,
      };

      // 4 firearms, 12 accessories, 10 ammo lots, 2 powders
      const result = getStorageCapacityUtilization(safe, 4, 12, 10, 2);

      expect(result.mode).toBe('firearms');
      expect(result.used).toBe(4);
      expect(result.max).toBe(24);
      expect(result.percent).toBe(17); // 4 / 24 = 16.6% -> 17%
      expect(result.unitLabel).toBe('Guns');
      expect(result.isOverCapacity).toBe(false);
      expect(result.totalItems).toBe(28);
      expect(result.summaryText).toBe('4 Guns • 12 Accs • 10 Ammo • 2 Powders');
    });

    it('defaults to ammo lots capacity for Ammo Cans', () => {
      const ammoCan: StorageLocation = {
        name: '50 Cal Ammo Can',
        type: 'AmmoCan',
        capacity: 10,
      };

      // 0 firearms, 0 accessories, 7 ammo boxes, 0 powders
      const result = getStorageCapacityUtilization(ammoCan, 0, 0, 7, 0);

      expect(result.mode).toBe('ammo');
      expect(result.used).toBe(7);
      expect(result.max).toBe(10);
      expect(result.percent).toBe(70);
      expect(result.unitLabel).toBe('Ammo Lots');
    });

    it('supports custom capacityMode = "all" to count all items together', () => {
      const gearLocker: StorageLocation = {
        name: 'Gear Locker',
        type: 'Cabinet',
        capacity: 50,
        capacityMode: 'all',
      };

      const result = getStorageCapacityUtilization(gearLocker, 2, 8, 10, 4);

      expect(result.mode).toBe('all');
      expect(result.used).toBe(24); // 2 + 8 + 10 + 4
      expect(result.max).toBe(50);
      expect(result.percent).toBe(48);
      expect(result.unitLabel).toBe('Items');
    });

    it('detects over-capacity when firearms exceed rated safe capacity', () => {
      const pistolCase: StorageLocation = {
        name: 'Pelican 2-Pistol Case',
        type: 'Case',
        capacity: 2,
      };

      const result = getStorageCapacityUtilization(pistolCase, 3, 2, 0, 0);

      expect(result.used).toBe(3);
      expect(result.max).toBe(2);
      expect(result.percent).toBe(100);
      expect(result.isOverCapacity).toBe(true);
      expect(result.unitLabel).toBe('Firearms');
    });
  });

  describe('getStorageTypeTheme', () => {
    it('returns theme colors for safe', () => {
      const theme = getStorageTypeTheme('Safe');
      expect(theme.text).toBe('#34d399');
      expect(theme.bg).toContain('rgba');
    });

    it('returns default fallback theme for unknown type', () => {
      const theme = getStorageTypeTheme('UnknownType' as any);
      expect(theme.text).toBe('#94a3b8');
    });
  });
});
