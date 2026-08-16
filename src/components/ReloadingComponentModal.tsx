import React, { useState, useEffect } from 'react';
import { ReloadingComponent } from '../types';

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

  const lookupUPC = async (upc: string) => {
    if (!upc || !window.api || !window.api.lookupUPC) return;
    setIsLookingUp(true);
    try {
      const data = await window.api.lookupUPC(upc);
      if (data && data.items && data.items.length > 0) {
        const item = data.items[0];
        setFormData(prev => ({
          ...prev,
          manufacturer: prev.manufacturer || item.brand || '',
          name: prev.name || item.title || '',
        }));
      }
    } catch (e) {
      console.error(e);
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
      await window.api.addComponent(newComp);
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
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
                <input required type="text" className="form-input" placeholder="e.g. FMJ" value={formData.bulletType || ''} onChange={e => setFormData({...formData, bulletType: e.target.value})} />
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>{formData.type === 'Powder' ? 'Amount' : 'Quantity'}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input required type="number" min="0" step={formData.type === 'Powder' ? '0.01' : '1'} className="form-input" style={{ flex: 1 }} value={formData.quantity === undefined || formData.quantity === null ? '' : formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value === '' ? ('' as any) : parseFloat(e.target.value)})} />
                {formData.type === 'Powder' && (
                  <select className="form-input" style={{ width: '100px' }} value={formData.weightUnit || 'lbs'} onChange={e => setFormData({...formData, weightUnit: e.target.value as any})}>
                    <option value="lbs">lbs</option>
                    <option value="oz">oz</option>
                  </select>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Cost / Value ($)</label>
              <input type="number" step="0.01" className="form-input" value={formData.cost === undefined || formData.cost === null ? '' : formData.cost} onChange={e => setFormData({...formData, cost: e.target.value === '' ? undefined : parseFloat(e.target.value)})} />
              {formData.cost !== undefined && formData.cost !== null && formData.quantity !== undefined && formData.quantity > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  {formData.type === 'Powder' ? (
                    `≈ $${(formData.cost / (formData.quantity * (formData.weightUnit === 'lbs' ? 7000 : 437.5))).toFixed(4)} per grain`
                  ) : (
                    `≈ $${(formData.cost / formData.quantity).toFixed(3)} per unit`
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
      </div>
    </div>
  );
};
