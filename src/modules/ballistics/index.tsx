import React from 'react';
import { BallisticsNavIcon } from '@/components/CustomIcons';
import { ArmoryModule } from '../registry/types';
import manifest from './manifest.json';

export const BallisticsCalculator = React.lazy(() =>
  import('@/pages/BallisticsCalculator').then((m) => ({ default: m.BallisticsCalculator }))
);

export const ballisticsModule: ArmoryModule = {
  manifest: manifest as any,
  routes: [
    {
      path: '/ballistics',
      element: BallisticsCalculator,
    },
  ],
  navItems: [
    {
      path: '/ballistics',
      label: 'Ballistics',
      icon: <BallisticsNavIcon size={18} />,
      group: 'tools',
    },
  ],
  commands: [
    {
      id: 'search-ballistics',
      label: 'Ballistics Calculator',
      sublabel: 'Trajectory tables, drop charts & DOPE',
      path: '/ballistics',
      keywords: ['ballistics', 'dope', 'trajectory', 'drop', 'wind', 'calculator'],
    },
  ],
};

export default ballisticsModule;
