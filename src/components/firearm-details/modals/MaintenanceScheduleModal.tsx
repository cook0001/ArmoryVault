import { Wrench, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Firearm, MaintenanceScheduleItem } from '../../../types';

export interface ScheduleFormData {
  id?: string;
  task_name: string;
  interval_rounds: number;
  enableDays?: boolean;
  interval_days?: number;
  notes?: string;
}

interface MaintenanceScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  firearm: Firearm;
  editingScheduleId: string | null;
  initialForm?: ScheduleFormData;
  onScheduleSaved: (updatedFirearm: Firearm) => void;
}

export const MaintenanceScheduleModal: React.FC<MaintenanceScheduleModalProps> = ({
  isOpen,
  onClose,
  firearm,
  editingScheduleId,
  initialForm,
  onScheduleSaved,
}) => {
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormData>({
    task_name: '',
    interval_rounds: 3000,
    enableDays: false,
    interval_days: 90,
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (initialForm) {
        setScheduleForm(initialForm);
      } else {
        setScheduleForm({
          task_name: '',
          interval_rounds: 3000,
          enableDays: false,
          interval_days: 90,
          notes: '',
        });
      }
    }
  }, [isOpen, initialForm]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firearm || !scheduleForm.task_name.trim()) return;

    const totalRounds =
      firearm.logs
        ?.filter((l) => l.type === 'Range')
        .reduce((sum, l) => sum + (Number(l.rounds_fired) || 0), 0) || 0;
    const currentSchedules = [...(firearm.maintenance_schedules || [])];
    const intervalDays =
      scheduleForm.enableDays && scheduleForm.interval_days
        ? Number(scheduleForm.interval_days)
        : undefined;

    if (editingScheduleId) {
      const idx = currentSchedules.findIndex((s) => s.id === editingScheduleId);
      if (idx !== -1) {
        currentSchedules[idx] = {
          ...currentSchedules[idx],
          task_name: scheduleForm.task_name,
          interval_rounds: Number(scheduleForm.interval_rounds) || 3000,
          interval_days: intervalDays,
          notes: scheduleForm.notes,
        };
      }
    } else {
      currentSchedules.push({
        id: `sched_${Date.now()}`,
        task_name: scheduleForm.task_name,
        interval_rounds: Number(scheduleForm.interval_rounds) || 3000,
        interval_days: intervalDays,
        last_performed_rounds: totalRounds,
        last_performed_date: new Date().toISOString().split('T')[0],
        notes: scheduleForm.notes,
      });
    }

    const updated = { ...firearm, maintenance_schedules: currentSchedules };
    await window.api.updateFirearm(firearm.id!, updated);
    onScheduleSaved(updated);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={20} style={{ color: 'var(--accent)' }} />
            <h3 style={{ margin: 0 }}>
              {editingScheduleId ? 'Edit Maintenance Schedule' : 'New Maintenance Schedule'}
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Task Name / Action *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Replace Extractor & Spring, Detail Clean, Recoil Spring"
              value={scheduleForm.task_name}
              onChange={(e) => setScheduleForm({ ...scheduleForm, task_name: e.target.value })}
              required
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Service Interval (Rounds) *
            </label>
            <input
              type="number"
              min="50"
              step="50"
              className="form-input"
              placeholder="e.g. 3000"
              value={scheduleForm.interval_rounds}
              onChange={(e) =>
                setScheduleForm({
                  ...scheduleForm,
                  interval_rounds: parseInt(e.target.value) || 0,
                })
              }
              required
            />
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginTop: '0.3rem',
              }}
            >
              Alerts will trigger every {scheduleForm.interval_rounds || 0} rounds fired through
              this firearm.
            </div>
          </div>

          {/* Time Interval Option */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              <input
                type="checkbox"
                checked={scheduleForm.enableDays || false}
                onChange={(e) => setScheduleForm({ ...scheduleForm, enableDays: e.target.checked })}
              />
              Also trigger on elapsed time (Days)
            </label>
            {scheduleForm.enableDays && (
              <div style={{ marginTop: '0.75rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.4rem',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  Service Interval (Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="form-input"
                  placeholder="e.g. 90, 180, 365"
                  value={scheduleForm.interval_days || ''}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      interval_days: parseInt(e.target.value) || 0,
                    })
                  }
                  required={scheduleForm.enableDays}
                />
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.3rem',
                  }}
                >
                  Task will alert when <strong>either</strong> {scheduleForm.interval_rounds || 0}{' '}
                  rounds OR {scheduleForm.interval_days || 0} days have elapsed.
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              Notes / Part Recommendations (Optional)
            </label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g. Apex Tactical HD extractor or OEM factory replacement"
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
            />
          </div>

          <div
            className="modal-actions"
            style={{
              marginTop: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingScheduleId ? 'Update Schedule' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
