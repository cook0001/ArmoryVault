import { FileText, Printer } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import { Accessory, Firearm } from '../../../types';
import { formatCurrency } from '../../../utils/currency';

interface GunsmithDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  firearm: Firearm;
  attachedAccessories: Accessory[];
}

export const GunsmithDossierModal: React.FC<GunsmithDossierModalProps> = ({
  isOpen,
  onClose,
  firearm,
  attachedAccessories,
}) => {
  if (!isOpen) return null;

  const totalRounds =
    firearm.logs
      ?.filter((l) => l.type === 'Range')
      .reduce((sum, l) => sum + (Number(l.rounds_fired) || 0), 0) || 0;
  const totalMaintCost = (firearm.logs || []).reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
  const totalCleanings = (firearm.logs || []).filter((l) => l.type === 'Cleaning').length;
  const totalMalfunctions = (firearm.logs || []).reduce(
    (sum, l) => sum + (Number(l.malfunctions) || 0),
    0
  );
  const reliability =
    totalRounds > 0
      ? (((totalRounds - totalMalfunctions) / totalRounds) * 100).toFixed(1)
      : '100.0';

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100100 }}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '980px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f172a',
          color: '#f8fafc',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={22} style={{ color: '#38bdf8' }} />
            <div>
              <h3 style={{ margin: 0 }}>Gunsmith Service Record & Dossier</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Complete provenance, round telemetry, service ledger, and mounted equipment.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Printer size={16} /> Print / Save PDF
            </button>
            <button className="btn-icon" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          id="printable-firearm-dossier"
          style={{
            overflowY: 'auto',
            flex: 1,
            padding: '1rem',
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '8px',
          }}
        >
          <style>{`
          @media print {
            body * { visibility: hidden; }
            #printable-firearm-dossier, #printable-firearm-dossier * { visibility: visible; }
            #printable-firearm-dossier { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; background: #ffffff !important; color: #000000 !important; }
          }
        `}</style>

          {/* Dossier Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a' }}>
                {firearm.make} {firearm.model}
              </h2>
              <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: '0.2rem' }}>
                Serial #: <strong>{firearm.serial_number || 'N/A'}</strong> &bull; Caliber:{' '}
                <strong>{firearm.caliber || 'N/A'}</strong> &bull; Action:{' '}
                <strong>{firearm.action_type || 'N/A'}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0284c7' }}>
                ARMORYVAULT DOSSIER
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Generated {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Telemetry Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                background: '#f1f5f9',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Lifetime Rounds
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                {totalRounds.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                background: '#f1f5f9',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Service Spend
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                ${totalMaintCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div
              style={{
                background: '#f1f5f9',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Cleanings Logged
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                {totalCleanings}
              </div>
            </div>
            <div
              style={{
                background: '#f1f5f9',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Reliability Rating
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>
                {reliability}%
              </div>
            </div>
          </div>

          {/* Specifications Table */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4
              style={{
                margin: '0 0 0.5rem',
                color: '#0f172a',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.3rem',
                fontSize: '1rem',
              }}
            >
              Firearm Specifications
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <strong>Barrel Length:</strong> {firearm.barrel_length || 'N/A'}
              </div>
              <div>
                <strong>Finish:</strong> {firearm.finish || 'N/A'}
              </div>
              <div>
                <strong>Condition:</strong> {firearm.condition || 'N/A'}
              </div>
              <div>
                <strong>Acquired:</strong> {firearm.purchase_date || 'N/A'}
              </div>
              <div>
                <strong>Purchase Price:</strong>{' '}
                {firearm.purchase_price != null ? formatCurrency(firearm.purchase_price) : 'N/A'}
              </div>
              {firearm.is_nfa && (
                <div>
                  <strong>NFA Type:</strong> {firearm.nfa_type || 'Yes'} (Stamp:{' '}
                  {firearm.stamp_status || 'Approved'})
                </div>
              )}
            </div>
          </div>

          {/* Active Maintenance Schedules */}
          {firearm.maintenance_schedules && firearm.maintenance_schedules.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4
                style={{
                  margin: '0 0 0.5rem',
                  color: '#0f172a',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '0.3rem',
                  fontSize: '1rem',
                }}
              >
                Active Service & Wear Schedules
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr
                    style={{
                      background: '#f1f5f9',
                      borderBottom: '1px solid #cbd5e1',
                      textAlign: 'left',
                    }}
                  >
                    <th style={{ padding: '0.4rem' }}>Task</th>
                    <th style={{ padding: '0.4rem' }}>Interval (Rds / Days)</th>
                    <th style={{ padding: '0.4rem' }}>Last Performed</th>
                    <th style={{ padding: '0.4rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {firearm.maintenance_schedules.map((s, idx) => {
                    const roundsSinceLast = Math.max(
                      0,
                      totalRounds - (s.last_performed_rounds || 0)
                    );
                    const isDue = roundsSinceLast >= s.interval_rounds;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.4rem' }}>
                          <strong>{s.task_name}</strong>
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          {s.interval_rounds.toLocaleString()} rds
                          {s.interval_days ? ` / ${s.interval_days}d` : ''}
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          {s.last_performed_rounds.toLocaleString()} rds (
                          {s.last_performed_date || 'N/A'})
                        </td>
                        <td
                          style={{
                            padding: '0.4rem',
                            color: isDue ? '#dc2626' : '#059669',
                            fontWeight: 600,
                          }}
                        >
                          {isDue ? 'SERVICE DUE' : 'GOOD'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Complete Service & Range Ledger */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4
              style={{
                margin: '0 0 0.5rem',
                color: '#0f172a',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.3rem',
                fontSize: '1rem',
              }}
            >
              Complete Service & Range Ledger
            </h4>
            {!firearm.logs || firearm.logs.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                No service or range events recorded yet.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr
                    style={{
                      background: '#f1f5f9',
                      borderBottom: '1px solid #cbd5e1',
                      textAlign: 'left',
                    }}
                  >
                    <th style={{ padding: '0.4rem' }}>Date</th>
                    <th style={{ padding: '0.4rem' }}>Event</th>
                    <th style={{ padding: '0.4rem' }}>Rounds</th>
                    <th style={{ padding: '0.4rem' }}>Part / Modification</th>
                    <th style={{ padding: '0.4rem' }}>Cost</th>
                    <th style={{ padding: '0.4rem' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {firearm.logs.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.4rem', whiteSpace: 'nowrap' }}>{log.date}</td>
                      <td style={{ padding: '0.4rem' }}>
                        <strong>{log.type}</strong>
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        {log.rounds_fired ? `${log.rounds_fired} rds` : '—'}
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        {log.installed_part_details || log.repaired_part || '—'}
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        {log.cost ? formatCurrency(log.cost) : '—'}
                      </td>
                      <td style={{ padding: '0.4rem', color: '#475569' }}>{log.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mounted Accessories & Optics */}
          {attachedAccessories.length > 0 && (
            <div>
              <h4
                style={{
                  margin: '0 0 0.5rem',
                  color: '#0f172a',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '0.3rem',
                  fontSize: '1rem',
                }}
              >
                Mounted Accessories, Optics & Suppressors
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr
                    style={{
                      background: '#f1f5f9',
                      borderBottom: '1px solid #cbd5e1',
                      textAlign: 'left',
                    }}
                  >
                    <th style={{ padding: '0.4rem' }}>Type</th>
                    <th style={{ padding: '0.4rem' }}>Manufacturer / Model</th>
                    <th style={{ padding: '0.4rem' }}>Serial #</th>
                    <th style={{ padding: '0.4rem' }}>Rounds on Gear</th>
                    <th style={{ padding: '0.4rem' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {attachedAccessories.map((acc, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.4rem' }}>{acc.type}</td>
                      <td style={{ padding: '0.4rem' }}>
                        <strong>
                          {acc.manufacturer} {acc.model}
                        </strong>
                      </td>
                      <td style={{ padding: '0.4rem' }}>{acc.serialNumber || 'N/A'}</td>
                      <td style={{ padding: '0.4rem' }}>
                        {acc.round_count ? `${acc.round_count.toLocaleString()} rds` : '0 rds'}
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        {acc.value != null ? formatCurrency(acc.value) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
