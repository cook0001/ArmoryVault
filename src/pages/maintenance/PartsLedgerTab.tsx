import { Calendar, ExternalLink, History, Search } from 'lucide-react';
import React, { memo, useMemo } from 'react';
import type { Firearm, MaintenanceLog } from '../../types';

interface PartsLedgerTabProps {
  masterServiceHistory: { firearm: Firearm; log: MaintenanceLog }[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  historyTypeFilter: string;
  setHistoryTypeFilter: (val: string) => void;
  showCosts: boolean;
  onNavigateDetails: (id: number) => void;
}

export const PartsLedgerTab: React.FC<PartsLedgerTabProps> = memo(
  ({
    masterServiceHistory,
    searchQuery,
    setSearchQuery,
    historyTypeFilter,
    setHistoryTypeFilter,
    showCosts,
    onNavigateDetails,
  }) => {
    // Filtered service history computed inside tab
    const filteredServiceHistory = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      return masterServiceHistory.filter((item) => {
        const matchesSearch =
          !q ||
          item.firearm.make.toLowerCase().includes(q) ||
          item.firearm.model.toLowerCase().includes(q) ||
          item.firearm.serial_number?.toLowerCase().includes(q) ||
          item.log.repaired_part?.toLowerCase().includes(q) ||
          item.log.installed_part_details?.toLowerCase().includes(q) ||
          item.log.notes?.toLowerCase().includes(q);

        const matchesType = historyTypeFilter === 'all' || item.log.type === historyTypeFilter;

        return matchesSearch && matchesType;
      });
    }, [masterServiceHistory, searchQuery, historyTypeFilter]);

    const totalFilteredSpend = useMemo(() => {
      return filteredServiceHistory
        .reduce((sum, item) => sum + (Number(item.log.cost) || 0), 0)
        .toFixed(2);
    }, [filteredServiceHistory]);

    return (
      <div>
        {/* Sub-toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search parts, logs, or firearms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.2rem' }}
              />
            </div>

            <select
              className="form-input"
              value={historyTypeFilter}
              onChange={(e) => setHistoryTypeFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="all">All Categories</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Repair">Repair</option>
              <option value="Modification">Modification</option>
              <option value="Other">Inspection</option>
            </select>
          </div>

          {showCosts && (
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
              }}
            >
              Filtered Log Spend:{' '}
              <strong style={{ color: '#34d399', fontSize: '1.05rem' }}>
                ${totalFilteredSpend}
              </strong>
            </div>
          )}
        </div>

        {/* Ledger Table */}
        {filteredServiceHistory.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              border: '1px dashed var(--border-light)',
            }}
          >
            <History size={48} color="#64748b" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>No Service Logs Recorded</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
              Cleanings, repairs, and parts installations recorded via the Quick Service modal will
              populate here in chronological order.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderBottom: '1px solid var(--border-light)',
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                    }}
                  >
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Firearm</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Procedure / Part Details</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Notes</th>
                    {showCosts && (
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Cost</th>
                    )}
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServiceHistory.map(({ firearm, log }) => (
                    <tr
                      key={`log_${firearm.id}_${log.id}_${log.date}`}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} color="var(--text-secondary)" />
                          <span>{log.date}</span>
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {firearm.make} {firearm.model}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {firearm.caliber}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            backgroundColor:
                              log.type === 'Repair'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : log.type === 'Modification'
                                  ? 'rgba(168, 85, 247, 0.15)'
                                  : log.type === 'Cleaning'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : 'rgba(255, 255, 255, 0.08)',
                            color:
                              log.type === 'Repair'
                                ? '#f87171'
                                : log.type === 'Modification'
                                  ? '#c084fc'
                                  : log.type === 'Cleaning'
                                    ? '#34d399'
                                    : 'var(--text-secondary)',
                          }}
                        >
                          {log.type}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 500 }}>
                          {log.installed_part_details || log.repaired_part || 'Maintenance service'}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          color: 'var(--text-secondary)',
                          maxWidth: '280px',
                        }}
                      >
                        {log.notes || '—'}
                      </td>

                      {showCosts && (
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            fontWeight: 600,
                            color: log.cost ? '#34d399' : 'var(--text-secondary)',
                          }}
                        >
                          {log.cost ? `$${Number(log.cost).toFixed(2)}` : '—'}
                        </td>
                      )}

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            if (firearm.id != null) onNavigateDetails(firearm.id);
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <ExternalLink size={12} />
                          <span>Firearm</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PartsLedgerTab.displayName = 'PartsLedgerTab';
