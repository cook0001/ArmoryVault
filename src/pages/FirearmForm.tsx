import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Firearm } from '../types';
import { formatCaliber } from '../utils/caliberHelpers';
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
            <input id="model" list="models-list" required type="text" name="model" value={formData.model} onChange={handleChange} placeholder="e.g. M1 Garand, 1903A3, Model 1895" />
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
            <input id="firearm_type" list="types-list" type="text" name="firearm_type" value={formData.firearm_type || ''} onChange={handleChange} placeholder="e.g. Rifle, C&R Rifle, Pistol" />
          </div>
          <div className="form-group">
            <label htmlFor="action_type">Action Type</label>
            <input id="action_type" list="actions-list" type="text" name="action_type" value={formData.action_type} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="finish">Finish</label>
            <input id="finish" list="finishes-list" type="text" name="finish" value={formData.finish} onChange={handleChange} placeholder="e.g. Parkerized, Blued, Case Hardened" />
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
            <input id="purchased_from" type="text" name="purchased_from" value={formData.purchased_from || ''} onChange={handleChange} placeholder="Name, Address, or FFL (e.g. CMP, GunBroker)" />
          </div>
          <div className="form-group">
            <label htmlFor="purchase_price">Purchase Price ($)</label>
            <input id="purchase_price" type="number" step="0.01" name="purchase_price" value={formData.purchase_price || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="condition">Condition</label>
            <input id="condition" list="conditions-list" type="text" name="condition" value={formData.condition} onChange={handleChange} placeholder="e.g. NRA Fine, Excellent, CMP Service" />
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
        {/* Modern Manufacturers */}
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
        <option value="Marlin" />
        <option value="Henry Repeating Arms" />
        <option value="Browning" />
        <option value="Tikka" />
        <option value="Sako" />
        <option value="Walther" />
        <option value="Benelli" />
        <option value="Franchi" />
        <option value="Daniel Defense" />
        <option value="BCM (Bravo Company)" />
        <option value="Aero Precision" />

        {/* Historic & Military Surplus Arsenals */}
        <option value="Inland Manufacturing" />
        <option value="Rock-Ola" />
        <option value="Underwood Elliott Fisher" />
        <option value="Saginaw Steering Gear" />
        <option value="Quality Hardware" />
        <option value="National Postal Meter" />
        <option value="Standard Products" />
        <option value="Smith-Corona" />
        <option value="Eddystone" />
        <option value="Harrington & Richardson (H&R)" />
        <option value="Auto-Ordnance" />
        <option value="Ithaca Gun Company" />
        <option value="Union Switch & Signal" />
        <option value="Mauser (Oberndorf / DWM)" />
        <option value="DWM (Deutsche Waffen- und Munitionsfabriken)" />
        <option value="Enfield (RSAF)" />
        <option value="BSA (Birmingham Small Arms)" />
        <option value="Lithgow Small Arms" />
        <option value="Ishapore Arsenal" />
        <option value="Tula Arsenal" />
        <option value="Izhevsk Arsenal" />
        <option value="Waffenfabrik Bern (Swiss)" />
        <option value="Carl Gustafs (Swedish)" />
        <option value="Husqvarna" />
        <option value="Nagoya Arsenal" />
        <option value="Kokura Arsenal" />
        <option value="Terni Arsenal (Carcano)" />
        <option value="Steyr-Mannlicher" />
        <option value="FEG" />
        <option value="FB Radom" />
        <option value="Zastava Arms" />
        <option value="Norinco" />
        <option value="Uberti" />
        <option value="Pietta" />
        <option value="Pedersoli" />
        <option value="Taylor's & Co" />
        <option value="Cimarron Firearms" />
      </datalist>

      <datalist id="models-list">
        {/* Historic Rifles & Carbines */}
        <option value="M1 Garand" />
        <option value="M1 Carbine" />
        <option value="M1A / M14" />
        <option value="Springfield M1903" />
        <option value="Springfield M1903A3" />
        <option value="M1917 Enfield" />
        <option value="Krag-Jørgensen M1898" />
        <option value="Winchester Model 1895" />
        <option value="Winchester Model 1894" />
        <option value="Winchester Model 1873" />
        <option value="Winchester Model 70 (Pre-64)" />
        <option value="Marlin Model 336" />
        <option value="Marlin Model 1895" />
        <option value="Savage Model 99" />
        <option value="Mauser Karabiner 98k (K98k)" />
        <option value="Gewehr 98 (G98)" />
        <option value="Swedish Mauser M96 / M38" />
        <option value="Mosin-Nagant M91/30" />
        <option value="Mosin-Nagant M44 Carbine" />
        <option value="Mosin-Nagant M38 Carbine" />
        <option value="Lee-Enfield No. 4 Mk 1" />
        <option value="Lee-Enfield SMLE No. 1 Mk III" />
        <option value="Schmidt-Rubin K31" />
        <option value="Arisaka Type 99" />
        <option value="Arisaka Type 38" />
        <option value="Carcano M91/38" />
        <option value="SKS (Type 56 / Russian / Yugo)" />
        <option value="SVT-40" />
        <option value="FN-49" />
        <option value="Thompson M1A1" />
        <option value="Remington Model 8 / 81 Woodsmaster" />

        {/* Historic Handguns */}
        <option value="Colt M1911" />
        <option value="Colt M1911A1 (USGI)" />
        <option value="Colt Single Action Army (Peacemaker)" />
        <option value="Colt Police Positive" />
        <option value="Colt Official Police" />
        <option value="Smith & Wesson Model 10 / M&P" />
        <option value="Smith & Wesson Model 1917" />
        <option value="Luger P08" />
        <option value="Walther P38" />
        <option value="Walther PP / PPK" />
        <option value="Mauser C96 (Broomhandle)" />
        <option value="Browning Hi-Power (P-35)" />
        <option value="TT-33 Tokarev" />
        <option value="Makarov PM" />
        <option value="Nagant M1895 Revolver" />
        <option value="Webley Mk IV / Mk VI" />
        <option value="Beretta M1934 / M1951" />
        <option value="Vis Radom wz. 35" />
        <option value="Nambu Type 14" />
        <option value="CZ 52" />
        <option value="CZ 82 / 83" />
      </datalist>

      <datalist id="calibers-list">
        {/* Common Modern */}
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
        <option value=".300 Winchester Magnum" />
        <option value=".270 Winchester" />
        <option value="7mm Remington Magnum" />

        {/* Historic & Surplus Calibers */}
        <option value=".30-06 Springfield" />
        <option value=".30 Carbine" />
        <option value=".30-40 Krag" />
        <option value=".30-30 Winchester" />
        <option value=".45-70 Government" />
        <option value=".405 Winchester" />
        <option value=".32 Winchester Special" />
        <option value=".35 Remington" />
        <option value=".300 Savage" />
        <option value=".250-3000 Savage" />
        <option value=".303 British" />
        <option value="7.62x54mmR" />
        <option value="7.92x57mm Mauser (8mm Mauser)" />
        <option value="6.5x55mm Swedish Mauser" />
        <option value="7.5x55mm Swiss (GP11)" />
        <option value="7.65x53mm Argentine Mauser" />
        <option value="7x57mm Mauser (7mm Mauser)" />
        <option value="6.5x50mmSR Arisaka" />
        <option value="7.7x58mm Arisaka" />
        <option value="6.5x52mm Carcano" />
        <option value="7.35x51mm Carcano" />
        <option value="8x56mmR Steyr-Mannlicher" />
        <option value="8x50mmR Lebel" />
        <option value="7.5x54mm French" />
        <option value="7.62x25mm Tokarev" />
        <option value="9x18mm Makarov" />
        <option value="7.62x38mmR (Nagant)" />
        <option value="7.63x25mm Mauser (.30 Mauser)" />
        <option value="7.65x21mm Parabellum (.30 Luger)" />
        <option value=".455 Webley" />
        <option value=".38 S&W (.38/200)" />
        <option value=".38-40 Winchester (.38 WCF)" />
        <option value=".44-40 Winchester (.44 WCF)" />
        <option value=".45 Colt (.45 Long Colt)" />
      </datalist>

      <datalist id="types-list">
        <option value="Rifle" />
        <option value="Curio & Relic (C&R) Rifle" />
        <option value="Military Surplus Service Rifle" />
        <option value="Pistol" />
        <option value="Curio & Relic (C&R) Handgun" />
        <option value="Military Surplus Handgun" />
        <option value="Revolver" />
        <option value="Antique / Blackpowder" />
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
        <option value="Semi-Automatic (Gas)" />
        <option value="Semi-Automatic (Long-Stroke Gas Piston)" />
        <option value="Semi-Automatic (Short-Stroke Gas Tappet)" />
        <option value="Semi-Automatic (Blowback)" />
        <option value="Semi-Automatic (Short Recoil)" />
        <option value="Bolt Action" />
        <option value="Bolt Action (Controlled-Round Feed)" />
        <option value="Bolt Action (Push Feed)" />
        <option value="Straight-Pull Bolt Action" />
        <option value="Lever Action" />
        <option value="Lever Action (Box Magazine)" />
        <option value="Lever Action (Tubular Magazine)" />
        <option value="Pump Action" />
        <option value="Striker-Fired" />
        <option value="Hammer-Fired (DA/SA)" />
        <option value="Single Action Only (SAO)" />
        <option value="Revolver (Double Action)" />
        <option value="Revolver (Single Action)" />
        <option value="Revolver (Top-Break)" />
        <option value="Break Action" />
        <option value="Falling Block / Rolling Block" />
        <option value="Muzzleloader / Percussion" />
      </datalist>

      <datalist id="conditions-list">
        <option value="Factory New" />
        <option value="NRA Excellent (98-100%)" />
        <option value="NRA Fine (90-95%)" />
        <option value="NRA Very Good (75-85%)" />
        <option value="NRA Good (60-70%)" />
        <option value="NRA Fair (40-50%)" />
        <option value="NRA Poor / Relic (<30%)" />
        <option value="CMP Collector Grade" />
        <option value="CMP Service Grade" />
        <option value="CMP Field Grade" />
        <option value="CMP Rack Grade" />
        <option value="Arsenal Refurbished" />
        <option value="All-Matching Numbers" />
        <option value="Parts Only" />
      </datalist>

      <datalist id="finishes-list">
        <option value="Parkerized" />
        <option value="Dull Gray Parkerized (Mil-Spec)" />
        <option value="Greenish Gray Zinc Parkerized" />
        <option value="Blued" />
        <option value="High Polish Charcoal Blued" />
        <option value="Hot Salt Blued" />
        <option value="Color Case Hardened" />
        <option value="Niter Blued / Fire Blued" />
        <option value="In the White / Armory Bright" />
        <option value="Oil Quenched / Browned" />
        <option value="Black Suncorite / Enamel Paint" />
        <option value="Stainless Steel" />
        <option value="Nickel Plated" />
        <option value="Matte Black" />
        <option value="Cerakote" />
        <option value="Nitride" />
        <option value="FDE (Flat Dark Earth)" />
        <option value="OD Green" />
        <option value="Wood/Anodized" />
      </datalist>

    </div>
  );
};
