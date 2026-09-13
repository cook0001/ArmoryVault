import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  ShieldCheck,
} from 'lucide-react';
import React, { memo } from 'react';
import type { ServiceTaskEntry } from './types';

interface ServiceBoardTabProps {
  tasks: ServiceTaskEntry[];
  allTasksCount: number;
  overdueCount: number;
  dueSoonCount: number;
  goodStandingCount: number;
  statusFilter: 'all' | 'overdue' | 'due_soon' | 'good';
  setStatusFilter: (val: 'all' | 'overdue' | 'due_soon' | 'good') => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onOpenQuickService: (firearmId: number, taskId?: string, taskName?: string) => void;
  onNavigateDetails: (id: number) => void;
}

export const ServiceBoardTab: React.FC<ServiceBoardTabProps> = memo(
  ({
    tasks,
    allTasksCount,
    overdueCount,
    dueSoonCount,
    goodStandingCount,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    onOpenQuickService,
    onNavigateDetails,
  }) => {
    return (
      <div>
        {/* Sub-toolbar: Search & Filter Chips */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Filter chips */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`badge-filter ${statusFilter === 'all' ? 'active' : ''}`}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                border: '1px solid var(--border-light)',
                background: statusFilter === 'all' ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                color: statusFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.85rem',
              }}
              onClick={() => setStatusFilter('all')}
            >
              All Tasks ({allTasksCount})
            </button>
            <button
              type="button"
              className={`badge-filter ${statusFilter === 'overdue' ? 'active' : ''}`}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background:
                  statusFilter === 'overdue' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(239, 68, 68, 0.1)',
                color: statusFilter === 'overdue' ? '#fff' : '#f87171',
                fontSize: '0.85rem',
              }}
              onClick={() => setStatusFilter('overdue')}
            >
              Overdue ({overdueCount})
            </button>
            <button
              type="button"
              className={`badge-filter ${statusFilter === 'due_soon' ? 'active' : ''}`}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                background:
                  statusFilter === 'due_soon'
                    ? 'rgba(245, 158, 11, 0.9)'
                    : 'rgba(245, 158, 11, 0.1)',
                color: statusFilter === 'due_soon' ? '#fff' : '#fbbf24',
                fontSize: '0.85rem',
              }}
              onClick={() => setStatusFilter('due_soon')}
            >
              Due Soon ({dueSoonCount})
            </button>
            <button
              type="button"
              className={`badge-filter ${statusFilter === 'good' ? 'active' : ''}`}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background:
                  statusFilter === 'good' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(16, 185, 129, 0.1)',
                color: statusFilter === 'good' ? '#fff' : '#34d399',
                fontSize: '0.85rem',
              }}
              onClick={() => setStatusFilter('good')}
            >
              Good Standing ({goodStandingCount})
            </button>
          </div>

          {/* Search Input */}
          <div
            style={{
              position: 'relative',
              minWidth: '260px',
            }}
          >
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
              placeholder="Search firearm or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.2rem', width: '100%' }}
            />
          </div>
        </div>

        {/* Task Cards Grid */}
        {tasks.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              border: '1px dashed var(--border-light)',
            }}
          >
            <ShieldCheck size={48} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>All Clear!</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
              {searchQuery
                ? 'No tasks matched your search query.'
                : statusFilter !== 'all'
                  ? `No tasks currently in ${statusFilter.replace('_', ' ')} status.`
                  : 'No scheduled tasks found. Configure schedules in the Master Armory Schedule tab.'}
            </p>
          </div>
        ) : (
          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {tasks.map((entry) => {
              const statusColor = entry.isOverdue
                ? '#ef4444'
                : entry.isDueSoon
                  ? '#f59e0b'
                  : '#10b981';
              const statusBg = entry.isOverdue
                ? 'rgba(239, 68, 68, 0.08)'
                : entry.isDueSoon
                  ? 'rgba(245, 158, 11, 0.08)'
                  : 'rgba(16, 185, 129, 0.04)';
              const statusBorder = entry.isOverdue
                ? 'rgba(239, 68, 68, 0.4)'
                : entry.isDueSoon
                  ? 'rgba(245, 158, 11, 0.4)'
                  : 'var(--border-light)';

              return (
                <div
                  key={`${entry.firearm.id}_${entry.task.id}`}
                  className="card"
                  style={{
                    border: `1px solid ${statusBorder}`,
                    background: statusBg,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.25rem',
                    borderRadius: '10px',
                  }}
                >
                  <div>
                    {/* Card Header: Firearm & Status Badge */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.75rem',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {entry.firearm.make} {entry.firearm.model}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {entry.firearm.caliber} • SN: {entry.firearm.serial_number || 'N/A'}
                        </div>
                      </div>

                      {/* Status Chip */}
                      <div
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backgroundColor: entry.isOverdue
                            ? 'rgba(239, 68, 68, 0.2)'
                            : entry.isDueSoon
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(16, 185, 129, 0.2)',
                          color: statusColor,
                        }}
                      >
                        {entry.isOverdue ? (
                          <>
                            <AlertTriangle size={12} /> Overdue
                          </>
                        ) : entry.isDueSoon ? (
                          <>
                            <Clock size={12} /> Due Soon
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={12} /> Up-to-Date
                          </>
                        )}
                      </div>
                    </div>

                    {/* Task Name & Interval Badge */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: statusColor,
                          marginBottom: '0.2rem',
                        }}
                      >
                        {entry.task.task_name}
                      </div>
                      {entry.task.notes && (
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.5rem',
                          }}
                        >
                          {entry.task.notes}
                        </div>
                      )}

                      {/* User-Set Interval Badges */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          Interval: {entry.task.interval_rounds.toLocaleString()} rds
                        </span>
                        {entry.task.interval_days && (
                          <span
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.06)',
                            }}
                          >
                            Interval: {entry.task.interval_days} days
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Metrics & Bar */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.8rem',
                          marginBottom: '0.35rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span>
                          {entry.roundsSince} / {entry.task.interval_rounds} rds fired
                        </span>
                        <span style={{ fontWeight: 600, color: statusColor }}>
                          {entry.roundProgress}%
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, entry.roundProgress)}%`,
                            height: '100%',
                            backgroundColor: statusColor,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>

                      {entry.daysSince !== -1 && entry.task.interval_days && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.4rem',
                          }}
                        >
                          {entry.daysSince} days elapsed since last service
                          {entry.task.last_performed_date && ` (${entry.task.last_performed_date})`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => onNavigateDetails(entry.firearm.id!)}
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.35rem 0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Firearm</span>
                    </button>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() =>
                        onOpenQuickService(entry.firearm.id!, entry.task.id, entry.task.task_name)
                      }
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.35rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <CheckCircle size={14} />
                      <span>Log Service</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);
