import { Bookmark } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Firearm } from '../../../types';

interface SaveScheduleTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  firearm: Firearm;
  onSave: (name: string, description: string) => Promise<void> | void;
}

export const SaveScheduleTemplateModal: React.FC<SaveScheduleTemplateModalProps> = ({
  isOpen,
  onClose,
  firearm,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen && firearm) {
      setName(`${firearm.make} ${firearm.model} Schedule`);
      setDescription(`${firearm.action_type || ''} custom maintenance schedule`.trim());
    }
  }, [isOpen, firearm]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave(name.trim(), description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100200 }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
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
            <Bookmark size={20} style={{ color: '#fbbf24' }} />
            <h3 style={{ margin: 0 }}>Save as Custom Template</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            ×
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
              Template Name *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Daniel's 3-Gun Shotgun Schedule"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
              Description (Optional)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Tuned recoil spring, extractor, and barrel maintenance"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            This template will capture all{' '}
            <strong>{firearm.maintenance_schedules?.length || 0} active schedule tasks</strong> from
            this firearm so you can apply them to any other firearm with 1-click.
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
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Bookmark size={15} /> Save Template
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
