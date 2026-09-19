import { Check, Eye, EyeOff, Palette, RotateCcw } from 'lucide-react';
import React from 'react';
import {
  ACCENT_PRESETS,
  CanvasStyle,
  CornerRadius,
  FontFamily,
  FontScale,
  ThemeAccent,
  ThemeConfig,
  UiDensity,
  WidgetVisibilityConfig,
} from '@/utils/themeEngine';
import { WidgetVisibilityManager } from './WidgetVisibilityManager';

interface AppearanceSettingsSectionProps {
  theme: ThemeConfig;
  customColor: string;
  onCustomColorChange: (color: string) => void;
  onAccentChange: (accent: ThemeAccent, customHex?: string) => void;
  onCanvasChange: (canvas: CanvasStyle) => void;
  onDensityChange: (density: UiDensity) => void;
  onRadiusChange: (radius: CornerRadius) => void;
  onFontChange: (font: FontFamily) => void;
  onFontScaleChange: (fontScale: FontScale) => void;
  onStartupRouteChange: (startupRoute: string) => void;
  onPrivacyToggle: () => void;
  onResetTheme: () => void;
  onWidgetToggle: (key: keyof WidgetVisibilityConfig) => void;
}

export const AppearanceSettingsSection: React.FC<AppearanceSettingsSectionProps> = ({
  theme,
  customColor,
  onCustomColorChange,
  onAccentChange,
  onCanvasChange,
  onDensityChange,
  onRadiusChange,
  onFontChange,
  onFontScaleChange,
  onStartupRouteChange,
  onPrivacyToggle,
  onResetTheme,
  onWidgetToggle,
}) => {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Palette size={18} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>
            Appearance & Personalization
          </h3>
        </div>
        <button
          className="btn-secondary"
          onClick={onResetTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            fontSize: '0.75rem',
            borderRadius: '6px',
          }}
          title="Reset all themes, typography, density, and widget settings to defaults"
        >
          <RotateCcw size={13} />
          Reset Defaults
        </button>
      </div>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          margin: '0 0 1.25rem',
        }}
      >
        Configure tactical accent palettes, OLED/ambient canvas backgrounds, interface density,
        typography, discretion mode, and modular widget visibility.
      </p>

      {/* 1. Tactical Color Themes */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          Tactical Accent Palettes
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          {Object.values(ACCENT_PRESETS).map((preset) => {
            const isSelected = theme.accent === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onAccentChange(preset.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '8px',
                  border: isSelected
                    ? `1px solid ${preset.primary}`
                    : '1px solid var(--border-light)',
                  background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? `0 0 10px ${preset.glow}` : 'none',
                }}
              >
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: preset.primary,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 6px ${preset.primary}`,
                  }}
                />
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {preset.name}
                </span>
                {isSelected && <Check size={13} style={{ color: preset.primary, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        {/* Custom Hex Accent Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border:
              theme.accent === 'custom'
                ? '1px solid var(--accent)'
                : '1px solid var(--border-light)',
          }}
        >
          <input
            type="color"
            value={customColor}
            onChange={(e) => {
              onCustomColorChange(e.target.value);
              onAccentChange('custom', e.target.value);
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              padding: 0,
            }}
            title="Choose custom hex accent color"
          />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              Custom Accent Color
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Personalize with any custom RGB / Hex value
            </span>
          </div>
          <input
            type="text"
            value={customColor}
            onChange={(e) => {
              const val = e.target.value;
              onCustomColorChange(val);
              if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
                onAccentChange('custom', val);
              }
            }}
            placeholder="#3b82f6"
            style={{
              width: '85px',
              padding: '0.35rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              textAlign: 'center',
            }}
          />
          {theme.accent === 'custom' && (
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--accent)',
                fontWeight: 600,
                padding: '0.2rem 0.5rem',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '4px',
              }}
            >
              Active
            </span>
          )}
        </div>
      </div>

      {/* 2. Canvas Background Style */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.6rem',
          }}
        >
          Canvas Background Style
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
          }}
        >
          {[
            { id: 'mesh', label: 'Tactical Mesh', desc: 'Radial Glow' },
            { id: 'oled', label: 'OLED Pure Black', desc: '#000000 True' },
            { id: 'navy', label: 'Midnight Navy', desc: 'Deep Submarine' },
            { id: 'flat', label: 'Flat Slate', desc: 'Matte Clean' },
          ].map((canvasOpt) => {
            const isSelected = theme.canvas === canvasOpt.id;
            return (
              <button
                key={canvasOpt.id}
                type="button"
                onClick={() => onCanvasChange(canvasOpt.id as CanvasStyle)}
                style={{
                  padding: '0.6rem 0.5rem',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-light)',
                  background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 600 : 400 }}>
                  {canvasOpt.label}
                </span>
                <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>{canvasOpt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Interface Density & Corner Geometry */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Density */}
        <div>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            UI Spacing & Density
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[
              { id: 'compact', label: 'Compact' },
              { id: 'comfortable', label: 'Balanced' },
              { id: 'spacious', label: 'Spacious' },
            ].map((d) => {
              const isSelected = theme.density === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onDensityChange(d.id as UiDensity)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.35rem',
                    borderRadius: '6px',
                    border: isSelected
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border-light)',
                    background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Corner Geometry */}
        <div>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Corner Geometry
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[
              { id: 'sharp', label: 'Tactical (3px)' },
              { id: 'modern', label: 'Modern (14px)' },
              { id: 'pill', label: 'Pill (24px)' },
            ].map((r) => {
              const isSelected = theme.radius === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onRadiusChange(r.id as CornerRadius)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.35rem',
                    borderRadius: '6px',
                    border: isSelected
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border-light)',
                    background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Typography & Font Scale */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Font Family */}
        <div>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Typography Family
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[
              { id: 'sans', label: 'Inter Sans' },
              { id: 'mono', label: 'Milspec HUD' },
              { id: 'system', label: 'Native OS' },
            ].map((f) => {
              const isSelected = theme.font === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onFontChange(f.id as FontFamily)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.35rem',
                    borderRadius: '6px',
                    border: isSelected
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border-light)',
                    background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Scale */}
        <div>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Font Scale
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[
              { id: 'compact', label: 'Compact 90%' },
              { id: 'standard', label: 'Standard 100%' },
              { id: 'large', label: 'Comfort 112%' },
            ].map((s) => {
              const isSelected = theme.fontScale === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onFontScaleChange(s.id as FontScale)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.35rem',
                    borderRadius: '6px',
                    border: isSelected
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border-light)',
                    background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Default Startup Route */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.4rem',
          }}
        >
          Default Screen on Vault Unlock
        </div>
        <select
          value={theme.startupRoute}
          onChange={(e) => onStartupRouteChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.6rem 0.8rem',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        >
          <option value="/">Dashboard & Firearms Collection</option>
          <option value="/ammo">Ammunition Stockpile</option>
          <option value="/components">Reloading Bench & Components</option>
          <option value="/accessories">Optics, Accessories & Gear</option>
          <option value="/bound-book">ATF Bound Book (Compliance)</option>
          <option value="/maintenance">Maintenance & Service Logs</option>
          <option value="/storage">Storage & Safe Organizer</option>
          <option value="/load-development">Load Development</option>
          <option value="/ballistics">Ballistics Calculator</option>
          <option value="/nfa-tracker">NFA / Tax Stamp Tracker</option>
        </select>
      </div>

      {/* 6. Discretion / Privacy Shield Mode */}
      <div
        style={{
          background: theme.privacyMode ? 'var(--accent-badge-bg)' : 'rgba(0, 0, 0, 0.2)',
          border: theme.privacyMode ? '1px solid var(--accent)' : '1px solid var(--border-light)',
          borderRadius: '10px',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {theme.privacyMode ? (
            <EyeOff size={20} style={{ color: 'var(--accent)' }} />
          ) : (
            <Eye size={20} style={{ color: 'var(--text-secondary)' }} />
          )}
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Discretion Shield (Privacy Mode)
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                marginTop: '0.15rem',
              }}
            >
              Masks serial numbers (SN••••21), total purchase investments, and safe names for
              screen-shares or range demonstrations.
            </div>
          </div>
        </div>
        <button
          type="button"
          className={theme.privacyMode ? 'btn-primary' : 'btn-secondary'}
          onClick={onPrivacyToggle}
          style={{
            padding: '0.45rem 0.9rem',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
          }}
        >
          {theme.privacyMode ? 'Shield Enabled' : 'Enable Shield'}
        </button>
      </div>

      {/* 7. Modular Widget Visibility Manager (Collapsible) */}
      <WidgetVisibilityManager widgets={theme.widgets} onToggleWidget={onWidgetToggle} />
    </div>
  );
};
