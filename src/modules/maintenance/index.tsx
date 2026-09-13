import React from 'react';
import { MaintenanceNavIcon } from '@/components/CustomIcons';
import { ArmoryModule } from '../registry/types';
import manifest from './manifest.json';

export const MaintenanceDashboard = React.lazy(() =>
  import('@/pages/MaintenanceDashboard').then((m) => ({ default: m.MaintenanceDashboard }))
);

export const maintenanceModule: ArmoryModule = {
  manifest: manifest as any,
  routes: [
    {
      path: '/maintenance',
      element: MaintenanceDashboard,
    },
  ],
  navItems: [
    {
      path: '/maintenance',
      label: 'Maintenance',
      icon: <MaintenanceNavIcon size={18} />,
      group: 'vault',
    },
  ],
  commands: [
    {
      id: 'search-maintenance',
      label: 'Maintenance & Service',
      sublabel: 'Cleaning schedules, round counts & logs',
      path: '/maintenance',
      keywords: ['maintenance', 'cleaning', 'armorer', 'service', 'schedule', 'optic zero'],
    },
  ],
};

export default maintenanceModule;
