/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Accessory, Ammo, Firearm, ReloadingComponent, StorageLocation } from '../types';
import { StorageOrganizer } from './StorageOrganizer';

// Mock qrcode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockStorageQRDataUrl'),
  },
}));

describe('StorageOrganizer Component', () => {
  const mockLocations: StorageLocation[] = [
    {
      id: 1,
      name: 'Main Gun Safe',
      type: 'Safe',
      capacity: 24,
      notes: 'Master vault in basement',
      firearmIds: [1],
      accessoryIds: [101],
      ammoIds: [201],
      componentIds: [301],
    },
    {
      id: 2,
      name: 'Range Ammo Can Alpha',
      type: 'AmmoCan',
      capacity: 10,
      notes: '9mm range ammo',
      firearmIds: [],
      accessoryIds: [],
      ammoIds: [],
      componentIds: [],
    },
  ];

  const mockFirearms: Firearm[] = [
    {
      id: 1,
      make: 'Glock',
      model: '19 Gen 5',
      caliber: '9mm Luger',
      serial_number: 'GLK9911',
    },
    {
      id: 2,
      make: 'Colt',
      model: 'Python',
      caliber: '.357 Magnum',
      serial_number: 'CP7788',
    },
  ];

  const mockAccessories: Accessory[] = [
    {
      id: 101,
      type: 'Optic',
      manufacturer: 'Trijicon',
      model: 'RMR Type 2',
      sku: 'TRI-RMR-06',
    },
  ];

  const mockAmmo: Ammo[] = [
    {
      id: 201,
      manufacturer: 'Federal',
      caliber: '9mm Luger',
      count: 500,
      upc_code: '029465063801',
    },
  ];

  const mockComponents: ReloadingComponent[] = [
    {
      id: 301,
      type: 'Powder',
      manufacturer: 'Hodgdon',
      name: 'Varget',
      quantity: 8,
      weightUnit: 'lbs',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).api = {
      getStorageLocations: vi.fn().mockResolvedValue(mockLocations),
      getFirearms: vi.fn().mockResolvedValue(mockFirearms),
      getAccessories: vi.fn().mockResolvedValue(mockAccessories),
      getAmmo: vi.fn().mockResolvedValue(mockAmmo),
      getComponents: vi.fn().mockResolvedValue(mockComponents),
      updateStorageLocation: vi.fn().mockResolvedValue(true),
      addStorageLocation: vi.fn().mockResolvedValue({ id: 3 }),
      deleteStorageLocation: vi.fn().mockResolvedValue(true),
      getConfig: vi.fn().mockResolvedValue(true),
      setConfig: vi.fn().mockResolvedValue(true),
      printQRLabel: vi.fn().mockResolvedValue(true),
      saveQRImage: vi.fn().mockResolvedValue(true),
    };
  });

  it('renders all storage locations with quick-look breakdown and QR code triggers', async () => {
    render(<StorageOrganizer />);

    await waitFor(() => {
      expect(screen.getByText('Main Gun Safe')).toBeDefined();
      expect(screen.getByText('Range Ammo Can Alpha')).toBeDefined();
    });

    // Check search/scanner input is rendered
    const searchInput = screen.getByPlaceholderText(/Scan storage QR/i);
    expect(searchInput).toBeDefined();

    // Verify QR code buttons exist on cards
    const qrButtons = screen.getAllByTitle('Generate & Print Storage QR Code');
    expect(qrButtons.length).toBe(2);

    // Open QR Code Modal for location 1
    fireEvent.click(qrButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Storage Location QR Label')).toBeDefined();
      expect(screen.getByText('armoryvault://storage/1')).toBeDefined();
    });
  });

  it('filters locations when searching or scanning container ID', async () => {
    render(<StorageOrganizer />);

    await waitFor(() => {
      expect(screen.getByText('Main Gun Safe')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(/Scan storage QR/i);
    fireEvent.change(searchInput, { target: { value: 'Ammo Can' } });

    expect(screen.getByText('Range Ammo Can Alpha')).toBeDefined();
    expect(screen.queryByText('Main Gun Safe')).toBeNull();
  });

  it('opens location details when card is clicked and displays assigned items', async () => {
    render(<StorageOrganizer />);

    await waitFor(() => {
      expect(screen.getByTestId('storage-card-1')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('storage-card-1'));

    await waitFor(() => {
      expect(screen.getByText(/Assigned Firearms/i)).toBeDefined();
      expect(screen.getByText(/Assigned Reloading Supplies/i)).toBeDefined();
      expect(screen.getByText(/Varget/i)).toBeDefined();
    });
  });

  it('automatically opens location details when scanning armoryvault://storage/1 into search', async () => {
    render(<StorageOrganizer />);

    await waitFor(() => {
      expect(screen.getByText('Main Gun Safe')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(/Scan storage QR/i);
    fireEvent.change(searchInput, { target: { value: 'armoryvault://storage/1' } });

    await waitFor(() => {
      expect(screen.getByText(/Assigned Firearms/i)).toBeDefined();
      expect(screen.getByText(/Assigned Reloading Supplies/i)).toBeDefined();
      expect(screen.getByText(/Varget/i)).toBeDefined();
    });
  });
});
