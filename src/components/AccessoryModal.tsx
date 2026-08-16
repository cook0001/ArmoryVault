import React, { useState, useEffect } from 'react';
import { Accessory, Firearm } from '../types';
import { useNavigate } from 'react-router-dom';
import { parseBarcodeData } from '../utils/BarcodeEngine';
import { Target, AlertTriangle } from 'lucide-react';
import { Camera } from 'lucide-react';

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
  quantity: '' as any,
  serialNumber: '',
  value: null,
  purchaseDate: new Date().toISOString().split('T')[0],
  mounts: [],
  notes: '',
  photo: null
};

export const AccessoryModal: React.FC<AccessoryModalProps> = ({ isOpen, onClose, onSave, editingId, initialData, initialUpc, firearms }) => {
  const [formData, setFormData] = useState<Partial<Accessory>>(defaultFormData);
  const [upcInput, setUpcInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<{message: string, type: 'error' | 'success'} | null>(null);
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
          if (window.confirm("This looks like loaded Ammunition. Would you like to redirect to the Ammo tab?")) {
            navigate('/ammo', { state: { openAddModal: true, upc: upc } });
            return;
          }
        } else if (parsed.category === 'component') {
          if (window.confirm("This looks like a Reloading Component. Would you like to redirect to the Components tab?")) {
            navigate('/components', { state: { openAddModal: true, upc: upc } });
            return;
          }
        } else if (parsed.category === 'unknown') {
          const typeChoice = window.prompt("Is this Ammo, Component, or Accessory? (Type 'ammo', 'component', or 'accessory')", "accessory");
          if (typeChoice && typeChoice.toLowerCase() === 'ammo') {
            navigate('/ammo', { state: { openAddModal: true, upc: upc } });
            return;
          } else if (typeChoice && typeChoice.toLowerCase() === 'component') {
            navigate('/components', { state: { openAddModal: true, upc: upc } });
            return;
          }
        }

        setFormData(prev => ({
          ...prev,
          type: parsed.parsedAccessory?.type || prev.type,
          manufacturer: parsed.parsedAccessory?.manufacturer || prev.manufacturer,
          model: parsed.parsedAccessory?.model || prev.model,
          value: parsed.parsedAccessory?.value || prev.value,
        }));
        setLookupStatus({ message: 'Accessory found and parsed automatically!', type: 'success' });
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
    if (isOpen) {
      setUpcInput('');
      setLookupStatus(null);
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

  const accessoryTypes = ['Optic', 'Suppressor', 'Light', 'Holster', 'Mount', 'Sling', 'Magazine', 'Other'];

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

    if (editingId) {
      await window.api.updateAccessory(editingId, newAcc);
    } else {
      const allAccs = await window.api.getAccessories();
      const duplicate = allAccs.find((a: any) => 
        a.type === newAcc.type &&
        a.manufacturer === newAcc.manufacturer &&
        a.model === newAcc.model
      );
      
      let merged = false;
      if (duplicate) {
        if (window.confirm(`An existing entry for ${duplicate.manufacturer || ''} ${duplicate.model || duplicate.type} was found. Would you like to merge this into the existing entry?`)) {
           const mergedData = { ...duplicate };
           mergedData.quantity = (duplicate.quantity || 1) + (newAcc.quantity || 1);
           if (!mergedData.upc_code && newAcc.upc_code) {
             mergedData.upc_code = newAcc.upc_code;
           }
           await window.api.updateAccessory(duplicate.id!, mergedData);
           merged = true;
        }
      }
      
      if (!merged) {
        await window.api.addAccessory(newAcc);
      }
    }
    
    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{editingId ? 'Edit Accessory' : 'Add Accessory'}</h2>
        
        <form onSubmit={handleSave}>
          
          {!editingId && (
            <div style={{ background: 'var(--bg-card)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
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
                  onChange={e => setUpcInput(e.target.value)}
                  onKeyDown={e => {
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
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', 
                  padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem',
                  background: lookupStatus.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: lookupStatus.type === 'error' ? '#ef4444' : '#22c55e',
                  border: `1px solid ${lookupStatus.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                }}>
                  <AlertTriangle size={16} />
                  {lookupStatus.message}
                </div>
              )}
            </div>
          )}

          <div className="form-group">

            <label>Accessory Type</label>
            <select 
              className="form-input" 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value as any})}
            >
              {accessoryTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Manufacturer</label>
              <input required type="text" className="form-input" value={formData.manufacturer || ''} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Model</label>
              <input required type="text" className="form-input" value={formData.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} />
            </div>
          </div>

          {formData.type === 'Optic' && (
            <div className="form-group">
              <label>Magnification (e.g. 1-6x24, 3-9x40, or 1x for Red Dot)</label>
              <input type="text" className="form-input" value={formData.magnification || ''} onChange={e => setFormData({...formData, magnification: e.target.value})} />
            </div>
          )}

          {formData.type === 'Suppressor' && (
            <div className="form-group">
              <label>Rated Calibers (e.g. .30 Cal, 5.56mm, Multi-cal)</label>
              <input type="text" className="form-input" value={formData.ratedCalibers || ''} onChange={e => setFormData({...formData, ratedCalibers: e.target.value})} />
            </div>
          )}

          {formData.type === 'Light' && (
            <div className="form-group">
              <label>Lumens</label>
              <input type="number" min="0" className="form-input" value={formData.lumens === undefined ? '' : formData.lumens} onChange={e => setFormData({...formData, lumens: e.target.value === '' ? undefined : parseInt(e.target.value)})} />
            </div>
          )}

          {formData.type === 'Holster' && (
            <div className="form-group">
              <label>Fits / Supported Models (e.g. Glock 19 Gen 5)</label>
              <input type="text" className="form-input" value={formData.supportedModels || ''} onChange={e => setFormData({...formData, supportedModels: e.target.value})} />
            </div>
          )}

          {formData.type === 'Magazine' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Caliber (e.g. 9mm, 5.56 NATO)</label>
                <input type="text" className="form-input" value={formData.caliber || ''} onChange={e => setFormData({...formData, caliber: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input type="number" min="0" className="form-input" value={formData.capacity === undefined || formData.capacity === null ? '' : formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value === '' ? undefined : parseInt(e.target.value)})} />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" min="1" className="form-input" value={formData.quantity === undefined || formData.quantity === null ? '' : formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value === '' ? ('' as any) : parseInt(e.target.value)})} />
            </div>
            <div className="form-group">
              <label>Value / Price (Per Item, $)</label>
              <input type="number" step="0.01" className="form-input" value={formData.value === undefined || formData.value === null ? '' : formData.value} onChange={e => setFormData({...formData, value: e.target.value === '' ? null : parseFloat(e.target.value)})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Serial Number (Leave blank if tracking multiple qty)</label>
              <input type="text" className="form-input" value={formData.serialNumber || ''} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
            </div>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
            <label>Mounting & Allocations</label>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              {(formData.mounts || []).map((mount, index) => (
                <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <select 
                    className="form-input" 
                    style={{ flex: 1 }}
                    value={mount.firearmId} 
                    onChange={e => {
                      const newMounts = [...(formData.mounts || [])];
                      newMounts[index].firearmId = Number(e.target.value);
                      setFormData({...formData, mounts: newMounts});
                    }}
                  >
                    <option value="0" disabled>Select Firearm...</option>
                    {firearms.map(f => (
                      <option key={f.id} value={f.id}>{f.make} {f.model} ({f.caliber})</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Qty:</span>
                    <input 
                      type="number" 
                      min="1" 
                      max={formData.quantity}
                      className="form-input" 
                      style={{ width: '70px', padding: '0.4rem' }}
                      value={mount.quantity === undefined ? '' : mount.quantity} 
                      onChange={e => {
                        const newMounts = [...(formData.mounts || [])];
                        newMounts[index].quantity = e.target.value === '' ? ('' as any) : Number(e.target.value);
                        setFormData({...formData, mounts: newMounts});
                      }}
                    />
                  </div>
                  <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => {
                    const newMounts = [...(formData.mounts || [])];
                    newMounts.splice(index, 1);
                    setFormData({...formData, mounts: newMounts});
                  }}>Remove</button>
                </div>
              ))}
              {(() => {
                const totalAllocated = (formData.mounts || []).reduce((sum, m) => sum + m.quantity, 0);
                const unallocated = (formData.quantity || 1) - totalAllocated;
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: unallocated < 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {unallocated > 0 ? `${unallocated} unallocated (in safe)` : unallocated < 0 ? `Over-allocated by ${Math.abs(unallocated)}!` : 'All items allocated.'}
                    </span>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        const newMounts = [...(formData.mounts || [])];
                        newMounts.push({ firearmId: firearms[0]?.id || 0, quantity: 1 });
                        setFormData({...formData, mounts: newMounts});
                      }}
                      disabled={unallocated <= 0 || firearms.length === 0}
                    >
                      + Add Mount
                    </button>
                  </div>
                )
              })()}
            </div>
          </div>

          <div className="form-group full-width" style={{ background: 'rgba(234, 179, 8, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: formData.is_nfa ? '1rem' : '0' }}>
              <input type="checkbox" checked={formData.is_nfa || false} onChange={e => setFormData({...formData, is_nfa: e.target.checked})} style={{ width: 'auto' }} />
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>NFA Regulated Item</span>
            </label>
            {formData.is_nfa && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>NFA Type</label>
                  <select className="form-input" value={formData.nfa_type || ''} onChange={e => setFormData({...formData, nfa_type: e.target.value as any})}>
                    <option value="">Select Type...</option>
                    <option value="Suppressor">Suppressor</option>
                    <option value="Machine Gun">Machine Gun</option>
                    <option value="Destructive Device">Destructive Device</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Registration Type</label>
                  <select className="form-input" value={formData.registration_type || ''} onChange={e => setFormData({...formData, registration_type: e.target.value as any})}>
                    <option value="">Select Type...</option>
                    <option value="Individual">Individual</option>
                    <option value="Trust">Trust</option>
                    <option value="Corporation">Corporation</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Stamp Status</label>
                  <select className="form-input" value={formData.stamp_status || ''} onChange={e => setFormData({...formData, stamp_status: e.target.value as any})}>
                    <option value="">Select Status...</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Date Submitted</label>
                  <input type="date" className="form-input" value={formData.stamp_submitted_date || ''} onChange={e => setFormData({...formData, stamp_submitted_date: e.target.value})} />
                </div>
                {formData.stamp_status === 'Approved' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Date Approved</label>
                    <input type="date" className="form-input" value={formData.stamp_approved_date || ''} onChange={e => setFormData({...formData, stamp_approved_date: e.target.value})} />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-input" rows={2} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
          </div>

          <div className="form-group">
            <label>Photo</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {formData.photo && (
                <img src={formData.photo.startsWith('local-file://') ? formData.photo : `local-file://${formData.photo}`} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
              )}
              <button type="button" className="btn-secondary" onClick={handlePhotoUpload}>
                <Camera size={18} /> {formData.photo ? 'Change Photo' : 'Select Photo'}
              </button>
              {formData.photo && (
                <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setFormData({...formData, photo: null})}>
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Accessory</button>
          </div>
        </form>
      </div>
    </div>
  );
};
