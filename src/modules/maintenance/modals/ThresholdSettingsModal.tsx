import { SlidersHorizontal, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dueSoonRounds: number;
  dueSoonDays: number;
  onSave: (rounds: number, days: number) => void;
}

export const ThresholdSettingsModal: React.FC<ThresholdSettingsModalProps> = ({
  isOpen,
  onClose,
  dueSoonRounds,
  dueSoonDays,
  onSave,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: '460px', width: '100%' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SlidersHorizontal size={20} color="#3b82f6" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
              Maintenance Alert Preferences
            </h3>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const rounds = Number.parseInt(formData.get('due_rounds') as string, 10) || 200;
            const days = Number.parseInt(formData.get('due_days') as string, 10) || 14;
            onSave(rounds, days);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Configure when scheduled tasks are flagged with the amber &quot;Due Soon&quot; status prior
            to reaching their mandatory service interval.
          </p>

          <div>
            <label
              htmlFor="due_rounds"
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              Round Count Warning Window
            </label>
            <input
              id="due_rounds"
              name="due_rounds"
              type="number"
              min="25"
              step="25"
              className="form-input"
              defaultValue={dueSoonRounds}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Flag as Due Soon when within this many rounds of target interval (default: 200 rds)
            </span>
          </div>

          <div>
            <label
              htmlFor="due_days"
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              Days Warning Window
            </label>
            <input
              id="due_days"
              name="due_days"
              type="number"
              min="1"
              max="180"
              className="form-input"
              defaultValue={dueSoonDays}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Flag as Due Soon when within this many days of calendar interval (default: 14 days)
            </span>
          </div>

          <div
            className="modal-actions"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
