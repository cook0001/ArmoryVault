/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import { Dashboard } from './Dashboard';

describe('Dashboard Component', () => {
  test('renders dashboard heading', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Inventory Dashboard')).toBeDefined();
    });
  });

  test('loads and displays firearms from mock API', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the mock data to appear
    await waitFor(() => {
      expect(screen.getByText('Glock')).toBeDefined();
      expect(screen.getByText('19 Gen 5')).toBeDefined();
      expect(screen.getByText('GLK12345')).toBeDefined();
    });
  });

  test('renders Storage & Physical Security Overview and container badge on firearm card', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Storage & Physical Security Overview')).toBeDefined();
      expect(screen.getAllByText('Liberty Safe').length).toBeGreaterThan(0);
      expect(screen.getByText('Valuations Visible')).toBeDefined();
    });
  });
});
