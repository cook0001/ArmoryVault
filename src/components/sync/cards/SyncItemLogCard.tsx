import { AlertTriangle, CheckCircle, Paperclip, Trash2 } from 'lucide-react';
import React from 'react';
import type { Firearm, SyncItem } from '../../../types';

export interface SyncItemLogCardProps {
  item: SyncItem;
  firearms: Firearm[];
  onApprove: (item: SyncItem) => void;
  onDelete: (id: number) => void;
}

export const SyncItemLogCard: React.FC<SyncItemLogCardProps> = ({
  item,
  firearms,
  onApprove,
  onDelete,
}) => {
  if (item.type === 'firearm_log') {
    const fId = Number((item as any).firearmId);
    const firearm = firearms.find((f) => f.id === fId);

    return (
      <div
        key={item.id}
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              Firearm Log
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {new Date(item.timestamp).toLocaleString()}
            </span>
          </div>

          {firearm ? (
            <div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  margin: '0 0 0.25rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle size={18} color="var(--success)" />
                {firearm.make} {firearm.model} {firearm.caliber ? `(${firearm.caliber})` : ''}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                }}
              >
                <strong>{(item as any).logType === 'range' ? 'Range Log' : 'Maintenance'}</strong> -{' '}
                {(item as any).roundCount > 0
                  ? `${(item as any).roundCount} Rounds Fired`
                  : 'No rounds recorded'}
              </p>
              {(item as any).notes && (
                <p
                  style={{
                    margin: '0.5rem 0 0 0',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                  }}
                >
                  "{(item as any).notes}"
                </p>
              )}
              {(item as any).photoBase64 && (
                <p
                  style={{
                    margin: '0.2rem 0 0 0',
                    color: 'var(--accent)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Paperclip size={13} /> Photo Attached
                </p>
              )}
            </div>
          ) : (
            <div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  margin: '0 0 0.25rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--warning)',
                }}
              >
                <AlertTriangle size={18} />
                Unknown Firearm ID: {fId}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                }}
              >
                Action: {(item as any).logType}
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {firearm && (
            <button className="btn-primary" onClick={() => onApprove(item)}>
              Approve
            </button>
          )}
          <button
            className="btn-icon"
            onClick={() => onDelete(item.id!)}
            style={{ color: 'var(--danger)' }}
            title="Delete"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (item.type === 'firearm_maintenance') {
    const fId = Number(item.firearm_id);
    const firearm = firearms.find((f) => f.id === fId);

    return (
      <div
        key={item.id}
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          background: 'rgba(56, 189, 248, 0.03)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              Firearm Maintenance
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {item.date || new Date(item.timestamp).toLocaleDateString()}
            </span>
          </div>

          <div>
            <h3
              style={{
                fontSize: '1.15rem',
                margin: '0 0 0.25rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle size={18} color="#38bdf8" />
              {firearm ? `${firearm.make} ${firearm.model}` : `Firearm #${fId}`}
            </h3>
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                marginTop: '0.25rem',
              }}
            >
              Service:{' '}
              <strong style={{ color: '#38bdf8' }}>
                {item.notes || (item as any).service_type || 'Service Performed'}
              </strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn-primary"
            onClick={() => onApprove(item)}
            style={{ background: 'var(--success)' }}
          >
            Approve
          </button>
          <button
            className="btn-icon"
            onClick={() => onDelete(item.id!)}
            style={{ color: 'var(--danger)' }}
            title="Decline / Delete"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
