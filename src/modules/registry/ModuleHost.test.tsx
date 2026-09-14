import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleProvider } from './ModuleContext';
import { ModuleErrorBoundary, ModuleHost } from './ModuleHost';

describe('ModuleHost Runtime Dynamic Loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).api = {
      getConfig: vi.fn().mockResolvedValue(['optics', 'ballistics']),
      setConfig: vi.fn().mockResolvedValue(true),
      getInstalledDiskModules: vi.fn().mockResolvedValue(['optics', 'ballistics']),
      getModuleArchives: vi.fn().mockResolvedValue({}),
      checkRemoteModules: vi.fn().mockResolvedValue({
        success: true,
        modules: {
          optics: {
            id: 'optics',
            name: 'Optics & Zero Vault',
            version: '1.0.0',
            entry: 'module.bundle.js',
          },
        },
      }),
      getModuleBundle: vi.fn(),
    };
  });

  it('renders not-installed screen when module is not installed', async () => {
    (window as any).api.getConfig.mockResolvedValue([]);

    render(
      <ModuleProvider>
        <MemoryRouter initialEntries={['/modules/custom-mod']}>
          <Routes>
            <Route path="/modules/:moduleId" element={<ModuleHost />} />
          </Routes>
        </MemoryRouter>
      </ModuleProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Not Installed/i)).toBeInTheDocument();
      expect(screen.getByText(/Install in Module Center/i)).toBeInTheDocument();
    });
  });

  it('catches and isolates errors via ModuleErrorBoundary', () => {
    const ProblemChild = () => {
      throw new Error('Simulated optical calibration crash');
    };

    const onRetry = vi.fn();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ModuleErrorBoundary moduleId="broken-mod" moduleName="Broken Extension" onRetry={onRetry}>
        <ProblemChild />
      </ModuleErrorBoundary>
    );

    expect(screen.getByText(/Module Runtime Exception/i)).toBeInTheDocument();
    expect(screen.getByText(/Simulated optical calibration crash/i)).toBeInTheDocument();
    expect(screen.getByText(/Reload Module/i)).toBeInTheDocument();

    spy.mockRestore();
  });

  it('executes dynamic bundle returned by getModuleBundle', async () => {
    // Provide bundle code that assigns to ArmoryModule_optics
    const mockBundleCode = `
      window.ArmoryModule_optics = {
        default: function MockOpticsDashboard() {
          return React.createElement('div', { 'data-testid': 'mock-optics-ui' }, 'Optics Registry Live Test');
        }
      };
    `;

    (window as any).api.getModuleBundle.mockResolvedValue({
      success: true,
      moduleId: 'optics',
      manifest: { id: 'optics', name: 'Optics & Zero Vault', version: '1.0.0' },
      hasBundle: true,
      jsCode: mockBundleCode,
    });

    render(
      <ModuleProvider>
        <MemoryRouter initialEntries={['/modules/optics']}>
          <Routes>
            <Route path="/modules/:moduleId" element={<ModuleHost />} />
          </Routes>
        </MemoryRouter>
      </ModuleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-optics-ui')).toBeInTheDocument();
      expect(screen.getByText('Optics Registry Live Test')).toBeInTheDocument();
    });
  });
});
