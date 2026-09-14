import { Target } from 'lucide-react';
import React from 'react';
import { ArmoryModule } from '../types';
import manifest from './manifest.json';
import { ShootingRanges } from './ShootingRanges';

export { ShootingRanges };

export const rangesModule: ArmoryModule = {
  manifest: manifest as any,
  routes: [
    {
      path: '/ranges',
      element: ShootingRanges as any,
    },
  ],
  navItems: [
    {
      path: '/ranges',
      label: 'Range Finder',
      icon: <Target size={18} />,
      group: 'tools',
    },
  ],
  commands: [
    {
      id: 'search-shooting-ranges',
      label: 'Shooting Range Directory & Finder',
      sublabel: 'Locate 2,539 verified shooting facilities by ZIP or state',
      path: '/ranges',
      keywords: [
        'ranges',
        'shooting',
        'facilities',
        'targets',
        'indoor',
        'outdoor',
        'clay',
        'trap',
        'gun club',
      ],
    },
  ],
};

export default rangesModule;
