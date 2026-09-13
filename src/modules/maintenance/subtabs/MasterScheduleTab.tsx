import { Edit3, ExternalLink, Plus, Sparkles, Wrench } from 'lucide-react';
import React, { memo, useState } from 'react';
import type { Firearm, MaintenanceScheduleItem } from '@/types';
import { detectMaintenanceProfile } from '@/utils/maintenancePresets';

interface MasterScheduleTabProps {
  firearms: Firearm[];
  firearmProfilesMap: Map<number, ReturnType<typeof detectMaintenanceProfile>>;
  firearmRoundsMap: Map<number, number>;
  searchQuery: string;
  onOpenQuickService: (firearmId: number, taskId?: string, taskName?: string) => void;
  onApplyPreset: (firearm: Firearm) => Promise<void>;
  onSaveScheduleItem: (
    firearm: Firearm,
    taskId: string,
    rounds: number,
    days?: number
  ) => Promise<void>;
  onNavigateDetails: (id: number) => void;
}

export const MasterScheduleTab: React.FC<MasterScheduleTabProps> = memo(
  ({
    firearms,
    firearmProfilesMap,
    firearmRoundsMap,
    searchQuery,
    onOpenQuickService,
    onApplyPreset,
    onSaveScheduleItem,
    onNavigateDetails,
  }) => {
    // Inline editing schedule interval state
    const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
    const [editIntervalRounds, setEditIntervalRounds] = useState<string>('');
    const [editIntervalDays, setEditIntervalDays] = useState<string>('');

    const handleStartEditSchedule = (task: MaintenanceScheduleItem) => {
      setEditingScheduleId(task.id);
      setEditIntervalRounds(String(task.interval_rounds));
      setEditIntervalDays(task.interval_days ? String(task.interval_days) : '');
    };

    const handleSaveEditSchedule = async (firearm: Firearm, taskId: string) => {
      const rounds = Number.parseInt(editIntervalRounds, 10);
      const days = editIntervalDays.trim() ? Number.parseInt(editIntervalDays, 10) : undefined;
      if (Number.isNaN(rounds) || rounds <= 0) return;
      await onSaveScheduleItem(firearm, taskId, rounds, days);
      setEditingScheduleId(null);
    };

    if (firearms.length === 0) {
      return (
        <div
          className="card"
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <Wrench size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <p style={{ margin: 0 }}>
            {searchQuery
              ? `No firearms found matching "${searchQuery}" in the armory schedule.`
              : 'No firearms in the collection yet.'}
          </p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {firearms.map((firearm) => {
          const hasSchedules =
            firearm.maintenance_schedules && firearm.maintenance_schedules.length > 0;
          const detectedProfile =
            firearmProfilesMap.get(firearm.id!) || detectMaintenanceProfile(firearm);
          const totalRounds = firearmRoundsMap.get(firearm.id!) ?? 0;

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
              {/* Firearm Summary Header */}
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
                    {firearm.caliber} • SN: {firearm.serial_number || 'N/A'} • Total Rounds Fired:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {totalRounds.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {!hasSchedules && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => onApplyPreset(firearm)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.85rem',
                      }}
                    >
                      <Sparkles size={14} />
                      <span>Apply {detectedProfile.name} Preset</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onOpenQuickService(firearm.id!)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Service Log</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onNavigateDetails(firearm.id!)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>Details</span>
                  </button>
                </div>
              </div>

              {/* Schedule Tasks Table / List */}
              {!hasSchedules ? (
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    border: '1px dashed rgba(59, 130, 246, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: '0.2rem' }}>
                      No customized maintenance schedule configured
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Recommended preset based on specs: <strong>{detectedProfile.name}</strong> (
                      {detectedProfile.tasks.length} standard tasks).
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => onApplyPreset(firearm)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Initialize Schedule</span>
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--border-light)',
                          color: 'var(--text-secondary)',
                          textAlign: 'left',
                        }}
                      >
                        <th style={{ padding: '0.6rem' }}>Procedure / Task Name</th>
                        <th style={{ padding: '0.6rem' }}>User Interval (Rounds)</th>
                        <th style={{ padding: '0.6rem' }}>User Interval (Days)</th>
                        <th style={{ padding: '0.6rem' }}>Last Performed</th>
                        <th style={{ padding: '0.6rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {firearm.maintenance_schedules?.map((task) => {
                        const isEditing = editingScheduleId === task.id;

                        return (
                          <tr
                            key={task.id}
                            style={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            }}
                          >
                            <td style={{ padding: '0.6rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {task.task_name}
                              </div>
                              {task.notes && (
                                <div
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    marginTop: '0.1rem',
                                  }}
                                >
                                  {task.notes}
                                </div>
                              )}
                            </td>

                            {/* Interval Rounds (Inline Editable) */}
                            <td style={{ padding: '0.6rem' }}>
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="50"
                                  step="50"
                                  className="form-input"
                                  value={editIntervalRounds}
                                  onChange={(e) => setEditIntervalRounds(e.target.value)}
                                  style={{ width: '100px', padding: '0.25rem 0.5rem' }}
                                />
                              ) : (
                                <span>Every {task.interval_rounds.toLocaleString()} rds</span>
                              )}
                            </td>

                            {/* Interval Days (Inline Editable) */}
                            <td style={{ padding: '0.6rem' }}>
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Optional"
                                  className="form-input"
                                  value={editIntervalDays}
                                  onChange={(e) => setEditIntervalDays(e.target.value)}
                                  style={{ width: '100px', padding: '0.25rem 0.5rem' }}
                                />
                              ) : (
                                <span>
                                  {task.interval_days ? `Every ${task.interval_days} days` : '—'}
                                </span>
                              )}
                            </td>

                            {/* Last Performed Info */}
                            <td style={{ padding: '0.6rem', color: 'var(--text-secondary)' }}>
                              {task.last_performed_date || 'Not recorded yet'} (at{' '}
                              {(task.last_performed_rounds || 0).toLocaleString()} rds)
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                              {isEditing ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '0.4rem',
                                    justifyContent: 'flex-end',
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setEditingScheduleId(null)}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => handleSaveEditSchedule(firearm, task.id)}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '0.4rem',
                                    justifyContent: 'flex-end',
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => handleStartEditSchedule(task)}
                                    title="Edit Service Intervals"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() =>
                                      onOpenQuickService(firearm.id!, task.id, task.task_name)
                                    }
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                  >
                                    Log Service
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);
