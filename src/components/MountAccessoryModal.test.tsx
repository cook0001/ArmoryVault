import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Accessory, Firearm } from '../types';
import { MountAccessoryModal } from './MountAccessoryModal';

describe('MountAccessoryModal Component', () => {
  const mockFirearm: Firearm = {
    id: 101,
    make: 'Glock',
    model: '19 Gen 5',
    caliber: '9mm',
    serial_number: 'GLK-12345',
    purchase_price: 550,
    purchase_date: '2023-01-15',
    condition: 'Excellent',
    image_path: '',
    is_sold: false,
  };

  const mockOtherFirearm: Firearm = {
    id: 102,
    make: 'Ruger',
    model: '10/22',
    caliber: '.22 LR',
    serial_number: 'RUG-9988',
    purchase_price: 320,
    purchase_date: '2022-05-10',
    condition: 'Very Good',
    image_path: '',
    is_sold: false,
  };

  const mockAccessories: Accessory[] = [
    {
      id: 1,
      type: 'Optic',
      manufacturer: 'Holosun',
      model: 'HE507C-GR X2',
      magnification: '1x (2 MOA Dot)',
      value: 310,
      mounts: [], // Unmounted / In Storage
    },
    {
      id: 2,
      type: 'Light',
      manufacturer: 'Streamlight',
      model: 'TLR-7A Flex',
      lumens: 500,
      value: 140,
      mounts: [{ firearmId: 101, quantity: 1 }], // Mounted to target firearm
    },
    {
      id: 3,
      type: 'Optic',
      manufacturer: 'Vortex',
      model: 'Crossfire II 3-9x40',
      magnification: '3-9x40mm',
      value: 180,
      mounts: [{ firearmId: 102, quantity: 1 }], // Mounted to other firearm
    },
    {
      id: 4,
      type: 'Magazine',
      manufacturer: 'Magpul',
      model: 'PMAG 17 GL9',
      capacity: 17,
      quantity: 5,
      value: 16,
      mounts: [],
    },
  ];

  beforeEach(() => {
    window.api = {
      updateAccessory: vi.fn().mockResolvedValue(true),
    } as any;
  });

  test('renders modal when open with target firearm header and accessory list', () => {
    render(
      <MountAccessoryModal
        isOpen={true}
        onClose={vi.fn()}
        targetFirearm={mockFirearm}
        allAccessories={mockAccessories}
        allFirearms={[mockFirearm, mockOtherFirearm]}
        onMountChanged={vi.fn()}
      />
    );

    expect(screen.getByText('Mount Accessory to Firearm')).toBeInTheDocument();
    expect(screen.getByText(/Glock 19 Gen 5/)).toBeInTheDocument();
    expect(screen.getByText(/Holosun HE507C-GR X2/)).toBeInTheDocument();
    expect(screen.getByText(/Streamlight TLR-7A Flex/)).toBeInTheDocument();
    expect(screen.getByText(/Vortex Crossfire II 3-9x40/)).toBeInTheDocument();
    expect(screen.getByText(/5x Magpul PMAG 17 GL9/)).toBeInTheDocument();
  });

  test('filters accessories by search query and category chips', () => {
    render(
      <MountAccessoryModal
        isOpen={true}
        onClose={vi.fn()}
        targetFirearm={mockFirearm}
        allAccessories={mockAccessories}
        allFirearms={[mockFirearm, mockOtherFirearm]}
        onMountChanged={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by manufacturer/i);
    fireEvent.change(searchInput, { target: { value: 'Holosun' } });

    expect(screen.getByText(/Holosun HE507C-GR X2/)).toBeInTheDocument();
    expect(screen.queryByText(/Streamlight TLR-7A Flex/)).not.toBeInTheDocument();

    // Clear search and filter by category
    fireEvent.change(searchInput, { target: { value: '' } });
    const lightChip = screen.getByRole('button', { name: /Light/i });
    fireEvent.click(lightChip);

    expect(screen.getByText(/Streamlight TLR-7A Flex/)).toBeInTheDocument();
    expect(screen.queryByText(/Holosun HE507C-GR X2/)).not.toBeInTheDocument();
  });

  test('mounts an unmounted accessory when "Mount to Firearm" is clicked', async () => {
    const onMountChanged = vi.fn();
    render(
      <MountAccessoryModal
        isOpen={true}
        onClose={vi.fn()}
        targetFirearm={mockFirearm}
        allAccessories={mockAccessories}
        allFirearms={[mockFirearm, mockOtherFirearm]}
        onMountChanged={onMountChanged}
      />
    );

    const mountButtons = screen.getAllByRole('button', { name: /Mount to Firearm/i });
    fireEvent.click(mountButtons[0]);

    await waitFor(() => {
      expect(window.api.updateAccessory).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          id: 1,
          mounts: [{ firearmId: 101, quantity: 1 }],
        })
      );
      expect(onMountChanged).toHaveBeenCalled();
    });
  });

  test('unmounts an already mounted accessory when "Unmount" is clicked', async () => {
    const onMountChanged = vi.fn();
    render(
      <MountAccessoryModal
        isOpen={true}
        onClose={vi.fn()}
        targetFirearm={mockFirearm}
        allAccessories={mockAccessories}
        allFirearms={[mockFirearm, mockOtherFirearm]}
        onMountChanged={onMountChanged}
      />
    );

    const unmountButton = screen.getByRole('button', { name: /^Unmount$/i });
    fireEvent.click(unmountButton);

    await waitFor(() => {
      expect(window.api.updateAccessory).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          id: 2,
          mounts: [],
        })
      );
      expect(onMountChanged).toHaveBeenCalled();
    });
  });
});
