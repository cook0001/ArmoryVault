/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CsvImportModal } from './CsvImportModal';

describe('CsvImportModal Component', () => {
  beforeEach(() => {
    window.api = {
      ...window.api,
      getFirearms: vi.fn().mockResolvedValue([]),
      getAmmo: vi.fn().mockResolvedValue([]),
      getComponents: vi.fn().mockResolvedValue([]),
      getAccessories: vi.fn().mockResolvedValue([]),
      importFirearmsBatch: vi.fn().mockResolvedValue({ insertedCount: 1, updatedCount: 0 }),
      importAmmoBatch: vi.fn().mockResolvedValue({ insertedCount: 1, updatedCount: 0 }),
      importComponentsBatch: vi.fn().mockResolvedValue({ insertedCount: 1 }),
      importAccessoriesBatch: vi.fn().mockResolvedValue({ insertedCount: 1 }),
      selectCSVFile: vi.fn().mockResolvedValue({
        name: 'test_guns.csv',
        path: '/mock/test_guns.csv',
        content: 'Manufacturer,Model,Serial,Caliber,Cost\nBeretta,92FS,BER12345,9mm,$650.00',
      }),
    } as any;
  });

  test('renders step 1 when open and triggers native file picker on browse', async () => {
    const onClose = vi.fn();
    render(<CsvImportModal isOpen={true} onClose={onClose} />);

    expect(screen.getByText('Import Inventory from CSV')).toBeInTheDocument();
    expect(screen.getByText('Drop your CSV or TSV file here')).toBeInTheDocument();

    const browseBtn = screen.getByText('Browse File...');
    fireEvent.click(browseBtn);

    await waitFor(() => {
      expect(window.api.selectCSVFile).toHaveBeenCalled();
    });

    // Should transition to step 2
    await waitFor(() => {
      expect(
        screen.getByText('Column Mapping (CSV Header → ArmoryVault Field)')
      ).toBeInTheDocument();
      expect(screen.getByText('Beretta')).toBeInTheDocument();
      expect(screen.getByText('92FS')).toBeInTheDocument();
      expect(screen.getByText('BER12345')).toBeInTheDocument();
    });
  });

  test('executes batch import and transitions to complete step', async () => {
    const onClose = vi.fn();
    const onComplete = vi.fn();

    render(<CsvImportModal isOpen={true} onClose={onClose} onImportComplete={onComplete} />);

    fireEvent.click(screen.getByText('Browse File...'));

    await waitFor(() => {
      expect(screen.getByText('Import 1 Records')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Import 1 Records'));

    await waitFor(() => {
      expect(window.api.importFirearmsBatch).toHaveBeenCalled();
      expect(screen.getByText('Import Completed Successfully!')).toBeInTheDocument();
    });

    const doneBtn = screen.getByText('Done');
    fireEvent.click(doneBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
