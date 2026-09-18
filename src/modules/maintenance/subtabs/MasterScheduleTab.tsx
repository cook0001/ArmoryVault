import {
  Check,
  Edit3,
  ExternalLink,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
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
  onAddTask?: (
    firearm: Firearm,
    task: { task_name: string; interval_rounds: number; interval_days?: number; notes?: string }
  ) => Promise<void>;
  onDeleteTask?: (firearm: Firearm, taskId: string) => Promise<void>;
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
    onAddTask,
    onDeleteTask,
    onNavigateDetails,
  }) => {
    // Inline editing schedule interval state
    const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
    const [editIntervalRounds, setEditIntervalRounds] = useState<string>('');
    const [editIntervalDays, setEditIntervalDays] = useState<string>('');

    // Add task form state
    const [addingFirearmId, setAddingFirearmId] = useState<number | null>(null);
    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskRounds, setNewTaskRounds] = useState('500');
    const [newTaskDays, setNewTaskDays] = useState('');
    const [newTaskNotes, setNewTaskNotes] = useState('');
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);

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

    const handleSaveNewTask = async (firearm: Firearm) => {
      if (!newTaskName.trim() || !onAddTask) return;
      const rounds = Number.parseInt(newTaskRounds, 10);
      if (Number.isNaN(rounds) || rounds <= 0) return;
      const days = newTaskDays.trim() ? Number.parseInt(newTaskDays, 10) : undefined;

      setIsSubmittingTask(true);
      try {
        await onAddTask(firearm, {
          task_name: newTaskName.trim(),
          interval_rounds: rounds,
          interval_days: days,
          notes: newTaskNotes.trim() || undefined,
        });
        setAddingFirearmId(null);
        setNewTaskName('');
        setNewTaskRounds('500');
        setNewTaskDays('');
        setNewTaskNotes('');
      } finally {
        setIsSubmittingTask(false);
      }
    };

    const handleDeleteTaskConfirm = async (firearm: Firearm, task: MaintenanceScheduleItem) => {
      if (!onDeleteTask) return;
      if (window.confirm(`Delete scheduled task "${task.task_name}" from ${firearm.make} ${firearm.model}?`)) {
        await onDeleteTask(firearm, task.id);
      }
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
          const isAddingTask = addingFirearmId === firearm.id;

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
                    {detectedProfile && (
                      <span style={{ marginLeft: '0.6rem', color: 'var(--accent)', fontWeight: 500 }}>
                        [{detectedProfile.name}]
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {!hasSchedules ? (
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
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Re-apply the recommended ${detectedProfile.name} preset? This will refresh default factory intervals.`
                            )
                          ) {
                            onApplyPreset(firearm);
                          }
                        }}
                        title={`Reset to standard ${detectedProfile.name} tasks`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.8rem',
                        }}
                      >
                        <RotateCcw size={13} />
                        <span>Reset Preset</span>
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setAddingFirearmId(isAddingTask ? null : firearm.id!)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        <Plus size={14} />
                        <span>Add Task</span>
                      </button>
                    </>
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

              {/* Inline Add Task Form */}
              {isAddingTask && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-card-secondary, rgba(255, 255, 255, 0.03))',
                    border: '1px solid var(--accent, #3b82f6)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Add New Maintenance Task for {firearm.make} {firearm.model}
                    </div>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setAddingFirearmId(null)}
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                        Task / Procedure Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Clean Gas Block & Regulator"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        className="form-input"
                        style={{ width: '100%' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                        Round Interval *
                      </label>
                      <input
                        type="number"
                        min="25"
                        step="25"
                        placeholder="e.g., 500"
                        value={newTaskRounds}
                        onChange={(e) => setNewTaskRounds(e.target.value)}
                        className="form-input"
                        style={{ width: '100%' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                        Day Interval (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g., 90"
                        value={newTaskDays}
                        onChange={(e) => setNewTaskDays(e.target.value)}
                        className="form-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                      Armorer Notes / Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Inspect carbon build-up on exhaust vents; torque screws to 25 in-lbs."
                      value={newTaskNotes}
                      onChange={(e) => setNewTaskNotes(e.target.value)}
                      className="form-input"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setAddingFirearmId(null)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleSaveNewTask(firearm)}
                      disabled={!newTaskName.trim() || isSubmittingTask}
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Check size={14} />
                      <span>Save Task</span>
                    </button>
                  </div>
                </div>
              )}

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
                                    alignItems: 'center',
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

                                  {onDeleteTask && (
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      onClick={() => handleDeleteTaskConfirm(firearm, task)}
                                      title="Delete Scheduled Task"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger, #ef4444)' }}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}

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
