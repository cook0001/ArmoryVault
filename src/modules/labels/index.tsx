import { Printer } from 'lucide-react';
import React from 'react';
import { ArmoryModule } from '../types';
import { BatchLabelStudio } from './BatchLabelStudio';
import manifest from './manifest.json';

export { BatchLabelStudio };

export const labelsModule: ArmoryModule = {
  manifest: manifest as any,
  routes: [
    {
      path: '/labels',
      element: BatchLabelStudio as any,
    },
  ],
  navItems: [
    {
      path: '/labels',
      label: 'Label Studio',
      icon: <Printer size={18} />,
      group: 'tools',
    },
  ],
  commands: [
    {
      id: 'open-label-studio',
      label: 'Batch Label & QR Print Studio',
      sublabel: 'Avery multi-label sheet and thermal roll printing for ammo & storage',
      path: '/labels',
      keywords: ['label', 'print', 'qr', 'barcode', 'avery', 'thermal', 'sheet', 'ammo can'],
    },
  ],
};

export default labelsModule;
