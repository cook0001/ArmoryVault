import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleProvider } from '../../modules/registry/ModuleContext';
import { ModulePromptView } from '../ModulePromptView';
import { ModuleCenterModal } from './ModuleCenterModal';

describe('ModuleCenterModal & ModulePromptView Component', () => {
  beforeEach(() => {
    localStorage.clear();
    (window as any).api = {
      getConfig: vi.fn().mockResolvedValue(['ballistics']),
      setConfig: vi.fn().mockResolvedValue(undefined),
      archiveModuleData: vi.fn().mockResolvedValue({
        success: true,
        totalRecords: 10,
      }),
      restoreModuleData: vi.fn().mockResolvedValue({
        success: true,
        restoredRecords: 10,
      }),
      getModuleArchives: vi.fn().mockResolvedValue({
        reloading: {
          moduleId: 'reloading',
          archivedAt: '2026-09-13T12:00:00.000Z',
          totalRecords: 10,
        },
      }),
      downloadModule: vi.fn().mockResolvedValue({
        success: true,
        moduleId: 'maintenance',
      }),
      deleteModuleFiles: vi.fn().mockResolvedValue({
        success: true,
      }),
      getInstalledDiskModules: vi.fn().mockResolvedValue(['ballistics']),
      checkRemoteModules: vi.fn().mockResolvedValue({
        success: true,
        source: 'remote',
        modules: [
          {
            id: 'reloading',
            name: 'Reloading Workbench',
            version: '1.0.0',
            description: 'Batch-level metallic reloading bench',
            category: 'bench',
            sizeKb: 24,
            downloadUrl:
              'https://github.com/cook0001/ArmoryVault-Modules/releases/download/v1.0.0/module-reloading.zip',
          },
          {
            id: 'maintenance',
            name: 'Armorer & Maintenance',
            version: '1.0.0',
            description: 'Firearm maintenance schedule',
            category: 'bench',
            sizeKb: 22,
            downloadUrl:
              'https://github.com/cook0001/ArmoryVault-Modules/releases/download/v1.0.0/module-maintenance.zip',
          },
        ],
      }),
      onModuleDownloadProgress: vi.fn().mockReturnValue(() => {}),
    };
  });

  it('renders ModuleCenterModal with module catalog and filters', async () => {
    const handleClose = vi.fn();

    render(
      <MemoryRouter>
        <ModuleProvider>
          <ModuleCenterModal isOpen={true} onClose={handleClose} />
        </ModuleProvider>
      </MemoryRouter>
    );

    // Check title and subtitle
    expect(await screen.findByText('Module Center')).toBeInTheDocument();
    expect(screen.getByText('Reloading Workbench')).toBeInTheDocument();
    expect(screen.getByText('Ballistics Calculator')).toBeInTheDocument();
    expect(screen.getByText('Armorer & Maintenance')).toBeInTheDocument();

    // Category chips
    expect(screen.getByRole('button', { name: 'all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'bench' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'range' })).toBeInTheDocument();

    // Filter by category
    fireEvent.click(screen.getByRole('button', { name: 'bench' }));
    expect(screen.getByText('Reloading Workbench')).toBeInTheDocument();
    expect(screen.queryByText('Ballistics Calculator')).not.toBeInTheDocument();
  });

  it('renders ModulePromptView fallback for uninstalled modules with safe actions', async () => {
    render(
      <MemoryRouter>
        <ModuleProvider>
          <ModulePromptView moduleId="reloading" featureName="Reloading Workbench" />
        </ModuleProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Module Required')).toBeInTheDocument();
    expect(screen.getByText('Reloading Workbench')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Install/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Module Center/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
  });

  it('displays download buttons with size estimates and confirms uninstallation with disk file deletion option', async () => {
    const handleClose = vi.fn();

    render(
      <MemoryRouter>
        <ModuleProvider>
          <ModuleCenterModal isOpen={true} onClose={handleClose} />
        </ModuleProvider>
      </MemoryRouter>
    );

    // Ballistics is installed
    expect(await screen.findByText('Ballistics Calculator')).toBeInTheDocument();
    expect(screen.getByText('Installed')).toBeInTheDocument();

    // Maintenance is not installed and not downloaded
    expect(screen.getByText('Armorer & Maintenance')).toBeInTheDocument();
    expect(screen.getByText(/Package size: ~22 KB/i)).toBeInTheDocument();
    const downloadBtn = screen.getByRole('button', { name: /Download & Install \(~22 KB\)/i });
    expect(downloadBtn).toBeInTheDocument();

    // Click download button
    fireEvent.click(downloadBtn);
    expect((window as any).api.downloadModule).toHaveBeenCalledWith('maintenance');

    // Test Uninstall modal for ballistics
    const uninstallBtn = screen.getByRole('button', { name: /Uninstall/i });
    fireEvent.click(uninstallBtn);

    expect(await screen.findByText('Uninstall Ballistics Calculator?')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox', {
      name: /Also delete downloaded module files from disk/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    // Check the box to also delete disk files
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Confirm uninstallation
    const confirmBtn = screen.getByRole('button', { name: /Confirm Uninstall & Archive/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect((window as any).api.archiveModuleData).toHaveBeenCalledWith(
        'ballistics',
        expect.any(Array)
      );
      expect((window as any).api.deleteModuleFiles).toHaveBeenCalledWith('ballistics');
    });
  });

  it('checks GitHub for remote modules and updates catalog metadata', async () => {
    const handleClose = vi.fn();

    render(
      <MemoryRouter>
        <ModuleProvider>
          <ModuleCenterModal isOpen={true} onClose={handleClose} />
        </ModuleProvider>
      </MemoryRouter>
    );

    const checkBtn = await screen.findByRole('button', { name: /Check for New Modules/i });
    expect(checkBtn).toBeInTheDocument();

    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect((window as any).api.checkRemoteModules).toHaveBeenCalled();
    });

    // Verify confirmation feedback toast and remote badge
    expect(
      await screen.findByText(
        'Checked GitHub (cook0001/ArmoryVault-Modules). Catalog is up to date!'
      )
    ).toBeInTheDocument();

    await waitFor(() => {
      const badges = screen.getAllByText('GitHub Release');
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});
