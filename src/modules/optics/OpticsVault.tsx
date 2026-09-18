import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Battery,
  BatteryCharging,
  Crosshair,
  Edit3,
  Eye,
  Filter,
  Layers,
  Plus,
  Printer,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { ScopeIcon } from '@/components/CustomIcons';

export interface OpticProfile {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  type: 'Rifle Scope' | 'Red Dot' | 'Holographic' | 'Prism' | 'LPVO' | 'Iron Sights';
  focalPlane?: 'FFP (First)' | 'SFP (Second)' | 'N/A';
  magnification?: string;
  objectiveLens?: string;
  tubeDiameter?: string;
  reticle: string;
  clickValue: '0.1 MRAD' | '1/4 MOA' | '1/2 MOA' | '1 MOA' | 'Custom';
  zeroDistance: number;
  zeroStop: boolean;
  mountedOnFirearm?: string;
  ringTorque?: string;
  baseTorque?: string;
  batteryType: 'CR2032' | 'CR123A' | 'CR2' | 'AAA' | 'Solar / Integrated' | 'None';
  batteryReplacedDate?: string;
  notes?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'optics_vault_inventory';

export const OpticsVault: React.FC = () => {
  const [optics, setOptics] = useState<OpticProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<OpticProfile>>({
    name: '',
    manufacturer: '',
    model: '',
    type: 'Rifle Scope',
    focalPlane: 'FFP (First)',
    magnification: '3-15x',
    objectiveLens: '50mm',
    reticle: '',
    clickValue: '1/4 MOA',
    zeroDistance: 100,
    zeroStop: true,
    batteryType: 'CR2032',
    notes: '',
  });

  const loadOptics = async () => {
    try {
      if (window.api && window.api.getConfig) {
        const data = await window.api.getConfig(STORAGE_KEY);
        if (Array.isArray(data)) {
          setOptics(data);
          return;
        }
      }
    } catch {}

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setOptics(parsed);
      }
    } catch {}
  };

  const saveOptics = async (newList: OpticProfile[]) => {
    setOptics(newList);
    try {
      if (window.api && window.api.setConfig) {
        await window.api.setConfig(STORAGE_KEY, newList);
      }
    } catch {}
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch {}
  };

  useEffect(() => {
    loadOptics();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      manufacturer: '',
      model: '',
      type: 'Rifle Scope',
      focalPlane: 'FFP (First)',
      magnification: '3-15x',
      objectiveLens: '50mm',
      reticle: '',
      clickValue: '1/4 MOA',
      zeroDistance: 100,
      zeroStop: true,
      batteryType: 'CR2032',
      batteryReplacedDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (optic: OpticProfile) => {
    setEditingId(optic.id);
    setFormData({ ...optic });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this optic profile from the vault?')) {
      const updated = optics.filter((o) => o.id !== id);
      await saveOptics(updated);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const record: OpticProfile = {
      id: editingId || `optic-${Date.now()}`,
      name: formData.name || 'Unnamed Optic',
      manufacturer: formData.manufacturer || '',
      model: formData.model || '',
      serialNumber: formData.serialNumber || '',
      type: (formData.type as any) || 'Rifle Scope',
      focalPlane: formData.focalPlane || 'N/A',
      magnification: formData.magnification || '',
      objectiveLens: formData.objectiveLens || '',
      tubeDiameter: formData.tubeDiameter || '',
      reticle: formData.reticle || 'Standard',
      clickValue: (formData.clickValue as any) || '1/4 MOA',
      zeroDistance: Number(formData.zeroDistance) || 100,
      zeroStop: Boolean(formData.zeroStop),
      mountedOnFirearm: formData.mountedOnFirearm || '',
      ringTorque: formData.ringTorque || '',
      baseTorque: formData.baseTorque || '',
      batteryType: (formData.batteryType as any) || 'None',
      batteryReplacedDate: formData.batteryReplacedDate || '',
      notes: formData.notes || '',
      updatedAt: new Date().toISOString(),
    };

    let updated: OpticProfile[];
    if (editingId) {
      updated = optics.map((o) => (o.id === editingId ? record : o));
    } else {
      updated = [record, ...optics];
    }

    await saveOptics(updated);
    setIsModalOpen(false);
  };

  const filteredOptics = useMemo(() => {
    return optics.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reticle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.mountedOnFirearm && item.mountedOnFirearm.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedType === 'all' || item.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [optics, searchQuery, selectedType]);

  const handlePrintCard = (optic: OpticProfile) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Optic Zero Card — ${optic.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #111; }
          .card { border: 2px solid #000; border-radius: 8px; padding: 20px; max-width: 500px; margin: 0 auto; }
          h1 { font-size: 18px; margin: 0 0 4px 0; }
          .subtitle { font-size: 12px; color: #666; margin-bottom: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
          .item-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
          .item-val { font-weight: bold; }
          .footer { font-size: 10px; color: #888; margin-top: 16px; text-align: center; }
          @media print { body { margin: 0; padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${optic.name}</h1>
          <div class="subtitle">${optic.manufacturer} ${optic.model} • ${optic.type}</div>
          <div class="grid">
            <div><div class="item-label">Zero Distance</div><div class="item-val">${optic.zeroDistance} yards</div></div>
            <div><div class="item-label">Turret Clicks</div><div class="item-val">${optic.clickValue}</div></div>
            <div><div class="item-label">Reticle</div><div class="item-val">${optic.reticle || 'Standard'}</div></div>
            <div><div class="item-label">Focal Plane</div><div class="item-val">${optic.focalPlane || 'N/A'}</div></div>
            <div><div class="item-label">Magnification</div><div class="item-val">${optic.magnification || '1x'}</div></div>
            <div><div class="item-label">Zero Stop</div><div class="item-val">${optic.zeroStop ? 'ENGAGED' : 'None'}</div></div>
            <div><div class="item-label">Mounted Firearm</div><div class="item-val">${optic.mountedOnFirearm || 'Unmounted / Bench'}</div></div>
            <div><div class="item-label">Ring Torque</div><div class="item-val">${optic.ringTorque || 'N/A'} in-lbs</div></div>
            <div><div class="item-label">Base Torque</div><div class="item-val">${optic.baseTorque || 'N/A'} in-lbs</div></div>
            <div><div class="item-label">Battery Cell</div><div class="item-val">${optic.batteryType}</div></div>
          </div>
          <div class="footer">ArmoryVault Optics & Zero Registry • Verified Zero</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ScopeIcon size={26} color="var(--accent)" />
            Optics & Zero Vault
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.85rem' }}>
            Track scope zeros, turret click adjustments, reticles, battery shelf life, and mounting torque specs.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          <span>New Optic</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="glass-input"
            placeholder="Search optics by name, reticle, or firearm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {['all', 'Rifle Scope', 'LPVO', 'Red Dot', 'Holographic', 'Prism'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              style={{
                background: selectedType === t ? 'var(--accent)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedType === t ? '#000' : 'var(--text-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.78rem',
                fontWeight: selectedType === t ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Optics Cards Grid */}
      {filteredOptics.length === 0 ? (
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px dashed var(--border-light)',
            borderRadius: '16px',
            padding: '3rem 2rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <ScopeIcon size={42} color="var(--accent)" style={{ margin: '0 auto 1rem auto', opacity: 0.7 }} />
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No Optics in Vault</h3>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem' }}>
            Log your rifle scopes, red dots, LPVOs, and iron sights with zero distances and click specifications.
          </p>
          <button className="btn-primary" onClick={handleOpenAdd}>
            Add First Optic
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredOptics.map((optic) => (
            <div
              key={optic.id}
              className="tactical-card"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent)', fontWeight: 600 }}>
                      {optic.type}
                    </div>
                    <h3 style={{ color: 'var(--text-primary)', margin: '2px 0 0 0', fontSize: '1.1rem' }}>{optic.name}</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {optic.manufacturer} {optic.model}
                    </div>
                  </div>
                  <span
                    style={{
                      background: 'rgba(52, 211, 153, 0.12)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  >
                    {optic.zeroDistance} YDS
                  </span>
                </div>

                {/* Specs Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.6rem',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '0.85rem',
                    fontSize: '0.78rem',
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Turret Clicks</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{optic.clickValue}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Reticle</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{optic.reticle || 'Standard'}</div>
                  </div>
                  {optic.magnification && (
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Magnification</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{optic.magnification}</div>
                    </div>
                  )}
                  {optic.mountedOnFirearm && (
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Mounted On</div>
                      <div style={{ color: '#60a5fa', fontWeight: 600 }}>{optic.mountedOnFirearm}</div>
                    </div>
                  )}
                </div>

                {/* Battery and Torque Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Battery size={13} color="var(--accent)" />
                    <span>{optic.batteryType}</span>
                    {optic.batteryReplacedDate && <span style={{ opacity: 0.7 }}>({optic.batteryReplacedDate})</span>}
                  </div>
                  {(optic.ringTorque || optic.baseTorque) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Wrench size={12} color="#f59e0b" />
                      <span>{optic.ringTorque ? `${optic.ringTorque} in-lb ring` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                <button
                  className="btn-secondary"
                  onClick={() => handlePrintCard(optic)}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Printer size={13} />
                  <span>Print Card</span>
                </button>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => handleOpenEdit(optic)}
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleDelete(optic.id)}
                    style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit */}
      {isModalOpen &&
        createPortal(
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
                borderRadius: '16px',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '640px',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ScopeIcon size={20} color="var(--accent)" />
                  {editingId ? 'Edit Optic Profile' : 'Add Optic to Vault'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveForm}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Optic Nickname / Profile Title *</label>
                    <input
                      className="glass-input"
                      required
                      placeholder="e.g. Nightforce ATACR 7-35x56 or Holosun 507C"
                      value={formData.name || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Manufacturer</label>
                    <input
                      className="glass-input"
                      placeholder="e.g. Vortex, Leupold, Trijicon"
                      value={formData.manufacturer || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, manufacturer: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Model</label>
                    <input
                      className="glass-input"
                      placeholder="e.g. Razor HD Gen III"
                      value={formData.model || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, model: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Optic Type</label>
                    <select
                      className="glass-input"
                      value={formData.type || 'Rifle Scope'}
                      onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as any }))}
                    >
                      <option value="Rifle Scope">Rifle Scope</option>
                      <option value="LPVO">LPVO (1-6x / 1-8x / 1-10x)</option>
                      <option value="Red Dot">Red Dot</option>
                      <option value="Holographic">Holographic</option>
                      <option value="Prism">Prism Sight</option>
                      <option value="Iron Sights">Iron Sights</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Focal Plane</label>
                    <select
                      className="glass-input"
                      value={formData.focalPlane || 'FFP (First)'}
                      onChange={(e) => setFormData((p) => ({ ...p, focalPlane: e.target.value as any }))}
                    >
                      <option value="FFP (First)">FFP (First Focal Plane)</option>
                      <option value="SFP (Second)">SFP (Second Focal Plane)</option>
                      <option value="N/A">N/A (Red Dot / Prism)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Turret Click Value</label>
                    <select
                      className="glass-input"
                      value={formData.clickValue || '1/4 MOA'}
                      onChange={(e) => setFormData((p) => ({ ...p, clickValue: e.target.value as any }))}
                    >
                      <option value="0.1 MRAD">0.1 MRAD (1cm @ 100m)</option>
                      <option value="1/4 MOA">1/4 MOA (0.26" @ 100 yds)</option>
                      <option value="1/2 MOA">1/2 MOA (0.52" @ 100 yds)</option>
                      <option value="1 MOA">1 MOA</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Zero Distance (Yards)</label>
                    <input
                      type="number"
                      className="glass-input"
                      value={formData.zeroDistance ?? 100}
                      onChange={(e) => setFormData((p) => ({ ...p, zeroDistance: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Reticle Pattern</label>
                    <input
                      className="glass-input"
                      placeholder="e.g. EBR-7C, Mil-XT, ACSS Raptor"
                      value={formData.reticle || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, reticle: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Mounted Firearm</label>
                    <input
                      className="glass-input"
                      placeholder="e.g. Bergara B-14 HMR 6.5 CM"
                      value={formData.mountedOnFirearm || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, mountedOnFirearm: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Battery Cell Type</label>
                    <select
                      className="glass-input"
                      value={formData.batteryType || 'CR2032'}
                      onChange={(e) => setFormData((p) => ({ ...p, batteryType: e.target.value as any }))}
                    >
                      <option value="CR2032">CR2032</option>
                      <option value="CR123A">CR123A</option>
                      <option value="CR2">CR2</option>
                      <option value="AAA">AAA</option>
                      <option value="Solar / Integrated">Solar / Integrated</option>
                      <option value="None">None (Etched / Passive)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Battery Installed Date</label>
                    <input
                      type="date"
                      className="glass-input"
                      value={formData.batteryReplacedDate || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, batteryReplacedDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Ring Torque (in-lbs)</label>
                    <input
                      className="glass-input"
                      placeholder="e.g. 15-18 in-lbs"
                      value={formData.ringTorque || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, ringTorque: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Base Cross-Bolt Torque (in-lbs)</label>
                    <input
                      className="glass-input"
                      placeholder="e.g. 45-50 in-lbs"
                      value={formData.baseTorque || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, baseTorque: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Optic
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default OpticsVault;
