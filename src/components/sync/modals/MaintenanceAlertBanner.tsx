import { AlertTriangle, X } from 'lucide-react';
import React from 'react';

export interface MaintenanceAlertBannerProps {
  maintenanceAlert: {
    firearmId: number;
    firearmName: string;
    taskName: string;
    projectedRounds: number;
  } | null;
  onDismiss: () => void;
  onRecordService: (alert: {
    firearmId: number;
    firearmName: string;
    taskName: string;
    projectedRounds: number;
  }) => void;
}

export const MaintenanceAlertBanner: React.FC<MaintenanceAlertBannerProps> = ({
  maintenanceAlert,
  onDismiss,
  onRecordService,
}) => {
  if (!maintenanceAlert) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.85rem 1.25rem',
        background: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        borderRadius: '10px',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <AlertTriangle size={20} color="#fbbf24" />
        <div>
          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
            Maintenance Threshold Reached: {maintenanceAlert.firearmName}
          </div>
          <div style={{ color: '#fbbf24', fontSize: '0.8rem' }}>
            Lifetime rounds reached {maintenanceAlert.projectedRounds} rds —{' '}
            {maintenanceAlert.taskName} is recommended.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          className="btn-primary"
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
          onClick={() => onRecordService(maintenanceAlert)}
        >
          Record Service Now
        </button>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
