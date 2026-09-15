import { AlertTriangle, CheckCircle, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import React from 'react';
import type { Firearm, SyncItem } from '../../../types';

export interface SyncItemMediaCardProps {
  item: SyncItem;
  firearms: Firearm[];
  isResolving: boolean;
  onResolveUniversal: (item: SyncItem) => void;
  onApprove: (item: SyncItem) => void;
  onDelete: (id: number) => void;
}

export const SyncItemMediaCard: React.FC<SyncItemMediaCardProps> = ({
  item,
  firearms,
  isResolving,
  onResolveUniversal,
  onApprove,
  onDelete,
}) => {
  if (item.type === 'universal_scan') {
    const upcOrId = String(item.upcOrId);
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
                background: 'rgba(234, 179, 8, 0.1)',
                color: '#eab308',
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              Universal Scan
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {new Date(item.timestamp).toLocaleString()}
            </span>
          </div>
          <div>
            <h3
              style={{
                fontSize: '1.1rem',
                margin: '0 0 0.25rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--accent)',
              }}
            >
              <AlertTriangle size={18} />
              Uncategorized Barcode: {upcOrId}
            </h3>
            <p
              style={{
                margin: 0,
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
              }}
            >
              Sent from mobile scanner. Click Resolve to look it up.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn-primary"
            onClick={() => onResolveUniversal(item)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            disabled={isResolving}
          >
            {isResolving ? <RefreshCw size={16} className="spin" /> : <PlusCircle size={16} />}
            {isResolving ? 'Resolving...' : 'Resolve & Add'}
          </button>
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

  if (item.type === 'firearm_photo') {
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
                background: 'rgba(168, 85, 247, 0.1)',
                color: '#a855f7',
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              Firearm Photo
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {new Date(item.timestamp).toLocaleString()}
            </span>
          </div>

          {firearm ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {(item as any).photoBase64 && (
                <img
                  src={(item as any).photoBase64}
                  alt="Preview"
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid var(--border-light)',
                  }}
                />
              )}
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
                  New photo for inspection gallery
                </p>
              </div>
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
                Action: Add Photo
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

  return null;
};
