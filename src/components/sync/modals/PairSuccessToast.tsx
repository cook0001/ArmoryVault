import { CheckCircle2, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

export interface PairSuccessToastProps {
  pairSuccess: { deviceName: string; timestamp: number } | null;
  onDismiss: () => void;
}

export const PairSuccessToast: React.FC<PairSuccessToastProps> = ({ pairSuccess, onDismiss }) => {
  if (!pairSuccess) return null;

  return createPortal(
    <div className="toast-floating-container">
      <div className="toast-success-card">
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle2 size={28} style={{ color: '#10b981' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            Device Paired Successfully!
          </div>
          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginTop: '0.15rem',
            }}
          >
            <strong>{pairSuccess.deviceName}</strong> is now securely linked to ArmoryVault.
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="btn-icon"
          style={{ padding: '0.25rem', color: 'var(--text-secondary)' }}
          title="Dismiss"
        >
          <X size={16} />
        </button>
        <div className="toast-progress-bar" />
      </div>
    </div>,
    document.body
  );
};
