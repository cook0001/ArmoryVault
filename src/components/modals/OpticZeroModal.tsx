import { AlertTriangle, CheckCircle, Crosshair, Gauge, Target, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Firearm, OpticZeroRecord } from '@/types';

interface OpticZeroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  firearm: Firearm;
  existingRecord?: OpticZeroRecord | null;
}

export const OpticZeroModal: React.FC<OpticZeroModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  firearm,
  existingRecord,
}) => {
  const [opticName, setOpticName] = useState('');
  const [ringTorque, setRingTorque] = useState<string>('');
  const [baseTorque, setBaseTorque] = useState<string>('');
  const [actionScrewTorque, setActionScrewTorque] = useState<string>('');
  const [zeroDistanceYards, setZeroDistanceYards] = useState<string>('100');
  const [zeroAmmo, setZeroAmmo] = useState('');
  const [lastZeroDate, setLastZeroDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (existingRecord) {
        setOpticName(existingRecord.opticName || '');
        setRingTorque(
          existingRecord.ringTorqueInLbs !== undefined ? String(existingRecord.ringTorqueInLbs) : ''
        );
        setBaseTorque(
          existingRecord.baseTorqueInLbs !== undefined ? String(existingRecord.baseTorqueInLbs) : ''
        );
        setActionScrewTorque(
          existingRecord.actionScrewTorqueInLbs !== undefined
            ? String(existingRecord.actionScrewTorqueInLbs)
            : ''
        );
        setZeroDistanceYards(
          existingRecord.zeroDistanceYards !== undefined
            ? String(existingRecord.zeroDistanceYards)
            : '100'
        );
        setZeroAmmo(existingRecord.zeroAmmo || '');
        setLastZeroDate(existingRecord.lastZeroDate || new Date().toISOString().split('T')[0]);
        setNotes(existingRecord.notes || '');
      } else {
        setOpticName('');
        setRingTorque('');
        setBaseTorque('');
        setActionScrewTorque('');
        setZeroDistanceYards('100');
        setZeroAmmo('');
        setLastZeroDate(new Date().toISOString().split('T')[0]);
        setNotes('');
      }
    }
  }, [isOpen, existingRecord]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opticName.trim()) {
      setError('Please provide an optic name or description.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const record: OpticZeroRecord = {
        id: existingRecord?.id || `zero_${Date.now()}`,
        opticName: opticName.trim(),
        ringTorqueInLbs: ringTorque.trim() ? Number.parseFloat(ringTorque) : undefined,
        baseTorqueInLbs: baseTorque.trim() ? Number.parseFloat(baseTorque) : undefined,
        actionScrewTorqueInLbs: actionScrewTorque.trim()
          ? Number.parseFloat(actionScrewTorque)
          : undefined,
        zeroDistanceYards: zeroDistanceYards.trim()
          ? Number.parseInt(zeroDistanceYards, 10)
          : undefined,
        zeroAmmo: zeroAmmo.trim() || undefined,
        lastZeroDate,
        notes: notes.trim() || undefined,
      };

      const existingRecords = firearm.optic_zero_records || [];
      let updatedRecords: OpticZeroRecord[];

      if (existingRecord) {
        updatedRecords = existingRecords.map((r) => (r.id === existingRecord.id ? record : r));
      } else {
        updatedRecords = [...existingRecords, record];
      }

      const updatedFirearm: Firearm = {
        ...firearm,
        optic_zero_records: updatedRecords,
      };

      if (window.api) {
        await window.api.updateFirearm(firearm.id!, updatedFirearm);
        window.dispatchEvent(new CustomEvent('armoryvault-reload'));
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save optic torque/zero record:', err);
      setError(err?.message || 'Failed to save optic zero and torque record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: '640px', width: '100%' }}
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
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <Crosshair size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                {existingRecord
                  ? 'Edit Optic Zero & Torque Spec'
                  : 'Record Optic Zero & Torque Spec'}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {firearm.make} {firearm.model} ({firearm.caliber})
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
          {/* Optic Name */}
          <div>
            <label
              htmlFor="optic-zero-name"
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              Mounted Optic / Sight Name *
            </label>
            <input
              id="optic-zero-name"
              type="text"
              className="form-input"
              placeholder="e.g. Vortex Razor HD Gen III 1-10x24 / Aimpoint T2"
              value={opticName}
              onChange={(e) => setOpticName(e.target.value)}
              required
            />
          </div>

          {/* Torque Specifications Section */}
          <div
            style={{
              padding: '0.85rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '0.75rem',
                color: '#38bdf8',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              <Gauge size={16} />
              <span>Fastener Torque Specifications (inch-pounds)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div>
                <label
                  htmlFor="optic-ring-torque"
                  style={{
                    display: 'block',
                    marginBottom: '0.3rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Ring Caps (in-lbs)
                </label>
                <input
                  id="optic-ring-torque"
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  className="form-input"
                  placeholder="e.g. 15-18"
                  value={ringTorque}
                  onChange={(e) => setRingTorque(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="optic-base-torque"
                  style={{
                    display: 'block',
                    marginBottom: '0.3rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Base Clamp (in-lbs)
                </label>
                <input
                  id="optic-base-torque"
                  type="number"
                  step="0.5"
                  min="0"
                  max="200"
                  className="form-input"
                  placeholder="e.g. 45-65"
                  value={baseTorque}
                  onChange={(e) => setBaseTorque(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="action-screw-torque"
                  style={{
                    display: 'block',
                    marginBottom: '0.3rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Action Screws (in-lbs)
                </label>
                <input
                  id="action-screw-torque"
                  type="number"
                  step="0.5"
                  min="0"
                  max="200"
                  className="form-input"
                  placeholder="e.g. 45-55"
                  value={actionScrewTorque}
                  onChange={(e) => setActionScrewTorque(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Zero Confirmation Section */}
          <div
            style={{
              padding: '0.85rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '0.75rem',
                color: '#34d399',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              <Target size={16} />
              <span>Zero Verification & Ammunition Data</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', gap: '0.75rem' }}>
              <div>
                <label
                  htmlFor="zero-distance"
                  style={{
                    display: 'block',
                    marginBottom: '0.3rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Distance (Yards)
                </label>
                <input
                  id="zero-distance"
                  type="number"
                  min="5"
                  max="1000"
                  className="form-input"
                  placeholder="100"
                  value={zeroDistanceYards}
                  onChange={(e) => setZeroDistanceYards(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="zero-ammo"
                  style={{
                    display: 'block',
                    marginBottom: '0.3rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Zeroed Ammunition Load
                </label>
                <input
                  id="zero-ammo"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 77gr Sierra MatchKing OTM"
                  value={zeroAmmo}
                  onChange={(e) => setZeroAmmo(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="zero-date"
                  style={{
                    display: 'block',
                    marginBottom: '0.3rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Confirmation Date
                </label>
                <input
                  id="zero-date"
                  type="date"
                  className="form-input"
                  value={lastZeroDate}
                  onChange={(e) => setLastZeroDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="optic-zero-notes"
              style={{
                display: 'block',
                marginBottom: '0.3rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              Turret Offsets / Reticle & Environmental Notes
            </label>
            <textarea
              id="optic-zero-notes"
              className="form-input"
              rows={2}
              placeholder="e.g. Turrets zero-stopped. 100yd zero confirmed at 65°F. Paint-penned witness marks on ring screws."
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
              {isSubmitting
                ? 'Saving...'
                : existingRecord
                  ? 'Update Record'
                  : 'Save Zero & Torque Spec'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
