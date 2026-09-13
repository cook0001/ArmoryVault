/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AccessoryModal } from './AccessoryModal';

describe('AccessoryModal Custom SKU Integration', () => {
  beforeEach(() => {
    window.api = {
      ...window.api,
      getSkus: vi.fn().mockResolvedValue({
        'APX-EXT-100': {
          category: 'accessory',
          accessoryType: 'Other',
          manufacturer: 'Apex Tactical',
          model: 'Failure Resistant Extractor',
          caliber: '9mm / Glock Gen 5',
          value: 59.95,
          notes: 'Melonite finish',
        },
      }),
      lookupUPC: vi.fn(),
      getAccessories: vi.fn().mockResolvedValue([]),
      addAccessory: vi.fn().mockResolvedValue(1),
      updateAccessory: vi.fn().mockResolvedValue(1),
      saveSkus: vi.fn().mockResolvedValue(true),
    } as any;
  });

  test('auto-fills accessory details when custom SKU is looked up', async () => {
    render(
      <MemoryRouter>
        <AccessoryModal
          isOpen={true}
          onClose={() => {}}
          onSave={() => {}}
          editingId={null}
          firearms={[]}
        />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Scan or type UPC...');
    fireEvent.change(input, { target: { value: 'APX-EXT-100' } });

    const lookupBtn = screen.getByText('Lookup');
    fireEvent.click(lookupBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Apex Tactical')).toBeDefined();
      expect(screen.getByDisplayValue('Failure Resistant Extractor')).toBeDefined();
      expect(screen.getByDisplayValue('59.95')).toBeDefined();
      expect(screen.getByText(/Custom SKU "APX-EXT-100" matched and loaded!/i)).toBeDefined();
    });
  });
});
