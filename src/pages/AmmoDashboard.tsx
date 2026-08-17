import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Ammo } from '../types';
import { PlusCircle, Target, Package, Trash2, Edit, Printer, Upload, AlertTriangle, Tag, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseBarcodeData } from '../utils/BarcodeEngine';
import { getStandardPelletCount, generateInternalUPC, formatCaliber, buildCustomCategories, getAmmoCategory, escapeRegExp, COMPREHENSIVE_BULLET_TYPES } from '../utils/caliberHelpers';
import { AmmoCanLabelModal } from '../components/AmmoCanLabelModal';
import { BatchManufactureModal } from '../components/BatchManufactureModal';
// formatCaliber is re-exported for other consumers
export { formatCaliber } from '../utils/caliberHelpers';


export const AmmoDashboard = () => {
  const [ammoList, setAmmoList] = useState<Ammo[]>([]);
  const [activeTab, setActiveTab] = useState<'factory' | 'handload'>('factory');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingStockMode, setIsAddingStockMode] = useState(false);
  const [editingAmmo, setEditingAmmo] = useState<Ammo | null>(null);
  const [inspectingAmmo, setInspectingAmmo] = useState<Ammo | null>(null);
  const [labelModalAmmo, setLabelModalAmmo] = useState<Ammo | null>(null);
  const [batchManufactureAmmo, setBatchManufactureAmmo] = useState<Ammo | null>(null);
  const [upcStatus, setUpcStatus] = useState<{ message: string, type: 'success' | 'error' | 'info' | 'loading' } | null>(null);
  const [calcRds, setCalcRds] = useState<number | ''>('');
  const [calcBoxes, setCalcBoxes] = useState<number>(1);
  const location = useLocation();
  const navigate = useNavigate();
  const locationProcessed = useRef<string | null>(null);

  const [formData, setFormData] = useState<Partial<Ammo>>({ type: 'factory' });

  const customCategories = useMemo(() => buildCustomCategories(ammoList), [ammoList]);

  const loadAmmo = async () => {
    if (window.api) {
      const data = await window.api.getAmmo();
      setAmmoList(data);
    }
  };

  useEffect(() => {
    loadAmmo();
    let unsubscribe: (() => void) | undefined;
    if (window.api?.onSyncReceived) {
      unsubscribe = window.api.onSyncReceived(() => {
        loadAmmo();
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (location.state && location.state.openAddModal && locationProcessed.current !== location.key) {
      locationProcessed.current = location.key;
      setIsModalOpen(true);
      setEditingAmmo(null);
      setIsAddingStockMode(false);
      
      const upcToLookup = location.state.upc || '';
      
      const formDataToSet: any = { 
        type: 'factory', 
        upc_code: upcToLookup, 
        count: location.state.count 
      };

      if (location.state.parsedData) {
        Object.assign(formDataToSet, location.state.parsedData);
      }
      
      setFormData(formDataToSet);
      
      if (upcToLookup && !location.state.parsedData) {
        setTimeout(() => {
          lookupUPC(upcToLookup);
        }, 100);
      }
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const openAddModal = (type: 'factory' | 'handload') => {
    setEditingAmmo(null);
    setIsAddingStockMode(false);
    setFormData({ type });
    setUpcStatus(null);
    setIsModalOpen(true);
    setCalcRds('');
    setCalcBoxes(1);
  };

  const openEditModal = (ammo: Ammo) => {
    setEditingAmmo(ammo);
    setIsAddingStockMode(false);
    setFormData({ ...ammo });
    setUpcStatus(null);
    setIsModalOpen(true);
    setCalcRds(ammo.count);
    setCalcBoxes(1);
  };

  const handlePrintAmmoQR = async (ammo: Ammo) => {
    if (!window.api) return;
    try {
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(`armoryvault://ammo/${ammo.id}`, { width: 300, margin: 1 });
      await window.api.printQRLabel({
        itemName: `${ammo.caliber} ${ammo.manufacturer || 'Ammo'}`,
        itemDetails: `Type: ${ammo.type}\nQuantity: ${ammo.count || 0}`,
        qrDataUrl
      });
    } catch (err) {
      console.error('Failed to print QR label', err);
      alert('Failed to print QR label.');
    }
  };

  const handleSaveAmmoQR = async (ammo: Ammo) => {
    if (!window.api) return;
    try {
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(`armoryvault://ammo/${ammo.id}`, { width: 300, margin: 1 });
      await window.api.saveQRImage({
        itemName: `${ammo.caliber} ${ammo.manufacturer || 'Ammo'}`,
        qrDataUrl
      });
    } catch (err) {
      console.error('Failed to save QR label', err);
      alert('Failed to save QR label.');
    }
  };

  const handleShotgunChange = (field: 'caliber' | 'shell_length' | 'shot_size', value: string) => {
    const newForm = { ...formData, [field]: value };
    if (newForm.shot_size?.toLowerCase().includes('buck')) {
      const pc = getStandardPelletCount(newForm.caliber, newForm.shell_length, newForm.shot_size);
      if (pc !== '') {
        newForm.pellet_count = pc;
      }
    } else {
      newForm.pellet_count = undefined;
    }
    setFormData(newForm);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this ammo record?')) {
      if (window.api) {
        await window.api.deleteAmmo(id);
        await loadAmmo();
      }
    }
  };

  const lookupUPC = async (upc: string) => {
    const cleanUpc = upc.trim().toUpperCase();
    if (!cleanUpc) return;

    setUpcStatus({ message: 'Searching database...', type: 'loading' });

    // 1. Check Local Custom SKU Database first
    const currentSkus = await window.api.getSkus();
    if (currentSkus[cleanUpc]) {
      const data = currentSkus[cleanUpc];
      
      const localMatch = ammoList.find(a => a.upc_code === cleanUpc);
      if (localMatch) {
        setEditingAmmo(localMatch);
        setIsAddingStockMode(true);
        setFormData({ ...localMatch });
        setCalcRds(data.count || 20);
        setCalcBoxes(1);
        setUpcStatus({ message: 'Found in your inventory! How many boxes are you adding?', type: 'success' });
        return;
      }

      setFormData(prev => ({
        ...prev,
        ...data,
        upc_code: cleanUpc
      }));
      if (data.count) {
        setCalcRds(data.count);
        setCalcBoxes(1);
      }
      setUpcStatus({ message: 'Match found in local SKU database!', type: 'success' });
      return;
    }

    // 2. Check Inventory
    const localMatch = ammoList.find(a => a.upc_code === upc);
    if (localMatch) {
      setEditingAmmo(localMatch);
      setIsAddingStockMode(true);
      setFormData({ ...localMatch });
      setCalcBoxes(1);
      setCalcRds('');
      setUpcStatus({ message: 'Found in your inventory! How many boxes are you adding?', type: 'success' });
      return;
    }

    try {
      const data = await window.api.lookupUPC(upc);
      if (data && data.items && data.items.length > 0) {
        const item = data.items[0];
        const parsed = parseBarcodeData(item, ammoList);

        if (parsed.category === 'component') {
          if (window.confirm("This looks like a Reloading Component. Would you like to redirect to the Components tab?")) {
            navigate('/components', { state: { openAddModal: true, upc: upc } });
            return;
          }
        } else if (parsed.category === 'accessory') {
          if (window.confirm("This looks like an Accessory. Would you like to redirect to the Accessories tab?")) {
            navigate('/accessories', { state: { openAddModal: true, upc: upc } });
            return;
          }
        } else if (parsed.category === 'unknown') {
          const typeChoice = window.prompt("Is this Ammo, Component, or Accessory? (Type 'ammo', 'component', or 'accessory')", "ammo");
          if (typeChoice && typeChoice.toLowerCase() === 'component') {
            navigate('/components', { state: { openAddModal: true, upc: upc } });
            return;
          } else if (typeChoice && typeChoice.toLowerCase() === 'accessory') {
            navigate('/accessories', { state: { openAddModal: true, upc: upc } });
            return;
          }
        }

        if (parsed.parsedAmmo?.count) {
          setCalcRds(parsed.parsedAmmo.count);
          setCalcBoxes(1);
        }

        setFormData(prev => ({
          ...prev,
          manufacturer: parsed.parsedAmmo?.manufacturer || prev.manufacturer,
          caliber: parsed.parsedAmmo?.caliber || prev.caliber,
          grain: parsed.parsedAmmo?.grain || prev.grain,
          projectile: parsed.parsedAmmo?.projectile || prev.projectile,
          isPlusP: parsed.parsedAmmo?.isPlusP !== undefined ? parsed.parsedAmmo.isPlusP : prev.isPlusP,
          costPerRound: parsed.parsedAmmo?.costPerRound || prev.costPerRound,
          boxPrice: parsed.parsedAmmo?.boxPrice !== undefined ? parsed.parsedAmmo.boxPrice : (prev as any).boxPrice,
          count: parsed.parsedAmmo?.count || prev.count,
          upc_match: parsed.parsedAmmo?.upc_match || prev.upc_match,
          upc_code: upc
        } as any));

        setUpcStatus({ message: 'Barcode parsed automatically!', type: 'success' });
      } else {
        setUpcStatus({ message: "Barcode not found in database. Manual entry required.", type: 'error' });
      }
    } catch (e) {
      console.warn("UPC Lookup failed:", e);
      setUpcStatus({ message: "Network error looking up barcode.", type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let submissionData = { ...formData };
    if (submissionData.type === 'handload' && !submissionData.upc_code) {
      submissionData.upc_code = generateInternalUPC();
    }

    if (editingAmmo && editingAmmo.id) {
      if (isAddingStockMode) {
        submissionData.count = (editingAmmo.count || 0) + (submissionData.count || 0);
      }
      await window.api.updateAmmo(editingAmmo.id, submissionData as Ammo);
    } else {
      // Check for duplicates before adding
      const duplicate = ammoList.find(a => 
        a.type === submissionData.type &&
        a.caliber === submissionData.caliber &&
        a.manufacturer === submissionData.manufacturer &&
        a.grain === submissionData.grain &&
        a.projectile === submissionData.projectile
      );
      
      let merged = false;
      if (duplicate) {
        if (window.confirm(`An existing entry for ${duplicate.manufacturer || ''} ${duplicate.caliber} ${duplicate.grain || ''}gr was found. Would you like to merge this into the existing entry?`)) {
           const mergedData = { ...duplicate };
           mergedData.count = (duplicate.count || 0) + (submissionData.count || 0);
           // Take the new UPC if the old one was blank
           if (!mergedData.upc_code && submissionData.upc_code) {
             mergedData.upc_code = submissionData.upc_code;
           }
           await window.api.updateAmmo(duplicate.id!, mergedData as Ammo);
           merged = true;
        }
      }
      
      if (!merged) {
        await window.api.addAmmo(submissionData as Ammo);
      }

      // Automatically clear the sync item from the inbox if this was a resolution
      if (location.state && location.state.syncItemId) {
        await window.api.removeSyncItem(location.state.syncItemId);
      }
    }
    setIsModalOpen(false);
    setIsAddingStockMode(false);
    
    // Clear location state after successful submit so it doesn't trigger again
    if (location.state?.syncItemId) {
      window.history.replaceState({}, document.title);
    }
    
    loadAmmo();
  };

  const isAmmoLow = (a: Ammo) => {
    const threshold = a.min_threshold ?? a.low_stock_threshold;
    if (threshold !== undefined && threshold > 0 && a.count <= threshold) return true;
    if (a.target_stock_goal && (a.count / a.target_stock_goal * 100) <= (a.alert_percentage || 20)) return true;
    return false;
  };

  const filteredAmmo = ammoList.filter(a => {
    if (a.type !== activeTab) return false;
    if (onlyLowStock && !isAmmoLow(a)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const searchable = `${a.caliber} ${a.manufacturer || ''} ${a.projectile || ''} ${a.powder || ''} ${a.shot_size || ''} ${a.notes || ''}`.toLowerCase();
      return searchable.includes(q);
    }
    return true;
  });

  const lowAmmoAlerts = useMemo(() => {
    return ammoList.filter(ammo => isAmmoLow(ammo));
  }, [ammoList]);

  return (
    <>
      <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ammunition Inventory</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track your factory ammunition and custom handload recipes.</p>
        </div>
        <button className="btn-primary" onClick={() => openAddModal(activeTab)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={20} /> Add {activeTab === 'factory' ? 'Ammo' : 'Handload'}
        </button>
      </div>

      {lowAmmoAlerts.length > 0 && !onlyLowStock && (
        <div style={{ marginBottom: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1rem 1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} /> Low Stock Alerts ({lowAmmoAlerts.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {lowAmmoAlerts.map(ammo => (
              <div key={ammo.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.8rem 1rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{ammo.caliber}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ammo.type === 'factory' ? ammo.manufacturer : 'Handload'} • {ammo.projectile || ammo.shot_size || 'N/A'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#f87171', fontSize: '1.2rem' }}>
                    {ammo.count} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ {ammo.min_threshold ?? ammo.low_stock_threshold ?? ammo.target_stock_goal ?? 'min'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setActiveTab('factory')} 
            style={{ background: 'transparent', border: 'none', color: activeTab === 'factory' ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '1.1rem', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: activeTab === 'factory' ? '2px solid var(--accent)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Package size={20} /> Factory Ammo
          </button>
          <button 
            onClick={() => setActiveTab('handload')} 
            style={{ background: 'transparent', border: 'none', color: activeTab === 'handload' ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '1.1rem', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: activeTab === 'handload' ? '2px solid var(--accent)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Target size={20} /> Custom Handloads
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {lowAmmoAlerts.length > 0 && (
            <button
              className={onlyLowStock ? 'btn-danger' : 'btn-secondary'}
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
            >
              ⚠️ Low Stock ({lowAmmoAlerts.length})
            </button>
          )}
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search calibers, bullets, powder..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ minWidth: '260px', marginBottom: 0 }}
          />
        </div>
      </div>

      <div>
        {['Pistol', 'Rifle', 'Shotgun', 'Other'].map(category => {
          const categoryAmmo = filteredAmmo
            .filter(a => getAmmoCategory(a.caliber, customCategories) === category)
            .sort((a, b) => (a.caliber || '').localeCompare(b.caliber || ''));
          if (categoryAmmo.length === 0) return null;
          return (
            <div key={category} style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {category}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {categoryAmmo.map(ammo => {
                  const isLow = isAmmoLow(ammo);
                  return (
                  <div key={ammo.id} className="card ammo-card" onClick={() => setInspectingAmmo(ammo)} style={{ position: 'relative', cursor: 'pointer', border: isLow ? '1px solid rgba(239, 68, 68, 0.4)' : undefined, background: isLow ? 'rgba(239, 68, 68, 0.03)' : undefined }}>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.4rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); setLabelModalAmmo(ammo); }} style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '0.2rem' }} title="Print Can / Box Sticker Label"><Tag size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handlePrintAmmoQR(ammo); }} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '0.2rem' }} title="Print Standard QR Sheet"><Printer size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleSaveAmmoQR(ammo); }} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '0.2rem' }} title="Save QR Image"><Upload size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(ammo); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}><Edit size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(ammo.id!); }} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}><Trash2 size={16} /></button>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {ammo.caliber}
                        {ammo.isPlusP && <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)', verticalAlign: 'middle', fontWeight: 'bold' }}>+P</span>}
                      </h3>
                      {isLow && (
                        <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                          Low Stock
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      {(() => {
                        const isShotgun = category === 'Shotgun';
                        if (ammo.type === 'factory') {
                          if (isShotgun) {
                            const fmtPayload = ammo.oz_payload ? (ammo.oz_payload.toLowerCase().includes('oz') ? ammo.oz_payload : `${ammo.oz_payload} oz`) : (ammo.pellet_count ? `${ammo.pellet_count} pellets` : '');
                            return `${ammo.manufacturer || 'Unknown Make'} - ${ammo.shot_size || 'Unknown Shot'} ${fmtPayload ? `(${fmtPayload})` : ''}`.trim();
                          }
                          return `${ammo.manufacturer || 'Unknown Make'} - ${ammo.grain || '??'}gr ${ammo.projectile || ''}`.trim();
                        } else {
                          if (isShotgun) {
                            const fmtPayload = ammo.oz_payload ? (ammo.oz_payload.toLowerCase().includes('oz') ? ammo.oz_payload : `${ammo.oz_payload} oz`) : (ammo.pellet_count ? `${ammo.pellet_count} pellets` : '');
                            return `${ammo.shot_size || 'Unknown Shot'} - ${ammo.powder || 'Unknown Powder'} ${ammo.powderCharge ? `(${ammo.powderCharge}gr)` : ''} ${fmtPayload ? `(${fmtPayload})` : ''}`.trim();
                          }
                          return `${ammo.bullet_manufacturer ? ammo.bullet_manufacturer + ' ' : ''}${ammo.grain ? ammo.grain + 'gr ' : ''}${ammo.projectile || 'Unknown'} - ${ammo.powder || 'Unknown Powder'} ${ammo.powderCharge ? `(${ammo.powderCharge}gr)` : ''}`.trim();
                        }
                      })()}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block' }}>Rounds in Stock</span>
                          <strong style={{ fontSize: '1.5rem', color: (ammo.low_stock_threshold && ammo.count <= ammo.low_stock_threshold) || (ammo.target_stock_goal && (ammo.count / ammo.target_stock_goal * 100) <= (ammo.alert_percentage || 0)) ? 'var(--danger)' : 'var(--accent)' }}>
                            {ammo.count.toLocaleString()}
                          </strong>
                        </div>
                        {ammo.costPerRound && (
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block' }}>Cost / Rnd</span>
                            <strong style={{ fontSize: '1.2rem', color: 'var(--success)' }}>${ammo.costPerRound.toFixed(2)}</strong>
                          </div>
                        )}
                      </div>
                      
                      {ammo.target_stock_goal && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            <span>Stock Goal</span>
                            <span>{Math.round((ammo.count / ammo.target_stock_goal) * 100)}% ({ammo.target_stock_goal})</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${Math.min(100, (ammo.count / ammo.target_stock_goal) * 100)}%`, 
                              background: (ammo.low_stock_threshold && ammo.count <= ammo.low_stock_threshold) || ((ammo.count / ammo.target_stock_goal * 100) <= (ammo.alert_percentage || 0)) ? 'var(--danger)' : 'var(--accent)',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {ammo.type === 'handload' && (
                      <>
                        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div><strong>Primer:</strong> {ammo.primer_type ? `${ammo.primer_type} (${ammo.primer || 'Unknown'})` : (ammo.primer || 'N/A')}</div>
                          <div><strong>Brass/Hull:</strong> {ammo.brass || ammo.shell_length || 'N/A'}</div>
                          <div><strong>OAL:</strong> {ammo.oal ? `${ammo.oal}"` : 'N/A'}</div>
                        </div>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBatchManufactureAmmo(ammo);
                          }}
                          style={{
                            marginTop: '0.85rem',
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            width: '100%'
                          }}
                          title="Manufacture a batch of this recipe and deduct powder, primers, brass, and bullets automatically"
                        >
                          <Sparkles size={15} /> Assemble / Manufacture Batch
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          );
        })}
        {filteredAmmo.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <p>No {activeTab} records found.</p>
          </div>
        )}
      </div>
    </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: formData.type === 'handload' ? '850px' : '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, padding: 0, border: 'none' }}>
                {isAddingStockMode ? 'Add Stock' : editingAmmo ? 'Edit' : 'Add'} {formData.type === 'factory' ? 'Factory Ammo' : 'Custom Handload'}
              </h2>
              <button type="button" className="btn-icon" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '-0.5rem' }}>Basic Information</h3>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>UPC Barcode (Optional)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" className="form-input" style={{ flex: 1 }} value={formData.upc_code || ''} onChange={e => setFormData({...formData, upc_code: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookupUPC(formData.upc_code || ''); } }} onBlur={e => lookupUPC(e.target.value)} placeholder="Scan or type UPC code..." />
                    <button type="button" className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => lookupUPC(formData.upc_code || '')}>Lookup</button>
                  </div>
                  {upcStatus && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.5rem', borderRadius: '4px', background: upcStatus.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : upcStatus.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.1)', color: upcStatus.type === 'success' ? '#4ade80' : upcStatus.type === 'error' ? '#f87171' : '#38bdf8', border: `1px solid ${upcStatus.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : upcStatus.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)'}` }}>
                      {upcStatus.message}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Caliber *</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input required list="calibers-list" type="text" className="form-input" style={{ flex: 1 }} value={formData.caliber || ''} onChange={e => handleShotgunChange('caliber', e.target.value)} onBlur={() => handleShotgunChange('caliber', formatCaliber(formData.caliber || ''))} placeholder="e.g. 9mm, .223 Rem" />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: formData.isPlusP ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)', padding: '0.65rem 0.75rem', borderRadius: '4px', border: `1px solid ${formData.isPlusP ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.1)'}` }}>
                        <input type="checkbox" checked={!!formData.isPlusP} onChange={e => setFormData({...formData, isPlusP: e.target.checked})} style={{ margin: 0 }} />
                        <span style={{ color: formData.isPlusP ? '#ef4444' : 'var(--text-secondary)', fontWeight: formData.isPlusP ? 'bold' : 'normal', fontSize: '0.9rem' }}>+P</span>
                      </label>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Total Rounds in Stock *</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input required type="number" className="form-input" value={formData.count === undefined ? '' : formData.count} onChange={e => {
                        setFormData({...formData, count: e.target.value === '' ? ('' as any) : parseInt(e.target.value)});
                        setCalcRds('');
                      }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Calculator:</span>
                        <input type="number" placeholder="Rounds/Box" value={calcRds} style={{ width: '90px', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #3f3f46', background: '#18181b', color: '#fff' }} onChange={(e) => {
                          const rds = e.target.value === '' ? '' : parseInt(e.target.value);
                          setCalcRds(rds);
                          if (typeof rds === 'number') setFormData({...formData, count: rds * calcBoxes});
                        }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>x</span>
                        <input type="number" placeholder="Boxes" value={calcBoxes} min="1" style={{ width: '70px', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #3f3f46', background: '#18181b', color: '#fff' }} onChange={(e) => {
                          const boxes = parseInt(e.target.value) || 1;
                          setCalcBoxes(boxes);
                          if (typeof calcRds === 'number') setFormData({...formData, count: calcRds * boxes});
                        }} />
                      </div>
                    </div>
                  </div>
                </div>

                {formData.type === 'handload' && getAmmoCategory(formData.caliber || '', customCategories) === 'Other' && formData.caliber && (
                  <div className="form-group" style={{ marginBottom: 0, marginTop: '1.5rem', background: 'rgba(56, 189, 248, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    <label style={{ color: 'var(--accent)' }}>Unknown Caliber Detected. Select Category:</label>
                    <select required className="form-input" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                      <option value="">Select Category...</option>
                      <option value="Pistol">Pistol</option>
                      <option value="Rifle">Rifle</option>
                      <option value="Shotgun">Shotgun</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--accent)', marginBottom: '1rem' }}>
                  {formData.type === 'factory' ? 'Factory Details' : 'Handload Recipe'}
                </h3>
                
                {formData.type === 'factory' ? (() => {
                  const baseCategory = getAmmoCategory(formData.caliber || '', customCategories);
                  const isShotgun = baseCategory === 'Shotgun';
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Manufacturer</label>
                          <input type="text" list="ammo-makes-list" className="form-input" value={formData.manufacturer || ''} onChange={e => setFormData({...formData, manufacturer: e.target.value})} placeholder="e.g. Winchester, Federal" />
                        </div>
                        {isShotgun ? (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Shell Length</label>
                            <select className="form-input" value={formData.shell_length || ''} onChange={e => handleShotgunChange('shell_length', e.target.value)}>
                              <option value="">Select Length</option>
                              <option value="1 3/4">1 3/4"</option>
                              <option value="2">2"</option>
                              <option value="2 1/2">2 1/2"</option>
                              <option value="2 5/8">2 5/8"</option>
                              <option value="2 3/4">2 3/4"</option>
                              <option value="3">3"</option>
                              <option value="3 1/2">3 1/2"</option>
                            </select>
                          </div>
                        ) : (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Bullet Weight (Grain)</label>
                            <input type="number" className="form-input" value={formData.grain ?? ''} onChange={e => setFormData({...formData, grain: e.target.value === '' ? ('' as any) : parseInt(e.target.value)})} />
                          </div>
                        )}
                      </div>
                      {isShotgun ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Shot Size / Slug</label>
                            <select className="form-input" value={formData.shot_size || ''} onChange={e => handleShotgunChange('shot_size', e.target.value)}>
                              <option value="">Select Shot Size</option>
                              <option value="Slug">Slug</option>
                              <option value="000 Buck">000 Buck</option>
                              <option value="00 Buck">00 Buck</option>
                              <option value="0 Buck">0 Buck</option>
                              <option value="1 Buck">1 Buck</option>
                              <option value="4 Buck">4 Buck</option>
                              <option value="BB">BB</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                              <option value="6">6</option>
                              <option value="7">7</option>
                              <option value="7 1/2">7 1/2</option>
                              <option value="8">8</option>
                              <option value="8 1/2">8 1/2</option>
                              <option value="9">9</option>
                            </select>
                          </div>
                          {!(formData.shot_size?.toLowerCase().includes('buck')) && (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>Payload Weight (oz)</label>
                              <select className="form-input" value={formData.oz_payload || ''} onChange={e => setFormData({...formData, oz_payload: e.target.value})}>
                                <option value="">Select Payload</option>
                                <option value="1/2">1/2 oz</option>
                                <option value="5/8">5/8 oz</option>
                                <option value="11/16">11/16 oz</option>
                                <option value="3/4">3/4 oz</option>
                                <option value="7/8">7/8 oz</option>
                                <option value="1">1 oz</option>
                                <option value="1 1/16">1 1/16 oz</option>
                                <option value="1 1/8">1 1/8 oz</option>
                                <option value="1 1/4">1 1/4 oz</option>
                                <option value="1 3/8">1 3/8 oz</option>
                                <option value="1 1/2">1 1/2 oz</option>
                                <option value="1 5/8">1 5/8 oz</option>
                                <option value="1 3/4">1 3/4 oz</option>
                                <option value="1 7/8">1 7/8 oz</option>
                                <option value="2">2 oz</option>
                                <option value="2 1/4">2 1/4 oz</option>
                                <option value="2 1/2">2 1/2 oz</option>
                              </select>
                            </div>
                          )}
                          {formData.shot_size?.toLowerCase().includes('buck') && (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>Pellet Count</label>
                              <input type="number" className="form-input" value={formData.pellet_count || ''} onChange={e => setFormData({...formData, pellet_count: e.target.value ? parseInt(e.target.value) : undefined})} placeholder="e.g. 9" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Bullet Type</label>
                          <input type="text" list="bullet-types-list" className="form-input" value={formData.projectile || ''} onChange={e => setFormData({...formData, projectile: e.target.value})} placeholder="e.g. FMJ, JHP, Match" />
                        </div>
                      )}
                      <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                        <label>Notes / Description</label>
                        <textarea className="form-input" rows={2} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Additional details"></textarea>
                      </div>
                      
                      {formData.upc_match && (
                        <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                          <label>UPC Match Data</label>
                          <textarea className="form-input" rows={2} value={formData.upc_match || ''} onChange={e => setFormData({...formData, upc_match: e.target.value})} placeholder="Data from barcode database"></textarea>
                        </div>
                      )}
                    </div>
                  );
                })() : (() => {
                  const baseCategory = getAmmoCategory(formData.caliber || '', customCategories);
                  const effectiveCategory = formData.category || baseCategory;
                  const isShotgun = effectiveCategory === 'Shotgun';
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {isShotgun ? (
                          <>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>Shot Size / Slug</label>
                              <input type="text" list="shot-size-list" className="form-input" value={formData.shot_size || ''} onChange={e => handleShotgunChange('shot_size', e.target.value)} placeholder="e.g. 00 Buck, 7 1/2" />
                              <datalist id="shot-size-list">
                                <option value="Slug">Slug</option>
                                <option value="000 Buck">000 Buck</option>
                                <option value="00 Buck">00 Buck</option>
                                <option value="0 Buck">0 Buck</option>
                                <option value="1 Buck">1 Buck</option>
                                <option value="4 Buck">4 Buck</option>
                                <option value="BB">BB</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="7">7</option>
                                <option value="7 1/2">7 1/2</option>
                                <option value="8">8</option>
                                <option value="8 1/2">8 1/2</option>
                                <option value="9">9</option>
                              </datalist>
                            </div>
                            {!(formData.shot_size?.toLowerCase().includes('buck')) && (
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Payload Weight (oz)</label>
                                <input type="text" list="payload-list" className="form-input" value={formData.oz_payload || ''} onChange={e => setFormData({...formData, oz_payload: e.target.value})} placeholder="e.g. 1 1/8" />
                                <datalist id="payload-list">
                                  <option value="1/2">1/2 oz</option>
                                  <option value="5/8">5/8 oz</option>
                                  <option value="11/16">11/16 oz</option>
                                  <option value="3/4">3/4 oz</option>
                                  <option value="7/8">7/8 oz</option>
                                  <option value="1">1 oz</option>
                                  <option value="1 1/16">1 1/16 oz</option>
                                  <option value="1 1/8">1 1/8 oz</option>
                                  <option value="1 1/4">1 1/4 oz</option>
                                  <option value="1 3/8">1 3/8 oz</option>
                                  <option value="1 1/2">1 1/2 oz</option>
                                  <option value="1 5/8">1 5/8 oz</option>
                                  <option value="1 3/4">1 3/4 oz</option>
                                  <option value="1 7/8">1 7/8 oz</option>
                                  <option value="2">2 oz</option>
                                  <option value="2 1/4">2 1/4 oz</option>
                                  <option value="2 1/2">2 1/2 oz</option>
                                </datalist>
                              </div>
                            )}
                            {formData.shot_size?.toLowerCase().includes('buck') && (
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Pellet Count</label>
                                <input type="number" className="form-input" value={formData.pellet_count || ''} onChange={e => setFormData({...formData, pellet_count: e.target.value ? parseInt(e.target.value) : undefined})} placeholder="e.g. 9" />
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>Bullet Manufacturer</label>
                              <input type="text" className="form-input" value={formData.bullet_manufacturer || ''} onChange={e => setFormData({...formData, bullet_manufacturer: e.target.value})} placeholder="e.g. Hornady, Sierra" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>Bullet Weight (Grain)</label>
                              <input type="number" className="form-input" value={formData.grain ?? ''} onChange={e => setFormData({...formData, grain: e.target.value === '' ? ('' as any) : parseInt(e.target.value)})} placeholder="e.g. 147" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>Bullet Type</label>
                              <input type="text" className="form-input" value={formData.projectile || ''} onChange={e => setFormData({...formData, projectile: e.target.value})} placeholder="e.g. XTP, FMJ" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>Overall Length (OAL)</label>
                              <input type="number" step="0.001" className="form-input" value={formData.oal ?? ''} onChange={e => setFormData({...formData, oal: e.target.value === '' ? ('' as any) : parseFloat(e.target.value)})} placeholder="e.g. 1.150" />
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Powder</label>
                          <input type="text" list="powders-list" className="form-input" value={formData.powder || ''} onChange={e => setFormData({...formData, powder: e.target.value})} placeholder="e.g. Titegroup, Varget" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Charge (Grains)</label>
                          <input type="number" step="0.1" className="form-input" value={formData.powderCharge ?? ''} onChange={e => setFormData({...formData, powderCharge: e.target.value === '' ? ('' as any) : parseFloat(e.target.value)})} />
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Primer Size / Type</label>
                          <input type="text" list="primer-types-list" className="form-input" value={formData.primer_type || ''} onChange={e => setFormData({...formData, primer_type: e.target.value})} placeholder="e.g. Small Rifle" />
                          <datalist id="primer-types-list">
                            <option value="Small Pistol">Small Pistol</option>
                            <option value="Small Pistol Magnum">Small Pistol Magnum</option>
                            <option value="Large Pistol">Large Pistol</option>
                            <option value="Large Pistol Magnum">Large Pistol Magnum</option>
                            <option value="Small Rifle">Small Rifle</option>
                            <option value="Small Rifle Magnum">Small Rifle Magnum</option>
                            <option value="Large Rifle">Large Rifle</option>
                            <option value="Large Rifle Magnum">Large Rifle Magnum</option>
                            <option value="Shotgun 209">Shotgun 209</option>
                          </datalist>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Primer Model</label>
                          <input type="text" className="form-input" value={formData.primer || ''} onChange={e => setFormData({...formData, primer: e.target.value})} placeholder="e.g. CCI 500" />
                        </div>
                        {isShotgun ? (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Shell Length / Hull</label>
                            <input type="text" list="shell-length-list" className="form-input" value={formData.shell_length || ''} onChange={e => handleShotgunChange('shell_length', e.target.value)} placeholder='e.g. 2 3/4"' />
                            <datalist id="shell-length-list">
                              <option value="1 3/4">1 3/4"</option>
                              <option value="2">2"</option>
                              <option value="2 1/2">2 1/2"</option>
                              <option value="2 5/8">2 5/8"</option>
                              <option value="2 3/4">2 3/4"</option>
                              <option value="3">3"</option>
                              <option value="3 1/2">3 1/2"</option>
                            </datalist>
                          </div>
                        ) : (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Brass</label>
                            <input type="text" list="brass-list" className="form-input" value={formData.brass || ''} onChange={e => setFormData({...formData, brass: e.target.value})} placeholder="e.g. Starline, Mixed" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>Inventory Tracking</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Target Stock Goal (Rounds)</label>
                    <input type="number" className="form-input" value={formData.target_stock_goal ?? ''} onChange={e => setFormData({...formData, target_stock_goal: e.target.value === '' ? ('' as any) : parseInt(e.target.value)})} placeholder="e.g. 1000" />
                  </div>
                  <div className="form-group">
                    <label>Low Stock Alert (Rounds)</label>
                    <input type="number" className="form-input" value={formData.low_stock_threshold ?? ''} onChange={e => setFormData({...formData, low_stock_threshold: e.target.value === '' ? ('' as any) : parseInt(e.target.value)})} placeholder="e.g. 200" />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label>Alert Threshold Percentage</label>
                  <input type="number" min="0" max="100" className="form-input" value={formData.alert_percentage ?? ''} onChange={e => setFormData({...formData, alert_percentage: e.target.value === '' ? ('' as any) : parseInt(e.target.value)})} placeholder="e.g. 20 for 20% warning" />
                  <small style={{ color: 'var(--text-secondary)' }}>App will highlight stock level in red if it drops below this % of target goal, or below the exact Low Stock Alert amount.</small>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Total Box Price ($) <span style={{fontSize:'0.75rem', fontWeight:'normal'}}>(Auto-calcs CPR)</span></label>
                    <input type="number" step="0.01" className="form-input" placeholder="e.g. 25.00" value={(formData as any).boxPrice ?? ''} onChange={e => {
                      const valStr = e.target.value;
                      const val = parseFloat(valStr);
                      if (!isNaN(val) && formData.count) {
                        setFormData({...formData, boxPrice: val, costPerRound: parseFloat((val / formData.count).toFixed(3))} as any);
                      } else {
                        setFormData({...formData, boxPrice: valStr === '' ? undefined : val} as any);
                      }
                    }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Cost per Round ($)</label>
                    <input type="number" step="0.01" className="form-input" value={formData.costPerRound ?? ''} onChange={e => setFormData({...formData, costPerRound: e.target.value === '' ? ('' as any) : parseFloat(e.target.value)})} placeholder="0.25" />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                  <label>Notes / Description</label>
                  <textarea className="form-input" rows={2} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Accuracy notes, velocity data, etc."></textarea>
                </div>
                  
                {formData.upc_match && (
                  <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                    <label>UPC Match Data</label>
                    <textarea className="form-input" rows={2} value={formData.upc_match || ''} onChange={e => setFormData({...formData, upc_match: e.target.value})} placeholder="Data from barcode database"></textarea>
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.8rem 2rem' }}>
                  Save {formData.type === 'factory' ? 'Ammo' : 'Handload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inspectingAmmo && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, padding: 0, border: 'none', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {inspectingAmmo.caliber}
                  {inspectingAmmo.isPlusP && <span style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 'bold' }}>+P</span>}
                </h2>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {inspectingAmmo.type === 'factory' ? `${inspectingAmmo.manufacturer || 'Unknown Make'}` : 'Custom Handload'}
                </span>
              </div>
              <button type="button" className="btn-icon" onClick={() => setInspectingAmmo(null)}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '1.5rem', borderRadius: '8px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Inventory Count</span>
                  <strong style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{inspectingAmmo.count} <span style={{fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)'}}>rds</span></strong>
                </div>
                {inspectingAmmo.costPerRound && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cost per Round</span>
                    <strong style={{ fontSize: '1.5rem', color: 'var(--success)' }}>${inspectingAmmo.costPerRound.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              {inspectingAmmo.type === 'factory' ? (() => {
                const baseCategory = getAmmoCategory(inspectingAmmo.caliber || '', customCategories);
                const isShotgun = baseCategory === 'Shotgun';
                if (isShotgun) {
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Shell Length</span>
                        <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.shell_length ? (inspectingAmmo.shell_length.includes('"') || inspectingAmmo.shell_length.toLowerCase().includes('in') ? inspectingAmmo.shell_length : `${inspectingAmmo.shell_length}"`) : 'N/A'}</div>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Shot Size</span>
                        <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.shot_size || 'N/A'}</div>
                      </div>
                      {!(inspectingAmmo.shot_size?.toLowerCase().includes('buck')) && (
                        <div>
                          <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Payload</span>
                          <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.oz_payload ? (inspectingAmmo.oz_payload.toLowerCase().includes('oz') ? inspectingAmmo.oz_payload : `${inspectingAmmo.oz_payload} oz`) : 'N/A'}</div>
                        </div>
                      )}
                      {inspectingAmmo.shot_size?.toLowerCase().includes('buck') && (
                        <div>
                          <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pellets</span>
                          <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.pellet_count || 'N/A'}</div>
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bullet Weight</span>
                      <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.grain ? `${inspectingAmmo.grain} gr` : 'N/A'}</div>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bullet Type</span>
                      <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.projectile || 'N/A'}</div>
                    </div>
                  </div>
                );
              })() : (() => {
                const baseCategory = getAmmoCategory(inspectingAmmo.caliber || '', customCategories);
                const isShotgun = (inspectingAmmo.category || baseCategory) === 'Shotgun';
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {isShotgun ? (
                      <>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Shot / Slug</span>
                          <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.shot_size || 'N/A'}</div>
                        </div>
                        {!(inspectingAmmo.shot_size?.toLowerCase().includes('buck')) && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Payload</span>
                            <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.oz_payload ? (inspectingAmmo.oz_payload.toLowerCase().includes('oz') ? inspectingAmmo.oz_payload : `${inspectingAmmo.oz_payload} oz`) : 'N/A'}</div>
                          </div>
                        )}
                        {inspectingAmmo.shot_size?.toLowerCase().includes('buck') && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pellets</span>
                            <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.pellet_count || 'N/A'}</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Projectile</span>
                          <div style={{ fontSize: '1.1rem' }}>
                            {`${inspectingAmmo.bullet_manufacturer ? inspectingAmmo.bullet_manufacturer + ' ' : ''}${inspectingAmmo.grain ? inspectingAmmo.grain + 'gr ' : ''}${inspectingAmmo.projectile || ''}`.trim() || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>OAL</span>
                          <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.oal ? `${inspectingAmmo.oal}"` : 'N/A'}</div>
                        </div>
                      </>
                    )}
                    <div>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Powder</span>
                      <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.powder} ({inspectingAmmo.powderCharge}gr)</div>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Primer</span>
                      <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.primer || 'N/A'}</div>
                    </div>
                    {isShotgun ? (
                      <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Shell Length</span>
                        <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.shell_length ? (inspectingAmmo.shell_length.includes('"') || inspectingAmmo.shell_length.toLowerCase().includes('in') ? inspectingAmmo.shell_length : `${inspectingAmmo.shell_length}"`) : 'N/A'}</div>
                      </div>
                    ) : (
                      <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Brass</span>
                        <div style={{ fontSize: '1.1rem' }}>{inspectingAmmo.brass || 'N/A'}</div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {inspectingAmmo.notes && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Notes</span>
                  <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '4px', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                    {inspectingAmmo.notes}
                  </div>
                </div>
              )}

            </div>

            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button className="btn-primary" onClick={() => setInspectingAmmo(null)} style={{ width: '100%' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Datalists for Autocomplete */}
      <datalist id="calibers-list">
        {/* Modern Calibers */}
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
        <option value="16 Gauge" />
        <option value="28 Gauge" />
        <option value=".410 Bore" />
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

        {/* Historic & Military Surplus Calibers */}
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

      <datalist id="ammo-makes-list">
        <option value="Winchester" />
        <option value="Federal" />
        <option value="Hornady" />
        <option value="CCI" />
        <option value="Remington" />
        <option value="Fiocchi" />
        <option value="Sellier & Bellot" />
        <option value="Magtech" />
        <option value="PMC" />
        <option value="Speer" />
      </datalist>

      <datalist id="powders-list">
        <option value="Titegroup" />
        <option value="Varget" />
        <option value="H4350" />
        <option value="Unique" />
        <option value="Bullseye" />
        <option value="H335" />
        <option value="IMR 4064" />
        <option value="CFE 223" />
        <option value="CFE Pistol" />
        <option value="Winchester 231" />
        <option value="Reloder 15" />
        <option value="H110" />
      </datalist>

      <datalist id="primers-list">
        <option value="Small Pistol" />
        <option value="Large Pistol" />
        <option value="Small Rifle" />
        <option value="Large Rifle" />
        <option value="Small Pistol Magnum" />
        <option value="Large Pistol Magnum" />
        <option value="Small Rifle Magnum" />
        <option value="Large Rifle Magnum" />
        <option value="209 Shotgun" />
        <option value="CCI 500" />
        <option value="CCI 550" />
        <option value="CCI 400" />
        <option value="CCI 450" />
        <option value="CCI 200" />
        <option value="CCI 250" />
      </datalist>

      <datalist id="brass-list">
        <option value="Starline" />
        <option value="Winchester" />
        <option value="Federal" />
        <option value="Hornady" />
        <option value="Lapua" />
        <option value="Remington" />
        <option value="Mixed/Range" />
      </datalist>

      <datalist id="bullet-types-list">
        {COMPREHENSIVE_BULLET_TYPES.map((bt, idx) => (
          <option key={idx} value={bt} />
        ))}
      </datalist>

      {labelModalAmmo && (
        <AmmoCanLabelModal
          isOpen={!!labelModalAmmo}
          onClose={() => setLabelModalAmmo(null)}
          ammo={labelModalAmmo}
        />
      )}

      {batchManufactureAmmo && (
        <BatchManufactureModal
          isOpen={!!batchManufactureAmmo}
          ammo={batchManufactureAmmo}
          onClose={() => setBatchManufactureAmmo(null)}
          onSuccess={() => {
            loadAmmo();
          }}
        />
      )}

    </>
  );
};
