import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  Tag,
  Wrench,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Firearm, MaintenanceScheduleItem } from '@/types';

interface QuickServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  firearms: Firearm[];
  initialFirearmId?: number;
  initialTaskId?: string;
  initialTaskName?: string;
}

const COMMON_TASKS = [
  'Field Strip, Clean & Lubricate',
  'Deep Ultrasonic Clean',
  'Bore Cleaning & Carbon Removal',
  'Recoil Spring Replacement',
  'Extractor & Ejector Service',
  'Action Screws Torque Check',
  'Optic Mount Torque Check',
  'Trigger Assembly Inspection & Lube',
  'Gas Rings & Gas Key Inspection',
  'Magazine Springs Replacement',
  'Sight Alignment & Zero Verification',
];

export const QuickServiceModal: React.FC<QuickServiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  firearms,
  initialFirearmId,
  initialTaskId,
  initialTaskName,
}) => {
  const [selectedFirearmId, setSelectedFirearmId] = useState<number | ''>(() => {
    if (initialFirearmId) return initialFirearmId;
    return firearms.length > 0 ? firearms[0].id || '' : '';
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => initialTaskId || '');
  const [taskName, setTaskName] = useState<string>(() => initialTaskName || COMMON_TASKS[0]);
  const [serviceType, setServiceType] = useState<'Cleaning' | 'Repair' | 'Modification' | 'Other'>(
    'Cleaning'
  );
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [actionDetails, setActionDetails] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialFirearmId) {
        setSelectedFirearmId(initialFirearmId);
      } else if (firearms.length > 0 && selectedFirearmId === '') {
        setSelectedFirearmId(firearms[0].id || '');
      }

      if (initialTaskId) {
        setSelectedTaskId(initialTaskId);
        setTaskName(initialTaskName || '');
      } else if (!initialTaskName) {
        setSelectedTaskId('');
        setTaskName(COMMON_TASKS[0]);
      }
    }
  }, [isOpen, initialFirearmId, initialTaskId, initialTaskName]);

  if (!isOpen) return null;

  const currentFirearm = firearms.find((f) => f.id === Number(selectedFirearmId));
  const schedules: MaintenanceScheduleItem[] = currentFirearm?.maintenance_schedules || [];

  const handleFirearmChange = (firearmId: number) => {
    setSelectedFirearmId(firearmId);
    setSelectedTaskId('');
    const target = firearms.find((f) => f.id === firearmId);
    if (target?.maintenance_schedules && target.maintenance_schedules.length > 0) {
      setSelectedTaskId(target.maintenance_schedules[0].id);
      setTaskName(target.maintenance_schedules[0].task_name);
    } else {
      setTaskName(COMMON_TASKS[0]);
    }
  };

  const handleTaskSelection = (value: string) => {
    if (value.startsWith('sched:')) {
      const sId = value.replace('sched:', '');
      setSelectedTaskId(sId);
      const sched = schedules.find((s) => s.id === sId);
      if (sched) {
        setTaskName(sched.task_name);
        setActionDetails(`Completed scheduled service: ${sched.task_name}`);
      }
    } else {
      setSelectedTaskId('');
      setTaskName(value);
      setActionDetails(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFirearmId) {
      setError('Please select a firearm.');
      return;
    }
    if (!taskName.trim()) {
      setError('Please specify a task or service action.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const parsedCost = cost.trim() ? Number.parseFloat(cost) : 0;
      const logData = {
        action_performed: actionDetails.trim() || taskName,
        part_details: actionDetails.trim() || taskName,
        cost: Number.isNaN(parsedCost) ? 0 : parsedCost,
        date,
        notes: notes.trim(),
      };

      if (window.api) {
        if (selectedTaskId && window.api.completeMaintenanceTask) {
          // Scheduled task completion
          await window.api.completeMaintenanceTask(
            Number(selectedFirearmId),
            selectedTaskId,
            logData
          );
        } else {
          // Ad-hoc service log append
          const allFirearms = await window.api.getFirearms();
          const target = allFirearms.find((f) => f.id === Number(selectedFirearmId));
          if (target) {
            const currentLogs = target.logs || [];
            const newLogId =
              currentLogs.length > 0 ? Math.max(...currentLogs.map((l) => l.id || 0)) + 1 : 1;
            const newLog = {
              id: newLogId,
              date,
              type: serviceType,
              repaired_part: taskName,
              installed_part_details: actionDetails.trim(),
              cost: Number.isNaN(parsedCost) ? 0 : parsedCost,
              notes: notes.trim(),
            };
            target.logs = [...currentLogs, newLog];
            await window.api.updateFirearm(target.id!, target);
          }
        }

        window.dispatchEvent(new CustomEvent('armoryvault-reload'));
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to log maintenance service:', err);
      setError(err?.message || 'Failed to record maintenance service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: '600px', width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
              }}
            >
              <Wrench size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                Log Armorer Service
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Record scheduled maintenance, part replacements, or cleanings
              </p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
            }}
          >
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {/* Firearm Selector */}
          <div>
            <label
              htmlFor="quick-service-firearm"
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              Target Firearm *
            </label>
            <select
              id="quick-service-firearm"
              className="form-input"
              value={selectedFirearmId}
              onChange={(e) => handleFirearmChange(Number(e.target.value))}
              required
            >
              <option value="" disabled>
                Select a firearm...
              </option>
              {firearms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.make} {f.model} ({f.caliber}) — SN: {f.serial_number || 'N/A'}
                </option>
              ))}
            </select>
          </div>

          {/* Task / Service Action */}
          <div>
            <label
              htmlFor="quick-service-task"
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              Task / Maintenance Item *
            </label>
            <select
              id="quick-service-task"
              className="form-input"
              value={selectedTaskId ? `sched:${selectedTaskId}` : taskName}
              onChange={(e) => handleTaskSelection(e.target.value)}
              required
            >
              {schedules.length > 0 && (
                <optgroup label="Firearm Scheduled Intervals">
                  {schedules.map((s) => (
                    <option key={s.id} value={`sched:${s.id}`}>
                      {s.task_name} (Every {s.interval_rounds.toLocaleString()} rds
                      {s.interval_days ? ` / ${s.interval_days} days` : ''})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Standard Armorer & Cleaning Procedures">
                {COMMON_TASKS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Custom Task Name if not matched */}
          {!selectedTaskId && (
            <div>
              <label
                htmlFor="quick-service-custom-task"
                style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Procedure Title / Description
              </label>
              <input
                id="quick-service-custom-task"
                type="text"
                className="form-input"
                placeholder="e.g. Polished feed ramp, replaced ejector"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                required
              />
            </div>
          )}

          {/* Service Type & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                htmlFor="quick-service-type"
                style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Service Category
              </label>
              <select
                id="quick-service-type"
                className="form-input"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as any)}
              >
                <option value="Cleaning">Cleaning / Lubrication</option>
                <option value="Repair">Repair / Part Replacement</option>
                <option value="Modification">Modification / Upgrade</option>
                <option value="Other">Inspection / Armorer Check</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="quick-service-date"
                style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <Calendar
                  size={14}
                  style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }}
                />
                Service Date
              </label>
              <input
                id="quick-service-date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Installed Part Details & Cost */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label
                htmlFor="quick-service-parts"
                style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <Tag
                  size={14}
                  style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }}
                />
                Installed Parts / Replaced Details
              </label>
              <input
                id="quick-service-parts"
                type="text"
                className="form-input"
                placeholder="e.g. OEM Glock 18lb recoil spring"
                value={actionDetails}
                onChange={(e) => setActionDetails(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="quick-service-cost"
                style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <DollarSign
                  size={14}
                  style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }}
                />
                Cost ($) (Optional)
              </label>
              <input
                id="quick-service-cost"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="quick-service-notes"
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              <FileText
                size={14}
                style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }}
              />
              Armorer Notes / Observations
            </label>
            <textarea
              id="quick-service-notes"
              className="form-input"
              rows={2}
              placeholder="e.g. Bore scoped clean, bolt lugs checked with no cracks, function tested 100%"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div
            className="modal-actions"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <CheckCircle size={16} />
              {isSubmitting ? 'Recording...' : 'Record Service & Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
