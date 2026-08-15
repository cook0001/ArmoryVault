import React, { useState, useEffect } from 'react';
import { Accessory, Firearm } from '../types';
import { PlusCircle, Search, Edit, Trash2, Camera, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { AccessoryModal } from '../components/AccessoryModal';

export const Accessories = () => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Partial<Accessory>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (window.api && window.api.getAccessories && window.api.getFirearms) {
      const fetchedAcc = await window.api.getAccessories();
      const fetchedFirearms = await window.api.getFirearms();
      setAccessories(fetchedAcc);
      setFirearms(fetchedFirearms);
    }
  };

  const filteredAccessories = accessories.filter(a => {
    const term = search.toLowerCase();
    return (
      a.manufacturer.toLowerCase().includes(term) ||
      a.model.toLowerCase().includes(term) ||
      a.type.toLowerCase().includes(term)
    );
  });



  const handleEdit = (acc: Accessory) => {
    setFormData(acc);
    setEditingId(acc.id || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this accessory?")) {
      if (window.api && window.api.deleteAccessory) {
        await window.api.deleteAccessory(id);
        loadData();
      }
    }
  };

  const openNewModal = () => {
    setFormData({});
    setEditingId(null);
    setIsModalOpen(true);
  };

  const getMountedFirearmName = (id: number | null) => {
    if (!id) return null;
    const f = firearms.find(x => x.id === id);
    if (f) return `${f.make} ${f.model}`;
    return "Unknown Firearm";
  };

  const totalValue = accessories.reduce((sum, acc) => sum + ((acc.value || 0) * (acc.quantity || 1)), 0);
  const totalItemsCount = accessories.reduce((sum, acc) => sum + (acc.quantity || 1), 0);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1>Accessories & Optics</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track sights, suppressors, mounts, and more.</p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          <PlusCircle size={20} /> Add Accessory
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="search-bar" style={{ flex: 1, maxWidth: '400px' }}>
          <Search size={20} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Search accessories..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '0.8rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Value</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent)' }}>
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ width: '1px', height: '30px', background: 'var(--border-light)' }}></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Item Count</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{totalItemsCount}</div>
          </div>
        </div>
      </div>

      {filteredAccessories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            <AlertCircle size={48} style={{ margin: '0 auto', opacity: 0.5 }} />
          </div>
          <h3>No accessories found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Add your first optic, suppressor, or accessory to start tracking.</p>
          <button className="btn-primary" onClick={openNewModal}>Add Accessory</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredAccessories.map(acc => (
            <div key={acc.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {acc.photo ? (
                    <img src={acc.photo} alt={acc.model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Camera size={24} color="var(--text-secondary)" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{acc.type}</div>
                    {acc.is_nfa && <span className="status-badge" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.5)', padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>NFA</span>}
                  </div>
                  <h3 style={{ margin: '0 0 0.3rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(acc.quantity && acc.quantity > 1) ? `${acc.quantity}x ` : ''}{acc.manufacturer} {acc.model} 
                    {acc.magnification && <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)', fontWeight: 'normal' }}> ({acc.magnification})</span>}
                    {acc.ratedCalibers && <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)', fontWeight: 'normal' }}> ({acc.ratedCalibers})</span>}
                    {acc.lumens && <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)', fontWeight: 'normal' }}> ({acc.lumens} lm)</span>}
                    {acc.supportedModels && <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)', fontWeight: 'normal' }}> (Fits: {acc.supportedModels})</span>}
                    {(acc.caliber || acc.capacity) && <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)', fontWeight: 'normal' }}> ({[acc.caliber, acc.capacity ? `${acc.capacity}rd` : ''].filter(Boolean).join(' - ')})</span>}
                  </h3>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--success)' }}>
                    ${((acc.value || 0) * (acc.quantity || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {acc.quantity && acc.quantity > 1 && <span style={{ fontSize: '0.7em', color: 'var(--text-secondary)', fontWeight: 'normal' }}> (${(acc.value || 0).toLocaleString()} ea)</span>}
                  </div>
                </div>
              </div>
              
              {acc.mounts && acc.mounts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                  {acc.mounts.map((m, idx) => (
                    <div key={idx} style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LinkIcon size={14} color="var(--accent)" />
                      <span style={{ color: 'var(--text-secondary)' }}>Mounted on:</span>
                      <strong style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{getMountedFirearmName(m.firearmId)}</strong>
                      <span style={{ background: 'rgba(0,0,0,0.3)', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Qty: {m.quantity}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                <button onClick={() => handleEdit(acc)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '6px' }}>
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(acc.id!)} className="btn-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.5rem', borderRadius: '6px' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AccessoryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadData}
        editingId={editingId}
        initialData={formData}
        firearms={firearms}
      />
    </div>
  );
};
