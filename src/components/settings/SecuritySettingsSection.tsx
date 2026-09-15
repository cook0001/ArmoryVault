import { Key, Lock, Shield } from 'lucide-react';
import React from 'react';

interface SecuritySettingsSectionProps {
  onOpenChangePassword: () => void;
  onOpenRecoveryKey: () => void;
}

export const SecuritySettingsSection: React.FC<SecuritySettingsSectionProps> = ({
  onOpenChangePassword,
  onOpenRecoveryKey,
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
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        <Shield size={18} style={{ color: 'var(--accent)' }} />
        <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>
          Vault Security & Encryption
        </h3>
      </div>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          margin: '0 0 1rem',
        }}
      >
        Update your master password or view and copy your 64-character offline emergency recovery
        key.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <button
          className="btn-secondary"
          onClick={onOpenChangePassword}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            alignItems: 'center',
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
          }}
        >
          <Key size={16} /> Change Master Password
        </button>
        <button
          className="btn-secondary"
          onClick={onOpenRecoveryKey}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            alignItems: 'center',
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
            color: '#60a5fa',
          }}
        >
          <Lock size={16} /> View Vault Recovery Key
        </button>
      </div>
    </div>
  );
};
