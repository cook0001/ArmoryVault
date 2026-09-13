import React from 'react';
import { BoundBookNavIcon } from '@/components/CustomIcons';
import { ArmoryModule } from '../registry/types';
import manifest from './manifest.json';

export const BoundBook = React.lazy(() =>
  import('@/pages/BoundBook').then((m) => ({ default: m.BoundBook }))
);

export const boundbookModule: ArmoryModule = {
  manifest: manifest as any,
  routes: [
    {
      path: '/bound-book',
      element: BoundBook,
    },
  ],
  navItems: [
    {
      path: '/bound-book',
      label: 'Bound Book',
      icon: <BoundBookNavIcon size={18} />,
      group: 'vault',
    },
  ],
  commands: [
    {
      id: 'search-bound-book',
      label: 'Bound Book (A&D)',
      sublabel: 'ATF Curio & Relic / FFL acquisition & disposition',
      path: '/bound-book',
      keywords: ['bound book', 'atf', 'c&r', 'acquisition', 'disposition', 'ffl'],
    },
  ],
};

export default boundbookModule;
