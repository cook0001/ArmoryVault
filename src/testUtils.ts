import { vi } from 'vitest';
import { Firearm } from './types';

export const mockWindowApi = () => {
  const mockFirearms: Firearm[] = [
    {
      id: 1,
      make: 'Glock',
      model: '19 Gen 5',
      serial_number: 'GLK12345',
      caliber: '9mm',
      barrel_length: '4.02"',
      action_type: 'Striker Fired',
      notes: '',
      purchase_price: 550,
      purchase_date: '2023-01-15',
      condition: 'Excellent',
      image_path: '',
      is_sold: false,
      sold_to_name: '',
      sold_date: '',
      sold_price: null,
      sale_notes: '',
    },
  ];

  window.api = {
    getFirearms: vi.fn().mockResolvedValue(mockFirearms),
    lockVault: vi.fn().mockResolvedValue(undefined),
    addFirearm: vi.fn().mockResolvedValue(2),
    updateFirearm: vi.fn().mockResolvedValue(1),
    deleteFirearm: vi.fn().mockResolvedValue(1),
    logRangeSession: vi
      .fn()
      .mockResolvedValue({ success: true, firearm_rounds: 50, ammo_remaining: 150 }),
    completeMaintenanceTask: vi.fn().mockResolvedValue(true),
    savePhoto: vi.fn().mockResolvedValue('/path/to/mock_photo.jpg'),
    getAmmo: vi.fn().mockResolvedValue([]),
    getAccessories: vi.fn().mockResolvedValue([]),
    getComponents: vi.fn().mockResolvedValue([]),
    getSkus: vi.fn().mockResolvedValue({}),
    getConfig: vi.fn().mockResolvedValue(null),
    setConfig: vi.fn().mockResolvedValue(undefined),
    getBackupFolder: vi.fn().mockResolvedValue(null),
    restoreBackup: vi.fn().mockResolvedValue({ success: true }),
    getSyncQueue: vi.fn().mockResolvedValue([]),
    onSyncReceived: vi.fn().mockReturnValue(() => {}),
    onDevicePaired: vi.fn().mockReturnValue(() => {}),
    onUpdateMessage: vi.fn().mockReturnValue(() => {}),
    getPlatform: vi.fn().mockReturnValue('browser'),
    selectAndSavePhoto: vi.fn().mockResolvedValue(null),
    exportData: vi.fn().mockResolvedValue('test.csv'),
  } as any;
};
