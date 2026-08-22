/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Ammo } from '../types';
import { getBarcodeLabelType, isShotgunAmmo, isUpcBarcode } from '../utils/caliberHelpers';
import { AmmoCanLabelModal } from './AmmoCanLabelModal';

// Mock qrcode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockQRDataUrl'),
  },
}));

describe('UPC vs SKU Barcode Checker', () => {
  it('should identify standard numeric retail barcodes as UPC', () => {
    // Standard 12-digit UPC-A
    expect(isUpcBarcode('020825021234')).toBe(true);
    expect(getBarcodeLabelType('020825021234')).toBe('UPC');

    // Standard 13-digit EAN-13
    expect(isUpcBarcode('5012345678900')).toBe(true);
    expect(getBarcodeLabelType('5012345678900')).toBe('UPC');

    // Standard 8-digit UPC-E / EAN-8
    expect(isUpcBarcode('01234565')).toBe(true);
    expect(getBarcodeLabelType('01234565')).toBe('UPC');

    // Standard 14-digit GTIN-14
    expect(isUpcBarcode('10012345678902')).toBe(true);
    expect(getBarcodeLabelType('10012345678902')).toBe('UPC');
  });

  it('should identify alphanumeric, store, and manufacturer codes as SKU', () => {
    expect(isUpcBarcode('FED-AE9MM')).toBe(false);
    expect(getBarcodeLabelType('FED-AE9MM')).toBe('SKU');

    expect(isUpcBarcode('WIN-AA128')).toBe(false);
    expect(getBarcodeLabelType('WIN-AA128')).toBe('SKU');

    expect(isUpcBarcode('CCI-500')).toBe(false);
    expect(getBarcodeLabelType('CCI-500')).toBe('SKU');

    expect(isUpcBarcode('HODG-VAR-1')).toBe(false);
    expect(getBarcodeLabelType('HODG-VAR-1')).toBe('SKU');

    // Non-standard length numeric codes
    expect(isUpcBarcode('12345')).toBe(false);
    expect(getBarcodeLabelType('12345')).toBe('SKU');

    expect(isUpcBarcode('991823')).toBe(false);
    expect(getBarcodeLabelType('991823')).toBe('SKU');
  });

  it('should identify shotgun ammo calibers and categories correctly', () => {
    expect(isShotgunAmmo({ caliber: '12 Gauge' })).toBe(true);
    expect(isShotgunAmmo({ caliber: '20 Gauge' })).toBe(true);
    expect(isShotgunAmmo({ caliber: '16 ga' })).toBe(true);
    expect(isShotgunAmmo({ caliber: '28 GA' })).toBe(true);
    expect(isShotgunAmmo({ caliber: '.410 Bore' })).toBe(true);
    expect(isShotgunAmmo({ caliber: '410 Gauge' })).toBe(true);
    expect(isShotgunAmmo({ category: 'Shotgun', caliber: 'Special Load' })).toBe(true);

    expect(isShotgunAmmo({ caliber: '9mm Luger' })).toBe(false);
    expect(isShotgunAmmo({ caliber: '.45 ACP' })).toBe(false);
    expect(isShotgunAmmo({ caliber: '5.56x45mm NATO' })).toBe(false);
    expect(isShotgunAmmo({ caliber: '.308 Winchester' })).toBe(false);
  });
});

describe('AmmoCanLabelModal Component', () => {
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dedicated Shotgun Shell specs (Shell Length, Shot Size, Pellet Count) and SKU label', async () => {
    const shotgunAmmo: Ammo = {
      id: 101,
      caliber: '12 Gauge',
      category: 'Shotgun',
      type: 'factory',
      count: 250,
      manufacturer: 'Winchester',
      shell_length: '2 3/4"',
      shot_size: '00 Buck',
      pellet_count: 9,
      oz_payload: '1 1/8 oz',
      upc_code: 'WIN-AA12-00', // Alphanumeric SKU
    };

    render(<AmmoCanLabelModal isOpen={true} onClose={onCloseMock} ammo={shotgunAmmo} />);

    // Verify header
    expect(screen.getByText('12 Gauge')).toBeDefined();
    expect(screen.getByText('Winchester')).toBeDefined();

    // Verify Shotgun-specific rows are rendered
    expect(screen.getByText(/SHELL LENGTH:/i)).toBeDefined();
    expect(screen.getByText('2 3/4"')).toBeDefined();

    expect(screen.getByText(/SHOT SIZE:/i)).toBeDefined();
    expect(screen.getByText('00 Buck')).toBeDefined();

    expect(screen.getByText(/PELLET COUNT:/i)).toBeDefined();
    expect(screen.getByText(/9 Pellets/i)).toBeDefined();

    // Verify BULLET: is NOT rendered for shotgun shells
    expect(screen.queryByText(/BULLET:/i)).toBeNull();

    // Verify SKU label is rendered instead of UPC
    expect(screen.getByText(/SKU:/i)).toBeDefined();
    expect(screen.getByText('WIN-AA12-00')).toBeDefined();
    expect(screen.queryByText(/UPC:/i)).toBeNull();
  });

  it('renders standard Cartridge projectile specs (Bullet grain & type) and UPC label', async () => {
    const cartridgeAmmo: Ammo = {
      id: 102,
      caliber: '9mm Luger',
      category: 'Pistol',
      type: 'factory',
      count: 500,
      manufacturer: 'Federal',
      grain: 124,
      projectile: 'HST JHP',
      upc_code: '029465063801', // 12-digit standard UPC-A
    };

    render(<AmmoCanLabelModal isOpen={true} onClose={onCloseMock} ammo={cartridgeAmmo} />);

    // Verify header
    expect(screen.getByText('9mm Luger')).toBeDefined();
    expect(screen.getByText('Federal')).toBeDefined();

    // Verify Bullet row is rendered for cartridges
    expect(screen.getByText(/BULLET:/i)).toBeDefined();
    expect(screen.getByText(/124gr HST JHP/i)).toBeDefined();

    // Verify Shotgun fields are NOT rendered
    expect(screen.queryByText(/SHELL LENGTH:/i)).toBeNull();
    expect(screen.queryByText(/SHOT SIZE:/i)).toBeNull();
    expect(screen.queryByText(/PELLET COUNT:/i)).toBeNull();

    // Verify UPC label is rendered
    expect(screen.getByText(/UPC:/i)).toBeDefined();
    expect(screen.getByText('029465063801')).toBeDefined();
    expect(screen.queryByText(/SKU:/i)).toBeNull();
  });
});
