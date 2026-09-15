import { CheckCircle, Edit3, Shield, Trash2 } from 'lucide-react';
import React from 'react';
import type { Firearm, SyncItem } from '../../../types';

export interface SyncItemFirearmCardProps {
  item: SyncItem;
  firearms: Firearm[];
  onApprove: (item: SyncItem) => void;
  onDelete: (id: number) => void;
  onEdit: (data: any, syncItemId: number, existingFirearmId?: number) => void;
}

export const SyncItemFirearmCard: React.FC<SyncItemFirearmCardProps> = ({
  item,
  firearms,
  onApprove,
  onDelete,
  onEdit,
}) => {
  if (item.type === 'new_firearm') {
    const data: any = item.data || item;
    const make = data.make || 'Unknown Make';
    const model = data.model || 'Unknown Model';
    const caliber = data.caliber || '';
    const serial = data.serial_number || '';
    const hasPhoto = data.photoBase64 || (data.photosBase64 && data.photosBase64.length > 0);
    const photoSrc = data.photoBase64 || (data.photosBase64 && data.photosBase64[0]);

    return (
      <div
        key={item.id}
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          gap: '1rem',
        }}
      >
        {hasPhoto && photoSrc && (
          <img
            src={photoSrc}
            alt={`${make} ${model}`}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '1px solid var(--border)',
              backgroundColor: 'rgba(0,0,0,0.2)',
            }}
          />
        )}

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
              New Firearm
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {new Date(item.timestamp).toLocaleString()}
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
              <Shield size={18} color="#38bdf8" />
              {make} {model} {caliber ? `• ${caliber}` : ''}
            </h3>
            <p
              style={{
                margin: 0,
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
              }}
            >
              {serial ? `S/N: ${serial} ` : ''}
              {data.type ? `• Type: ${data.type} ` : ''}
              {data.action ? `• Action: ${data.action} ` : ''}
              {hasPhoto ? '• Photo Attached ' : ''}
            </p>
            {data.notes && (
              <p
                style={{
                  margin: '0.4rem 0 0 0',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontStyle: 'italic',
                }}
              >
                "{data.notes}"
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn-primary"
            onClick={() => onApprove(item)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <CheckCircle size={16} /> Approve &amp; Add to Vault
          </button>
          <button
            className="btn-secondary"
            onClick={() => onEdit(data, item.id!)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Edit3 size={15} /> Review &amp; Edit
          </button>
          <button
            className="btn-icon"
            onClick={() => onDelete(item.id!)}
            style={{ color: 'var(--danger)' }}
            title="Dismiss"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (item.type === 'firearm_update') {
    const data: any = item.data || item;
    const fId = Number(data.firearmId || (item as any).firearmId);
    const serial = data.serial_number || '';
    const firearm = firearms.find(
      (f) =>
        (fId && f.id === fId) ||
        (serial &&
          f.serial_number &&
          f.serial_number.trim().toLowerCase() === serial.trim().toLowerCase())
    );
    const make = data.make || firearm?.make || 'Firearm';
    const model = data.model || firearm?.model || '';
    const hasPhoto = data.photoBase64 || (data.photosBase64 && data.photosBase64.length > 0);
    const photoSrc = data.photoBase64 || (data.photosBase64 && data.photosBase64[0]);

    return (
      <div
        key={item.id}
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          gap: '1rem',
        }}
      >
        {hasPhoto && photoSrc && (
          <img
            src={photoSrc}
            alt={`${make} ${model}`}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '1px solid var(--border)',
              backgroundColor: 'rgba(0,0,0,0.2)',
            }}
          />
        )}

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
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              Firearm Spec Update
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {new Date(item.timestamp).toLocaleString()}
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
              <Shield size={18} color="#f59e0b" />
              {make} {model} {data.caliber ? `• ${data.caliber}` : ''}
            </h3>
            <p
              style={{
                margin: 0,
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
              }}
            >
              {serial ? `S/N: ${serial} ` : ''}
              {data.condition ? `• Condition: ${data.condition} ` : ''}
              {hasPhoto ? '• New Photo Attached ' : ''}
            </p>
            {data.notes && (
              <p
                style={{
                  margin: '0.4rem 0 0 0',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontStyle: 'italic',
                }}
              >
                "{data.notes}"
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn-primary"
            onClick={() => onApprove(item)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <CheckCircle size={16} /> {firearm ? 'Apply Update' : 'Add to Vault'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => onEdit(data, item.id!, firearm?.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Edit3 size={15} /> Review &amp; Edit
          </button>
          <button
            className="btn-icon"
            onClick={() => onDelete(item.id!)}
            style={{ color: 'var(--danger)' }}
            title="Dismiss"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
