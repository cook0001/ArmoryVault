import { AlertTriangle, CheckCircle, FileText, Target, Trash2 } from 'lucide-react';
import React from 'react';
import type { Ammo, Firearm, SyncItem } from '../../../types';
import { ScopeIcon } from '../../CustomIcons';

export interface SyncItemSessionCardProps {
  item: SyncItem;
  firearms: Firearm[];
  ammoList: Ammo[];
  onApprove: (item: SyncItem) => void;
  onDelete: (id: number) => void;
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

export const SyncItemSessionCard: React.FC<SyncItemSessionCardProps> = ({
  item,
  firearms,
  ammoList,
  onApprove,
  onDelete,
  getFirearmMaintenanceWarning,
}) => {
  if (item.type === 'range_session') {
    const fId = Number(item.firearm_id);
    const firearm = firearms.find((f) => f.id === fId);
    const ammo = item.ammo_id ? ammoList.find((a) => a.id === Number(item.ammo_id)) : null;
    const rounds = item.rounds_fired || item.count || 0;

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
              Range Trip Session
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
              <CheckCircle size={18} color="var(--success)" />
              {firearm
                ? `${firearm.make} ${firearm.model} (${firearm.caliber})`
                : `Firearm #${fId}`}
            </h3>
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                marginTop: '0.25rem',
              }}
            >
              Fired: <strong style={{ color: 'var(--accent)' }}>{rounds} rounds</strong>
              {ammo && (
                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                  &bull; Ammo: {ammo.manufacturer || 'Custom'} {ammo.caliber}{' '}
                  {ammo.grain ? `${ammo.grain}gr` : ''} (Will deduct from stock: {ammo.count} rds)
                </span>
              )}
            </div>
            {firearm &&
              rounds > 0 &&
              (() => {
                const warn = getFirearmMaintenanceWarning(firearm, rounds);
                if (!warn) return null;
                return (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '0.4rem',
                      padding: '3px 8px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '6px',
                      color: '#fbbf24',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>
                      Service Due: {warn.taskName} ({warn.projectedRounds} rds reaches{' '}
                      {warn.interval} rd threshold)
                    </span>
                  </div>
                );
              })()}
            {item.group_metrics && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginTop: '0.5rem',
                  padding: '0.4rem 0.75rem',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '6px',
                }}
              >
                <span
                  style={{
                    color: '#34d399',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Target size={13} color="#34d399" />
                  <span>
                    {item.group_metrics.moa} MOA Group (
                    {item.group_metrics.extremeSpreadInches || item.group_metrics.extreme_spread_in}
                    ")
                  </span>
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {item.group_metrics.shotCount || item.group_metrics.shot_count} Shots &bull; Mean
                  Radius: {item.group_metrics.meanRadiusInches || item.group_metrics.mean_radius_in}
                  "
                </span>
              </div>
            )}

            {item.group_metrics?.turretAdjustment && (
              <div
                style={{
                  color: '#38bdf8',
                  fontSize: '0.8rem',
                  marginTop: '0.35rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ScopeIcon size={13} color="#38bdf8" />
                <span>
                  Scope Zero: Dial {item.group_metrics.turretAdjustment.elevationDirection}{' '}
                  {item.group_metrics.turretAdjustment.elevationClicks} clicks,{' '}
                  {item.group_metrics.turretAdjustment.windageDirection}{' '}
                  {item.group_metrics.turretAdjustment.windageClicks} clicks (
                  {item.group_metrics.turretAdjustment.clickUnitLabel})
                </span>
              </div>
            )}

            {item.notes && (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.35rem',
                  fontStyle: 'italic',
                }}
              >
                Notes: {item.notes}
              </div>
            )}

            {item.photoBase64 && (
              <div style={{ marginTop: '0.75rem' }}>
                <img
                  src={item.photoBase64}
                  alt="Target Grouping"
                  style={{
                    height: '80px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    objectFit: 'cover',
                  }}
                  onClick={() => window.open(item.photoBase64)}
                  title="Click to view full target"
                />
              </div>
            )}
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

  if (item.type === 'bill_of_sale_transfer') {
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
          background: 'rgba(16, 185, 129, 0.03)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
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
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              Private Bill of Sale
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {item.date || new Date(item.timestamp).toLocaleDateString()}
            </span>
            {item.transfer_id && (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {item.transfer_id}</span>
            )}
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
              <CheckCircle size={18} color="#10b981" />
              {firearm ? `${firearm.make} ${firearm.model}` : `Firearm #${fId}`}
              <span
                style={{
                  fontSize: '0.9rem',
                  color: '#10b981',
                  fontWeight: 'normal',
                }}
              >
                — Sold for ${item.sale_price || 0}
              </span>
            </h3>
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                marginTop: '0.25rem',
              }}
            >
              Buyer: <strong>{item.buyer_name || 'Buyer'}</strong> (DL:{' '}
              {item.buyer_dl || 'Verified'})
            </div>
            {item.pdf_base64 && (
              <div style={{ marginTop: '0.5rem' }}>
                <a
                  href={item.pdf_base64}
                  download={`BillOfSale_${item.transfer_id || 'transfer'}.pdf`}
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.3rem 0.7rem',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                  }}
                >
                  <FileText size={14} /> Download Signed PDF
                </a>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn-primary"
            onClick={() => onApprove(item)}
            style={{ background: 'var(--success)' }}
          >
            Approve &amp; Update Bound Book
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

  if (item.type === 'chrono_string') {
    const chrono = (item as any).chrono_data || item;
    const fId = Number(chrono.firearmId || chrono.firearm_id);
    const firearm = firearms.find((f) => f.id === fId);
    const shots = chrono.shotVelocities || [];
    const avg = chrono.averageVelocity || 0;
    const sd = chrono.standardDeviation || 0;
    const es = chrono.extremeSpread || 0;

    return (
      <div
        key={item.id}
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          background: 'rgba(245, 158, 11, 0.03)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
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
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              Chronograph Velocity String
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {chrono.date || (item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '')}
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
              <CheckCircle size={18} color="#f59e0b" />
              {firearm ? `${firearm.make} ${firearm.model}` : `Firearm #${fId || '?'}`}
              {chrono.ammoLabel && (
                <span
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 'normal',
                  }}
                >
                  — {chrono.ammoLabel}
                </span>
              )}
            </h3>

            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
              }}
            >
              <div>
                Shots: <strong style={{ color: '#f59e0b' }}>{shots.length}</strong>
              </div>
              <div>
                Avg: <strong style={{ color: '#34d399' }}>{avg} fps</strong>
              </div>
              <div>
                SD: <strong>{sd} fps</strong>
              </div>
              <div>
                ES: <strong>{es} fps</strong>
              </div>
              {chrono.temperature && (
                <div style={{ color: 'var(--text-secondary)' }}>Temp: {chrono.temperature}°F</div>
              )}
            </div>

            {chrono.notes && (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.35rem',
                  fontStyle: 'italic',
                }}
              >
                Notes: {chrono.notes}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn-primary"
            onClick={() => onApprove(item)}
            style={{ background: 'var(--success)' }}
          >
            Approve &amp; Record
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

  if (item.type === 'target_analysis') {
    const target = (item as any).target_data || item;
    const fId = Number(target.firearmId || target.firearm_id);
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
          background: 'rgba(52, 211, 153, 0.03)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
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
                background: 'rgba(52, 211, 153, 0.15)',
                color: '#34d399',
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              Target MOA Grouping Analysis
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {target.date || (item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '')}
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
              <Target size={18} color="#34d399" />
              {firearm ? `${firearm.make} ${firearm.model}` : `Firearm #${fId || '?'}`}
              <span
                style={{
                  fontSize: '0.9rem',
                  color: '#34d399',
                  fontWeight: 'bold',
                }}
              >
                —{' '}
                {target.groupMoa != null
                  ? `${target.groupMoa} MOA`
                  : target.moa != null
                    ? `${target.moa} MOA`
                    : `${target.extremeSpreadMoa || 0} MOA`}
              </span>
            </h3>

            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
              }}
            >
              <div>
                Distance:{' '}
                <strong>{target.distanceYards || target.distance_yards || 100} yds</strong>
              </div>
              <div>
                ES:{' '}
                <strong>
                  {target.extremeSpreadInches ||
                    target.extreme_spread_inches ||
                    target.extremeSpread ||
                    0}
                  "
                </strong>
              </div>
              {(target.meanRadius || target.mean_radius_inches) && (
                <div>
                  Mean Radius: <strong>{target.meanRadius || target.mean_radius_inches}"</strong>
                </div>
              )}
              {(target.shotCount || target.shot_count) && (
                <div>
                  Shots: <strong>{target.shotCount || target.shot_count}</strong>
                </div>
              )}
            </div>

            {target.turretAdjustment && (
              <div
                style={{
                  marginTop: '0.4rem',
                  fontSize: '0.85rem',
                  color: 'var(--accent)',
                }}
              >
                Scope Clicks:{' '}
                <strong>
                  {target.turretAdjustment.elevationClicks} clicks{' '}
                  {target.turretAdjustment.elevationDirection || 'UP'},{' '}
                  {target.turretAdjustment.windageClicks} clicks{' '}
                  {target.turretAdjustment.windageDirection || 'RIGHT'}
                </strong>
              </div>
            )}

            {target.photoBase64 && (
              <div style={{ marginTop: '0.75rem' }}>
                <img
                  src={target.photoBase64}
                  alt="Target Group"
                  style={{
                    height: '80px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    objectFit: 'cover',
                  }}
                  onClick={() => window.open(target.photoBase64)}
                  title="Click to view full target"
                />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn-primary"
            onClick={() => onApprove(item)}
            style={{ background: 'var(--success)' }}
          >
            Approve &amp; Save
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
