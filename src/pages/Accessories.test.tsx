/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Accessory, Firearm } from '../types';
import { Accessories } from './Accessories';

describe('Accessories Component & Tactical Detail Cards', () => {
  const mockFirearms: Firearm[] = [
    {
      id: 1,
      make: 'Glock',
      model: '19 Gen 5',
      serial_number: 'GLK12345',
      caliber: '9mm Luger',
      purchase_price: 550,
      purchase_date: '2023-01-15',
      condition: 'Excellent',
      image_path: '',
      is_sold: false,
    },
  ];

  const mockAccessories: Accessory[] = [
    {
      id: 101,
      type: 'Optic',
      manufacturer: 'Trijicon',
      model: 'RMR Type 2',
      magnification: '1x / 3.25 MOA',
      serialNumber: 'RMR998822',
      quantity: 1,
      round_count: 1250,
      value: 499.99,
      purchaseDate: '2023-04-10',
      notes: 'Zeroed at 25 yards with 124gr HST',
      mounts: [{ firearmId: 1, quantity: 1 }],
    },
    {
      id: 102,
      type: 'Suppressor',
      manufacturer: 'Dead Air',
      model: 'Sandman-S',
      ratedCalibers: 'Up to .300 Win Mag',
      is_nfa: true,
      nfa_type: 'Suppressor',
      registration_type: 'Trust',
      stamp_status: 'Approved',
      stamp_submitted_date: '2022-06-01',
      stamp_approved_date: '2023-02-15',
      quantity: 1,
      round_count: 3400,
      value: 849.0,
      mounts: [],
    },
  ];

  beforeEach(() => {
    window.api = {
      ...window.api,
      getAccessories: vi.fn().mockResolvedValue(mockAccessories),
      getFirearms: vi.fn().mockResolvedValue(mockFirearms),
      deleteAccessory: vi.fn().mockResolvedValue(true),
    } as any;
  });

  test('renders tactical cards with type badges, round telemetry, and specs', async () => {
    render(
      <MemoryRouter>
        <Accessories />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Accessories & Optics')).toBeDefined();
      expect(screen.getByText(/Trijicon RMR Type 2/i)).toBeDefined();
      expect(screen.getByText(/Dead Air Sandman-S/i)).toBeDefined();
    });

    // Check tactical spec chips and telemetry
    expect(screen.getByText(/1,250 rds/i)).toBeDefined();
    expect(screen.getByText(/3,400 rds/i)).toBeDefined();
    expect(screen.getByText(/1x \/ 3.25 MOA/i)).toBeDefined();
    expect(screen.getByText(/Up to \.300 Win Mag/i)).toBeDefined();
    expect(screen.getByText(/Glock 19 Gen 5/i)).toBeDefined();
  });

  test('opens AccessoryDetailModal when card or View Details is clicked', async () => {
    render(
      <MemoryRouter>
        <Accessories />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Trijicon RMR Type 2/i)).toBeDefined();
    });

    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Technical Specifications & Logistics')).toBeDefined();
      expect(screen.getByText('Magnification / Objective')).toBeDefined();
      expect(screen.getByText('RMR998822')).toBeDefined();
      expect(screen.getByText('Firearm Mounting Deployments')).toBeDefined();
      expect(screen.getByText('Zeroed at 25 yards with 124gr HST')).toBeDefined();
    });
  });

  test('displays NFA compliance details for suppressors in detail modal', async () => {
    render(
      <MemoryRouter>
        <Accessories />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dead Air Sandman-S/i)).toBeDefined();
    });

    const viewDetailsButtons = screen.getAllByText('View Details');
    // Second item is the Suppressor
    fireEvent.click(viewDetailsButtons[1]);

    await waitFor(() => {
      expect(screen.getByText('ATF / NFA Registration Details')).toBeDefined();
      expect(screen.getByText('Form 4 Submitted')).toBeDefined();
      expect(screen.getByText('2022-06-01')).toBeDefined();
      expect(screen.getByText('2023-02-15')).toBeDefined();
    });
  });
});
