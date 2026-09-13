import React from 'react';
import { LoadDevNavIcon } from '@/components/CustomIcons';
import { ArmoryModule } from '../registry/types';
import manifest from './manifest.json';

export const ReloadingComponents = React.lazy(() =>
  import('@/pages/ReloadingComponents').then((m) => ({ default: m.ReloadingComponents }))
);

export const LoadDevelopment = React.lazy(() =>
  import('@/pages/LoadDevelopment').then((m) => ({ default: m.LoadDevelopment }))
);

export const reloadingModule: ArmoryModule = {
  manifest: manifest as any,
  routes: [
    {
      path: '/components',
      element: ReloadingComponents,
    },
    {
      path: '/load-development',
      element: LoadDevelopment,
    },
  ],
  navItems: [
    {
      path: '/load-development',
      label: 'Load Dev',
      icon: <LoadDevNavIcon size={18} />,
      group: 'tools',
    },
  ],
  commands: [
    {
      id: 'search-reloading-components',
      label: 'Reloading Components',
      sublabel: 'Powder, Primers, Brass & Bullets',
      path: '/components',
      keywords: ['reloading', 'powder', 'primers', 'brass', 'bullets', 'grains'],
    },
    {
      id: 'search-load-development',
      label: 'Load Development',
      sublabel: 'Powder charges, ladders & recipes',
      path: '/load-development',
      keywords: ['load', 'development', 'recipe', 'ladder', 'charge'],
    },
  ],
};

export default reloadingModule;
