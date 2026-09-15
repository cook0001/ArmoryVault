import { AlertTriangle, Blocks, CheckCircle, PlusCircle, Target, Trash2 } from 'lucide-react';
import React from 'react';
import type { Ammo, Firearm, ReloadingComponent, SyncItem } from '../../../types';

export interface SyncItemAdjustmentCardProps {
  item: SyncItem;
  ammoList: Ammo[];
  firearms: Firearm[];
  componentsList: ReloadingComponent[];
  isReloadingInstalled: boolean;
  onApprove: (item: SyncItem) => void;
  onDelete: (id: number) => void;
  onResolveAmmo: (upcOrId: string, count: number, syncItemId: number) => void;
  onResolveComponent: (upcOrId: string, count: number, syncItemId: number) => void;
  onInstallReloadingModule: () => void;
  getFirearmMaintenanceWarning: (
    firearm: Firearm,
    additionalRounds: number
  ) => {
    taskName: string;
    interval: number;
    projectedRounds: number;
    isOverdue: boolean;
  } | null;
}

export const SyncItemAdjustmentCard: React.FC<SyncItemAdjustmentCardProps> = ({
  item,
  ammoList,
  firearms,
  componentsList,
  isReloadingInstalled,
  onApprove,
  onDelete,
  onResolveAmmo,
  onResolveComponent,
  onInstallReloadingModule,
  getFirearmMaintenanceWarning,
}) => {
  const upcOrId = String(item.upcOrId);

  if (item.type === 'ammo_adjustment') {
    const ammo = ammoList.find((a) => String(a.id) === upcOrId || a.upc_code === upcOrId);

    return (
      <div
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
                background: 'rgba(56, 189, 248, 0.1)',
                color: '#38bdf8',
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              Ammo
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {new Date(item.timestamp).toLocaleString()}
            </span>
          </div>

          {ammo ? (
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
                {ammo.caliber} - {ammo.manufacturer}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                }}
              >
                Action:{' '}
                <strong
                  style={{
                    color: item.action === 'add' ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {item.action === 'add' ? 'ADD' : 'REMOVE'} {item.count} {item.measurement || ''}{' '}
                  rds
                </strong>
                <span style={{ opacity: 0.5, marginLeft: '0.5rem' }}>
                  (Current stock: {ammo.count})
                </span>
              </p>
              {(() => {
                const fId = Number(
                  (item as any).firearmId ||
                    (item as any).firearm_id ||
                    (item.data && ((item.data as any).firearmId || (item.data as any).firearm_id))
                );
                const matchedFirearm = fId ? firearms.find((f) => f.id === fId) : null;
                if (!matchedFirearm) return null;
                const warn = getFirearmMaintenanceWarning(matchedFirearm, Number(item.count) || 0);
                return (
                  <>
                    <div
                      style={{
                        marginTop: '0.35rem',
                        fontSize: '0.85rem',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Target size={13} />
                      <span>
                        Depleted via:{' '}
                        <strong>
                          {matchedFirearm.make} {matchedFirearm.model}
                        </strong>{' '}
                        (Round count: {matchedFirearm.round_count || 0} &rarr;{' '}
                        {(Number(matchedFirearm.round_count) || 0) + (Number(item.count) || 0)} rds)
                      </span>
                    </div>
                    {warn && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          color: '#fbbf24',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          marginTop: '5px',
                        }}
                      >
                        <AlertTriangle size={13} />
                        <span>
                          Service Due: {warn.taskName} ({warn.projectedRounds} rds reaches{' '}
                          {warn.interval} rd threshold)
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
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
                Unknown Barcode: {upcOrId}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                }}
              >
                Action:{' '}
                <strong
                  style={{
                    color: item.action === 'add' ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {item.action === 'add' ? 'ADD' : 'REMOVE'} {item.count} rds
                </strong>
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {ammo ? (
            <button className="btn-primary" onClick={() => onApprove(item)}>
              Approve
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => onResolveAmmo(upcOrId, item.count || 0, item.id!)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <PlusCircle size={16} /> Resolve &amp; Add
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

  if (item.type === 'component_adjustment') {
    if (!isReloadingInstalled) {
      return (
        <div
          className="card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem',
            borderLeft: '4px solid #c084fc',
            backgroundColor: 'rgba(30, 41, 59, 0.45)',
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
                  background: 'rgba(192, 132, 252, 0.15)',
                  color: '#c084fc',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                }}
              >
                Reloading Component
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  background: 'rgba(251, 191, 36, 0.15)',
                  color: '#fbbf24',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                Module Required
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {new Date(item.timestamp).toLocaleString()}
              </span>
            </div>

            <div>
              <h3
                style={{
                  fontSize: '1.05rem',
                  margin: '0 0 0.25rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#f8fafc',
                }}
              >
                <Blocks size={18} color="#c084fc" />
                Reloading Workbench Module Required
              </h3>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.4,
                }}
              >
                Mobile companion logged an adjustment for <strong>{upcOrId}</strong> (
                <strong
                  style={{
                    color: item.action === 'add' ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {item.action === 'add' ? 'ADD' : 'REMOVE'} {item.count}
                </strong>
                ). Install the Reloading Workbench module to view stock and apply this update.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn-primary"
              onClick={onInstallReloadingModule}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#8b5cf6',
                border: 'none',
                fontSize: '0.85rem',
              }}
            >
              <Blocks size={16} /> Install Module
            </button>
            <button
              className="btn-icon"
              onClick={() => onDelete(item.id!)}
              style={{ color: 'var(--danger)' }}
              title="Discard"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      );
    }

    const component = componentsList.find(
      (c) => String(c.id) === upcOrId || c.upc_code === upcOrId
    );

    return (
      <div
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
                background: 'rgba(139, 92, 246, 0.1)',
                color: '#8b5cf6',
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              Component
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {new Date(item.timestamp).toLocaleString()}
            </span>
          </div>

          {component ? (
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
                {component.name} - {component.manufacturer}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                }}
              >
                Action:{' '}
                <strong
                  style={{
                    color: item.action === 'add' ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {item.action === 'add' ? 'ADD' : 'REMOVE'} {item.count}
                </strong>
                <span style={{ opacity: 0.5, marginLeft: '0.5rem' }}>
                  (Current stock: {component.quantity})
                </span>
              </p>
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
                Unknown Barcode: {upcOrId}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                }}
              >
                Action:{' '}
                <strong
                  style={{
                    color: item.action === 'add' ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {item.action === 'add' ? 'ADD' : 'REMOVE'} {item.count}
                </strong>
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {component ? (
            <button className="btn-primary" onClick={() => onApprove(item)}>
              Approve
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => onResolveComponent(upcOrId, item.count || 0, item.id!)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <PlusCircle size={16} /> Resolve &amp; Add
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
