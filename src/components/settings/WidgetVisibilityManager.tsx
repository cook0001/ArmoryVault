import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
import React, { useState } from 'react';
import { WidgetVisibilityConfig } from '@/utils/themeEngine';

interface WidgetVisibilityManagerProps {
  widgets: WidgetVisibilityConfig;
  onToggleWidget: (key: keyof WidgetVisibilityConfig) => void;
}

export const WidgetVisibilityManager: React.FC<WidgetVisibilityManagerProps> = ({
  widgets,
  onToggleWidget,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeCount = Object.values(widgets).filter(Boolean).length;
  const totalCount = Object.keys(widgets).length;

  return (
    <div
      style={{
        border: '1px solid var(--border-light)',
        borderRadius: '10px',
        background: 'rgba(0, 0, 0, 0.18)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Layers size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            Modular Widget Visibility Manager
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '0.15rem 0.5rem',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
            }}
          >
            {activeCount} / {totalCount} Active
          </span>
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div
          style={{
            padding: '0.75rem 1rem 1rem',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Command Bar Metrics */}
          <div>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}
            >
              Command Bar Metrics (Top 5 Stats)
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.5rem',
              }}
            >
              {[
                { key: 'statFirearms', label: 'Firearms Count' },
                { key: 'statAmmo', label: 'Ammo In Stock' },
                { key: 'statRounds', label: 'Rounds Fired' },
                { key: 'statValuation', label: 'Total Valuation' },
                { key: 'statService', label: 'Maintenance Needed' },
              ].map((w) => {
                const active = widgets[w.key as keyof WidgetVisibilityConfig];
                return (
                  <label
                    key={w.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => onToggleWidget(w.key as keyof WidgetVisibilityConfig)}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <span>{w.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Sectional Widgets */}
          <div>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}
            >
              Sectional Dashboard Widgets
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.5rem',
              }}
            >
              {[
                { key: 'collectionAnalytics', label: 'Valuation & Investment Analytics' },
                { key: 'storageOverview', label: 'Safe Storage Capacity Cards' },
                { key: 'storageValuations', label: 'Storage Value Rollup Badges' },
                { key: 'categoryChips', label: 'Quick Category Filter Chips' },
                { key: 'exportBinder', label: 'Export Binder / PDF Button' },
              ].map((w) => {
                const active = widgets[w.key as keyof WidgetVisibilityConfig];
                return (
                  <label
                    key={w.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => onToggleWidget(w.key as keyof WidgetVisibilityConfig)}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <span>{w.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Firearm Card Micro-Widgets */}
          <div>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}
            >
              Firearm Card Micro-Widgets
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.5rem',
              }}
            >
              {[
                { key: 'showThumbnails', label: 'Photo Thumbnails' },
                { key: 'wearGauges', label: 'Wear Level & Round Bars' },
                { key: 'mountedAccessories', label: 'Mounted Accessories Badges' },
                { key: 'storageBadges', label: 'Storage Safe Badges' },
                { key: 'telemetryStrip', label: 'Caliber & Round Count Strip' },
              ].map((w) => {
                const active = widgets[w.key as keyof WidgetVisibilityConfig];
                return (
                  <label
                    key={w.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => onToggleWidget(w.key as keyof WidgetVisibilityConfig)}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <span>{w.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Sub-page Widgets */}
          <div>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}
            >
              Sub-Page Inventory Widgets
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.5rem',
              }}
            >
              {[
                { key: 'ammoLowStockAlert', label: 'Ammunition Low Stock Alerts' },
                { key: 'ammoValuation', label: 'Ammunition Stock Valuation' },
                { key: 'accessoryValuation', label: 'Accessory Total Valuations' },
              ].map((w) => {
                const active = widgets[w.key as keyof WidgetVisibilityConfig];
                return (
                  <label
                    key={w.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => onToggleWidget(w.key as keyof WidgetVisibilityConfig)}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <span>{w.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
