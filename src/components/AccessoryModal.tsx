import { AlertTriangle, Camera, Target, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Accessory, Firearm, StorageLocation } from '../types';
import { parseBarcodeData } from '../utils/BarcodeEngine';
import {
  assignItemToStorage,
  getItemStorageLocation,
  saveStorageLocations,
} from '../utils/StorageSync';
import { AutocompleteInput } from './AutocompleteInput';
import { StorageLocationSelect } from './StorageBadge';

interface AccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingId: number | null;
  initialData?: Partial<Accessory>;
  initialUpc?: string;
  firearms: Firearm[];
}

const defaultFormData: Partial<Accessory> = {
  type: 'Optic',
  manufacturer: '',
  model: '',
  magnification: '',
  ratedCalibers: '',
  lumens: undefined,
  supportedModels: '',
  caliber: '',
  capacity: undefined,
  quantity: undefined,
  serialNumber: '',
  value: null,
  purchaseDate: new Date().toISOString().split('T')[0],
  mounts: [],
  notes: '',
  photo: null,
};

export const AccessoryModal: React.FC<AccessoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingId,
  initialData,
  initialUpc,
  firearms,
}) => {
  const [formData, setFormData] = useState<Partial<Accessory>>(defaultFormData);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [storageLocationId, setStorageLocationId] = useState<number | null>(null);
  const [upcInput, setUpcInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);
  const [saveToSkuDb, setSaveToSkuDb] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.api && window.api.getStorageLocations) {
      window.api.getStorageLocations().then((locs) => {
        setLocations(locs || []);
        if (editingId) {
          const matched = getItemStorageLocation('accessory', editingId, locs || []);
          if (matched) setStorageLocationId(matched.id || null);
        }
      });
    }

    if (isOpen) {
      setUpcInput('');
      setLookupStatus(null);
      setSaveToSkuDb(false);
      if (initialData) {
        setFormData({ ...defaultFormData, ...initialData });
      } else {
        setFormData(defaultFormData);
      }
      if (initialUpc) {
        setUpcInput(initialUpc);
        if (!initialData || !initialData.manufacturer) {
          lookupUPC(initialUpc);
        }
      }
    }
  }, [isOpen, initialData, initialUpc, editingId]);

  const lookupUPC = async (upc: string) => {
    if (!upc || !window.api) return;
    setIsLookingUp(true);
    setLookupStatus(null);
    try {
      // 1. Check Custom SKU Database first
      if (window.api.getSkus) {
        const skus = await window.api.getSkus();
        const matchedSkuKey = Object.keys(skus).find(
          (k) => k.trim().toUpperCase() === upc.trim().toUpperCase()
        );
        if (matchedSkuKey) {
          const skuData = skus[matchedSkuKey];
          setFormData((prev) => ({
            ...prev,
            type: (skuData.accessoryType || (skuData as any).type || prev.type) as any,
            manufacturer: skuData.manufacturer || prev.manufacturer,
            model: skuData.model || prev.model,
            value:
              skuData.value !== undefined
                ? skuData.value
                : (skuData as any).cost !== undefined
                  ? (skuData as any).cost
                  : prev.value,
            caliber: skuData.caliber || (skuData as any).supportedModels || prev.caliber,
            supportedModels: (skuData as any).supportedModels || prev.supportedModels,
            notes: skuData.notes || prev.notes,
            upc_code: matchedSkuKey,
          }));
          setLookupStatus({
            message: `Custom SKU "${matchedSkuKey}" matched and loaded!`,
            type: 'success',
          });
          setIsLookingUp(false);
          return;
        }
      }

      // 2. Fallback to online UPC barcode database
      if (window.api.lookupUPC) {
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
          } else if (parsed.category === 'component') {
            if (
              window.confirm(
                'This looks like a Reloading Component. Would you like to redirect to the Components tab?'
              )
            ) {
              navigate('/components', { state: { openAddModal: true, upc: upc } });
              return;
            }
          } else if (parsed.category === 'unknown') {
            const typeChoice = window.prompt(
              "Is this Ammo, Component, or Accessory? (Type 'ammo', 'component', or 'accessory')",
              'accessory'
            );
            if (typeChoice && typeChoice.toLowerCase() === 'ammo') {
              navigate('/ammo', { state: { openAddModal: true, upc: upc } });
              return;
            } else if (typeChoice && typeChoice.toLowerCase() === 'component') {
              navigate('/components', { state: { openAddModal: true, upc: upc } });
              return;
            }
          }

          setFormData((prev) => ({
            ...prev,
            type: parsed.parsedAccessory?.type || prev.type,
            manufacturer: parsed.parsedAccessory?.manufacturer || prev.manufacturer,
            model: parsed.parsedAccessory?.model || prev.model,
            value: parsed.parsedAccessory?.value || prev.value,
            upc_code: upc,
          }));
          setLookupStatus({
            message: 'Accessory found and parsed automatically!',
            type: 'success',
          });
        } else {
          setLookupStatus({
            message:
              'Barcode / SKU not found. You can enter details manually and save as a custom SKU.',
            type: 'error',
          });
        }
      }
    } catch (e: any) {
      console.error(e);
      setLookupStatus({ message: `Error: ${e.message}`, type: 'error' });
    } finally {
      setIsLookingUp(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setUpcInput('');
      setLookupStatus(null);
      setSaveToSkuDb(false);
      if (initialData) {
        setFormData({ ...defaultFormData, ...initialData });
      } else {
        setFormData(defaultFormData);
      }
      if (initialUpc) {
        setUpcInput(initialUpc);
        if (!initialData || !initialData.manufacturer) {
          lookupUPC(initialUpc);
        }
      }
    }
  }, [isOpen, initialData, initialUpc]);

  const accessoryTypes = [
    'Optic',
    'Suppressor',
    'Light',
    'Magazine',
    'Stock',
    'Chassis',
    'Belt',
    'Holster',
    'Mount',
    'Sling',
    'Other',
  ];

  const handlePhotoUpload = async () => {
    if (window.api && window.api.selectAndSavePhoto) {
      const paths = await window.api.selectAndSavePhoto();
      if (paths && paths.length > 0) {
        setFormData({ ...formData, photo: paths[0] });
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.api || !window.api.addAccessory || !window.api.updateAccessory) return;

    const newAcc = { ...formData } as Accessory;
    if (upcInput && !newAcc.upc_code) {
      newAcc.upc_code = upcInput.trim().toUpperCase();
    }

    let savedId = editingId;
    if (editingId) {
      await window.api.updateAccessory(editingId, newAcc);
    } else {
      const allAccs = await window.api.getAccessories();
      const duplicate = allAccs.find(
        (a: any) =>
          a.type === newAcc.type &&
          a.manufacturer === newAcc.manufacturer &&
          a.model === newAcc.model
      );

      let merged = false;
      if (duplicate) {
        if (
          window.confirm(
            `An existing entry for ${duplicate.manufacturer || ''} ${duplicate.model || duplicate.type} was found. Would you like to merge this into the existing entry?`
          )
        ) {
          const mergedData = { ...duplicate };
          mergedData.quantity = (duplicate.quantity || 1) + (newAcc.quantity || 1);
          if (!mergedData.upc_code && newAcc.upc_code) {
            mergedData.upc_code = newAcc.upc_code;
          }
          await window.api.updateAccessory(duplicate.id!, mergedData);
          savedId = duplicate.id || null;
          merged = true;
        }
      }

      if (!merged) {
        const res: any = await window.api.addAccessory(newAcc);
        if (typeof res === 'number') {
          savedId = res;
        } else if (res && typeof res.id === 'number') {
          savedId = res.id;
        } else {
          const fresh = await window.api.getAccessories();
          if (fresh && fresh.length > 0) {
            savedId = Math.max(...fresh.map((a: any) => a.id || 0));
          }
        }
      }
    }

    // Bi-directional Storage Sync
    if (savedId && locations.length > 0) {
      const updatedLocations = assignItemToStorage(
        'accessory',
        savedId,
        storageLocationId,
        locations
      );
      await saveStorageLocations(updatedLocations);
    }

    // Save to Custom SKU database if requested
    if (saveToSkuDb && newAcc.upc_code && window.api && window.api.saveSkus) {
      const existingSkus = (window.api.getSkus ? await window.api.getSkus() : {}) || {};
      const updated = {
        ...existingSkus,
        [newAcc.upc_code.trim().toUpperCase()]: {
          category: 'accessory' as const,
          accessoryType: newAcc.type,
          manufacturer: newAcc.manufacturer,
          model: newAcc.model,
          caliber: newAcc.caliber || newAcc.supportedModels || newAcc.ratedCalibers,
          value: newAcc.value || undefined,
          notes: newAcc.notes,
        },
      };
      await window.api.saveSkus(updated);
    }

    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', width: '100%' }}
      >
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>{editingId ? 'Edit Accessory' : 'Add Accessory'}</h2>
          <button type="button" className="btn-icon" onClick={onClose} title="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          {!editingId && (
            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.2rem',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Target size={18} color="var(--accent)" />
                <span style={{ fontWeight: 500 }}>Universal Barcode Scanner</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Scan or type UPC..."
                  value={upcInput}
                  onChange={(e) => setUpcInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      lookupUPC(upcInput);
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => lookupUPC(upcInput)}
                  disabled={!upcInput || isLookingUp}
                >
                  {isLookingUp ? 'Searching...' : 'Lookup'}
                </button>
              </div>

              {lookupStatus && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    background:
                      lookupStatus.type === 'success'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    color: lookupStatus.type === 'success' ? '#34d399' : '#f87171',
                    border: `1px solid ${lookupStatus.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  }}
                >
                  <AlertTriangle size={16} />
                  {lookupStatus.message}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Accessory Type</label>
              <AutocompleteInput
                mode="select"
                name="type"
                value={formData.type || 'Optic'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                options={accessoryTypes}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Storage Location / Container</label>
              <StorageLocationSelect
                value={storageLocationId}
                onChange={(locId) => setStorageLocationId(locId)}
                locations={locations}
                placeholder="Select Safe / Case / Container..."
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Manufacturer</label>
              <input
                required
                type="text"
                className="form-input"
                value={formData.manufacturer || ''}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Model</label>
              <input
                required
                type="text"
                className="form-input"
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          {/* Type-Specific Fields */}
          {formData.type === 'Optic' && (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Magnification / Reticle (e.g. 1-6x24, 3 MOA Dot)</label>
              <input
                type="text"
                className="form-input"
                value={formData.magnification || ''}
                onChange={(e) => setFormData({ ...formData, magnification: e.target.value })}
              />
            </div>
          )}

          {formData.type === 'Suppressor' && (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Rated Calibers (e.g. Up to .300 Win Mag)</label>
              <input
                type="text"
                className="form-input"
                value={formData.ratedCalibers || ''}
                onChange={(e) => setFormData({ ...formData, ratedCalibers: e.target.value })}
              />
            </div>
          )}

          {formData.type === 'Light' && (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Lumens</label>
              <input
                type="number"
                className="form-input"
                value={formData.lumens === undefined ? '' : formData.lumens}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lumens: e.target.value === '' ? undefined : parseInt(e.target.value),
                  })
                }
              />
            </div>
          )}

          {formData.type === 'Magazine' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Caliber</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.caliber || ''}
                  onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Capacity</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.capacity === undefined ? '' : formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: e.target.value === '' ? undefined : parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}

          {formData.type === 'Holster' && (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Supported Models / Platform</label>
              <input
                type="text"
                className="form-input"
                value={formData.supportedModels || ''}
                onChange={(e) => setFormData({ ...formData, supportedModels: e.target.value })}
              />
            </div>
          )}

          {/* Stock & Chassis Technical Specifications Panel */}
          {(formData.type === 'Stock' || formData.type === 'Chassis') && (
            <div
              style={{
                background:
                  formData.type === 'Chassis'
                    ? 'rgba(6, 182, 212, 0.05)'
                    : 'rgba(16, 185, 129, 0.05)',
                border: `1px solid ${formData.type === 'Chassis' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                borderRadius: '12px',
                padding: '1.25rem',
                marginTop: '1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: formData.type === 'Chassis' ? '#06b6d4' : '#10b981',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>
                  {formData.type === 'Chassis'
                    ? 'Precision Chassis Specifications'
                    : 'Stock & Furniture Specifications'}
                </span>
              </div>

              {/* Subtype & Action Inlet */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Furniture / Stock Subtype</label>
                  <select
                    className="form-input"
                    value={formData.stockType || ''}
                    onChange={(e) => setFormData({ ...formData, stockType: e.target.value })}
                  >
                    <option value="">Select Subtype...</option>
                    <option value="Precision Rifle Chassis">
                      Precision Rifle Chassis (MDT, KRG, MPA)
                    </option>
                    <option value="T/C Rifle Buttstock">
                      T/C Rifle Buttstock (Encore / Pro Hunter / Contender)
                    </option>
                    <option value="T/C Pistol Grip / Adapter">
                      T/C Pistol Grip / 1913 Adapter (Pachmayr / Sharps Bros)
                    </option>
                    <option value="T/C Forend (Pistol / Rifle)">
                      T/C Forend (10" Bull, Super 14", Heavy Rifle)
                    </option>
                    <option value="Adjustable Carbine Stock">
                      Adjustable Carbine Stock (CTR, B5 Bravo, SOPMOD)
                    </option>
                    <option value="Precision PRS / DMR Stock">
                      Precision PRS / DMR Stock (PRS Gen3, SRS)
                    </option>
                    <option value="Pistol Stabilizing Brace">
                      Pistol Stabilizing Brace (SBA3, SBA4, Tailhook)
                    </option>
                    <option value="1913 Picatinny Folding Stock">
                      1913 Picatinny Folding Stock (SIG Minimalist, MI)
                    </option>
                    <option value="Traditional / Hunting Stock">
                      Traditional / Hunting Stock (McMillan, Manners, Boyd's)
                    </option>
                    <option value="Shotgun Stock / Adapter">
                      Shotgun Stock / Adapter (Magpul SGA)
                    </option>
                    <option value="Fixed Rifle (A2)">Fixed Rifle (A2 Standard)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Action Inlet / Platform Fits</label>
                  <AutocompleteInput
                    name="actionInlet"
                    value={formData.actionInlet || formData.supportedModels || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, actionInlet: val, supportedModels: val });
                    }}
                    options={[
                      'Thompson/Center Encore / Pro Hunter / Endeavor',
                      'Thompson/Center Contender (G1 / Armor Alloy)',
                      'Thompson/Center G2 Contender / SSK-50',
                      'Remington 700 Short Action',
                      'Remington 700 Long Action',
                      'Tikka T3 / T3x',
                      'Savage 10 / 110 (Short Action)',
                      'Savage 110 (Long Action)',
                      'Howa 1500 / Weatherby Vanguard',
                      'Ruger American (Short Action)',
                      'Ruger 10/22',
                      'AR-15 / M4 / M16',
                      'AR-10 / SR-25 / DPMS .308',
                      'Mossberg 500 / 590',
                      'Remington 870',
                      'AK-47 / AKM (Stamped Trunnion)',
                      'SIG MCX / MPX / 1913 Rail',
                    ]}
                    placeholder="e.g. T/C Encore, Rem 700 SA, AR-15"
                  />
                </div>
              </div>

              {/* Mounting Interface & T/C Forend Spacing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Mounting Interface / Buffer Standard</label>
                  <select
                    className="form-input"
                    value={formData.bufferTubeType || ''}
                    onChange={(e) => setFormData({ ...formData, bufferTubeType: e.target.value })}
                  >
                    <option value="">Select Interface...</option>
                    <option value='Mil-Spec Buffer Tube (1.14" OD)'>
                      Mil-Spec Buffer Tube (1.14" OD)
                    </option>
                    <option value='Commercial Buffer Tube (1.17" OD)'>
                      Commercial Buffer Tube (1.17" OD)
                    </option>
                    <option value="T/C Encore Frame Bolt Interface">
                      T/C Encore Frame Bolt Interface
                    </option>
                    <option value="T/C Contender (G1) Frame Interface">
                      T/C Contender (G1) Frame Interface
                    </option>
                    <option value="T/C G2 / SSK-50 Frame Interface">
                      T/C G2 / SSK-50 Frame Interface
                    </option>
                    <option value="Picatinny 1913 Rail Mount">
                      Picatinny 1913 Rail Mount (Sharps / SIG)
                    </option>
                    <option value="Direct Action V-Block Bedding">
                      Direct Action V-Block Bedding (Chassis)
                    </option>
                    <option value="A2 Fixed Rifle Extension">A2 Fixed Rifle Extension</option>
                    <option value="AK Fixed/Folding Trunnion">AK Fixed/Folding Trunnion</option>
                    <option value="Shotgun Receiver Adapter">Shotgun Receiver Adapter</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>T/C Forend Spacing / Contour</label>
                  <select
                    className="form-input"
                    value={formData.tcForendSpacing || ''}
                    onChange={(e) => setFormData({ ...formData, tcForendSpacing: e.target.value })}
                  >
                    <option value="">N/A or Standard Forend</option>
                    <option value="Single Screw (Pistol/Carbine)">
                      Single Screw (Pistol/Carbine)
                    </option>
                    <option value="Double Screw (Standard Spacing)">
                      Double Screw (Standard Spacing)
                    </option>
                    <option value="Double Screw (Wide Spacing)">Double Screw (Wide Spacing)</option>
                    <option value="Heavy / Bull Barrel Contour">Heavy / Bull Barrel Contour</option>
                    <option value="Tapered Standard Contour">Tapered Standard Contour</option>
                    <option value="Free-Floating Hanger Bar">
                      Free-Floating Hanger Bar (EABCO / Tony's)
                    </option>
                    <option value="Muzzleloader (w/ Ramrod Channel)">
                      Muzzleloader (w/ Ramrod Channel)
                    </option>
                  </select>
                </div>
              </div>

              {/* Material & Weight */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Material &amp; Construction</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.material || ''}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="e.g. 6061-T6 Billet Aluminum, Carbon Fiber, Walnut"
                  />
                </div>
                <div className="form-group">
                  <label>Component Weight</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="e.g. 3.8 lbs, 12.5 oz, 9.5 oz"
                  />
                </div>
              </div>

              {/* Folding Stock Checkbox */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    margin: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!formData.isFolding}
                    onChange={(e) => setFormData({ ...formData, isFolding: e.target.checked })}
                    style={{ width: '1.15rem', height: '1.15rem', accentColor: '#10b981' }}
                  />
                  <span>Side-Folding Stock / Mechanism</span>
                </label>
              </div>
            </div>
          )}

          {/* Gun Belt & Western Cartridge Rig Form Section */}
          {formData.type === 'Belt' && (
            <div
              style={{
                background: 'rgba(234, 179, 8, 0.05)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginTop: '1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#eab308',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>Gun Belt &amp; Tactical Rig Specifications</span>
              </div>

              {/* Subtype & Belt Width */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Belt Subtype / Rig Style</label>
                  <select
                    className="form-input"
                    value={formData.beltType || ''}
                    onChange={(e) => setFormData({ ...formData, beltType: e.target.value })}
                  >
                    <option value="">Select Subtype...</option>
                    <option value="Western Buscadero Drop Belt (Single/Double)">
                      Western Buscadero Drop Belt (Hunter 150/155, Triple K)
                    </option>
                    <option value="Straight Western Cartridge Belt">
                      Straight Western Cartridge Belt (Hunter 158, Kirkpatrick)
                    </option>
                    <option value="Cross-Chest Bandolier / Cartridge Belt">
                      Cross-Chest Bandolier / Ammo Belt (Triple K, Galco)
                    </option>
                    <option value="Folded Leather Money Belt / Prairie Belt">
                      Folded Leather Money Belt / Prairie Belt (SASS / Frontier)
                    </option>
                    <option value="Two-Piece MOLLE Battle Belt">
                      Two-Piece MOLLE Battle Belt (Blue Alpha, AWS, Ronin)
                    </option>
                    <option value="EDC Concealed Carry Ratchet Belt">
                      EDC Concealed Carry Ratchet Belt (Kore, Nexbelt)
                    </option>
                    <option value="Low-Profile EDC Nylon Belt">
                      Low-Profile EDC Nylon Belt (Tenicor Zero, Blue Alpha)
                    </option>
                    <option value="Reinforced Leather Gun Belt (Steel/Poly Core)">
                      Reinforced Leather Gun Belt (Daltech Steel Core, Bigfoot)
                    </option>
                    <option value="Competition Rig (USPSA / IPSC / 3-Gun)">
                      Competition Rig (DAA Lynx, Safariland ELS)
                    </option>
                    <option value="Duty / Law Enforcement Belt">
                      Duty / Law Enforcement Belt (Safariland 7920, Bianchi)
                    </option>
                    <option value="Padded War Belt / Sleeve">
                      Padded War Belt / Sleeve (HSGI, Viking Tactics)
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Belt Width</label>
                  <select
                    className="form-input"
                    value={formData.beltWidth || ''}
                    onChange={(e) => setFormData({ ...formData, beltWidth: e.target.value })}
                  >
                    <option value="">Select Width...</option>
                    <option value='1.5" (Standard EDC / Concealed Carry)'>
                      1.5" (Standard EDC / Concealed Carry)
                    </option>
                    <option value='1.75" (Tactical / Battle Belt / Riggers)'>
                      1.75" (Tactical / Battle Belt / Riggers)
                    </option>
                    <option value='2.0" (Heavy Duty / Western Cartridge)'>
                      2.0" (Heavy Duty / Western Cartridge)
                    </option>
                    <option value='2.25" (Standard Duty / Police / LE)'>
                      2.25" (Standard Duty / Police / LE)
                    </option>
                    <option value='2.75" - 3.0" (Western Buscadero Drop Belt)'>
                      2.75" - 3.0" (Western Buscadero Drop Belt)
                    </option>
                    <option value='1.25" (Dress / Low-Profile EDC)'>
                      1.25" (Dress / Low-Profile EDC)
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Western Drop Configuration & Cartridge Loops */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Western Drop Loop</label>
                  <select
                    className="form-input"
                    value={formData.dropLoopType || ''}
                    onChange={(e) => setFormData({ ...formData, dropLoopType: e.target.value })}
                  >
                    <option value="">N/A / Standard Straight</option>
                    <option value="Single Drop (Right-Hand Strong Side)">
                      Single Drop (Right-Hand Strong Side)
                    </option>
                    <option value="Single Drop (Left-Hand Strong Side)">
                      Single Drop (Left-Hand Strong Side)
                    </option>
                    <option value="Double Drop (Dual Strong / Cross Draw)">
                      Double Drop (Dual Strong / Cross Draw)
                    </option>
                    <option value="Straight Non-Drop / Standard Rise">
                      Straight Non-Drop / Standard Rise
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Cartridge Loops (Caliber &amp; Count)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                    <select
                      className="form-input"
                      value={formData.cartridgeLoopCaliber || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, cartridgeLoopCaliber: e.target.value })
                      }
                    >
                      <option value="">None / Smooth Leather</option>
                      <option value=".22 LR / .22 WMR">.22 LR / .22 WMR</option>
                      <option value=".38 Special / .357 Magnum">.38 Special / .357 Magnum</option>
                      <option value=".44 Special / .44 Magnum / .45 Colt">
                        .44 Special / .44 Magnum / .45 Colt
                      </option>
                      <option value=".45-70 Government / Big Bore Rifle">
                        .45-70 Government / Big Bore Rifle
                      </option>
                      <option value="12 Gauge / 20 Gauge Shotshells">
                        12 Gauge / 20 Gauge Shotshells
                      </option>
                      <option value="Multi-Caliber / Elastic Loops">
                        Multi-Caliber / Elastic Loops
                      </option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={
                        formData.cartridgeLoopCount === undefined ? '' : formData.cartridgeLoopCount
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cartridgeLoopCount:
                            e.target.value === '' ? undefined : parseInt(e.target.value),
                        })
                      }
                      placeholder="Qty (25)"
                      title="Number of ammunition loops"
                    />
                  </div>
                </div>
              </div>

              {/* Buckle Mechanism & Stiffener Core */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Buckle Mechanism</label>
                  <select
                    className="form-input"
                    value={formData.buckleType || ''}
                    onChange={(e) => setFormData({ ...formData, buckleType: e.target.value })}
                  >
                    <option value="">Select Buckle...</option>
                    <option value="AustriAlpin Cobra Quick-Release">
                      AustriAlpin Cobra Quick-Release (Alloy/D-Ring)
                    </option>
                    <option value='Micro-Adjustable Ratchet / Track (1/4" Steps)'>
                      Micro-Adjustable Ratchet / Track (1/4" Steps)
                    </option>
                    <option value="Classic Western Clipped-Corner / Nickel Buckle">
                      Classic Western Clipped-Corner / Nickel Buckle
                    </option>
                    <option value="Classic Dual-Prong Roller Buckle">
                      Classic Dual-Prong Roller Buckle
                    </option>
                    <option value="Single-Prong Solid Brass / Steel Buckle">
                      Single-Prong Solid Brass / Steel Buckle
                    </option>
                    <option value="Low-Profile Friction / G-Hook">
                      Low-Profile Friction / G-Hook
                    </option>
                    <option value="Modular Interlock Links (DAA Lynx)">
                      Modular Interlock Links (DAA Lynx)
                    </option>
                    <option value="Hook-and-Loop Overlap">Hook-and-Loop Overlap</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Internal Stiffener Core</label>
                  <select
                    className="form-input"
                    value={formData.stiffenerCore || ''}
                    onChange={(e) => setFormData({ ...formData, stiffenerCore: e.target.value })}
                  >
                    <option value="">Select Stiffener...</option>
                    <option value="Tegris / Curv Thermoplastic Composite">
                      Tegris / Curv Thermoplastic Composite
                    </option>
                    <option value="Reinforced Polymer (Power-Core / HDPE)">
                      Reinforced Polymer (Power-Core / HDPE)
                    </option>
                    <option value="Dual-Layer Spring Steel Core">
                      Dual-Layer Spring Steel Core
                    </option>
                    <option value="Double-Layer Heavy Saddle Leather">
                      Double-Layer Heavy Saddle Leather
                    </option>
                    <option value="Double-Layer Scuba Webbing">Double-Layer Scuba Webbing</option>
                    <option value="Multi-Layer Ballistic Nylon">Multi-Layer Ballistic Nylon</option>
                    <option value="None / Flexible Unlined">None / Flexible Unlined</option>
                  </select>
                </div>
              </div>

              {/* Attachment System & Waist Size */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Attachment System / Interface</label>
                  <select
                    className="form-input"
                    value={formData.attachmentSystem || ''}
                    onChange={(e) => setFormData({ ...formData, attachmentSystem: e.target.value })}
                  >
                    <option value="">Select Attachment...</option>
                    <option value="Integrated Western Drop Slot (Hunter 1060/1100/2200 Holsters)">
                      Integrated Western Drop Slot (Hunter 1060/1100/2200)
                    </option>
                    <option value="Laser-Cut Micro-MOLLE / PALS Slots">
                      Laser-Cut Micro-MOLLE / PALS Slots
                    </option>
                    <option value='Standard 1/2" Tactical MOLLE Webbing'>
                      Standard 1/2" Tactical MOLLE Webbing
                    </option>
                    <option value="Safariland ELS / QLS Fork Mounting Plate">
                      Safariland ELS / QLS Fork Mounting Plate
                    </option>
                    <option value='Direct Holster Clip / 1.5"-1.75" Loops'>
                      Direct Holster Clip / 1.5"-1.75" Loops
                    </option>
                    <option value="Inner Loop / Hook Velcro (2-Piece)">
                      Inner Loop / Hook Velcro (2-Piece)
                    </option>
                    <option value="Belt Keepers (4-Point Duty)">Belt Keepers (4-Point Duty)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Waist Sizing Range</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.waistSize || ''}
                    onChange={(e) => setFormData({ ...formData, waistSize: e.target.value })}
                    placeholder='e.g. 32" - 36" (Size M), 40" - 44" (Western Hip), Trim-to-Fit'
                  />
                </div>
              </div>

              {/* Inner Belt & Color Pattern */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Inner Belt System</label>
                  <select
                    className="form-input"
                    value={formData.innerBeltType || ''}
                    onChange={(e) => setFormData({ ...formData, innerBeltType: e.target.value })}
                  >
                    <option value="">Select Inner Belt...</option>
                    <option value='Loop Inner Belt (Standard 1.5" Loop Velcro)'>
                      Loop Inner Belt (Standard 1.5" Loop)
                    </option>
                    <option value="Hook Inner Belt (Outer has Loop)">
                      Hook Inner Belt (Outer has Loop)
                    </option>
                    <option value="Low-Profile EDC / G-Hook Inner Belt">
                      Low-Profile EDC / G-Hook Inner
                    </option>
                    <option value="Padded Non-Slip Neoprene Grip Pad">
                      Padded Non-Slip Neoprene Grip Pad
                    </option>
                    <option value="Not Applicable / Single-Belt System">
                      Not Applicable / Single-Belt System
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Color / Pattern / Tooling</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.colorPattern || ''}
                    onChange={(e) => setFormData({ ...formData, colorPattern: e.target.value })}
                    placeholder="e.g. Chestnut Brown Leather, Antique Floral Tooled, Multicam"
                  />
                </div>
              </div>

              {/* Material & Weight */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Material &amp; Construction</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.material || ''}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="e.g. Full-Grain Saddle Leather, 1000D Cordura + Tegris"
                  />
                </div>

                <div className="form-group">
                  <label>Component Weight</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="e.g. 18.5 oz, 11.2 oz, 6.5 oz"
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={
                  formData.quantity === undefined || formData.quantity === null
                    ? ''
                    : formData.quantity
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: e.target.value === '' ? ('' as any) : parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div className="form-group">
              <label>Value / Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={
                  formData.value === undefined || formData.value === null ? '' : formData.value
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    value: e.target.value === '' ? null : parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div className="form-group">
              <label>Rounds on Gear</label>
              <input
                type="number"
                min="0"
                step="1"
                className="form-input"
                value={
                  formData.round_count === undefined || formData.round_count === null
                    ? ''
                    : formData.round_count
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    round_count: e.target.value === '' ? undefined : parseInt(e.target.value),
                  })
                }
                placeholder="e.g. 1500"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Serial Number (Leave blank if tracking multiple qty)</label>
              <input
                type="text"
                className="form-input"
                value={formData.serialNumber || ''}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="e.g. SN-981240"
              />
            </div>
            <div className="form-group">
              <label>Part # / SKU / UPC Barcode</label>
              <input
                type="text"
                className="form-input"
                value={formData.upc_code || upcInput || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, upc_code: val });
                  setUpcInput(val);
                }}
                placeholder="e.g. APX-EXT-100, HS507C-X2"
              />
            </div>
          </div>

          {(formData.upc_code || upcInput) && (
            <div
              style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <input
                type="checkbox"
                id="saveToSkuDb"
                checked={saveToSkuDb}
                onChange={(e) => setSaveToSkuDb(e.target.checked)}
                style={{
                  width: '1.2rem',
                  height: '1.2rem',
                  accentColor: '#8b5cf6',
                  cursor: 'pointer',
                }}
              />
              <label
                htmlFor="saveToSkuDb"
                style={{
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                Save this part to <strong>Custom SKU Dictionary</strong> for instant auto-filling
                when scanning
              </label>
            </div>
          )}

          <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
            <label>Mounting & Allocations</label>
            <div
              style={{
                background: 'rgba(0,0,0,0.2)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
              }}
            >
              {(formData.mounts || []).map((mount, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <AutocompleteInput
                      mode="select"
                      name={`mount-${index}`}
                      value={String(mount.firearmId)}
                      onChange={(e) => {
                        const newMounts = [...(formData.mounts || [])];
                        newMounts[index].firearmId = Number(e.target.value);
                        setFormData({ ...formData, mounts: newMounts });
                      }}
                      options={[
                        { value: '0', label: 'Select Firearm...' },
                        ...firearms.map((f) => ({
                          value: String(f.id),
                          label: `${f.make} ${f.model} (${f.caliber})`,
                        })),
                      ]}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Qty:
                    </span>
                    <input
                      type="number"
                      min="1"
                      max={formData.quantity}
                      className="form-input"
                      style={{ width: '70px', padding: '0.4rem' }}
                      value={mount.quantity === undefined ? '' : mount.quantity}
                      onChange={(e) => {
                        const newMounts = [...(formData.mounts || [])];
                        newMounts[index].quantity =
                          e.target.value === '' ? ('' as any) : Number(e.target.value);
                        setFormData({ ...formData, mounts: newMounts });
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-icon"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => {
                      const newMounts = [...(formData.mounts || [])];
                      newMounts.splice(index, 1);
                      setFormData({ ...formData, mounts: newMounts });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {(() => {
                const totalAllocated = (formData.mounts || []).reduce(
                  (sum, m) => sum + m.quantity,
                  0
                );
                const unallocated = (formData.quantity || 1) - totalAllocated;
                return (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: unallocated < 0 ? 'var(--danger)' : 'var(--text-secondary)',
                      }}
                    >
                      {unallocated > 0
                        ? `${unallocated} unallocated (in safe)`
                        : unallocated < 0
                          ? `Over-allocated by ${Math.abs(unallocated)}!`
                          : 'All items allocated.'}
                    </span>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        const newMounts = [...(formData.mounts || [])];
                        newMounts.push({ firearmId: firearms[0]?.id || 0, quantity: 1 });
                        setFormData({ ...formData, mounts: newMounts });
                      }}
                      disabled={unallocated <= 0 || firearms.length === 0}
                    >
                      + Add Mount
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          <div
            className="form-group full-width"
            style={{
              background: 'rgba(234, 179, 8, 0.05)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid rgba(234, 179, 8, 0.2)',
              marginBottom: '1.5rem',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                marginBottom: formData.is_nfa ? '1rem' : '0',
              }}
            >
              <input
                type="checkbox"
                checked={formData.is_nfa || false}
                onChange={(e) => setFormData({ ...formData, is_nfa: e.target.checked })}
                style={{ width: 'auto' }}
              />
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                NFA Regulated Item
              </span>
            </label>
            {formData.is_nfa && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>NFA Type</label>
                  <AutocompleteInput
                    mode="select"
                    name="nfa_type"
                    value={formData.nfa_type || ''}
                    onChange={(e) => setFormData({ ...formData, nfa_type: e.target.value as any })}
                    options={[
                      { value: '', label: 'Select Type...' },
                      { value: 'Suppressor', label: 'Suppressor' },
                      { value: 'Machine Gun', label: 'Machine Gun' },
                      { value: 'Destructive Device', label: 'Destructive Device' },
                    ]}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Registration Type</label>
                  <AutocompleteInput
                    mode="select"
                    name="registration_type"
                    value={formData.registration_type || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, registration_type: e.target.value as any })
                    }
                    options={[
                      { value: '', label: 'Select Type...' },
                      { value: 'Individual', label: 'Individual' },
                      { value: 'Trust', label: 'Trust' },
                      { value: 'Corporation', label: 'Corporation' },
                    ]}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Stamp Status</label>
                  <AutocompleteInput
                    mode="select"
                    name="stamp_status"
                    value={formData.stamp_status || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, stamp_status: e.target.value as any })
                    }
                    options={[
                      { value: '', label: 'Select Status...' },
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Approved', label: 'Approved' },
                    ]}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Date Submitted</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.stamp_submitted_date || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, stamp_submitted_date: e.target.value })
                    }
                  />
                </div>
                {formData.stamp_status === 'Approved' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Date Approved</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.stamp_approved_date || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, stamp_approved_date: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              className="form-input"
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            ></textarea>
          </div>

          <div className="form-group">
            <label>Photo</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {formData.photo && (
                <img
                  src={
                    formData.photo.startsWith('local-file://')
                      ? formData.photo
                      : `local-file://${formData.photo}`
                  }
                  alt="Preview"
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)',
                  }}
                />
              )}
              <button type="button" className="btn-secondary" onClick={handlePhotoUpload}>
                <Camera size={18} /> {formData.photo ? 'Change Photo' : 'Select Photo'}
              </button>
              {formData.photo && (
                <button
                  type="button"
                  className="btn-icon"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => setFormData({ ...formData, photo: null })}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Accessory
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
