import {
  Activity,
  Calendar,
  Crosshair,
  Filter,
  Laptop,
  Layers,
  Package,
  PlusCircle,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  Tag,
  Target,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityLogEntry } from '../types';
import { AccessoriesNavIcon, CartridgesIcon, GunpowderIcon, HandgunIcon } from './CustomIcons';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterCategory =
  | 'all'
  | 'firearm'
  | 'ammo'
  | 'accessory'
  | 'component'
  | 'range_session'
  | 'manufacture';

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [displayLimit, setDisplayLimit] = useState(50);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      if (window.api?.getActivityLog) {
        const data = await window.api.getActivityLog();
        setLogs(Array.isArray(data) ? [...data].reverse() : []);
      }
    } catch (e) {
      console.error('Failed to load activity logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesCategory =
        filter === 'all' || log.entityType === filter || log.action === filter;

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (log.detail && log.detail.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.entityType && log.entityType.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [logs, filter, search]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'add':
        return {
          icon: <PlusCircle size={14} className="text-emerald-400" />,
          label: 'Added',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.3)',
          text: '#34d399',
        };
      case 'delete':
        return {
          icon: <Trash2 size={14} className="text-rose-400" />,
          label: 'Deleted',
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.3)',
          text: '#f87171',
        };
      case 'range_session':
        return {
          icon: <Target size={14} className="text-amber-400" />,
          label: 'Range Log',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.3)',
          text: '#fbbf24',
        };
      case 'manufacture':
        return {
          icon: <Wrench size={14} className="text-cyan-400" />,
          label: 'Manufactured',
          bg: 'rgba(6, 182, 212, 0.12)',
          border: 'rgba(6, 182, 212, 0.3)',
          text: '#22d3ee',
        };
      default:
        return {
          icon: <Activity size={14} className="text-blue-400" />,
          label: action,
          bg: 'rgba(59, 130, 246, 0.12)',
          border: 'rgba(59, 130, 246, 0.3)',
          text: '#60a5fa',
        };
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'firearm':
        return <HandgunIcon size={14} />;
      case 'ammo':
        return <CartridgesIcon size={14} />;
      case 'accessory':
        return <AccessoriesNavIcon size={14} />;
      case 'component':
        return <GunpowderIcon size={14} />;
      default:
        return <Package size={14} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content activity-log-modal"
        style={{
          maxWidth: '800px',
          width: '90%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Activity size={20} />
            </div>
            <div>
              <h2 className="modal-title" style={{ margin: 0 }}>
                Activity Audit Log
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Encrypted local timeline of vault mutations and operations ({logs.length} total
                entries)
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Filters & Search */}
        <div
          style={{
            padding: '16px 20px 12px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                }}
              />
              <input
                type="text"
                placeholder="Search activity events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={loadLogs}
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
              }}
              title="Refresh logs"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { id: 'all', label: 'All Events' },
              { id: 'firearm', label: 'Firearms' },
              { id: 'ammo', label: 'Ammo' },
              { id: 'accessory', label: 'Accessories' },
              { id: 'component', label: 'Components' },
              { id: 'range_session', label: 'Range' },
              { id: 'manufacture', label: 'Handloads' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setFilter(chip.id as FilterCategory)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  border: '1px solid',
                  borderColor: filter === chip.id ? 'var(--accent)' : 'var(--border-color)',
                  backgroundColor:
                    filter === chip.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: filter === chip.id ? '#60a5fa' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Log Stream Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {filteredLogs.length === 0 ? (
            <div
              style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}
            >
              <Activity size={32} style={{ opacity: 0.3, margin: '0 auto 12px auto' }} />
              <p style={{ margin: 0, fontSize: 14 }}>
                {search ? `No activity events match "${search}"` : 'No activity logged yet.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredLogs.slice(0, displayLimit).map((entry, idx) => {
                const badge = getActionBadge(entry.action);
                const entityIcon = getEntityIcon(entry.entityType);
                const timeStr = entry.timestamp
                  ? new Date(entry.timestamp).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Unknown time';

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Action Icon Badge */}
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        backgroundColor: badge.bg,
                        border: `1px solid ${badge.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: badge.text,
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </div>

                    {/* Entity Icon & Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}
                      >
                        <span
                          style={{
                            color: 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          {entityIcon}
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            wordBreak: 'break-word',
                          }}
                        >
                          {entry.detail || `${entry.entityType} #${entry.entityId || ''}`}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} />
                          {timeStr}
                        </span>
                        {entry.source && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              textTransform: 'capitalize',
                              opacity: 0.75,
                            }}
                          >
                            {entry.source === 'mobile' ? (
                              <Smartphone size={12} />
                            ) : (
                              <Laptop size={12} />
                            )}
                            {entry.source}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredLogs.length > displayLimit && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setDisplayLimit((prev) => prev + 50)}
                  style={{ width: '100%', marginTop: 8, padding: '10px 0', fontSize: 13 }}
                >
                  Load More Events ({filteredLogs.length - displayLimit} remaining)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            borderTop: '1px solid var(--border-color)',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Showing {Math.min(filteredLogs.length, displayLimit)} of {filteredLogs.length} events
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
