import { CheckCircle, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Firearm, MaintenanceScheduleItem } from '../../../types';

export interface TaskCompletionFormData {
  action_performed: string;
  part_manufacturer: string;
  part_details: string;
  cost: string;
  date: string;
  notes: string;
}

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  firearm: Firearm;
  task: MaintenanceScheduleItem | null;
  onCompleted: () => void | Promise<void>;
}

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  isOpen,
  onClose,
  firearm,
  task,
  onCompleted,
}) => {
  const [completionForm, setCompletionForm] = useState<TaskCompletionFormData>({
    action_performed: '',
    part_manufacturer: '',
    part_details: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (isOpen && task) {
      setCompletionForm({
        action_performed: task.task_name || '',
        part_manufacturer: '',
        part_details: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firearm || !task) return;

    if (window.api && window.api.completeMaintenanceTask) {
      const partDetailStr = completionForm.part_details
        ? `${completionForm.part_manufacturer ? completionForm.part_manufacturer + ' ' : ''}${completionForm.part_details}`
        : completionForm.action_performed;
      await window.api.completeMaintenanceTask(firearm.id!, task.id, {
        action_performed: completionForm.action_performed,
        part_details: partDetailStr,
        cost: completionForm.cost ? parseFloat(completionForm.cost) : 0,
        date: completionForm.date,
        notes: completionForm.notes,
      });
      await onCompleted();
      onClose();
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
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
            <CheckCircle size={22} style={{ color: 'var(--success)' }} />
            <div>
              <h3 style={{ margin: 0 }}>Complete Maintenance: {task.task_name}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Log replacement parts, cost, and reset interval counter.
              </div>
            </div>
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
              Action Performed
            </label>
            <input
              type="text"
              className="form-input"
              value={completionForm.action_performed}
              onChange={(e) =>
                setCompletionForm({ ...completionForm, action_performed: e.target.value })
              }
              placeholder="e.g. Replaced Extractor & Spring"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                Part Manufacturer / Brand
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Apex Tactical / OEM Factory"
                value={completionForm.part_manufacturer}
                onChange={(e) =>
                  setCompletionForm({ ...completionForm, part_manufacturer: e.target.value })
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                Specific Part Model / Details
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Heavy Duty Extractor (Non-LCI)"
                value={completionForm.part_details}
                onChange={(e) =>
                  setCompletionForm({ ...completionForm, part_details: e.target.value })
                }
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                Part Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="0.00"
                value={completionForm.cost}
                onChange={(e) => setCompletionForm({ ...completionForm, cost: e.target.value })}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                Date Completed
              </label>
              <input
                type="date"
                className="form-input"
                value={completionForm.date}
                onChange={(e) => setCompletionForm({ ...completionForm, date: e.target.value })}
                required
              />
            </div>
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
              Service Notes / Condition Observed
            </label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g. Factory extractor claw was chipped; installed Apex extractor with heavy plunger spring. Function tested 100%."
              value={completionForm.notes}
              onChange={(e) => setCompletionForm({ ...completionForm, notes: e.target.value })}
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
            <button
              type="submit"
              className="btn-success"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle size={16} /> Save & Complete Task
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
