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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const { id } = useParams();

  React.useEffect(() => {
    if (id && window.api) {
      window.api.getFirearms().then(all => {
        const found = all.find(f => f.id === Number(id));
        if (found) {
          setFormData(found);
          if (found.image_path) {
            setPreview(`file://${found.image_path}`);
          }
        }
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.api) return;

    let finalImagePath = formData.image_path || '';
    if (photoFile) {
      const sourcePath = (photoFile as any).path || URL.createObjectURL(photoFile);
      const savedPath = await window.api.savePhoto(sourcePath, `${Date.now()}_${photoFile.name}`);
      if (savedPath) {
        finalImagePath = savedPath;
      }
    }

    const payload: Firearm = {
      ...formData as Firearm,
      image_path: finalImagePath,
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

        <div className="form-group full-width">
          <label>Photo</label>
          <div className="photo-upload">
            {preview ? (
              <img src={preview} alt="Preview" className="photo-preview" />
            ) : (
              <div className="photo-placeholder">
                <Upload size={32} />
                <span>Click to upload photo</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handlePhotoSelect} />
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
