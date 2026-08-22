import { Save, Upload, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AutocompleteInput } from '../components/AutocompleteInput';
import { StorageLocationSelect } from '../components/StorageBadge';
import { Firearm, StorageLocation } from '../types';
import { formatCaliber } from '../utils/caliberHelpers';
import {
  ACTION_OPTIONS,
  CALIBER_OPTIONS,
  CONDITION_OPTIONS,
  FINISH_OPTIONS,
  TYPE_OPTIONS,
} from '../utils/formOptions';
import {
  assignItemToStorage,
  getItemStorageLocation,
  saveStorageLocations,
} from '../utils/StorageSync';

export const FirearmForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState<Partial<Firearm>>({
    make: '',
    model: '',
    serial_number: '',
    caliber: '',
    barrel_length: '',
    action_type: '',
    finish: '',
    notes: '',
    purchase_price: null,
    purchase_date: '',
    condition: '',
    image_path: '',
    is_sold: false,
    purchased_from: '',
    firearm_type: '',
  });
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [storageLocationId, setStorageLocationId] = useState<number | null>(null);
  const [previews, setPreviews] = useState<{ url: string; isExisting: boolean; path?: string }[]>(
    []
  );
  const { id } = useParams();

  useEffect(() => {
    if (window.api && window.api.getStorageLocations) {
      window.api.getStorageLocations().then((locs) => {
        setLocations(locs || []);
        if (id) {
          const matched = getItemStorageLocation('firearm', Number(id), locs || []);
          if (matched) setStorageLocationId(matched.id || null);
        } else if (location.state?.parsedData?.storageLocationId) {
          setStorageLocationId(Number(location.state.parsedData.storageLocationId));
        }
      });
    }

    if (id && window.api) {
      window.api.getFirearms().then((all) => {
        const found = all.find((f) => f.id === Number(id));
        if (found) {
          setFormData(found);
          if (found.photos && found.photos.length > 0) {
            setPreviews(
              found.photos.map((p) => ({ url: `local-file://${p}`, isExisting: true, path: p }))
            );
          } else if (found.image_path) {
            setPreviews([
              { url: `local-file://${found.image_path}`, isExisting: true, path: found.image_path },
            ]);
          }
        }
      });
    } else if (location.state?.parsedData) {
      const p = location.state.parsedData;
      setFormData((prev) => ({
        ...prev,
        make: p.make || prev.make,
        model: p.model || prev.model,
        serial_number: p.serial_number || prev.serial_number,
        caliber: p.caliber || prev.caliber,
        barrel_length: p.barrel_length || prev.barrel_length,
        action_type: p.action_type || prev.action_type,
        finish: p.finish || prev.finish,
        notes: p.notes || prev.notes,
        purchase_price: p.purchase_price !== undefined ? p.purchase_price : prev.purchase_price,
        purchase_date: p.purchase_date || prev.purchase_date,
        condition: p.condition || prev.condition,
        purchased_from: p.purchased_from || prev.purchased_from,
        firearm_type: p.firearm_type || prev.firearm_type,
      }));
      if (p.photoBase64) {
        setPreviews([{ url: p.photoBase64, isExisting: false }]);
      }
    }
  }, [id, location.state]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelectNative = async () => {
    console.log('Renderer: handlePhotoSelectNative called. window.api =', !!window.api);
    if (!window.api) return;
    try {
      const paths = await window.api.selectAndSavePhoto();
      console.log('Renderer: selectAndSavePhoto returned', paths);
      if (paths && paths.length > 0) {
        setPreviews((prev) => [
          ...prev,
          ...paths.map((path) => ({ url: `local-file://${path}`, isExisting: true, path })),
        ]);
      }
    } catch (e) {
      console.error('Renderer: selectAndSavePhoto failed', e);
    }
  };

  const removePhoto = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.api) return;

    const finalPhotos: string[] = [];
    for (let i = 0; i < previews.length; i++) {
      const p = previews[i];
      if (p.isExisting && p.path) {
        finalPhotos.push(p.path);
      } else if (p.url.startsWith('data:image') && window.api?.saveBase64Photo) {
        const ext = p.url.split(';')[0].split('/')[1] || 'jpg';
        const filename = `firearm_${Date.now()}_${i}.${ext}`;
        const savedPath = await window.api.saveBase64Photo(p.url, filename);
        if (savedPath) finalPhotos.push(savedPath);
      } else if (p.path) {
        finalPhotos.push(p.path);
      }
    }

    const payload: Firearm = {
      ...(formData as Firearm),
      photos: finalPhotos,
      image_path: finalPhotos.length > 0 ? finalPhotos[0] : '', // Keep backward compatibility
      storageLocationId: storageLocationId || undefined,
    };

    let savedId = Number(id);
    if (id) {
      await window.api.updateFirearm(Number(id), payload);
    } else {
      const res: any = await window.api.addFirearm(payload);
      if (typeof res === 'number') {
        savedId = res;
      } else if (res && typeof res.id === 'number') {
        savedId = res.id;
      } else {
        // Fallback: fetch all firearms and find the highest ID
        const all = await window.api.getFirearms();
        if (all && all.length > 0) {
          savedId = Math.max(...all.map((f: any) => f.id || 0));
        }
      }
    }

    // Bi-directional Storage Sync
    if (savedId && locations.length > 0) {
      const updatedLocations = assignItemToStorage(
        'firearm',
        savedId,
        storageLocationId,
        locations
      );
      await saveStorageLocations(updatedLocations);
    }

    // Remove sync queue item if opened from Sync Inbox
    if (location.state?.syncItemId && window.api?.removeSyncItem) {
      await window.api.removeSyncItem(location.state.syncItemId);
    }

    if (id) {
      navigate(`/details/${id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="form-page">
      <div className="page-header">
        <h1>{id ? 'Edit Firearm' : 'Add Firearm'}</h1>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        >
          <X size={18} /> Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="firearm-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="make">Make</label>
            <input
              id="make"
              required
              type="text"
              name="make"
              value={formData.make}
              onChange={handleChange}
              placeholder="e.g. Manufacturer / Arsenal"
            />
          </div>
          <div className="form-group">
            <label htmlFor="model">Model</label>
            <input
              id="model"
              required
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="e.g. Model / Designation"
            />
          </div>
          <div className="form-group">
            <label htmlFor="serial_number">Serial Number</label>
            <input
              id="serial_number"
              type="text"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="caliber">Caliber</label>
            <AutocompleteInput
              id="caliber"
              name="caliber"
              value={formData.caliber || ''}
              onChange={handleChange}
              onBlur={(e) =>
                setFormData((prev) => ({ ...prev, caliber: formatCaliber(e.target.value) }))
              }
              options={CALIBER_OPTIONS}
              placeholder="e.g. 9mm Luger, .30-06 Springfield"
            />
          </div>
          <div className="form-group">
            <label htmlFor="firearm_type">Type</label>
            <AutocompleteInput
              id="firearm_type"
              name="firearm_type"
              value={formData.firearm_type || ''}
              onChange={handleChange}
              options={TYPE_OPTIONS}
              placeholder="e.g. Rifle, C&R Rifle, Pistol"
            />
          </div>
          <div className="form-group">
            <label htmlFor="action_type">Action Type</label>
            <AutocompleteInput
              id="action_type"
              name="action_type"
              value={formData.action_type || ''}
              onChange={handleChange}
              options={ACTION_OPTIONS}
              placeholder="e.g. Semi-Automatic, Bolt Action"
            />
          </div>
          <div className="form-group">
            <label htmlFor="finish">Finish</label>
            <AutocompleteInput
              id="finish"
              name="finish"
              value={formData.finish || ''}
              onChange={handleChange}
              options={FINISH_OPTIONS}
              placeholder="e.g. Parkerized, Blued, Case Hardened"
            />
          </div>
          <div className="form-group">
            <label htmlFor="barrel_length">Barrel Length</label>
            <input
              id="barrel_length"
              type="text"
              name="barrel_length"
              value={formData.barrel_length}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="purchase_date">Purchase Date</label>
            <input
              id="purchase_date"
              type="date"
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="purchased_from">Purchased From (Optional)</label>
            <input
              id="purchased_from"
              type="text"
              name="purchased_from"
              value={formData.purchased_from || ''}
              onChange={handleChange}
              placeholder="Name, Address, or FFL (e.g. CMP, GunBroker)"
            />
          </div>
          <div className="form-group">
            <label htmlFor="purchase_price">Purchase Price ($)</label>
            <input
              id="purchase_price"
              type="number"
              step="0.01"
              name="purchase_price"
              value={formData.purchase_price || ''}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="condition">Condition</label>
            <AutocompleteInput
              id="condition"
              name="condition"
              value={formData.condition || ''}
              onChange={handleChange}
              options={CONDITION_OPTIONS}
              placeholder="e.g. NRA Fine, Excellent, CMP Service"
            />
          </div>
          <div className="form-group">
            <label htmlFor="storage_location">Storage Location / Safe</label>
            <StorageLocationSelect
              value={storageLocationId}
              onChange={(locId) => setStorageLocationId(locId)}
              locations={locations}
              placeholder="Select Safe / Cabinet / Container..."
            />
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>NFA Type</label>
                <AutocompleteInput
                  mode="select"
                  name="nfa_type"
                  value={formData.nfa_type || ''}
                  onChange={(e) => setFormData({ ...formData, nfa_type: e.target.value as any })}
                  options={[
                    { value: '', label: 'Select Type...' },
                    { value: 'SBR', label: 'Short Barreled Rifle (SBR)' },
                    { value: 'SBS', label: 'Short Barreled Shotgun (SBS)' },
                    { value: 'Suppressor', label: 'Suppressor' },
                    { value: 'Machine Gun', label: 'Machine Gun' },
                    { value: 'AOW', label: 'Any Other Weapon (AOW)' },
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
        <div className="form-group full-width">
          <label
            style={{
              fontSize: '1.1rem',
              marginBottom: '1rem',
              display: 'block',
              color: 'var(--text)',
            }}
          >
            Photos Gallery
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1rem',
            }}
          >
            {previews.map((p, idx) => (
              <div
                key={idx}
                className="premium-photo-card"
                style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}
              >
                <img
                  src={p.url}
                  alt="Preview"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <button
                  type="button"
                  className="premium-photo-delete"
                  onClick={() => removePhoto(idx)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <div
              role="button"
              tabIndex={0}
              className="photo-placeholder premium-add-photo"
              style={{
                margin: 0,
                width: '100%',
                paddingBottom: '100%',
                position: 'relative',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.preventDefault();
                handlePhotoSelectNative();
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Upload size={28} style={{ marginBottom: '0.75rem' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500, textAlign: 'center' }}>
                  Add Photo
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="form-group full-width"
          style={{
            background: 'rgba(59, 130, 246, 0.05)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: '1.5rem',
          }}
        >
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--accent)' }}>Maintenance Alerts</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Clean Every (Rounds)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 500"
                value={formData.maintenance_round_threshold || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maintenance_round_threshold: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Clean Every (Days)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 90"
                value={formData.maintenance_date_threshold_days || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maintenance_date_threshold_days: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
              />
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
    </div>
  );
};
