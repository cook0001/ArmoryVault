/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { FflDealer, FflPickerModal } from './FflPickerModal';

describe('FflPickerModal Component', () => {
  beforeEach(() => {
    window.api = {
      ...window.api,
      lookupFFL: vi.fn().mockResolvedValue({
        success: true,
        count: 1,
        source: 'cloud_api',
        data: [
          {
            id: 1,
            license_num: '1-54-001-01-4A-12345',
            business_name: 'Apex Tactical & Armory LLC',
            trade_name: 'Apex Armory',
            street: '1004 Tactical Way',
            city: 'Dallas',
            state: 'TX',
            zip: '75201',
            phone: '(214) 555-0199',
            standard_fee: 25,
          },
        ],
      }),
    } as any;
  });

  test('renders modal, loads dealers, and selects an FFL', async () => {
    const onSelectMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <FflPickerModal
        isOpen={true}
        onClose={onCloseMock}
        onSelect={onSelectMock}
        initialZip="75201"
      />
    );

    expect(screen.getByText('ATF Licensed FFL Directory')).toBeDefined();

    // Wait for mock FFL dealers to load
    await waitFor(() => {
      expect(screen.getByText('Apex Tactical & Armory LLC')).toBeDefined();
    });

    expect(screen.getByText(/DBA: Apex Armory/i)).toBeDefined();
    expect(screen.getByText(/1-54-001-01-4A-12345/i)).toBeDefined();
    expect(screen.getByText(/Source: ArmsTrader Network/i)).toBeDefined();

    // Click "Select FFL"
    const selectButtons = screen.getAllByText('Select FFL');
    fireEvent.click(selectButtons[0]);

    expect(onSelectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        business_name: 'Apex Tactical & Armory LLC',
        license_num: '1-54-001-01-4A-12345',
      })
    );
    expect(onCloseMock).toHaveBeenCalled();
  });
});
