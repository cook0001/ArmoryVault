import { Flashlight, MapPin, Package } from 'lucide-react';
import React from 'react';
import {
  AmmoCanIcon,
  CabinetIcon,
  ChassisIcon,
  GunBeltIcon,
  GunCaseIcon,
  HolsterIcon,
  MagazineIcon,
  PicatinnyMountIcon,
  SafeIcon,
  ScopeIcon,
  StockIcon,
  SuppressorIcon,
  TacticalSlingIcon,
  VehicleVaultIcon,
} from '../CustomIcons';

export const renderAccessoryIcon = (type: string, size = 14, color?: string) => {
  switch (type) {
    case 'Optic':
      return <ScopeIcon size={size} color={color || '#38bdf8'} />;
    case 'Suppressor':
      return <SuppressorIcon size={size} color={color || '#f59e0b'} />;
    case 'Light':
      return <Flashlight size={size} style={{ color: color || '#fbbf24' }} />;
    case 'Holster':
      return <HolsterIcon size={size} color={color || '#34d399'} />;
    case 'Mount':
      return <PicatinnyMountIcon size={size} color={color || '#60a5fa'} />;
    case 'Sling':
      return <TacticalSlingIcon size={size} color={color || '#fb923c'} />;
    case 'Magazine':
      return <MagazineIcon size={size} color={color || '#c084fc'} />;
    case 'Stock':
      return <StockIcon size={size} color={color || '#10b981'} />;
    case 'Chassis':
      return <ChassisIcon size={size} color={color || '#06b6d4'} />;
    case 'Belt':
      return <GunBeltIcon size={size} color={color || '#eab308'} />;
    default:
      return <Package size={size} style={{ color: color || '#94a3b8' }} />;
  }
};

export const STORAGE_ICONS: Record<string, React.ReactNode> = {
  Safe: <SafeIcon size={18} color="#34d399" />,
  Cabinet: <CabinetIcon size={18} color="#60a5fa" />,
  AmmoCan: <AmmoCanIcon size={18} color="#f59e0b" />,
  Case: <GunCaseIcon size={18} color="#a78bfa" />,
  Vehicle: <VehicleVaultIcon size={18} color="#f87171" />,
  Other: <MapPin size={18} style={{ color: '#94a3b8' }} />,
};

export const TYPE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Safe: { text: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.35)' },
  Cabinet: { text: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.35)' },
  AmmoCan: { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)' },
  Case: { text: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.35)' },
  Vehicle: {
    text: '#f87171',
    bg: 'rgba(248, 113, 113, 0.15)',
    border: 'rgba(248, 113, 113, 0.35)',
  },
  Other: { text: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.35)' },
};
