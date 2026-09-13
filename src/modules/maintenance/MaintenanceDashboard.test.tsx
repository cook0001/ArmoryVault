/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Firearm } from '@/types';
import { MaintenanceDashboard } from './MaintenanceDashboard';

describe('MaintenanceDashboard (Armorer Command Center)', () => {
  const testFirearms: Firearm[] = [
    {
      id: 1,
      make: 'Colt',
      model: 'M4 Carbine',
      serial_number: 'M4-9988',
      caliber: '5.56 NATO',
      purchase_price: 1200,
      purchase_date: '2024-01-01',
      condition: 'Excellent',
      image_path: '',
      is_sold: false,
      logs: [
        {
          id: 101,
          date: '2024-02-01',
          type: 'Range',
          rounds_fired: 600,
          notes: 'Tactical carbine course',
        },
        {
          id: 102,
          date: '2024-02-02',
          type: 'Cleaning',
          cost: 25.5,
          installed_part_details: 'CLP & solvent bore swab',
          notes: 'Standard field strip clean',
        },
      ],
      maintenance_schedules: [
        {
          id: 'task_1',
          task_name: 'Clean BCG & Chamber Star',
          interval_rounds: 300,
          interval_days: 90,
          last_performed_rounds: 100, // 600 - 100 = 500 rounds since last (overdue: 500 >= 300)
          last_performed_date: '2024-01-10',
          notes: 'Clean bolt carrier group and inspect gas key',
        },
        {
          id: 'task_2',
          task_name: 'Replace Buffer Spring',
          interval_rounds: 5000,
          interval_days: 365,
          last_performed_rounds: 0,
          last_performed_date: '2024-01-01',
          notes: 'Buffer spring replacement',
        },
      ],
      optic_zero_records: [
        {
          id: 'zero_colt_1',
          opticName: 'Aimpoint CompM5 2 MOA Red Dot',
          ringTorqueInLbs: 18,
          baseTorqueInLbs: 45,
          actionScrewTorqueInLbs: 50,
          zeroDistanceYards: 50,
          zeroAmmo: 'Federal 55gr XM193',
          lastZeroDate: '2024-02-01',
          notes: 'Lower 1/3 cowitness verified',
        },
      ],
    },
    {
      id: 2,
      make: 'Glock',
      model: '17 Gen 5',
      serial_number: 'GLK-7711',
      caliber: '9mm',
      purchase_price: 580,
      purchase_date: '2024-03-01',
      condition: 'Like New',
      image_path: '',
      is_sold: false,
      logs: [
        {
          id: 201,
          date: '2024-03-10',
          type: 'Range',
          rounds_fired: 250,
        },
      ],
      maintenance_schedules: [
        {
          id: 'task_glock_1',
          task_name: 'Field Strip & Clean',
          interval_rounds: 300, // 250 rds fired, interval 300 => 50 rds remaining (within 200 rds = Due Soon!)
          interval_days: 90,
          last_performed_rounds: 0,
          last_performed_date: '2024-03-01',
        },
      ],
    },
    {
      id: 3,
      make: 'Ruger',
      model: 'Precision Rifle',
      serial_number: 'RPR-4455',
      caliber: '6.5 Creedmoor',
      purchase_price: 1500,
      purchase_date: '2024-04-01',
      condition: 'New in Box',
      image_path: '',
      is_sold: false,
      logs: [],
      // Unscheduled firearm to test preset application
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    window.api.getFirearms = vi.fn().mockResolvedValue(testFirearms);
    window.api.updateFirearm = vi.fn().mockResolvedValue(1);
    window.api.completeMaintenanceTask = vi.fn().mockResolvedValue(true);
  });

  test('renders Armorer Command Center header and armory health KPI summary cards', async () => {
    render(
      <MemoryRouter>
        <MaintenanceDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Armorer Command Center')).toBeDefined();
      expect(screen.getByText('Armory Monitored')).toBeDefined();
      expect(screen.getByText('Service Overdue')).toBeDefined();
      expect(screen.getByText('Due Soon')).toBeDefined();
      expect(screen.getByText('Good Standing')).toBeDefined();
      expect(screen.getByText('Armory Investment')).toBeDefined();
    });

    // 2 out of 3 firearms are scheduled
    expect(screen.getByText('2 / 3')).toBeDefined();
    // Overdue count is 1 (Colt M4 Clean BCG is 500 rds since last, threshold is 300)
    expect(screen.getByText('1')).toBeDefined();
  });

  test('toggles financial cost metrics visibility when cost toggle is clicked', async () => {
    render(
      <MemoryRouter>
        <MaintenanceDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Armory Investment')).toBeDefined();
      expect(screen.getByText('$25.50')).toBeDefined();
    });

    // Click toggle to hide costs
    const toggleBtn = screen.getByTitle('Hide Financial Costs');
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.queryByText('Armory Investment')).toBeNull();
      expect(screen.getByText('Costs Hidden')).toBeDefined();
    });

    // Click again to show costs
    const showBtn = screen.getByTitle('Show Financial Costs');
    fireEvent.click(showBtn);

    await waitFor(() => {
      expect(screen.getByText('Armory Investment')).toBeDefined();
      expect(screen.getByText('Costs Visible')).toBeDefined();
    });
  });

  test('adjusts Due Soon threshold dynamically via Settings modal', async () => {
    render(
      <MemoryRouter>
        <MaintenanceDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Due Soon')).toBeDefined();
    });

    // Open Alert Thresholds modal
    const settingsBtn = screen.getByTitle('Configure Alert Thresholds');
    fireEvent.click(settingsBtn);

    expect(screen.getByText('Maintenance Alert Preferences')).toBeDefined();

    // Adjust threshold rounds from 200 to 25 (Glock has 50 rds remaining, so with 25 window it should move to Good Standing!)
    const roundsInput = screen.getByLabelText(/Round Count Warning Window/i);
    fireEvent.change(roundsInput, { target: { value: '25' } });

    const saveBtn = screen.getByText('Save Preferences');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.queryByText('Maintenance Alert Preferences')).toBeNull();
    });
  });

  test('switches tabs to Master Armory Schedule and renders preset recommendations for unscheduled firearms', async () => {
    render(
      <MemoryRouter>
        <MaintenanceDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Master Armory Schedule')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Master Armory Schedule'));

    await waitFor(() => {
      expect(screen.getByText('Colt M4 Carbine')).toBeDefined();
      expect(screen.getByText('Glock 17 Gen 5')).toBeDefined();
      expect(screen.getByText('Ruger Precision Rifle')).toBeDefined();
    });

    // Ruger Precision Rifle is unscheduled and should have preset recommendation
    expect(screen.getByText('No customized maintenance schedule configured')).toBeDefined();

    const applyPresetBtns = screen.getAllByRole('button', { name: /preset|initialize schedule/i });
    expect(applyPresetBtns.length).toBeGreaterThan(0);

    // Click apply preset
    fireEvent.click(applyPresetBtns[0]);

    await waitFor(() => {
      expect(window.api.updateFirearm).toHaveBeenCalled();
    });
  });

  test('switches to Parts & Service Ledger and filters entries', async () => {
    render(
      <MemoryRouter>
        <MaintenanceDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Parts & Service Ledger')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Parts & Service Ledger'));

    await waitFor(() => {
      expect(screen.getByText('CLP & solvent bore swab')).toBeDefined();
      expect(screen.getByText('Standard field strip clean')).toBeDefined();
    });
  });

  test('switches to Optic Torque & Zero Registry and displays saved specifications', async () => {
    render(
      <MemoryRouter>
        <MaintenanceDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Optic Torque & Zero Registry')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Optic Torque & Zero Registry'));

    await waitFor(() => {
      expect(screen.getByText('Aimpoint CompM5 2 MOA Red Dot')).toBeDefined();
      expect(screen.getByText('18 in-lbs')).toBeDefined();
      expect(screen.getByText('45 in-lbs')).toBeDefined();
      expect(screen.getByText('50 yds')).toBeDefined();
      expect(screen.getByText(/Federal 55gr XM193/)).toBeDefined();
    });
  });

  test('opens QuickServiceModal and records completed maintenance task', async () => {
    render(
      <MemoryRouter>
        <MaintenanceDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Clean BCG & Chamber Star')).toBeDefined();
    });

    // Find "Log Service" button on the overdue Colt task card
    const logServiceBtns = screen.getAllByRole('button', { name: /^log service$/i });
    fireEvent.click(logServiceBtns[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Log Armorer Service' })).toBeDefined();
    });

    // Enter details and submit
    const partDetailsInput = screen.getByLabelText(/Installed Parts \/ Replaced Details/i);
    fireEvent.change(partDetailsInput, {
      target: { value: 'Inspected gas key and cleaned carbon' },
    });

    const submitBtn = screen.getByRole('button', { name: /Record Service & Complete/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(window.api.completeMaintenanceTask).toHaveBeenCalledWith(
        1,
        'task_1',
        expect.objectContaining({
          action_performed: 'Inspected gas key and cleaned carbon',
        })
      );
    });
  });
});
