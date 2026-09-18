import React from 'react';
import { ScopeIcon } from '@/components/CustomIcons';
import { ArmoryModule } from '../types';
import manifest from './manifest.json';
import { OpticsVault } from './OpticsVault';

export { OpticsVault };

export const opticsModule: ArmoryModule = {
  manifest: manifest as any,
  routes: [
    {
      path: '/optics',
      element: OpticsVault as any,
    },
  ],
  navItems: [
    {
      path: '/optics',
      label: 'Optics Vault',
      icon: <ScopeIcon size={18} />,
      group: 'tools',
    },
  ],
  commands: [
    {
      id: 'search-optics-vault',
      label: 'Optics & Zero Vault',
      sublabel: 'Scope zeros, click values, reticles & battery health',
      path: '/optics',
      keywords: ['optics', 'scopes', 'red dot', 'lpvo', 'zero', 'mrad', 'moa', 'reticle'],
    },
  ],
};

export default opticsModule;
