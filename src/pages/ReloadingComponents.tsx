import {
  AlertCircle,
  AlertTriangle,
  Edit,
  Package,
  PlusCircle,
  Scale,
  Search,
  Trash2,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BrassCaseIcon,
  BulletProjectileIcon,
  GunpowderIcon,
  PrimerIcon,
} from '../components/CustomIcons';
import { ReloadingComponentModal } from '../components/ReloadingComponentModal';
import { StorageBadge } from '../components/StorageBadge';
import { useUndoToast } from '../components/UndoToast';
import { ReloadingComponent, StorageLocation } from '../types';
import { calcCostPerGrain, formatPowderMultiUnit, toGrains } from '../utils/powderUnits';
import {
  getItemStorageLocation,
  removeItemFromAllStorage,
  saveStorageLocations,
} from '../utils/StorageSync';

export const ReloadingComponents = () => {
  const { showUndo } = useUndoToast();
  const [components, setComponents] = useState<ReloadingComponent[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [selectedStorageLocationId, setSelectedStorageLocationId] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<ReloadingComponent>>({});
  const [pendingSyncId, setPendingSyncId] = useState<number | null>(null);
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).openAddModal) {
      const state = location.state as any;
      setFormData({
        upc_code: state.upc || '',
        quantity: state.count || 0,
        type: state.parsedData?.type || 'Powder',
        ...(state.parsedData || {}),
      });
      if (state.syncItemId) {
        setPendingSyncId(state.syncItemId);
      }
      setEditingId(null);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSave = async () => {
    await loadData();
    if (pendingSyncId) {
      if (window.api && window.api.removeSyncItem) {
        await window.api.removeSyncItem(pendingSyncId);
      }
      setPendingSyncId(null);
    }
  };

  const loadData = async () => {
    if (window.api && window.api.getComponents) {
      const fetched = await window.api.getComponents();
      setComponents(fetched);

      if (window.api.getStorageLocations) {
        const locs = await window.api.getStorageLocations();
        setStorageLocations(locs || []);
      }
    }
  };

  const lowStockCount = components.filter(
    (c) => c.min_threshold !== undefined && c.min_threshold > 0 && c.quantity <= c.min_threshold
  ).length;

  const filteredComponents = components.filter((c) => {
    if (selectedStorageLocationId !== 'ALL') {
      const loc = getItemStorageLocation('component', c.id, storageLocations);
      if (selectedStorageLocationId === 'UNASSIGNED') {
        if (loc) return false;
      } else if (loc?.id !== Number(selectedStorageLocationId)) {
        return false;
      }
    }

    const term = search.toLowerCase();
    const matchesSearch =
      c.manufacturer.toLowerCase().includes(term) ||
      (c.name && c.name.toLowerCase().includes(term)) ||
      c.type.toLowerCase().includes(term) ||
      (c.caliber && c.caliber.toLowerCase().includes(term));
    const matchesLowStock =
      !onlyLowStock ||
      (c.min_threshold !== undefined && c.min_threshold > 0 && c.quantity <= c.min_threshold);
    return matchesSearch && matchesLowStock;
  });

  const handleEdit = (comp: ReloadingComponent) => {
    setFormData(comp);
    setEditingId(comp.id || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const targetComp = components.find((c) => c.id === id);
    if (!targetComp) return;
    if (storageLocations.length > 0) {
      const updatedLocs = removeItemFromAllStorage('component', id, storageLocations);
      await saveStorageLocations(updatedLocs);
    }
    if (window.api && window.api.deleteComponent) {
      await window.api.deleteComponent(id);
      loadData();
      showUndo(
        `Deleted ${targetComp.type}: ${targetComp.manufacturer} ${targetComp.name || ''}`,
        async () => {
          if (window.api?.addComponent) {
            const { id: _oldId, ...rest } = targetComp;
            await window.api.addComponent(rest as ReloadingComponent);
            loadData();
          }
        }
      );
    }
  };

  const openNewModal = () => {
    setFormData({ type: 'Powder' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const totalValue = components.reduce((sum, c) => sum + (c.cost || 0), 0);

  // Group components by type
  const grouped = filteredComponents.reduce(
    (acc, comp) => {
      if (!acc[comp.type]) acc[comp.type] = [];
      acc[comp.type].push(comp);
      return acc;
    },
    {} as Record<string, ReloadingComponent[]>
  );

  const renderComponentDetails = (c: ReloadingComponent) => {
    if (c.type === 'Powder') {
      const breakdown = formatPowderMultiUnit(c.quantity || 0, c.weightUnit);
      return (
        <>
          <div
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              marginBottom: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Scale size={14} style={{ color: 'var(--accent)' }} />
            <strong style={{ color: 'var(--text-primary)' }}>{breakdown.summary}</strong>
          </div>
          {c.usageTags && c.usageTags.length > 0 && (
            <div
              style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}
            >
              {c.usageTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: 'var(--accent)',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {c.quantity !== undefined && c.quantity > 0 && (
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.03)',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Zap size={11} color="#f59e0b" />
              <span>
                Yield: ~{Math.floor(breakdown.grains / 41.5).toLocaleString()} rds (.308 @ 41.5gr) •
                ~{Math.floor(breakdown.grains / 24.5).toLocaleString()} rds (5.56 @ 24.5gr) • ~
                {Math.floor(breakdown.grains / 4.5).toLocaleString()} rds (9mm @ 4.5gr)
              </span>
            </div>
          )}
        </>
      );
    }
    if (c.type === 'Brass') {
      return (
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {c.caliber} • {c.primerType} {c.isMagnumPrimer ? '(Magnum)' : ''}
          {c.prepStage && (
            <div style={{ marginTop: '0.3rem' }}>
              <span className="badge">{c.prepStage}</span>
            </div>
          )}
        </div>
      );
    }
    if (c.type === 'Bullet') {
      return (
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {c.caliber} • {c.grain ? `${c.grain}gr ` : ''}
          {c.bulletType}
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
          <p style={{ color: 'var(--text-secondary)' }}>
            Track powder, brass, primers, and projectiles.
          </p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          <PlusCircle size={20} /> Add Component
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flex: 1,
            flexWrap: 'wrap',
            maxWidth: '650px',
            alignItems: 'center',
          }}
        >
          <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={20} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search components by make, name, type, caliber..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '180px' }}
            value={selectedStorageLocationId}
            onChange={(e) => setSelectedStorageLocationId(e.target.value)}
            title="Filter by storage location / locker"
          >
            <option value="ALL">All Storage Locations</option>
            <option value="UNASSIGNED">Unassigned Containers</option>
            {storageLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                [{loc.type}] {loc.name}
              </option>
            ))}
          </select>
          {lowStockCount > 0 && (
            <button
              className={onlyLowStock ? 'btn-danger' : 'btn-secondary'}
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              style={{
                padding: '0.6rem 1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
              }}
            >
              <AlertTriangle size={14} /> Low Stock ({lowStockCount})
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {(() => {
            const totalPowderGrains = components
              .filter((c) => c.type === 'Powder')
              .reduce((sum, c) => sum + toGrains(c.quantity || 0, c.weightUnit), 0);
            if (totalPowderGrains <= 0) return null;
            const totalPowderLbs = Number((totalPowderGrains / 7000).toFixed(2));
            const totalPowderOz = Number((totalPowderGrains / 437.5).toFixed(1));

            return (
              <div
                style={{
                  background: 'var(--bg-card)',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Total Powder in Stock
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent)' }}>
                    {totalPowderLbs} lbs{' '}
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 400,
                      }}
                    >
                      ({totalPowderOz} oz / {totalPowderGrains.toLocaleString()} gr)
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Value</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent)' }}>
                $
                {totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredComponents.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
          }}
        >
          <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            <AlertCircle size={48} style={{ margin: '0 auto', opacity: 0.5 }} />
          </div>
          <h3>No reloading components found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Add your first powder, brass, primer, or bullet to start tracking.
          </p>
          <button className="btn-primary" onClick={openNewModal}>
            Add Component
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {['Powder', 'Brass', 'Bullet', 'Primer'].map((typeGroup) => {
            const groupItems = grouped[typeGroup];
            if (!groupItems || groupItems.length === 0) return null;

            return (
              <div key={typeGroup}>
                <h2
                  style={{
                    fontSize: '1.2rem',
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--border-light)',
                    paddingBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {typeGroup === 'Powder' ? (
                    <GunpowderIcon size={20} color="#f59e0b" />
                  ) : typeGroup === 'Brass' ? (
                    <BrassCaseIcon size={20} color="#eab308" />
                  ) : typeGroup === 'Bullet' ? (
                    <BulletProjectileIcon size={20} color="#f97316" />
                  ) : (
                    <PrimerIcon size={20} color="#fbbf24" />
                  )}
                  {typeGroup === 'Brass'
                    ? 'Brass & Hulls'
                    : typeGroup === 'Bullet'
                      ? 'Bullets & Projectiles'
                      : typeGroup + 's'}
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {groupItems.map((c) => {
                    const isLow =
                      c.min_threshold !== undefined &&
                      c.min_threshold > 0 &&
                      c.quantity <= c.min_threshold;
                    return (
                      <div
                        key={c.id}
                        className="card"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '1rem',
                          border: isLow ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
                          background: isLow ? 'rgba(239, 68, 68, 0.04)' : undefined,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <div style={{ flex: 1, paddingRight: '1rem' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                                marginBottom: '0.2rem',
                              }}
                            >
                              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                                {c.manufacturer} {c.name}
                              </h3>
                              {isLow && (
                                <span
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  Low Stock (≤{c.min_threshold})
                                </span>
                              )}
                              <StorageBadge
                                location={getItemStorageLocation(
                                  'component',
                                  c.id,
                                  storageLocations
                                )}
                                size="sm"
                              />
                            </div>
                            {renderComponentDetails(c)}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                color: isLow ? '#f87171' : 'var(--text-primary)',
                              }}
                            >
                              {c.type === 'Powder'
                                ? `${c.quantity} ${c.weightUnit || 'lbs'}`
                                : c.quantity}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {c.type === 'Powder'
                                ? `${toGrains(c.quantity || 0, c.weightUnit).toLocaleString()} gr`
                                : 'Qty'}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: 'auto',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '1rem',
                            borderTop: '1px solid var(--border-light)',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div
                              style={{
                                fontSize: '0.95rem',
                                color: 'var(--success)',
                                fontWeight: 600,
                              }}
                            >
                              {c.cost ? `$${c.cost.toFixed(2)}` : ''}
                            </div>
                            {c.cost !== undefined &&
                              c.cost !== null &&
                              c.quantity !== undefined &&
                              c.quantity > 0 && (
                                <div
                                  style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                                >
                                  {c.type === 'Powder'
                                    ? `≈ $${calcCostPerGrain(c.cost, c.quantity, c.weightUnit).toFixed(4)} / grain`
                                    : `≈ $${(c.cost / c.quantity).toFixed(3)} / ea`}
                                </div>
                              )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleEdit(c)}
                              className="btn-icon"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-primary)',
                                padding: '0.4rem',
                                borderRadius: '6px',
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id!)}
                              className="btn-icon"
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--danger)',
                                padding: '0.4rem',
                                borderRadius: '6px',
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ReloadingComponentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingId={editingId}
        initialData={formData}
      />
    </div>
  );
};
