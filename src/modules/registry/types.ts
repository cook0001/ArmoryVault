import React from 'react';

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion: string;
  author: string;
  category: 'bench' | 'armorer' | 'range' | 'compliance';
  description: string;
  dataKeys: string[];
  entry: string;
}

export interface ModuleRoute {
  path: string;
  element: React.LazyExoticComponent<any>;
}

export interface ModuleNavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  group: 'vault' | 'tools';
  activePaths?: string[];
}

export interface ModuleCommand {
  id: string;
  label: string;
  sublabel: string;
  path: string;
  keywords: string[];
}

export interface ArmoryModule {
  manifest: ModuleManifest;
  routes: ModuleRoute[];
  navItems: ModuleNavItem[];
  commands?: ModuleCommand[];
  onInstall?: () => Promise<void> | void;
  onUninstall?: () => Promise<void> | void;
}

export interface ModuleArchiveMetadata {
  moduleId: string;
  moduleName?: string;
  archivedAt: string;
  dataKeyCount?: Record<string, number>;
  totalRecords?: number;
}
