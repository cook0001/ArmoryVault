import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleProvider } from '../modules/registry/ModuleContext';
import { SyncItem } from '../types';
import { SyncInbox } from './SyncInbox';

describe('SyncInbox Uninstalled Module Safety & Fallback', () => {
  const mockSyncQueue: SyncItem[] = [
    {
      id: 101,
      type: 'component_adjustment',
      upcOrId: '039880010014',
      action: 'add',
      count: 500,
      timestamp: Date.now(),
    },
    {
      id: 102,
      type: 'ammo_adjustment',
      upcOrId: '020892013504',
      action: 'add',
      count: 100,
      timestamp: Date.now(),
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    // Simulate Reloading module NOT installed, but ballistics is
    (window as any).api = {
      getConfig: vi.fn().mockResolvedValue(['ballistics']),
      setConfig: vi.fn().mockResolvedValue(undefined),
      getSyncQueue: vi.fn().mockResolvedValue(mockSyncQueue),
      getAmmo: vi.fn().mockResolvedValue([]),
      getFirearms: vi.fn().mockResolvedValue([]),
      getComponents: vi.fn().mockResolvedValue([]),
      getAccessories: vi.fn().mockResolvedValue([]),
      getSkus: vi.fn().mockResolvedValue({}),
      getLocalIp: vi.fn().mockResolvedValue('192.168.1.100'),
      onSyncReceived: vi.fn().mockReturnValue(() => {}),
      onDevicePaired: vi.fn().mockReturnValue(() => {}),
      removeSyncItem: vi.fn().mockResolvedValue(true),
      getModuleArchives: vi.fn().mockResolvedValue({}),
    };
  });

  it('renders a safe fallback card without crashing or showing null when a component sync arrives for uninstalled reloading module', async () => {
    render(
      <MemoryRouter>
        <ModuleProvider>
          <SyncInbox />
        </ModuleProvider>
      </MemoryRouter>
    );

    // Wait for the sync inbox to load items
    expect(await screen.findByText('Reloading Workbench Module Required')).toBeInTheDocument();
    expect(screen.getByText(/Mobile companion logged an adjustment for/i)).toBeInTheDocument();
    expect(screen.getByText('039880010014')).toBeInTheDocument();

    // Verify fallback buttons are present
    expect(screen.getByRole('button', { name: /Install Module/i })).toBeInTheDocument();
    expect(screen.getByTitle('Discard')).toBeInTheDocument();
  });

  it('skips uninstalled module sync items in handleApproveAll without crashing or throwing errors', async () => {
    window.confirm = vi.fn().mockReturnValue(true);

    render(
      <MemoryRouter>
        <ModuleProvider>
          <SyncInbox />
        </ModuleProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Reloading Workbench Module Required')).toBeInTheDocument();

    // Click "Approve All Recognized" if button exists
    const approveAllBtn = screen.queryByText(/Approve All/i);
    if (approveAllBtn) {
      fireEvent.click(approveAllBtn);
    }

    // App continues running without throwing any unhandled exceptions
    expect(screen.getByText('Reloading Workbench Module Required')).toBeInTheDocument();
  });
});
