import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Firearm } from '../types';
import { Upload, Save, X } from 'lucide-react';

export const FirearmForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Firearm>>({
    make: '', model: '', serial_number: '', caliber: '', barrel_length: '',
    action_type: '', notes: '', purchase_price: null, purchase_date: '',
    condition: '', image_path: '', is_sold: false
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');

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

    await window.api.addFirearm(payload);
    navigate('/');
  };

  return (
    <div className="form-page">
      <div className="page-header">
        <h1>Add Firearm</h1>
        <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
          <X size={18} /> Cancel
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="firearm-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="make">Make</label>
            <input id="make" required type="text" name="make" value={formData.make} onChange={handleChange} />
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
            <input id="caliber" type="text" name="caliber" value={formData.caliber} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="action_type">Action Type</label>
            <input id="action_type" type="text" name="action_type" value={formData.action_type} onChange={handleChange} />
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
            <label htmlFor="purchase_price">Purchase Price ($)</label>
            <input id="purchase_price" type="number" step="0.01" name="purchase_price" value={formData.purchase_price || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="condition">Condition</label>
            <select id="condition" name="condition" value={formData.condition} onChange={handleChange}>
              <option value="">Select Condition...</option>
              <option value="New">New</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
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
            <Save size={18} /> Save Firearm
          </button>
        </div>
      </form>
    </div>
  );
};
