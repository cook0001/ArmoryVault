import { MapPin } from 'lucide-react';
import React from 'react';
import type { StorageLocation } from '../types';
import { getStorageTypeTheme } from '../utils/StorageSync';
import { AmmoCanIcon, CabinetIcon, GunCaseIcon, SafeIcon, VehicleVaultIcon } from './CustomIcons';

export const renderStorageIcon = (type: string, size = 14) => {
  switch (type) {
    case 'Safe':
      return <SafeIcon size={size} color="#34d399" />;
    case 'Cabinet':
      return <CabinetIcon size={size} color="#60a5fa" />;
    case 'AmmoCan':
      return <AmmoCanIcon size={size} color="#f59e0b" />;
    case 'Case':
      return <GunCaseIcon size={size} color="#a78bfa" />;
    case 'Vehicle':
      return <VehicleVaultIcon size={size} color="#f87171" />;
    default:
      return <MapPin size={size} color="#94a3b8" />;
  }
};

interface StorageBadgeProps {
  location?: StorageLocation | null;
  onClick?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
  showUnassigned?: boolean;
}

export const StorageBadge: React.FC<StorageBadgeProps> = ({
  location,
  onClick,
  size = 'sm',
  showUnassigned = true,
}) => {
  if (!location) {
    if (!showUnassigned) return null;
    return (
      <span
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: size === 'sm' ? '0.12rem 0.45rem' : '0.2rem 0.6rem',
          borderRadius: '4px',
          fontSize: size === 'sm' ? '0.72rem' : '0.8rem',
          fontWeight: 500,
          background: 'rgba(255, 255, 255, 0.04)',
          color: 'var(--text-muted)',
          border: '1px dashed rgba(255, 255, 255, 0.12)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.15s ease',
        }}
        title={onClick ? 'Click to assign storage location' : 'Unassigned to any container'}
      >
        <MapPin size={size === 'sm' ? 11 : 13} color="var(--text-muted)" />
        <span>Unassigned</span>
      </span>
    );
  }

  const theme = getStorageTypeTheme(location.type);

  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '0.12rem 0.5rem' : '0.2rem 0.65rem',
        borderRadius: '4px',
        fontSize: size === 'sm' ? '0.72rem' : '0.8rem',
        fontWeight: 500,
        background: theme.bg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
      }}
      title={
        onClick ? `Stored in ${location.name} (Click to manage)` : `Stored in ${location.name}`
      }
    >
      {renderStorageIcon(location.type, size === 'sm' ? 12 : 14)}
      <span style={{ fontWeight: 600 }}>{location.name}</span>
    </span>
  );
};

interface StorageLocationSelectProps {
  value?: number | null;
  onChange: (locationId: number | null) => void;
  locations: StorageLocation[];
  placeholder?: string;
  className?: string;
  name?: string;
}

export const StorageLocationSelect: React.FC<StorageLocationSelectProps> = ({
  value,
  onChange,
  locations,
  placeholder = 'Select Storage Location...',
  className = 'form-input',
  name = 'storageLocationId',
}) => {
  return (
    <select
      name={name}
      className={className}
      value={value === null || value === undefined ? '' : value}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val === '' ? null : parseInt(val, 10));
      }}
    >
      <option value="">{placeholder}</option>
      {locations.map((loc) => {
        const totalItems =
          (loc.firearmIds?.length || 0) +
          (loc.accessoryIds?.length || 0) +
          (loc.ammoIds?.length || 0) +
          (loc.componentIds?.length || 0);
        const capStr = loc.capacity ? ` - ${totalItems}/${loc.capacity}` : ` (${totalItems} items)`;

        return (
          <option key={loc.id} value={loc.id}>
            [{loc.type}] {loc.name} {capStr}
          </option>
        );
      })}
    </select>
  );
};
