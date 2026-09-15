import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { StorageLocation } from '../../../types';

export interface StorageLocationFormModalProps {
  isOpen: boolean;
  editingLocation: StorageLocation | null;
  defaultType?: StorageLocation['type'];
  onClose: () => void;
  onSave: (formData: Partial<StorageLocation>) => Promise<void> | void;
}

const DEFAULT_FORM: Partial<StorageLocation> = {
  name: '',
  type: 'Safe',
  capacity: undefined,
  capacityMode: undefined,
  notes: '',
  firearmIds: [],
  accessoryIds: [],
  ammoIds: [],
  componentIds: [],
};

export const StorageLocationFormModal: React.FC<StorageLocationFormModalProps> = ({
  isOpen,
  editingLocation,
  defaultType,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<Partial<StorageLocation>>(DEFAULT_FORM);

  useEffect(() => {
    if (isOpen) {
      if (editingLocation) {
        setForm({ ...editingLocation });
      } else {
        setForm({
          ...DEFAULT_FORM,
          type: defaultType || 'Safe',
        });
      }
    }
  }, [isOpen, editingLocation, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!form.name?.trim()) return;
    await onSave(form);
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '90vw',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.15rem' }}>
            {editingLocation ? 'Edit Storage Location' : 'Add Storage Location'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                marginBottom: 4,
              }}
            >
              Location Name
            </label>
            <input
              className="glass-input"
              value={form.name || ''}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Main Gun Safe, Master Bedroom Safe"
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                marginBottom: 4,
              }}
            >
              Storage Type
            </label>
            <select
              className="glass-input"
              value={form.type || 'Safe'}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as StorageLocation['type'] }))
              }
            >
              <option value="Safe">Safe</option>
              <option value="Cabinet">Cabinet</option>
              <option value="AmmoCan">Ammo Can</option>
              <option value="Case">Case</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                marginBottom: 4,
              }}
            >
              Capacity Tracking Mode
            </label>
            <select
              className="glass-input"
              value={
                form.capacityMode ||
                (form.type === 'AmmoCan' ? 'ammo' : form.type === 'Other' ? 'all' : 'firearms')
              }
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  capacityMode: e.target.value as 'firearms' | 'ammo' | 'all',
                }))
              }
            >
              <option value="firearms">Firearms / Guns Only (Standard for Safes & Cabinets)</option>
              <option value="ammo">Ammunition Lots / Boxes (Standard for Ammo Cans)</option>
              <option value="all">
                All Stored Items Combined (Firearms + Accs + Ammo + Powders)
              </option>
            </select>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginTop: '2px',
                display: 'block',
              }}
            >
              {form.capacityMode === 'all'
                ? 'Counts all stored firearms, accessories, ammunition lots, and reloading powders.'
                : form.capacityMode === 'ammo' || form.type === 'AmmoCan'
                  ? 'Counts only ammunition lots/boxes towards the capacity limit.'
                  : 'Counts only firearms towards the capacity limit. Accessories & ammo can be stored without filling gun slots.'}
            </span>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                marginBottom: 4,
              }}
            >
              Capacity Limit (Optional)
            </label>
            <input
              className="glass-input"
              type="number"
              value={form.capacity ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  capacity: e.target.value === '' ? undefined : Number(e.target.value),
                }))
              }
              placeholder={
                form.capacityMode === 'ammo' || form.type === 'AmmoCan'
                  ? 'e.g. 10 (Ammo Lots / Boxes)'
                  : form.capacityMode === 'all' || form.type === 'Other'
                    ? 'e.g. 50 (Total Stored Items)'
                    : form.type === 'Case'
                      ? 'e.g. 2 (Handguns or Long Guns)'
                      : 'e.g. 24 (Gun Capacity)'
              }
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                marginBottom: 4,
              }}
            >
              Notes & Combination Details
            </label>
            <textarea
              className="glass-input"
              rows={3}
              value={form.notes || ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Combination backup, shelf layout, location details, etc."
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1.5rem',
            justifyContent: 'flex-end',
          }}
        >
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            {editingLocation ? 'Update Location' : 'Add Location'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
