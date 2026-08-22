import { Edit, Sliders, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CustomSkuDatabase, CustomSkuItem } from '../types';
import { AutocompleteInput } from './AutocompleteInput';
import { AccessoriesNavIcon, CartridgesIcon, GunpowderIcon } from './CustomIcons';

interface SkuManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SkuManagerModal: React.FC<SkuManagerModalProps> = React.memo(({ isOpen, onClose }) => {
  const [skuDatabase, setSkuDatabase] = useState<CustomSkuDatabase>({});
  const [skuCategory, setSkuCategory] = useState<'ammo' | 'accessory' | 'component'>('ammo');
  const [skuFilter, setSkuFilter] = useState<'all' | 'ammo' | 'accessory' | 'component'>('all');
  const [newSku, setNewSku] = useState('');
  const [newSkuData, setNewSkuData] = useState<CustomSkuItem>({ category: 'ammo' });
  const [newSkuBoxPrice, setNewSkuBoxPrice] = useState('');

  useEffect(() => {
    if (isOpen && window.api && window.api.getSkus) {
      window.api.getSkus().then((skus) => setSkuDatabase(skus || {}));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSku = async () => {
    if (!newSku.trim()) return;
    const key = newSku.trim().toUpperCase();

    const finalData: CustomSkuItem = { ...newSkuData, category: skuCategory };
    if (skuCategory === 'ammo') {
      if (newSkuBoxPrice && finalData.count) {
        const price = parseFloat(newSkuBoxPrice);
        if (!isNaN(price) && price > 0) {
          finalData.costPerRound = Number((price / finalData.count).toFixed(3));
          finalData.boxPrice = price;
        }
      }
    } else if (skuCategory === 'accessory') {
      if (newSkuBoxPrice) {
        const val = parseFloat(newSkuBoxPrice);
        if (!isNaN(val)) finalData.value = val;
      }
    } else if (skuCategory === 'component') {
      if (newSkuBoxPrice) {
        const cost = parseFloat(newSkuBoxPrice);
        if (!isNaN(cost)) finalData.cost = cost;
      }
    }

    const currentSkus = window.api && window.api.getSkus ? await window.api.getSkus() : skuDatabase;
    const updated = { ...currentSkus, [key]: finalData };
    setSkuDatabase(updated);
    if (window.api && window.api.saveSkus) {
      await window.api.saveSkus(updated);
    }
    setNewSku('');
    setNewSkuData({ category: skuCategory });
    setNewSkuBoxPrice('');
  };

  const handleDeleteSku = async (sku: string) => {
    if (window.api && window.api.deleteSku) {
      await window.api.deleteSku(sku);
    }
    const currentSkus = window.api && window.api.getSkus ? await window.api.getSkus() : skuDatabase;
    const updated = { ...currentSkus };
    delete updated[sku];
    setSkuDatabase(updated);
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          width: '90%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={22} style={{ color: 'var(--accent)' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Custom SKU & Barcode Dictionary</h2>
              <p
                style={{
                  margin: '0.15rem 0 0',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                }}
              >
                Map manufacturer part numbers & custom SKUs for Ammunition, Parts/Accessories, and
                Reloading Supplies for instant scanning.
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', paddingRight: '0.5rem', flex: 1 }}>
          {/* Category Selector for New SKU */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '1.25rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              border: '1px solid var(--border-light)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>
                Add or Edit Custom SKU
              </h3>
              <div
                style={{
                  display: 'flex',
                  gap: '0.4rem',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '0.25rem',
                  borderRadius: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSkuCategory('ammo');
                    setNewSkuData({ category: 'ammo' });
                  }}
                  style={{
                    padding: '0.35rem 0.8rem',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: skuCategory === 'ammo' ? 'var(--accent)' : 'transparent',
                    color: skuCategory === 'ammo' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <CartridgesIcon
                    size={14}
                    color={skuCategory === 'ammo' ? '#fff' : 'currentColor'}
                  />
                  <span>Ammunition</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSkuCategory('accessory');
                    setNewSkuData({ category: 'accessory', accessoryType: 'Optic' });
                  }}
                  style={{
                    padding: '0.35rem 0.8rem',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: skuCategory === 'accessory' ? '#8b5cf6' : 'transparent',
                    color: skuCategory === 'accessory' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <AccessoriesNavIcon
                    size={14}
                    color={skuCategory === 'accessory' ? '#fff' : 'currentColor'}
                  />
                  <span>Parts &amp; Accessories</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSkuCategory('component');
                    setNewSkuData({ category: 'component', componentType: 'Powder' });
                  }}
                  style={{
                    padding: '0.35rem 0.8rem',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: skuCategory === 'component' ? '#f59e0b' : 'transparent',
                    color: skuCategory === 'component' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <GunpowderIcon
                    size={14}
                    color={skuCategory === 'component' ? '#fff' : 'currentColor'}
                  />
                  <span>Reloading Supplies</span>
                </button>
              </div>
            </div>

            {/* Form for Ammo */}
            {skuCategory === 'ammo' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>SKU / Barcode ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 44MG240HRN20"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Manufacturer</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hornady, Steinel"
                    value={newSkuData.manufacturer || ''}
                    onChange={(e) => setNewSkuData({ ...newSkuData, manufacturer: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Caliber</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. .44 Mag, 9mm"
                    value={newSkuData.caliber || ''}
                    onChange={(e) => setNewSkuData({ ...newSkuData, caliber: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Bullet Weight (gr)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 240"
                    value={newSkuData.grain ?? ''}
                    onChange={(e) =>
                      setNewSkuData({
                        ...newSkuData,
                        grain: e.target.value === '' ? undefined : parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Bullet Type</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1, minWidth: 0 }}
                      placeholder="e.g. XTP, FMJ"
                      value={newSkuData.projectile || ''}
                      onChange={(e) => setNewSkuData({ ...newSkuData, projectile: e.target.value })}
                    />
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newSkuData.isPlusP || false}
                        onChange={(e) =>
                          setNewSkuData({ ...newSkuData, isPlusP: e.target.checked })
                        }
                        style={{ accentColor: 'var(--danger)' }}
                      />
                      <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>+P</span>
                    </label>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Rounds / Box</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 20, 50"
                    value={newSkuData.count ?? ''}
                    onChange={(e) =>
                      setNewSkuData({
                        ...newSkuData,
                        count: e.target.value === '' ? undefined : parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Box Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 28.50"
                    value={newSkuBoxPrice}
                    onChange={(e) => setNewSkuBoxPrice(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Form for Parts & Accessories */}
            {skuCategory === 'accessory' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Part # / SKU ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. APX-EXT-100, HS507C-X2"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Accessory Type</label>
                  <AutocompleteInput
                    mode="select"
                    name="accessoryType"
                    value={newSkuData.accessoryType || 'Optic'}
                    onChange={(e) =>
                      setNewSkuData({ ...newSkuData, accessoryType: e.target.value as any })
                    }
                    options={[
                      { value: 'Optic', label: 'Optic / Sight' },
                      { value: 'Light', label: 'Light / Laser' },
                      { value: 'Suppressor', label: 'Suppressor / Silencer' },
                      { value: 'Holster', label: 'Holster' },
                      { value: 'Magazine', label: 'Magazine' },
                      { value: 'Mount', label: 'Mount / Adapter' },
                      { value: 'Sling', label: 'Sling' },
                      { value: 'Other', label: 'Other Part' },
                    ]}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Manufacturer</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Apex Tactical, Holosun"
                    value={newSkuData.manufacturer || ''}
                    onChange={(e) => setNewSkuData({ ...newSkuData, manufacturer: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Model / Part Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Heavy Duty Extractor"
                    value={newSkuData.model || ''}
                    onChange={(e) => setNewSkuData({ ...newSkuData, model: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Caliber / Supported Models</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 9mm / Glock Gen 5"
                    value={newSkuData.caliber || newSkuData.supportedModels || ''}
                    onChange={(e) =>
                      setNewSkuData({
                        ...newSkuData,
                        caliber: e.target.value,
                        supportedModels: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Part Price / Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 59.95"
                    value={newSkuBoxPrice || (newSkuData.value ? String(newSkuData.value) : '')}
                    onChange={(e) => setNewSkuBoxPrice(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Notes / Features</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Melonite finish"
                    value={newSkuData.notes || ''}
                    onChange={(e) => setNewSkuData({ ...newSkuData, notes: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Form for Reloading Supplies */}
            {skuCategory === 'component' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>SKU / Barcode ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. HODG-VARGET-1LB"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Component Type</label>
                  <AutocompleteInput
                    mode="select"
                    name="componentType"
                    value={newSkuData.componentType || 'Powder'}
                    onChange={(e) =>
                      setNewSkuData({ ...newSkuData, componentType: e.target.value as any })
                    }
                    options={[
                      { value: 'Powder', label: 'Powder' },
                      { value: 'Brass', label: 'Brass / Hulls' },
                      { value: 'Primer', label: 'Primers' },
                      { value: 'Bullet', label: 'Bullets / Projectiles' },
                    ]}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Manufacturer</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hodgdon, CCI, Starline"
                    value={newSkuData.manufacturer || ''}
                    onChange={(e) => setNewSkuData({ ...newSkuData, manufacturer: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Name / Powder / Primer Type</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Varget, #400 Small Rifle"
                    value={newSkuData.name || ''}
                    onChange={(e) => setNewSkuData({ ...newSkuData, name: e.target.value })}
                  />
                </div>
                {(newSkuData.componentType === 'Brass' ||
                  newSkuData.componentType === 'Bullet') && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Caliber</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. .308 Win, 6.5 CM"
                      value={newSkuData.caliber || ''}
                      onChange={(e) => setNewSkuData({ ...newSkuData, caliber: e.target.value })}
                    />
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Quantity / Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 1 (lb) or 1000"
                    value={newSkuData.quantity ?? ''}
                    onChange={(e) =>
                      setNewSkuData({
                        ...newSkuData,
                        quantity: e.target.value === '' ? undefined : parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                {newSkuData.componentType === 'Powder' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Weight Unit</label>
                    <AutocompleteInput
                      mode="select"
                      name="weightUnit"
                      value={newSkuData.weightUnit || 'lbs'}
                      onChange={(e) =>
                        setNewSkuData({ ...newSkuData, weightUnit: e.target.value as any })
                      }
                      options={[
                        { value: 'lbs', label: 'lbs (Pounds)' },
                        { value: 'oz', label: 'oz (Ounces)' },
                        { value: 'grains', label: 'gr (Grains)' },
                      ]}
                    />
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Cost / Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 45.00"
                    value={newSkuBoxPrice || (newSkuData.cost ? String(newSkuData.cost) : '')}
                    onChange={(e) => setNewSkuBoxPrice(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                marginTop: '0.5rem',
              }}
            >
              {(newSku || newSkuData.manufacturer) && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setNewSku('');
                    setNewSkuData({ category: skuCategory });
                    setNewSkuBoxPrice('');
                  }}
                >
                  Clear
                </button>
              )}
              <button className="btn-primary" onClick={handleSaveSku} disabled={!newSku.trim()}>
                Save SKU Mapping
              </button>
            </div>
          </div>

          {/* Filter Tabs for Existing SKUs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '0.5rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
              Mapped Dictionary ({Object.keys(skuDatabase).length})
            </h3>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {(['all', 'ammo', 'accessory', 'component'] as const).map((tab) => {
                const count = Object.values(skuDatabase).filter((item) => {
                  if (tab === 'all') return true;
                  const cat =
                    item.category ||
                    (item.accessoryType ? 'accessory' : item.componentType ? 'component' : 'ammo');
                  return cat === tab;
                }).length;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSkuFilter(tab)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: skuFilter === tab ? 'rgba(255,255,255,0.15)' : 'transparent',
                      color: skuFilter === tab ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {tab === 'accessory'
                      ? 'Accessories/Parts'
                      : tab === 'component'
                        ? 'Reloading'
                        : tab}{' '}
                    ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Existing SKUs List */}
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {Object.keys(skuDatabase).length === 0 && (
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                  padding: '1rem 0',
                }}
              >
                No custom SKUs mapped yet.
              </p>
            )}
            {Object.entries(skuDatabase)
              .filter(([_, data]) => {
                if (skuFilter === 'all') return true;
                const cat =
                  data.category ||
                  (data.accessoryType ? 'accessory' : data.componentType ? 'component' : 'ammo');
                return cat === skuFilter;
              })
              .map(([sku, data]) => {
                const cat =
                  data.category ||
                  (data.accessoryType ? 'accessory' : data.componentType ? 'component' : 'ammo');
                const badgeColor =
                  cat === 'accessory' ? '#8b5cf6' : cat === 'component' ? '#f59e0b' : '#38bdf8';
                const badgeBg =
                  cat === 'accessory'
                    ? 'rgba(139, 92, 246, 0.15)'
                    : cat === 'component'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(56, 189, 248, 0.15)';
                const badgeLabel =
                  cat === 'accessory'
                    ? data.accessoryType || 'PART / ACC'
                    : cat === 'component'
                      ? data.componentType || 'RELOADING'
                      : 'AMMO';

                return (
                  <div
                    key={sku}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.2rem',
                        }}
                      >
                        <strong
                          style={{
                            fontSize: '1.05rem',
                            color: 'var(--text-primary)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {sku}
                        </strong>
                        <span
                          style={{
                            background: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeColor}40`,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                          }}
                        >
                          {badgeLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {cat === 'accessory' ? (
                          <>
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {data.manufacturer || ''} {data.model || 'Accessory'}
                            </strong>
                            {(data.caliber || data.supportedModels) &&
                              ` • Fits: ${data.caliber || data.supportedModels}`}
                            {data.value !== undefined &&
                              data.value !== null &&
                              ` • $${Number(data.value).toFixed(2)}`}
                            {data.notes && ` (${data.notes})`}
                          </>
                        ) : cat === 'component' ? (
                          <>
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {data.manufacturer || ''}{' '}
                              {data.name || data.componentType || 'Component'}
                            </strong>
                            {data.caliber && ` • ${data.caliber}`}
                            {data.quantity !== undefined &&
                              ` • ${data.quantity} ${data.weightUnit || 'units'}`}
                            {data.cost !== undefined &&
                              data.cost !== null &&
                              ` • $${Number(data.cost).toFixed(2)}`}
                          </>
                        ) : (
                          <>
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {data.manufacturer || 'Unknown Make'} {data.caliber || ''}
                            </strong>
                            {data.isPlusP && (
                              <span
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#f87171',
                                  padding: '0.05rem 0.3rem',
                                  borderRadius: '3px',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  marginLeft: '0.3rem',
                                  marginRight: '0.3rem',
                                }}
                              >
                                +P
                              </span>
                            )}
                            {data.grain ? ` • ${data.grain}gr ` : ''}
                            {data.projectile || ''}
                            {data.count ? ` • ${data.count} rds/box` : ''}
                            {data.boxPrice
                              ? ` • $${Number(data.boxPrice).toFixed(2)}/box`
                              : data.costPerRound
                                ? ` • $${data.costPerRound}/rd`
                                : ''}
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => {
                          setNewSku(sku);
                          setSkuCategory(cat);
                          setNewSkuData(data);
                          if (cat === 'ammo') {
                            if (data.boxPrice) setNewSkuBoxPrice(String(data.boxPrice));
                            else if (data.costPerRound && data.count)
                              setNewSkuBoxPrice((data.costPerRound * data.count).toFixed(2));
                            else setNewSkuBoxPrice('');
                          } else if (cat === 'accessory') {
                            setNewSkuBoxPrice(data.value !== undefined ? String(data.value) : '');
                          } else if (cat === 'component') {
                            setNewSkuBoxPrice(data.cost !== undefined ? String(data.cost) : '');
                          }
                        }}
                        className="btn-icon"
                        style={{
                          color: 'var(--accent)',
                          background: 'rgba(56,189,248,0.1)',
                          padding: '0.4rem',
                          borderRadius: '4px',
                        }}
                        title="Edit SKU"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteSku(sku)}
                        className="btn-icon"
                        style={{
                          color: 'var(--danger)',
                          background: 'rgba(239,68,68,0.1)',
                          padding: '0.4rem',
                          borderRadius: '4px',
                        }}
                        title="Delete SKU"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});
