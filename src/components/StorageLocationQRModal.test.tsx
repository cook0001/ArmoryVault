/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageLocation } from '../types';
import { parseStorageUri } from '../utils/BarcodeEngine';
import { StorageLocationQRModal } from './StorageLocationQRModal';

// Mock qrcode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockStorageQRDataUrl'),
  },
}));

describe('parseStorageUri Helper', () => {
  it('should parse valid armoryvault://storage/{id} deep link URIs', () => {
    expect(parseStorageUri('armoryvault://storage/12')).toBe(12);
    expect(parseStorageUri('armoryvault://storage/1')).toBe(1);
    expect(parseStorageUri('armoryvault://location/99')).toBe(99);
  });

  it('should parse storage shorthand prefixes like storage:5 or location/7', () => {
    expect(parseStorageUri('storage:5')).toBe(5);
    expect(parseStorageUri('storage/42')).toBe(42);
    expect(parseStorageUri('location:101')).toBe(101);
  });

  it('should return null for invalid or non-storage codes', () => {
    expect(parseStorageUri('029465063801')).toBeNull();
    expect(parseStorageUri('armoryvault://firearm/12')).toBeNull();
    expect(parseStorageUri('armoryvault://ammo/4')).toBeNull();
    expect(parseStorageUri('')).toBeNull();
    expect(parseStorageUri(null)).toBeNull();
  });
});

describe('StorageLocationQRModal Component', () => {
  const onCloseMock = vi.fn();
  const mockLocation: StorageLocation = {
    id: 42,
    name: 'Liberty Safe 24-Gun',
    type: 'Safe',
    capacity: 24,
    notes: 'Master combination in backup vault',
    firearmIds: [1, 2],
    accessoryIds: [10],
    ammoIds: [20],
    componentIds: [30],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).api = {
      printQRLabel: vi.fn().mockResolvedValue(true),
      saveQRImage: vi.fn().mockResolvedValue(true),
    };
  });

  it('renders the storage container name, type tag, and capacity on the label', async () => {
    render(
      <StorageLocationQRModal
        isOpen={true}
        onClose={onCloseMock}
        location={mockLocation}
        itemCount={5}
      />
    );

    // Verify storage name is prominently displayed
    expect(screen.getByText('Liberty Safe 24-Gun')).toBeDefined();

    // Verify container type
    expect(screen.getByText(/Safe Container/i)).toBeDefined();

    // Verify capacity readout (tracks 2 firearms in a 24-gun safe)
    expect(screen.getByText(/2 \/ 24 Guns/i)).toBeDefined();

    // Verify ID metadata
    expect(screen.getByText(/ID: #42/i)).toBeDefined();

    // Verify deep link URI is shown
    expect(screen.getByText('armoryvault://storage/42')).toBeDefined();
  });

  it('invokes window.api.printQRLabel with formatted location details when printing', async () => {
    render(
      <StorageLocationQRModal
        isOpen={true}
        onClose={onCloseMock}
        location={mockLocation}
        itemCount={5}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Print Physical Label')).toBeDefined();
    });

    const printBtn = screen.getByText('Print Physical Label');
    fireEvent.click(printBtn);

    await waitFor(() => {
      expect((window as any).api.printQRLabel).toHaveBeenCalledWith(
        expect.objectContaining({
          itemName: 'Liberty Safe 24-Gun',
          itemDetails: expect.stringContaining('[Safe] Storage Container'),
          qrDataUrl: 'data:image/png;base64,mockStorageQRDataUrl',
        })
      );
    });
  });

  it('invokes window.api.saveQRImage when exporting PNG', async () => {
    render(
      <StorageLocationQRModal
        isOpen={true}
        onClose={onCloseMock}
        location={mockLocation}
        itemCount={5}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Save PNG')).toBeDefined();
    });

    const saveBtn = screen.getByText('Save PNG');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect((window as any).api.saveQRImage).toHaveBeenCalledWith(
        expect.objectContaining({
          itemName: 'Liberty_Safe_24_Gun_Storage_QR',
          qrDataUrl: 'data:image/png;base64,mockStorageQRDataUrl',
        })
      );
    });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <StorageLocationQRModal
        isOpen={false}
        onClose={onCloseMock}
        location={mockLocation}
        itemCount={5}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
