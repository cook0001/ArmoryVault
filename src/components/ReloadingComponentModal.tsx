import { Scale, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ReloadingComponent, StorageLocation } from '../types';
import { parseBarcodeData } from '../utils/BarcodeEngine';
import { COMPREHENSIVE_BULLET_TYPES } from '../utils/caliberHelpers';
import { CALIBER_OPTIONS } from '../utils/formOptions';
import { calcCostPerGrain, formatPowderMultiUnit } from '../utils/powderUnits';
import {
  assignItemToStorage,
  getItemStorageLocation,
  saveStorageLocations,
} from '../utils/StorageSync';
import { AutocompleteInput } from './AutocompleteInput';
import { StorageLocationSelect } from './StorageBadge';

interface ReloadingComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingId: number | null;
  initialData?: Partial<ReloadingComponent>;
}

const defaultFormData: Partial<ReloadingComponent> = {
  type: 'Powder',
  manufacturer: '',
  name: '',
  quantity: 0,
  cost: undefined,
  purchaseDate: new Date().toISOString().split('T')[0],
  notes: '',
  weightUnit: 'lbs',
  usageTags: [],
  primerType: 'Small Rifle',
  isMagnumPrimer: false,
  prepStage: 'Fired / Dirty',
  caliber: '',
  bulletType: '',
  grain: undefined,
};

export const ReloadingComponentModal: React.FC<ReloadingComponentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingId,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<ReloadingComponent>>(defaultFormData);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [storageLocationId, setStorageLocationId] = useState<number | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);
  const navigate = useNavigate();

  const lookupUPC = async (upc: string) => {
    if (!upc || !window.api || !window.api.lookupUPC) return;
    setIsLookingUp(true);
    setLookupStatus(null);
    try {
      const data = await window.api.lookupUPC(upc);
      if (data && data.items && data.items.length > 0) {
        const item = data.items[0];
        const parsed = parseBarcodeData(item);

        if (parsed.category === 'ammo') {
          if (
            window.confirm(
              'This looks like loaded Ammunition. Would you like to redirect to the Ammo tab?'
            )
          ) {
            navigate('/ammo', { state: { openAddModal: true, upc: upc } });
            return;
          }
        } else if (parsed.category === 'accessory') {
          if (
            window.confirm(
              'This looks like an Accessory. Would you like to redirect to the Accessories tab?'
            )
          ) {
            navigate('/accessories', { state: { openAddModal: true, upc: upc } });
            return;
          }
        } else if (parsed.category === 'unknown') {
          const typeChoice = window.prompt(
            "Is this Ammo, Component, or Accessory? (Type 'ammo', 'component', or 'accessory')",
            'component'
          );
          if (typeChoice && typeChoice.toLowerCase() === 'ammo') {
            navigate('/ammo', { state: { openAddModal: true, upc: upc } });
            return;
          } else if (typeChoice && typeChoice.toLowerCase() === 'accessory') {
            navigate('/accessories', { state: { openAddModal: true, upc: upc } });
            return;
          }
        }

        setFormData((prev) => {
          const newType = parsed.parsedComponent?.type || prev.type || 'Powder';
          return {
            ...prev,
            manufacturer: parsed.parsedComponent?.manufacturer || prev.manufacturer,
            name: parsed.parsedComponent?.name || prev.name,
            type: newType,
            caliber: parsed.parsedComponent?.caliber || prev.caliber,
            grain: parsed.parsedComponent?.grain || prev.grain,
            weightUnit: parsed.parsedComponent?.weightUnit || prev.weightUnit,
            primerType: parsed.parsedComponent?.primerType || prev.primerType,
            isMagnumPrimer:
              parsed.parsedComponent?.isMagnumPrimer !== undefined
                ? parsed.parsedComponent.isMagnumPrimer
                : prev.isMagnumPrimer,
            bulletType: parsed.parsedComponent?.bulletType || prev.bulletType,
            quantity: parsed.parsedComponent?.quantity || prev.quantity,
            cost: parsed.parsedComponent?.cost || prev.cost,
          };
        });
        setLookupStatus({ message: 'Component found and parsed successfully!', type: 'success' });
      } else {
        setLookupStatus({ message: 'Barcode not found in database.', type: 'error' });
      }
    } catch (e: any) {
      console.error(e);
      setLookupStatus({ message: `Error: ${e.message}`, type: 'error' });
    } finally {
      setIsLookingUp(false);
    }
  };

  useEffect(() => {
    if (window.api && window.api.getStorageLocations) {
      window.api.getStorageLocations().then((locs) => {
        setLocations(locs || []);
        if (editingId) {
          const matched = getItemStorageLocation('component', editingId, locs || []);
          if (matched) setStorageLocationId(matched.id || null);
        }
      });
    }

    if (isOpen) {
      if (initialData && Object.keys(initialData).length > 0) {
        setFormData({ ...defaultFormData, ...initialData });
      } else {
        setFormData(defaultFormData);
      }
      if (!editingId) {
        setStorageLocationId(null);
      }
    }
  }, [isOpen, initialData, editingId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.api || !window.api.addComponent || !window.api.updateComponent) return;

    const newComp = { ...formData } as ReloadingComponent;
    let savedId = editingId;

    if (editingId) {
      await window.api.updateComponent(editingId, newComp);
    } else {
      const allComps = await window.api.getComponents();
      const duplicate = allComps.find(
        (c: any) =>
          c.type === newComp.type &&
          c.manufacturer === newComp.manufacturer &&
          c.name === newComp.name
      );

      let merged = false;
      if (duplicate) {
        if (
          window.confirm(
            `An existing entry for ${duplicate.manufacturer || ''} ${duplicate.name || duplicate.type} was found. Would you like to merge this into the existing entry?`
          )
        ) {
          const mergedData = { ...duplicate };
          mergedData.quantity = (duplicate.quantity || 0) + (newComp.quantity || 0);
          if (!mergedData.upc_code && newComp.upc_code) {
            mergedData.upc_code = newComp.upc_code;
          }
          await window.api.updateComponent(duplicate.id!, mergedData);
          savedId = duplicate.id || null;
          merged = true;
        }
      }

      if (!merged) {
        const res = await window.api.addComponent(newComp);
        if (typeof res === 'number') {
          savedId = res;
        } else if (res && typeof (res as any).id === 'number') {
          savedId = (res as any).id;
        } else {
          const fresh = await window.api.getComponents();
          if (fresh && fresh.length > 0) {
            savedId = Math.max(...fresh.map((c: any) => c.id || 0));
          }
        }
      }
    }

    // Bi-directional Storage Sync
    if (savedId && locations.length > 0) {
      const updatedLocations = assignItemToStorage(
        'component',
        savedId,
        storageLocationId,
        locations
      );
      await saveStorageLocations(updatedLocations);
    }

    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '660px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>{editingId ? 'Edit Component' : 'Add Component'}</h2>
          <button type="button" className="btn-icon" onClick={onClose} title="Close modal">
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={handleSave}
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            flex: 1,
            paddingRight: '0.35rem',
          }}
        >
          <div
            className="form-group"
            style={{
              background: 'rgba(56, 189, 248, 0.05)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              marginBottom: '1rem',
            }}
          >
            <label>Scan UPC Code (Auto-fill)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                value={formData.upc_code || ''}
                onChange={(e) => setFormData({ ...formData, upc_code: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    lookupUPC(formData.upc_code || '');
                  }
                }}
                onBlur={(e) => lookupUPC(e.target.value)}
                placeholder="Scan or type UPC code..."
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
                onClick={() => lookupUPC(formData.upc_code || '')}
                disabled={isLookingUp}
              >
                {isLookingUp ? 'Searching...' : 'Lookup'}
              </button>
            </div>
            {lookupStatus && (
              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.85rem',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  background:
                    lookupStatus.type === 'success'
                      ? 'rgba(34, 197, 94, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                  color: lookupStatus.type === 'success' ? '#4ade80' : '#f87171',
                  border: `1px solid ${lookupStatus.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                }}
              >
                {lookupStatus.message}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Component Type</label>
              <AutocompleteInput
                mode="select"
                name="type"
                value={formData.type || 'Powder'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                options={[
                  { value: 'Powder', label: 'Powder' },
                  { value: 'Brass', label: 'Brass / Hulls' },
                  { value: 'Bullet', label: 'Bullets / Projectiles' },
                  { value: 'Primer', label: 'Primers' },
                ]}
                disabled={!!editingId}
              />
            </div>
            <div className="form-group">
              <label>Storage Location / Container</label>
              <StorageLocationSelect
                value={storageLocationId}
                onChange={(locId) => setStorageLocationId(locId)}
                locations={locations}
                placeholder="Select Safe / Locker / Shelf..."
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Manufacturer</label>
              <input
                required
                type="text"
                className="form-input"
                value={formData.manufacturer || ''}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>
            {(formData.type === 'Powder' ||
              formData.type === 'Primer' ||
              formData.type === 'Bullet') && (
              <div className="form-group">
                <label>Name</label>
                <input
                  required
                  type="text"
                  className="form-input"
                  placeholder={
                    formData.type === 'Powder'
                      ? 'e.g. Varget'
                      : formData.type === 'Primer'
                        ? 'e.g. #400'
                        : 'e.g. XTP'
                  }
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}
          </div>

          {(formData.type === 'Brass' || formData.type === 'Bullet') && (
            <div className="form-group">
              <label>Caliber</label>
              <AutocompleteInput
                required
                name="caliber"
                value={formData.caliber || ''}
                onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
                options={CALIBER_OPTIONS}
                placeholder="e.g. .308 Win, 9mm Luger"
              />
            </div>
          )}

          {formData.type === 'Bullet' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Bullet Type</label>
                <AutocompleteInput
                  required
                  name="bulletType"
                  value={formData.bulletType || ''}
                  onChange={(e) => setFormData({ ...formData, bulletType: e.target.value })}
                  options={COMPREHENSIVE_BULLET_TYPES}
                  placeholder="e.g. FMJ, MatchKing, ELD-X, TSX, Gold Dot"
                />
              </div>
              <div className="form-group">
                <label>Bullet Weight (grains)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  className="form-input"
                  value={formData.grain === undefined ? '' : formData.grain}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      grain: e.target.value === '' ? undefined : parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}

          {(formData.type === 'Brass' || formData.type === 'Primer') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Primer Type</label>
                <AutocompleteInput
                  mode="select"
                  name="primerType"
                  value={formData.primerType || 'Small Rifle'}
                  onChange={(e) => setFormData({ ...formData, primerType: e.target.value })}
                  options={[
                    'Small Rifle',
                    'Large Rifle',
                    'Small Pistol',
                    'Large Pistol',
                    '209 Shotgun',
                  ]}
                />
              </div>
              <div
                className="form-group"
                style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.isMagnumPrimer || false}
                    onChange={(e) => setFormData({ ...formData, isMagnumPrimer: e.target.checked })}
                    style={{ width: '1.2rem', height: '1.2rem' }}
                  />
                  <span style={{ fontWeight: 'bold' }}>Magnum Primer</span>
                </label>
              </div>
            </div>
          )}

          {formData.type === 'Brass' && (
            <div className="form-group">
              <label>Preparation Stage</label>
              <AutocompleteInput
                mode="select"
                name="prepStage"
                value={formData.prepStage || 'Fired / Dirty'}
                onChange={(e) => setFormData({ ...formData, prepStage: e.target.value as any })}
                options={[
                  'Fired / Dirty',
                  'Cleaned',
                  'Deprimed',
                  'Sized',
                  'Trimmed',
                  'Primed',
                  'Ready to Load',
                ]}
              />
            </div>
          )}

          {/* Quantity & Unit Row */}
          {formData.type === 'Powder' ? (
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}
            >
              <div className="form-group">
                <label>Amount *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="e.g. 1"
                  value={
                    formData.quantity === undefined || formData.quantity === null
                      ? ''
                      : formData.quantity
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: e.target.value === '' ? ('' as any) : parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Weight Unit *</label>
                <AutocompleteInput
                  mode="select"
                  name="weightUnit"
                  value={formData.weightUnit || 'lbs'}
                  onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value as any })}
                  options={[
                    { value: 'lbs', label: 'lbs (Pounds)' },
                    { value: 'oz', label: 'oz (Ounces)' },
                    { value: 'grains', label: 'gr (Grains)' },
                  ]}
                />
              </div>
              <div className="form-group">
                <label>Low-Stock Alert</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 1 (lb)"
                  value={
                    formData.min_threshold === undefined || formData.min_threshold === null
                      ? ''
                      : formData.min_threshold
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_threshold: e.target.value === '' ? undefined : parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Cost / Value ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="e.g. 39.99"
                  value={formData.cost === undefined || formData.cost === null ? '' : formData.cost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost: e.target.value === '' ? undefined : parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Quantity *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  className="form-input"
                  placeholder="e.g. 500"
                  value={
                    formData.quantity === undefined || formData.quantity === null
                      ? ''
                      : formData.quantity
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: e.target.value === '' ? ('' as any) : parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Low-Stock Alert</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-input"
                  placeholder="e.g. 100"
                  value={
                    formData.min_threshold === undefined || formData.min_threshold === null
                      ? ''
                      : formData.min_threshold
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_threshold: e.target.value === '' ? undefined : parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Cost / Value ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="e.g. 45.00"
                  value={formData.cost === undefined || formData.cost === null ? '' : formData.cost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost: e.target.value === '' ? undefined : parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* Live Unit Equivalents Banner for Powder */}
          {formData.type === 'Powder' &&
            formData.quantity !== undefined &&
            Number(formData.quantity) > 0 &&
            (() => {
              const breakdown = formatPowderMultiUnit(
                Number(formData.quantity),
                formData.weightUnit || 'lbs'
              );
              const costVal = Number(formData.cost) || 0;
              const costPerGr =
                costVal > 0
                  ? calcCostPerGrain(
                      costVal,
                      Number(formData.quantity),
                      formData.weightUnit || 'lbs'
                    )
                  : 0;
              return (
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.95rem',
                    margin: '0.25rem 0 1rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Scale size={15} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                        Live Unit Equivalents:
                      </span>
                      <strong>{breakdown.summary}</strong>
                    </div>
                    {costVal > 0 && (
                      <div style={{ color: '#4ade80', fontWeight: 600 }}>
                        ≈ ${costPerGr.toFixed(4)} / grain
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Purchase Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.purchaseDate || ''}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Lot #, storage container..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div
            className="modal-actions"
            style={{
              marginTop: 'auto',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}
          >
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Component
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
