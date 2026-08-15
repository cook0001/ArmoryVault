import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { expect, test, describe } from 'vitest';

describe('Dashboard Component', () => {
  test('renders dashboard heading', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Inventory Dashboard')).toBeInTheDocument();
  });

  test('loads and displays firearms from mock API', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the mock data to appear
    await waitFor(() => {
      expect(screen.getByText('Glock')).toBeInTheDocument();
      expect(screen.getByText('19 Gen 5')).toBeInTheDocument();
      expect(screen.getByText('GLK12345')).toBeInTheDocument();
    });
  });
});
