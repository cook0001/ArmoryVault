import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Firearm } from '../types';
import { formatCaliber } from './AmmoDashboard';
import { Upload, Save, X } from 'lucide-react';

export const FirearmForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Firearm>>({
    make: '', model: '', serial_number: '', caliber: '', barrel_length: '',
    action_type: '', finish: '', notes: '', purchase_price: null, purchase_date: '',
    condition: '', image_path: '', is_sold: false, purchased_from: '', firearm_type: ''
  });
  const [previews, setPreviews] = useState<{url: string, isExisting: boolean, path?: string}[]>([]);
  const { id } = useParams();

  React.useEffect(() => {
    if (id && window.api) {
      window.api.getFirearms().then(all => {
        const found = all.find(f => f.id === Number(id));
        if (found) {
          setFormData(found);
          if (found.photos && found.photos.length > 0) {
            setPreviews(found.photos.map(p => ({ url: `local-file://${p}`, isExisting: true, path: p })));
          } else if (found.image_path) {
            setPreviews([{ url: `local-file://${found.image_path}`, isExisting: true, path: found.image_path }]);
          }        }
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelectNative = async () => {
    console.log('Renderer: handlePhotoSelectNative called. window.api =', !!window.api);
    if (!window.api) return;
    try {
      const paths = await window.api.selectAndSavePhoto();
      console.log('Renderer: selectAndSavePhoto returned', paths);
      if (paths && paths.length > 0) {
        setPreviews(prev => [
          ...prev,
          ...paths.map(path => ({ url: `local-file://${path}`, isExisting: true, path }))
        ]);
      }
    } catch (e) {
      console.error('Renderer: selectAndSavePhoto failed', e);
    }
  };

  const removePhoto = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.api) return;

    let finalPhotos: string[] = previews.filter(p => p.isExisting && p.path).map(p => p.path!);

    const payload: Firearm = {
      ...formData as Firearm,
      photos: finalPhotos,
      image_path: finalPhotos.length > 0 ? finalPhotos[0] : '', // Keep backward compatibility
    };

    if (id) {
      await window.api.updateFirearm(Number(id), payload);
      navigate(`/details/${id}`);
    } else {
      await window.api.addFirearm(payload);
      navigate('/');
    }
  };

  return (
    <div className="form-page">
      <div className="page-header">
        <h1>{id ? 'Edit Firearm' : 'Add Firearm'}</h1>
        <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
          <X size={18} /> Cancel
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="firearm-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="make">Make</label>
            <input id="make" list="makes-list" required type="text" name="make" value={formData.make} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="model">Model</label>
            <input id="model" required type="text" name="model" value={formData.model} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="serial_number">Serial Number</label>
            <input id="serial_number" type="text" name="serial_number" value={formData.serial_number} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="caliber">Caliber</label>
            <input id="caliber" list="calibers-list" type="text" name="caliber" value={formData.caliber} onChange={handleChange} onBlur={(e) => setFormData({...formData, caliber: formatCaliber(e.target.value)})} />
          </div>
          <div className="form-group">
            <label htmlFor="firearm_type">Type</label>
            <input id="firearm_type" list="types-list" type="text" name="firearm_type" value={formData.firearm_type || ''} onChange={handleChange} placeholder="e.g. Pistol, Rifle" />
          </div>
          <div className="form-group">
            <label htmlFor="action_type">Action Type</label>
            <input id="action_type" list="actions-list" type="text" name="action_type" value={formData.action_type} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="finish">Finish</label>
            <input id="finish" list="finishes-list" type="text" name="finish" value={formData.finish} onChange={handleChange} placeholder="e.g. Blued, Stainless" />
          </div>
          <div className="form-group">
            <label htmlFor="barrel_length">Barrel Length</label>
            <input id="barrel_length" type="text" name="barrel_length" value={formData.barrel_length} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="purchase_date">Purchase Date</label>
            <input id="purchase_date" type="date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="purchased_from">Purchased From (Optional)</label>
            <input id="purchased_from" type="text" name="purchased_from" value={formData.purchased_from || ''} onChange={handleChange} placeholder="Name, Address, or FFL" />
          </div>
          <div className="form-group">
            <label htmlFor="purchase_price">Purchase Price ($)</label>
            <input id="purchase_price" type="number" step="0.01" name="purchase_price" value={formData.purchase_price || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="condition">Condition</label>
            <input id="condition" list="conditions-list" type="text" name="condition" value={formData.condition} onChange={handleChange} placeholder="e.g. Excellent, Good, Poor" />
          </div>
        </div>

        <div className="form-group full-width" style={{ background: 'rgba(234, 179, 8, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: formData.is_nfa ? '1rem' : '0' }}>
            <input type="checkbox" checked={formData.is_nfa || false} onChange={e => setFormData({...formData, is_nfa: e.target.checked})} style={{ width: 'auto' }} />
            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>NFA Regulated Item</span>
          </label>
          {formData.is_nfa && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>NFA Type</label>
                <select className="form-input" value={formData.nfa_type || ''} onChange={e => setFormData({...formData, nfa_type: e.target.value as any})}>
                  <option value="">Select Type...</option>
                  <option value="SBR">Short Barreled Rifle (SBR)</option>
                  <option value="SBS">Short Barreled Shotgun (SBS)</option>
                  <option value="Suppressor">Suppressor</option>
                  <option value="Machine Gun">Machine Gun</option>
                  <option value="AOW">Any Other Weapon (AOW)</option>
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
        <div className="form-group full-width">
          <label style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'block', color: 'var(--text)' }}>Photos Gallery</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1.25rem', marginBottom: '1rem' }}>
            {previews.map((p, idx) => (
              <div key={idx} className="premium-photo-card" style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
                <img src={p.url} alt="Preview" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" className="premium-photo-delete" onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: '8px', right: '8px', border: 'none', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                  <X size={16} />
                </button>
              </div>
            ))}
            <div role="button" tabIndex={0} className="photo-placeholder premium-add-photo" style={{ margin: 0, width: '100%', paddingBottom: '100%', position: 'relative', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); handlePhotoSelectNative(); }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={28} style={{ marginBottom: '0.75rem' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500, textAlign: 'center' }}>Add Photo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-group full-width" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--accent)' }}>Maintenance Alerts</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Clean Every (Rounds)</label>
              <input type="number" className="form-input" placeholder="e.g. 500" value={formData.maintenance_round_threshold || ''} onChange={e => setFormData({...formData, maintenance_round_threshold: e.target.value ? parseInt(e.target.value, 10) : undefined})} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Clean Every (Days)</label>
              <input type="number" className="form-input" placeholder="e.g. 90" value={formData.maintenance_date_threshold_days || ''} onChange={e => setFormData({...formData, maintenance_date_threshold_days: e.target.value ? parseInt(e.target.value, 10) : undefined})} />
            </div>
          </div>
        </div>

        <div className="form-group full-width">
          <label>Notes / Accessories</label>
          <textarea name="notes" rows={4} value={formData.notes} onChange={handleChange}></textarea>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            <Save size={18} /> {id ? 'Update Firearm' : 'Save Firearm'}
          </button>
        </div>
      </form>

      {/* Datalists for Autocomplete */}
      <datalist id="makes-list">
        <option value="Glock" />
        <option value="Sig Sauer" />
        <option value="Smith & Wesson" />
        <option value="Ruger" />
        <option value="Colt" />
        <option value="Springfield Armory" />
        <option value="CZ" />
        <option value="Beretta" />
        <option value="Heckler & Koch" />
        <option value="Mossberg" />
        <option value="Remington" />
        <option value="Winchester" />
        <option value="FN Herstal" />
        <option value="Taurus" />
        <option value="Savage Arms" />
      </datalist>

      <datalist id="calibers-list">
        <option value="9mm Luger" />
        <option value=".45 ACP" />
        <option value=".223 Remington" />
        <option value="5.56x45mm NATO" />
        <option value=".308 Winchester" />
        <option value="7.62x51mm NATO" />
        <option value="7.62x39mm" />
        <option value=".22 LR" />
        <option value="12 Gauge" />
        <option value="20 Gauge" />
        <option value=".380 ACP" />
        <option value=".38 Special" />
        <option value=".357 Magnum" />
        <option value=".44 Magnum" />
        <option value="10mm Auto" />
        <option value="5.7x28mm" />
        <option value=".300 Blackout" />
        <option value="6.5mm Creedmoor" />
      </datalist>

      <datalist id="types-list">
        <option value="Pistol" />
        <option value="Revolver" />
        <option value="Rifle" />
        <option value="Shotgun" />
        <option value="Receiver / Frame" />
        <option value="Silencer / Suppressor" />
        <option value="SBR (Short-Barreled Rifle)" />
        <option value="SBS (Short-Barreled Shotgun)" />
        <option value="AOW (Any Other Weapon)" />
        <option value="Machine Gun" />
        <option value="Destructive Device" />
      </datalist>

      <datalist id="actions-list">
        <option value="Striker-Fired" />
        <option value="Hammer-Fired (DA/SA)" />
        <option value="Single Action Only (SAO)" />
        <option value="Bolt Action" />
        <option value="Pump Action" />
        <option value="Lever Action" />
        <option value="Semi-Automatic (Gas)" />
        <option value="Semi-Automatic (Blowback)" />
        <option value="Revolver (Double Action)" />
        <option value="Revolver (Single Action)" />
        <option value="Break Action" />
      </datalist>

      <datalist id="conditions-list">
        <option value="Factory New" />
        <option value="Excellent" />
        <option value="Very Good" />
        <option value="Good" />
        <option value="Fair" />
        <option value="Poor" />
        <option value="Parts Only" />
      </datalist>

      <datalist id="finishes-list">
        <option value="Blued" />
        <option value="Stainless Steel" />
        <option value="Matte Black" />
        <option value="Cerakote" />
        <option value="Parkerized" />
        <option value="Color Case Hardened" />
        <option value="Nickel" />
        <option value="Nitride" />
        <option value="FDE (Flat Dark Earth)" />
        <option value="OD Green" />
        <option value="Wood/Anodized" />
      </datalist>

    </div>
  );
};
