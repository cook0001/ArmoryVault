import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Crosshair,
  DollarSign,
  FileText,
  MapPin,
  Target,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ammo, Firearm } from '../types';
import { AutocompleteInput } from './AutocompleteInput';

interface RangeSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedFirearmId?: number;
  onSaved?: () => void;
}

export const RangeSessionModal: React.FC<RangeSessionModalProps> = ({
  isOpen,
  onClose,
  preselectedFirearmId,
  onSaved,
}) => {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [ammoList, setAmmoList] = useState<Ammo[]>([]);

  const [selectedFirearmId, setSelectedFirearmId] = useState<number | ''>('');
  const [selectedAmmoId, setSelectedAmmoId] = useState<number | ''>('');
  const [roundsFired, setRoundsFired] = useState<number | ''>(50);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [cost, setCost] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [showAllAmmo, setShowAllAmmo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedFirearmId) {
      setSelectedFirearmId(preselectedFirearmId);
    }
  }, [preselectedFirearmId]);

  const loadData = async () => {
    if (window.api) {
      try {
        const f = await window.api.getFirearms();
        const availableFirearms = f.filter((item) => !item.is_sold);
        setFirearms(availableFirearms);
        if (preselectedFirearmId) {
          setSelectedFirearmId(preselectedFirearmId);
        } else if (availableFirearms.length > 0 && selectedFirearmId === '') {
          setSelectedFirearmId(availableFirearms[0].id || '');
        }

        const a = await window.api.getAmmo();
        setAmmoList(a);
      } catch (err) {
        console.error('Failed to load firearms/ammo for range session:', err);
      }
    }
  };

  if (!isOpen) return null;

  const currentFirearm = firearms.find((f) => f.id === Number(selectedFirearmId));

  // Filter ammo by caliber matching current firearm unless user toggles showAllAmmo
  const filteredAmmo = ammoList.filter((a) => {
    if (showAllAmmo || !currentFirearm) return true;
    const firearmCal = (currentFirearm.caliber || '').toLowerCase().trim();
    const ammoCal = (a.caliber || '').toLowerCase().trim();
    return ammoCal.includes(firearmCal) || firearmCal.includes(ammoCal);
  });

  const selectedAmmo = ammoList.find((a) => a.id === Number(selectedAmmoId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFirearmId) {
      setError('Please select a firearm.');
      return;
    }
    const rounds = Number(roundsFired);
    if (!rounds || rounds <= 0) {
      setError('Please enter a valid round count greater than 0.');
      return;
    }

    if (selectedAmmo && selectedAmmo.count < rounds) {
      const confirmExceed = window.confirm(
        `You entered ${rounds} rounds, but you only have ${selectedAmmo.count} rounds of this ammo in stock.\n\n` +
          `This will reduce stock to 0. Do you want to proceed?`
      );
      if (!confirmExceed) return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (window.api && window.api.logRangeSession) {
        const res = await window.api.logRangeSession({
          firearm_id: Number(selectedFirearmId),
          ammo_id: selectedAmmoId ? Number(selectedAmmoId) : undefined,
          rounds_fired: rounds,
          date,
          location,
          cost: cost ? parseFloat(cost) : 0,
          notes,
        });

        if (res.success) {
          if (onSaved) onSaved();
          onClose();
        } else {
          setError(res.error || 'Failed to log range session.');
        }
      }
    } catch (err: any) {
      console.error('Error logging range session:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addQuickRounds = (amount: number) => {
    const current = Number(roundsFired) || 0;
    setRoundsFired(current + amount);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Target size={24} style={{ color: 'var(--accent)' }} />
            <div>
              <h2 style={{ margin: 0, padding: 0, border: 'none', fontSize: '1.4rem' }}>
                Log Range Session
              </h2>
              <p
                style={{
                  margin: '0.2rem 0 0',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                }}
              >
                Log firearm rounds fired and automatically deduct ammo inventory in one action.
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
            }}
          >
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {/* Firearm Selector */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Select Firearm *
            </label>
            <AutocompleteInput
              mode="select"
              name="firearmId"
              value={String(selectedFirearmId)}
              onChange={(e) => {
                setSelectedFirearmId(e.target.value ? Number(e.target.value) : '');
                setSelectedAmmoId(''); // reset ammo selection on firearm change
              }}
              options={[
                { value: '', label: '-- Choose Firearm --' },
                ...firearms.map((f) => ({
                  value: String(f.id),
                  label: `${f.make} ${f.model} (${f.caliber})${f.serial_number ? ` • SN: ${f.serial_number}` : ''}`,
                })),
              ]}
              required
            />
          </div>

          {/* Ammo Selector */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.4rem',
              }}
            >
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Ammo Used (Optional - Deducts stock)
              </label>
              <label
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={showAllAmmo}
                  onChange={(e) => setShowAllAmmo(e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                Show all calibers
              </label>
            </div>
            <AutocompleteInput
              mode="select"
              name="ammoId"
              value={String(selectedAmmoId)}
              onChange={(e) => setSelectedAmmoId(e.target.value ? Number(e.target.value) : '')}
              options={[
                { value: '', label: '-- No ammo deduction (or range-supplied ammo) --' },
                ...filteredAmmo.map((a) => ({
                  value: String(a.id),
                  label: `${a.type === 'factory' ? a.manufacturer || 'Factory' : 'Custom Handload'} • ${a.caliber} ${a.grain ? `${a.grain}gr ` : ''}${a.projectile || ''} — [In Stock: ${a.count} rds]`,
                })),
              ]}
            />
            {selectedAmmo && (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--accent)',
                  marginTop: '0.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <CheckCircle size={14} /> Will deduct {roundsFired || 0} rounds from{' '}
                {selectedAmmo.count} rounds currently in stock.
              </div>
            )}
          </div>

          {/* Rounds Fired & Quick Increments */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Rounds Fired *
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                min="1"
                className="form-input"
                value={roundsFired}
                onChange={(e) =>
                  setRoundsFired(e.target.value === '' ? '' : parseInt(e.target.value) || 0)
                }
                required
                style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => addQuickRounds(25)}
                style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
              >
                +25
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => addQuickRounds(50)}
                style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
              >
                +50
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => addQuickRounds(100)}
                style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
              >
                +100
              </button>
            </div>
          </div>

          {/* Date, Location, Cost Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <label
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
                Date
              </label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
                <MapPin
                  size={14}
                  style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }}
                />
                Range Location
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Gun Club / BLM"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
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
                <DollarSign
                  size={14}
                  style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }}
                />
                Cost / Range Fee ($)
              </label>
              <input
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
              Session Notes / Malfunctions
            </label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g. Zeroed red dot at 25 yards, tested new handload grouping, 0 malfunctions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              <Crosshair size={16} />
              {isSubmitting ? 'Logging...' : 'Save & Log Range Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
