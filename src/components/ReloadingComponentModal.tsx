import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReloadingComponent } from '../types';
import { parseBarcodeData } from '../utils/BarcodeEngine';
import { COMPREHENSIVE_BULLET_TYPES } from '../utils/caliberHelpers';

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



export const ReloadingComponentModal: React.FC<ReloadingComponentModalProps> = ({ isOpen, onClose, onSave, editingId, initialData }) => {
  const [formData, setFormData] = useState<Partial<ReloadingComponent>>(defaultFormData);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const navigate = useNavigate();
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

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
        } else if (parsed.category === 'accessory') {
          if (window.confirm("This looks like an Accessory. Would you like to redirect to the Accessories tab?")) {
            navigate('/accessories', { state: { openAddModal: true, upc: upc } });
            return;
          }
        } else if (parsed.category === 'unknown') {
          const typeChoice = window.prompt("Is this Ammo, Component, or Accessory? (Type 'ammo', 'component', or 'accessory')", "component");
          if (typeChoice && typeChoice.toLowerCase() === 'ammo') {
            navigate('/ammo', { state: { openAddModal: true, upc: upc } });
            return;
          } else if (typeChoice && typeChoice.toLowerCase() === 'accessory') {
            navigate('/accessories', { state: { openAddModal: true, upc: upc } });
            return;
          }
        }

        setFormData(prev => {
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
            isMagnumPrimer: parsed.parsedComponent?.isMagnumPrimer !== undefined ? parsed.parsedComponent.isMagnumPrimer : prev.isMagnumPrimer,
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
    if (isOpen) {
      if (initialData && Object.keys(initialData).length > 0) {
        setFormData({ ...defaultFormData, ...initialData });
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [isOpen, initialData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.api || !window.api.addComponent || !window.api.updateComponent) return;
    
    const newComp = { ...formData } as ReloadingComponent;

    if (editingId) {
      await window.api.updateComponent(editingId, newComp);
    } else {
      const allComps = await window.api.getComponents();
      const duplicate = allComps.find((c: any) => 
        c.type === newComp.type &&
        c.manufacturer === newComp.manufacturer &&
        c.name === newComp.name
      );
      
      let merged = false;
      if (duplicate) {
        if (window.confirm(`An existing entry for ${duplicate.manufacturer || ''} ${duplicate.name || duplicate.type} was found. Would you like to merge this into the existing entry?`)) {
           const mergedData = { ...duplicate };
           mergedData.quantity = (duplicate.quantity || 0) + (newComp.quantity || 0);
           if (!mergedData.upc_code && newComp.upc_code) {
             mergedData.upc_code = newComp.upc_code;
           }
           await window.api.updateComponent(duplicate.id!, mergedData);
           merged = true;
        }
      }
      
      if (!merged) {
        await window.api.addComponent(newComp);
      }
    }
    
    onSave();
    onClose();
  };

  const toggleUsageTag = (tag: 'Pistol' | 'Rifle' | 'Shotgun') => {
    const tags = formData.usageTags || [];
    if (tags.includes(tag)) {
      setFormData({ ...formData, usageTags: tags.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, usageTags: [...tags, tag] });
    }
  };

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      {isOpen && (
        <>
          <h2>{editingId ? 'Edit Component' : 'Add Component'}</h2>
        <form onSubmit={handleSave}>
          <div className="form-group" style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)', marginBottom: '1.5rem' }}>
            <label>Scan UPC Code (Auto-fill)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                style={{ flex: 1 }} 
                value={formData.upc_code || ''} 
                onChange={e => setFormData({...formData, upc_code: e.target.value})} 
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookupUPC(formData.upc_code || ''); } }} 
                onBlur={e => lookupUPC(e.target.value)} 
                placeholder="Scan or type UPC code..." 
              />
              <button type="button" className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => lookupUPC(formData.upc_code || '')} disabled={isLookingUp}>
                {isLookingUp ? 'Searching...' : 'Lookup'}
              </button>
            </div>
            {lookupStatus && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.5rem', borderRadius: '4px', background: lookupStatus.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: lookupStatus.type === 'success' ? '#4ade80' : '#f87171', border: `1px solid ${lookupStatus.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                {lookupStatus.message}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Component Type</label>
            <select 
              className="form-input" 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value as any})}
              disabled={!!editingId}
            >
              <option value="Powder">Powder</option>
              <option value="Brass">Brass / Hulls</option>
              <option value="Bullet">Bullets / Projectiles</option>
              <option value="Primer">Primers</option>
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Manufacturer</label>
              <input required type="text" className="form-input" value={formData.manufacturer || ''} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
            </div>
            {(formData.type === 'Powder' || formData.type === 'Primer' || formData.type === 'Bullet') && (
              <div className="form-group">
                <label>Name</label>
                <input required type="text" className="form-input" placeholder={formData.type === 'Powder' ? 'e.g. Varget' : formData.type === 'Primer' ? 'e.g. #400' : 'e.g. XTP'} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
            )}
          </div>

          {(formData.type === 'Brass' || formData.type === 'Bullet') && (
            <div className="form-group">
              <label>Caliber</label>
              <input required type="text" className="form-input" placeholder="e.g. .308 Win" value={formData.caliber || ''} onChange={e => setFormData({...formData, caliber: e.target.value})} />
            </div>
          )}

          {formData.type === 'Bullet' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Bullet Type</label>
                <input
                  required
                  type="text"
                  list="reloading-bullet-types-list"
                  className="form-input"
                  placeholder="e.g. FMJ, MatchKing, ELD-X, TSX, Gold Dot"
                  value={formData.bulletType || ''}
                  onChange={e => setFormData({...formData, bulletType: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Bullet Weight (grains)</label>
                <input required type="number" min="0" step="0.1" className="form-input" value={formData.grain === undefined ? '' : formData.grain} onChange={e => setFormData({...formData, grain: e.target.value === '' ? undefined : parseFloat(e.target.value)})} />
              </div>
            </div>
          )}

          {(formData.type === 'Brass' || formData.type === 'Primer') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Primer Type</label>
                <select className="form-input" value={formData.primerType || ''} onChange={e => setFormData({...formData, primerType: e.target.value})}>
                  <option value="Small Rifle">Small Rifle</option>
                  <option value="Large Rifle">Large Rifle</option>
                  <option value="Small Pistol">Small Pistol</option>
                  <option value="Large Pistol">Large Pistol</option>
                  <option value="209 Shotgun">209 Shotgun</option>
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.isMagnumPrimer || false} onChange={e => setFormData({...formData, isMagnumPrimer: e.target.checked})} style={{ width: '1.2rem', height: '1.2rem' }} />
                  <span style={{ fontWeight: 'bold' }}>Magnum Primer</span>
                </label>
              </div>
            </div>
          )}

          {formData.type === 'Brass' && (
            <div className="form-group">
              <label>Preparation Stage</label>
              <select className="form-input" value={formData.prepStage || ''} onChange={e => setFormData({...formData, prepStage: e.target.value as any})}>
                <option value="Fired / Dirty">Fired / Dirty</option>
                <option value="Cleaned">Cleaned</option>
                <option value="Deprimed">Deprimed</option>
                <option value="Sized">Sized</option>
                <option value="Trimmed">Trimmed</option>
                <option value="Primed">Primed</option>
                <option value="Ready to Load">Ready to Load</option>
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>{formData.type === 'Powder' ? 'Amount' : 'Quantity'} *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input required type="number" min="0" step={formData.type === 'Powder' ? '0.01' : '1'} className="form-input" style={{ flex: 1 }} value={formData.quantity === undefined || formData.quantity === null ? '' : formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value === '' ? ('' as any) : parseFloat(e.target.value)})} />
                {formData.type === 'Powder' && (
                  <select className="form-input" style={{ width: '80px' }} value={formData.weightUnit || 'lbs'} onChange={e => setFormData({...formData, weightUnit: e.target.value as any})}>
                    <option value="lbs">lbs</option>
                    <option value="oz">oz</option>
                  </select>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Low-Stock Alert</label>
              <input type="number" min="0" step={formData.type === 'Powder' ? '0.1' : '1'} className="form-input" placeholder={formData.type === 'Powder' ? 'e.g. 1 (lb)' : 'e.g. 200'} value={formData.min_threshold === undefined || formData.min_threshold === null ? '' : formData.min_threshold} onChange={e => setFormData({...formData, min_threshold: e.target.value === '' ? undefined : parseFloat(e.target.value)})} />
            </div>
            <div className="form-group">
              <label>Cost / Value ($)</label>
              <input type="number" step="0.01" className="form-input" value={formData.cost === undefined || formData.cost === null ? '' : formData.cost} onChange={e => setFormData({...formData, cost: e.target.value === '' ? undefined : parseFloat(e.target.value)})} />
              {formData.cost !== undefined && formData.cost !== null && formData.quantity !== undefined && formData.quantity > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  {formData.type === 'Powder' ? (
                    `≈ $${(formData.cost / (formData.quantity * (formData.weightUnit === 'lbs' ? 7000 : 437.5))).toFixed(4)}/gr`
                  ) : (
                    `≈ $${(formData.cost / formData.quantity).toFixed(3)}/ea`
                  )}
                </div>
              )}
            </div>
          </div>

          {formData.type === 'Powder' && (
            <div className="form-group">
              <label>Usage Tags</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {['Pistol', 'Rifle', 'Shotgun'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleUsageTag(tag as any)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '16px',
                      border: '1px solid var(--border-light)',
                      background: formData.usageTags?.includes(tag as any) ? 'var(--accent)' : 'transparent',
                      color: formData.usageTags?.includes(tag as any) ? '#fff' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Purchase Date</label>
            <input type="date" className="form-input" value={formData.purchaseDate || ''} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-input" rows={2} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Component</button>
          </div>
        </form>

        <datalist id="reloading-bullet-types-list">
          {COMPREHENSIVE_BULLET_TYPES.map((bt, idx) => (
            <option key={idx} value={bt} />
          ))}
        </datalist>
        </>
      )}
    </dialog>
  );
};
