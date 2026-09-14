/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { RangePickerModal, ShootingRange } from './RangePickerModal';

describe('RangePickerModal Component', () => {
  beforeEach(() => {
    window.api = {
      ...window.api,
      lookupRanges: vi.fn().mockResolvedValue({
        success: true,
        count: 1,
        source: 'local_database',
        data: [
          {
            id: 1,
            name: 'Eagle Eye Precision Shooting Complex',
            trade_name: 'Eagle Eye Range',
            range_type: 'Outdoor 1000yd / Tactical Bays',
            street: '8820 Marksman Rd',
            city: 'Dallas',
            state: 'TX',
            zip: '75201',
            phone: '(214) 555-0812',
            lane_fee: 20,
            is_public: 1,
          },
        ],
      }),
    } as any;
  });

  test('renders modal, loads ranges, and selects a range facility', async () => {
    const onSelectMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <RangePickerModal
        isOpen={true}
        onClose={onCloseMock}
        onSelect={onSelectMock}
        initialZip="75201"
      />
    );

    expect(screen.getByText('Shooting Range Directory')).toBeDefined();

    // Wait for mock ranges to load
    await waitFor(() => {
      expect(screen.getByText('Eagle Eye Precision Shooting Complex')).toBeDefined();
    });

    expect(screen.getByText(/Outdoor 1000yd \/ Tactical Bays/i)).toBeDefined();
    expect(screen.getByText(/Public Access/i)).toBeDefined();

    // Click "Select Range"
    const selectButtons = screen.getAllByText('Select Range');
    fireEvent.click(selectButtons[0]);

    expect(onSelectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Eagle Eye Precision Shooting Complex',
        city: 'Dallas',
      })
    );
    expect(onCloseMock).toHaveBeenCalled();
  });
});
