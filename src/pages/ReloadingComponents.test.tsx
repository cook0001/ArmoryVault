/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ReloadingComponent } from '../types';
import { ReloadingComponents } from './ReloadingComponents';

describe('ReloadingComponents Powder Multi-Unit Telemetry', () => {
  const mockComponents: ReloadingComponent[] = [
    {
      id: 1,
      type: 'Powder',
      manufacturer: 'Hodgdon',
      name: 'Varget',
      quantity: 1.5,
      weightUnit: 'lbs',
      cost: 65.0,
      usageTags: ['Rifle'],
    },
    {
      id: 2,
      type: 'Powder',
      manufacturer: 'Alliant',
      name: 'Sport Pistol',
      quantity: 8,
      weightUnit: 'oz',
      cost: 28.0,
      usageTags: ['Pistol'],
    },
  ];

  beforeEach(() => {
    window.api = {
      ...window.api,
      getComponents: vi.fn().mockResolvedValue(mockComponents),
      deleteComponent: vi.fn().mockResolvedValue(true),
    } as any;
  });

  test('displays multi-unit weight breakdown on powder cards', async () => {
    render(
      <MemoryRouter>
        <ReloadingComponents />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Reloading Supplies')).toBeDefined();
      expect(screen.getByText(/Hodgdon Varget/i)).toBeDefined();
    });

    // 1.5 lbs = 24 oz = 10,500 gr
    expect(screen.getByText(/1.5 lbs • 24 oz • 10,500 gr/i)).toBeDefined();

    // 8 oz = 0.5 lbs = 3,500 gr
    expect(screen.getByText(/0.5 lbs • 8 oz • 3,500 gr/i)).toBeDefined();

    // Header total powder: 1.5 lbs + 0.5 lbs = 2.0 lbs (32 oz / 14,000 gr)
    expect(screen.getByText('Total Powder in Stock')).toBeDefined();
    expect(screen.getByText(/2 lbs/i)).toBeDefined();
    expect(screen.getByText(/32 oz \/ 14,000 gr/i)).toBeDefined();
  });
});
