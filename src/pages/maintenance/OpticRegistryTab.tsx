import { Crosshair, Edit3, Info, Trash2 } from 'lucide-react';
import React, { memo, useMemo } from 'react';
import type { Firearm, OpticZeroRecord } from '../../types';

interface OpticRegistryTabProps {
  firearms: Firearm[];
  searchQuery: string;
  onOpenOpticModal: (firearm: Firearm, record?: OpticZeroRecord | null) => void;
  onDeleteOpticZero: (firearm: Firearm, recordId: string) => void;
}

export const OpticRegistryTab: React.FC<OpticRegistryTabProps> = memo(
  ({ firearms, searchQuery, onOpenOpticModal, onDeleteOpticZero }) => {
    const filteredFirearms = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return firearms;
      return firearms.filter((f) => {
        const basicMatch =
          f.make.toLowerCase().includes(q) ||
          f.model.toLowerCase().includes(q) ||
          f.serial_number?.toLowerCase().includes(q) ||
          f.caliber?.toLowerCase().includes(q);
        if (basicMatch) return true;
        return (f.optic_zero_records || []).some(
          (r) =>
            r.opticName?.toLowerCase().includes(q) ||
            r.zeroAmmo?.toLowerCase().includes(q) ||
            r.notes?.toLowerCase().includes(q)
        );
      });
    }, [firearms, searchQuery]);

    if (filteredFirearms.length === 0) {
      return (
        <div
          className="card"
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <Crosshair size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <p style={{ margin: 0 }}>
            {searchQuery
              ? `No firearms found matching "${searchQuery}" in the optic torque & zero registry.`
              : 'No firearms available in the armory.'}
          </p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {filteredFirearms.map((firearm) => {
          const records = firearm.optic_zero_records || [];

          return (
            <div
              key={firearm.id}
              className="card"
              style={{
                border: '1px solid var(--border-light)',
                padding: '1.5rem',
                borderRadius: '10px',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                    {firearm.make} {firearm.model}
                  </h3>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.2rem',
                    }}
                  >
                    {firearm.caliber} • SN: {firearm.serial_number || 'N/A'}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onOpenOpticModal(firearm, null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <Crosshair size={14} />
                  <span>Record Optic Zero & Torque</span>
                </button>
              </div>

              {/* Zero & Torque Records Grid */}
              {records.length === 0 ? (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Info size={16} />
                  <span>
                    No optic torque or zero verification records saved for this firearm yet.
                  </span>
                </div>
              ) : (
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {records.map((rec) => (
                    <div
                      key={rec.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '1rem', color: '#60a5fa' }}>
                            {rec.opticName}
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => onOpenOpticModal(firearm, rec)}
                              title="Edit Record"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => onDeleteOpticZero(firearm, rec.id)}
                              title="Delete Record"
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Torque Specifications Pill Row */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '0.5rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              padding: '0.4rem',
                              borderRadius: '4px',
                              background: 'rgba(56, 189, 248, 0.08)',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              Ring Caps
                            </div>
                            <div style={{ fontWeight: 600, color: '#38bdf8', fontSize: '0.85rem' }}>
                              {rec.ringTorqueInLbs !== undefined
                                ? `${rec.ringTorqueInLbs} in-lbs`
                                : '—'}
                            </div>
                          </div>

                          <div
                            style={{
                              padding: '0.4rem',
                              borderRadius: '4px',
                              background: 'rgba(56, 189, 248, 0.08)',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              Base Clamp
                            </div>
                            <div style={{ fontWeight: 600, color: '#38bdf8', fontSize: '0.85rem' }}>
                              {rec.baseTorqueInLbs !== undefined
                                ? `${rec.baseTorqueInLbs} in-lbs`
                                : '—'}
                            </div>
                          </div>

                          <div
                            style={{
                              padding: '0.4rem',
                              borderRadius: '4px',
                              background: 'rgba(56, 189, 248, 0.08)',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              Action Screws
                            </div>
                            <div style={{ fontWeight: 600, color: '#38bdf8', fontSize: '0.85rem' }}>
                              {rec.actionScrewTorqueInLbs !== undefined
                                ? `${rec.actionScrewTorqueInLbs} in-lbs`
                                : '—'}
                            </div>
                          </div>
                        </div>

                        {/* Zero Verification Info */}
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <div>
                            Zero Distance:{' '}
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {rec.zeroDistanceYards || 100} yds
                            </strong>
                          </div>
                          {rec.zeroAmmo && (
                            <div style={{ marginTop: '0.2rem' }}>
                              Zero Ammo:{' '}
                              <strong style={{ color: 'var(--text-primary)' }}>
                                {rec.zeroAmmo}
                              </strong>
                            </div>
                          )}
                          {rec.lastZeroDate && (
                            <div style={{ marginTop: '0.2rem' }}>
                              Confirmed: <span>{rec.lastZeroDate}</span>
                            </div>
                          )}
                          {rec.notes && (
                            <div
                              style={{
                                marginTop: '0.4rem',
                                fontSize: '0.75rem',
                                fontStyle: 'italic',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              "{rec.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

OpticRegistryTab.displayName = 'OpticRegistryTab';
