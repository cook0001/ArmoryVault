import { ChevronRight, Edit, FileText, QrCode, Shield, Trash2 } from 'lucide-react';
import React from 'react';
import type { Accessory, Ammo, Firearm, ReloadingComponent, StorageLocation } from '../../../types';
import { formatCurrency, parseCurrency } from '../../../utils/currency';
import { getStorageCapacityUtilization } from '../../../utils/StorageSync';
import { maskValue, ThemeConfig } from '../../../utils/themeEngine';
import { AccessoriesNavIcon, CartridgesIcon, GunpowderIcon } from '../../CustomIcons';
import { getAccessoryTypeColor } from '../../modals/AccessoryDetailModal';
import { renderAccessoryIcon, STORAGE_ICONS, TYPE_COLORS } from '../types';

export interface StorageLocationCardProps {
  location: StorageLocation;
  firearmsById: Map<number, Firearm>;
  accessoriesById: Map<number, Accessory>;
  ammoById: Map<number, Ammo>;
  componentsById: Map<number, ReloadingComponent>;
  showValuations: boolean;
  themeConfig: ThemeConfig;
  onInspect: (id: number) => void;
  onEdit: (loc: StorageLocation) => void;
  onDelete: (id: number) => void;
  onShowQR: (loc: StorageLocation) => void;
}

export const StorageLocationCard: React.FC<StorageLocationCardProps> = ({
  location: loc,
  firearmsById,
  accessoriesById,
  ammoById,
  componentsById,
  showValuations,
  themeConfig,
  onInspect,
  onEdit,
  onDelete,
  onShowQR,
}) => {
  const locFirearms = (loc.firearmIds || [])
    .map((id) => firearmsById.get(id))
    .filter(Boolean) as Firearm[];
  const locAccessories = (loc.accessoryIds || [])
    .map((id) => accessoriesById.get(id))
    .filter(Boolean) as Accessory[];
  const locAmmo = (loc.ammoIds || []).map((id) => ammoById.get(id)).filter(Boolean) as Ammo[];
  const locComps = (loc.componentIds || [])
    .map((id) => componentsById.get(id))
    .filter(Boolean) as ReloadingComponent[];
  const totalRounds = locAmmo.reduce((sum, a) => sum + (a.count || 0), 0);
  const colorMeta = TYPE_COLORS[loc.type] || TYPE_COLORS.Other;

  const capUtil = getStorageCapacityUtilization(
    loc,
    locFirearms.length,
    locAccessories.length,
    locAmmo.length,
    locComps.length
  );

  const locFirearmsVal = locFirearms.reduce((sum, f) => sum + parseCurrency(f.purchase_price), 0);
  const locAccsVal = locAccessories.reduce(
    (sum, a) => sum + parseCurrency(a.value) * (Number(a.quantity) || 1),
    0
  );
  const locAmmoVal = locAmmo.reduce(
    (sum, am) => sum + (Number(am.count) || 0) * parseCurrency(am.costPerRound),
    0
  );
  const locCompsVal = locComps.reduce((sum, c) => sum + parseCurrency(c.cost), 0);
  const locTotalVal = locFirearmsVal + locAccsVal + locAmmoVal + locCompsVal;

  return (
    <div
      data-testid={`storage-card-${loc.id}`}
      onClick={() => onInspect(loc.id!)}
      className="storage-quick-card"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-light)',
        borderRadius: '14px',
        borderLeft: `4px solid ${colorMeta.text}`,
        padding: '1.15rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        position: 'relative',
      }}
    >
      {/* Card Top Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: colorMeta.bg,
              border: `1px solid ${colorMeta.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {STORAGE_ICONS[loc.type]}
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontSize: '1rem',
              }}
            >
              {maskValue(loc.name, 'location', themeConfig.privacyMode)}
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '0.35rem',
                alignItems: 'center',
                marginTop: 2,
              }}
            >
              <span
                style={{
                  background: colorMeta.bg,
                  color: colorMeta.text,
                  border: `1px solid ${colorMeta.border}`,
                  padding: '1px 7px',
                  borderRadius: 4,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {loc.type}
              </span>
              {capUtil.mode === 'firearms' && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.04)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                  }}
                >
                  Gun Capacity
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onShowQR(loc)}
            className="btn-icon"
            style={{ padding: '5px', borderRadius: '6px' }}
            title="Generate & Print Storage QR Code"
          >
            <QrCode size={14} />
          </button>
          <button
            onClick={() => onEdit(loc)}
            className="btn-icon"
            style={{ padding: '5px', borderRadius: '6px' }}
            title="Edit Location"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(loc.id!)}
            className="btn-icon"
            style={{ padding: '5px', borderRadius: '6px', color: 'var(--danger)' }}
            title="Delete Location"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Quick Look Breakdown Pills (All 4 Categories) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0.4rem 0.3rem',
            textAlign: 'center',
          }}
          title={`${locFirearms.length} Firearms stored`}
        >
          <div
            style={{
              fontSize: '0.68rem',
              color: '#a78bfa',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              marginBottom: 2,
            }}
          >
            <Shield size={11} color="#a78bfa" /> Guns
          </div>
          <div style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 700 }}>
            {locFirearms.length}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0.4rem 0.3rem',
            textAlign: 'center',
          }}
          title={`${locAccessories.length} Accessories stored`}
        >
          <div
            style={{
              fontSize: '0.68rem',
              color: '#60a5fa',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              marginBottom: 2,
            }}
          >
            <AccessoriesNavIcon size={11} color="#60a5fa" /> Accs
          </div>
          <div style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 700 }}>
            {locAccessories.length}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0.4rem 0.3rem',
            textAlign: 'center',
          }}
          title={`${locAmmo.length} Ammo Lots (${totalRounds.toLocaleString()} rounds)`}
        >
          <div
            style={{
              fontSize: '0.68rem',
              color: '#f59e0b',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              marginBottom: 2,
            }}
          >
            <CartridgesIcon size={11} color="#f59e0b" /> Ammo
          </div>
          <div style={{ fontSize: '0.95rem', color: '#f59e0b', fontWeight: 700 }}>
            {locAmmo.length}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0.4rem 0.3rem',
            textAlign: 'center',
          }}
          title={`${locComps.length} Reloading Components stored`}
        >
          <div
            style={{
              fontSize: '0.68rem',
              color: '#c084fc',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              marginBottom: 2,
            }}
          >
            <GunpowderIcon size={11} color="#c084fc" /> Powders
          </div>
          <div style={{ fontSize: '0.95rem', color: '#c084fc', fontWeight: 700 }}>
            {locComps.length}
          </div>
        </div>
      </div>

      {/* Capacity Progress Meter */}
      {capUtil.max ? (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              marginBottom: 4,
            }}
          >
            <span
              style={{
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{capUtil.unitLabel} Capacity</span>
            </span>
            <span
              style={{
                color:
                  capUtil.isOverCapacity || (capUtil.percent && capUtil.percent >= 90)
                    ? 'var(--danger)'
                    : 'var(--text-primary)',
                fontWeight: 700,
              }}
            >
              {capUtil.used} / {capUtil.max} {capUtil.unitLabel} ({capUtil.percent}%)
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, capUtil.percent || 0)}%`,
                height: '100%',
                background:
                  capUtil.isOverCapacity || (capUtil.percent && capUtil.percent >= 90)
                    ? 'var(--danger)'
                    : colorMeta.text,
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Stored Valuation Line */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          marginTop: '0.2rem',
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Total Stored Value:</span>
        <strong
          className="privacy-mask-val"
          style={{ color: 'var(--success)', fontSize: '0.9rem' }}
        >
          {showValuations
            ? maskValue(formatCurrency(locTotalVal), 'currency', themeConfig.privacyMode)
            : '•••••'}
        </strong>
      </div>

      {/* Sample Items Preview */}
      {capUtil.totalItems > 0 ? (
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {locFirearms.slice(0, 2).map((f) => (
            <span
              key={f.id}
              style={{
                background: 'rgba(167, 139, 250, 0.1)',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: '0.72rem',
                color: '#c4b5fd',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Shield size={11} color="#a78bfa" /> {f.make} {f.model}
            </span>
          ))}
          {locAccessories.slice(0, 1).map((a) => {
            const tc = getAccessoryTypeColor(a.type);
            return (
              <span
                key={a.id}
                style={{
                  background: tc.bg,
                  border: `1px solid ${tc.border}`,
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: '0.72rem',
                  color: tc.text,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {renderAccessoryIcon(a.type, 11, tc.text)} {a.model || a.manufacturer || a.type}
              </span>
            );
          })}
          {locAmmo.slice(0, 1).map((am) => (
            <span
              key={am.id}
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: '0.72rem',
                color: '#fbbf24',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CartridgesIcon size={11} color="#f59e0b" /> {am.caliber} ({am.count} rds)
            </span>
          ))}
          {capUtil.totalItems > 3 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              +{capUtil.totalItems - 3} more
            </span>
          )}
        </div>
      ) : (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Empty location • Tap to assign items
        </div>
      )}

      {/* Card Footer prompt */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.6rem',
          marginTop: 'auto',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <FileText size={12} style={{ opacity: 0.7 }} />
          {loc.notes
            ? `${loc.notes.slice(0, 28)}${loc.notes.length > 28 ? '...' : ''}`
            : 'No notes'}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--accent)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          Quick Look <ChevronRight size={13} />
        </span>
      </div>
    </div>
  );
};
