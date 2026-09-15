import { Activity, ExternalLink, Sliders } from 'lucide-react';
import React from 'react';
import packageJson from '../../../package.json';

interface PreferencesSettingsSectionProps {
  onOpenActivityLog?: () => void;
  showTotalSetupValue: boolean;
  onToggleSetupValue: (checked: boolean) => void;
  showCollectionAnalytics: boolean;
  onToggleAnalytics: (checked: boolean) => void;
}

export const PreferencesSettingsSection: React.FC<PreferencesSettingsSectionProps> = ({
  onOpenActivityLog,
  showTotalSetupValue,
  onToggleSetupValue,
  showCollectionAnalytics,
  onToggleAnalytics,
}) => {
  return (
    <>
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
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          <Sliders size={18} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>
            Preferences & Mappings
          </h3>
        </div>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            margin: '0 0 1rem',
          }}
        >
          Manage custom inventory mappings and configure view options.
        </p>

        {onOpenActivityLog && (
          <div style={{ marginBottom: '1rem' }}>
            <button
              className="btn-secondary"
              onClick={onOpenActivityLog}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                alignItems: 'center',
                padding: '0.65rem 1rem',
                fontSize: '0.85rem',
                color: '#60a5fa',
                width: '100%',
              }}
            >
              <Activity size={16} /> Activity Audit Log
            </button>
          </div>
        )}

        <div
          style={{
            background: 'rgba(0,0,0,0.15)',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          >
            <input
              type="checkbox"
              checked={showTotalSetupValue}
              onChange={(e) => onToggleSetupValue(e.target.checked)}
              style={{
                width: '1.15rem',
                height: '1.15rem',
                accentColor: 'var(--accent)',
                cursor: 'pointer',
              }}
            />
            <span>
              Show <strong>Total Setup Value</strong> (Firearm + Mounted Accessories) on Firearm
              Details
            </span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <input
              type="checkbox"
              checked={showCollectionAnalytics}
              onChange={(e) => onToggleAnalytics(e.target.checked)}
              style={{
                width: '1.15rem',
                height: '1.15rem',
                accentColor: 'var(--accent)',
                cursor: 'pointer',
              }}
            />
            <span>
              Show <strong>Collection Value & Investment Analytics</strong> on Dashboard
            </span>
          </label>
        </div>
      </div>

      {/* App Version & Updates Section */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            ArmoryVault{' '}
            <span
              style={{
                background: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--accent)',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                marginLeft: '0.4rem',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              v{packageJson.version}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginTop: '0.2rem',
            }}
          >
            Desktop Edition &bull; Local Encrypted Storage
          </div>
        </div>
        <button
          className="btn-secondary"
          onClick={() => {
            if (window.api && window.api.openUrl) {
              window.api.openUrl('https://github.com/cook0001/ArmoryVault/releases/latest');
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.9rem',
            fontSize: '0.85rem',
          }}
        >
          <ExternalLink size={14} /> Releases & Updates
        </button>
      </div>
    </>
  );
};
