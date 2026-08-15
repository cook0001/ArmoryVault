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
    addFirearm: vi.fn().mockResolvedValue(2),
    updateFirearm: vi.fn().mockResolvedValue(1),
    deleteFirearm: vi.fn().mockResolvedValue(1),
    savePhoto: vi.fn().mockResolvedValue('/path/to/mock_photo.jpg'),
  };
};
