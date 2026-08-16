import React, { useState, useEffect } from 'react';
import { ReloadingComponent } from '../types';
import { PlusCircle, Search, Edit, Trash2, AlertCircle, Package } from 'lucide-react';
import { ReloadingComponentModal } from '../components/ReloadingComponentModal';

export const ReloadingComponents = () => {
  const [components, setComponents] = useState<ReloadingComponent[]>([]);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Partial<ReloadingComponent>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (window.api && window.api.getComponents) {
      const fetched = await window.api.getComponents();
      setComponents(fetched);
    }
  };

  const filteredComponents = components.filter(c => {
    const term = search.toLowerCase();
    return (
      c.manufacturer.toLowerCase().includes(term) ||
      (c.name && c.name.toLowerCase().includes(term)) ||
      c.type.toLowerCase().includes(term) ||
      (c.caliber && c.caliber.toLowerCase().includes(term))
    );
  });

  const handleEdit = (comp: ReloadingComponent) => {
    setFormData(comp);
    setEditingId(comp.id || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this component?")) {
      if (window.api && window.api.deleteComponent) {
        await window.api.deleteComponent(id);
        loadData();
      }
    }
  };

  const openNewModal = () => {
    setFormData({ type: 'Powder' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const totalValue = components.reduce((sum, c) => sum + (c.cost || 0), 0);

  // Group components by type
  const grouped = filteredComponents.reduce((acc, comp) => {
    if (!acc[comp.type]) acc[comp.type] = [];
    acc[comp.type].push(comp);
    return acc;
  }, {} as Record<string, ReloadingComponent[]>);

  const renderComponentDetails = (c: ReloadingComponent) => {
    if (c.type === 'Powder') {
      return (
        <>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
            {c.quantity} {c.weightUnit}
          </div>
          {c.usageTags && c.usageTags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {c.usageTags.map(tag => (
                <span key={tag} style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent)', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{tag}</span>
              ))}
            </div>
          )}
        </>
      );
    }
    if (c.type === 'Brass') {
      return (
        <>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
            {c.caliber} • {c.primerType} {c.isMagnumPrimer ? '(Magnum)' : ''}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
            Stage: {c.prepStage}
          </div>
        </>
      );
    }
    if (c.type === 'Bullet') {
      return (
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {c.caliber} • {c.grain ? `${c.grain}gr ` : ''}{c.bulletType}
        </div>
      );
    }
    if (c.type === 'Primer') {
      return (
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {c.primerType} {c.isMagnumPrimer ? '(Magnum)' : ''}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1>Reloading Supplies</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track powder, brass, primers, and projectiles.</p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          <PlusCircle size={20} /> Add Component
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="search-bar" style={{ flex: 1, maxWidth: '400px' }}>
          <Search size={20} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Search components..." 
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
        </div>
      </div>

      {filteredComponents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            <AlertCircle size={48} style={{ margin: '0 auto', opacity: 0.5 }} />
          </div>
          <h3>No reloading components found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Add your first powder, brass, primer, or bullet to start tracking.</p>
          <button className="btn-primary" onClick={openNewModal}>Add Component</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {['Powder', 'Brass', 'Bullet', 'Primer'].map(typeGroup => {
            const groupItems = grouped[typeGroup];
            if (!groupItems || groupItems.length === 0) return null;
            
            return (
              <div key={typeGroup}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={20} color="var(--accent)" />
                  {typeGroup === 'Brass' ? 'Brass & Hulls' : typeGroup === 'Bullet' ? 'Bullets & Projectiles' : typeGroup + 's'}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {groupItems.map(c => (
                    <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1, paddingRight: '1rem' }}>
                          <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.1rem' }}>
                            {c.manufacturer} {c.name}
                          </h3>
                          {renderComponentDetails(c)}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                            {c.type === 'Powder' ? '' : c.quantity}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {c.type === 'Powder' ? '' : 'Qty'}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontSize: '0.95rem', color: 'var(--success)', fontWeight: 600 }}>
                            {c.cost ? `$${c.cost.toFixed(2)}` : ''}
                          </div>
                          {c.cost !== undefined && c.cost !== null && c.quantity !== undefined && c.quantity > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {c.type === 'Powder' ? (
                                `≈ $${(c.cost / (c.quantity * (c.weightUnit === 'lbs' ? 7000 : 437.5))).toFixed(4)} / grain`
                              ) : (
                                `≈ $${(c.cost / c.quantity).toFixed(3)} / ea`
                              )}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleEdit(c)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', padding: '0.4rem', borderRadius: '6px' }}>
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(c.id!)} className="btn-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.4rem', borderRadius: '6px' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ReloadingComponentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadData}
        editingId={editingId}
        initialData={formData}
      />
    </div>
  );
};
