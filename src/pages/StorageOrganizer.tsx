import {
  Archive,
  Box,
  Car,
  ChevronRight,
  Crosshair,
  Edit,
  Eye,
  FileText,
  Flashlight,
  Layers,
  Lock,
  MapPin,
  Package,
  Plus,
  PlusCircle,
  Shield,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAccessoryTypeColor } from '../components/AccessoryDetailModal';
import {
  AccessoriesNavIcon,
  AmmoCanIcon,
  CabinetIcon,
  CartridgesIcon,
  GunCaseIcon,
  HolsterIcon,
  MagazineIcon,
  PicatinnyMountIcon,
  SafeIcon,
  ScopeIcon,
  SuppressorIcon,
  TacticalSlingIcon,
  VehicleVaultIcon,
} from '../components/CustomIcons';
import type { Accessory, Ammo, Firearm, StorageLocation } from '../types';

export const renderAccessoryIcon = (type: string, size = 14, color?: string) => {
  switch (type) {
    case 'Optic':
      return <ScopeIcon size={size} color={color || '#38bdf8'} />;
    case 'Suppressor':
      return <SuppressorIcon size={size} color={color || '#f59e0b'} />;
    case 'Light':
      return <Flashlight size={size} style={{ color: color || '#fbbf24' }} />;
    case 'Holster':
      return <HolsterIcon size={size} color={color || '#34d399'} />;
    case 'Mount':
      return <PicatinnyMountIcon size={size} color={color || '#60a5fa'} />;
    case 'Sling':
      return <TacticalSlingIcon size={size} color={color || '#fb923c'} />;
    case 'Magazine':
      return <MagazineIcon size={size} color={color || '#c084fc'} />;
    default:
      return <Package size={size} style={{ color: color || '#94a3b8' }} />;
  }
};

const STORAGE_ICONS: Record<string, React.ReactNode> = {
  Safe: <SafeIcon size={18} color="#34d399" />,
  Cabinet: <CabinetIcon size={18} color="#60a5fa" />,
  AmmoCan: <AmmoCanIcon size={18} color="#f59e0b" />,
  Case: <GunCaseIcon size={18} color="#a78bfa" />,
  Vehicle: <VehicleVaultIcon size={18} color="#f87171" />,
  Other: <MapPin size={18} style={{ color: '#94a3b8' }} />,
};

const TYPE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Safe: { text: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.35)' },
  Cabinet: { text: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.35)' },
  AmmoCan: { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)' },
  Case: { text: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.35)' },
  Vehicle: {
    text: '#f87171',
    bg: 'rgba(248, 113, 113, 0.15)',
    border: 'rgba(248, 113, 113, 0.35)',
  },
  Other: { text: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.35)' },
};

export const StorageOrganizer = () => {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [ammoList, setAmmoList] = useState<Ammo[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [inspectingLocationId, setInspectingLocationId] = useState<number | null>(null);
  const [assignModal, setAssignModal] = useState<{
    locationId: number;
    type: 'firearm' | 'accessory' | 'ammo';
  } | null>(null);

  const [form, setForm] = useState<Partial<StorageLocation>>({
    name: '',
    type: 'Safe',
    capacity: undefined,
    notes: '',
    firearmIds: [],
    accessoryIds: [],
    ammoIds: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (window.api) {
      if (window.api.getStorageLocations) {
        const locs = await window.api.getStorageLocations();
        setLocations(locs);
      }
      if (window.api.getFirearms) {
        const f = await window.api.getFirearms();
        setFirearms(f);
      }
      if (window.api.getAccessories) {
        const a = await window.api.getAccessories();
        setAccessories(a);
      }
      if (window.api.getAmmo) {
        const am = await window.api.getAmmo();
        setAmmoList(am);
      }
    }
  };

  const handleSave = async () => {
    if (!form.name) return;
    const loc = form as StorageLocation;
    if (window.api) {
      if (editingLocation?.id) {
        await window.api.updateStorageLocation(editingLocation.id, loc);
      } else {
        await window.api.addStorageLocation(loc);
      }
      await loadData();
      setIsAddModalOpen(false);
      setEditingLocation(null);
      setForm({
        name: '',
        type: 'Safe',
        capacity: undefined,
        notes: '',
        firearmIds: [],
        accessoryIds: [],
        ammoIds: [],
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this storage location?')) return;
    if (window.api?.deleteStorageLocation) {
      await window.api.deleteStorageLocation(id);
      if (inspectingLocationId === id) setInspectingLocationId(null);
      await loadData();
    }
  };

  const handleEdit = (loc: StorageLocation) => {
    setForm({ ...loc });
    setEditingLocation(loc);
    setIsAddModalOpen(true);
  };

  const handleAssignItem = async (
    locationId: number,
    type: 'firearm' | 'accessory' | 'ammo',
    itemId: number
  ) => {
    const loc = locations.find((l) => l.id === locationId);
    if (!loc) return;
    const updated = { ...loc };
    if (type === 'firearm') {
      updated.firearmIds = [...(updated.firearmIds || []), itemId];
    } else if (type === 'accessory') {
      updated.accessoryIds = [...(updated.accessoryIds || []), itemId];
    } else {
      updated.ammoIds = [...(updated.ammoIds || []), itemId];
    }
    if (window.api?.updateStorageLocation) {
      await window.api.updateStorageLocation(locationId, updated);
      await loadData();
    }
    setAssignModal(null);
  };

  const handleUnassignItem = async (
    locationId: number,
    type: 'firearm' | 'accessory' | 'ammo',
    itemId: number
  ) => {
    const loc = locations.find((l) => l.id === locationId);
    if (!loc) return;
    const updated = { ...loc };
    if (type === 'firearm') {
      updated.firearmIds = (updated.firearmIds || []).filter((id) => id !== itemId);
    } else if (type === 'accessory') {
      updated.accessoryIds = (updated.accessoryIds || []).filter((id) => id !== itemId);
    } else {
      updated.ammoIds = (updated.ammoIds || []).filter((id) => id !== itemId);
    }
    if (window.api?.updateStorageLocation) {
      await window.api.updateStorageLocation(locationId, updated);
      await loadData();
    }
  };

  // Items already assigned anywhere
  const assignedFirearmIds = new Set(locations.flatMap((l) => l.firearmIds || []));
  const assignedAccessoryIds = new Set(locations.flatMap((l) => l.accessoryIds || []));
  const assignedAmmoIds = new Set(locations.flatMap((l) => l.ammoIds || []));

  const totalItems = locations.reduce(
    (sum, l) =>
      sum + (l.firearmIds?.length || 0) + (l.accessoryIds?.length || 0) + (l.ammoIds?.length || 0),
    0
  );

  const activeLocation = locations.find((l) => l.id === inspectingLocationId) || null;
  const activeFirearms = activeLocation
    ? firearms.filter((f) => (activeLocation.firearmIds || []).includes(f.id!))
    : [];
  const activeAccessories = activeLocation
    ? accessories.filter((a) => (activeLocation.accessoryIds || []).includes(a.id!))
    : [];
  const activeAmmo = activeLocation
    ? ammoList.filter((a) => (activeLocation.ammoIds || []).includes(a.id!))
    : [];

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1
            style={{
              color: 'var(--text-primary)',
              margin: 0,
              fontSize: '1.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Shield size={24} style={{ color: 'var(--accent)' }} />
            Storage & Safe Organizer
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.88rem' }}>
            {locations.length} locations • {totalItems} items assigned
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingLocation(null);
            setForm({
              name: '',
              type: 'Safe',
              capacity: undefined,
              notes: '',
              firearmIds: [],
              accessoryIds: [],
              ammoIds: [],
            });
            setIsAddModalOpen(true);
          }}
        >
          <PlusCircle size={16} /> Add Location
        </button>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        {(['Safe', 'Cabinet', 'AmmoCan', 'Case', 'Vehicle', 'Other'] as const).map((type) => {
          const count = locations.filter((l) => l.type === type).length;
          const colorMeta = TYPE_COLORS[type] || TYPE_COLORS.Other;
          return (
            <div
              key={type}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: colorMeta.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {STORAGE_ICONS[type]}
              </div>
              <div>
                <div
                  style={{
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    lineHeight: 1.2,
                  }}
                >
                  {count}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {type === 'AmmoCan' ? 'Ammo Cans' : type + 's'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Location Cards (Quick Look Grid) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1rem',
        }}
      >
        {locations.map((loc) => {
          const locFirearms = firearms.filter((f) => (loc.firearmIds || []).includes(f.id!));
          const locAccessories = accessories.filter((a) =>
            (loc.accessoryIds || []).includes(a.id!)
          );
          const locAmmo = ammoList.filter((a) => (loc.ammoIds || []).includes(a.id!));
          const totalRounds = locAmmo.reduce((sum, a) => sum + (a.count || 0), 0);
          const itemCount = locFirearms.length + locAccessories.length + locAmmo.length;
          const colorMeta = TYPE_COLORS[loc.type] || TYPE_COLORS.Other;
          const capacityPercent = loc.capacity
            ? Math.min(100, Math.round((itemCount / loc.capacity) * 100))
            : null;

          return (
            <div
              key={loc.id}
              onClick={() => setInspectingLocationId(loc.id!)}
              className="storage-quick-card"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
                borderRadius: '14px',
                borderLeft: `4px solid ${colorMeta.text}`,
                padding: '1.15rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                position: 'relative',
              }}
            >
              {/* Card Top Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: colorMeta.bg,
                      border: `1px solid ${colorMeta.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {STORAGE_ICONS[loc.type]}
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                      }}
                    >
                      {loc.name}
                    </h3>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 2,
                        background: colorMeta.bg,
                        color: colorMeta.text,
                        border: `1px solid ${colorMeta.border}`,
                        padding: '1px 7px',
                        borderRadius: 4,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {loc.type}
                    </span>
                  </div>
                </div>

                <div
                  style={{ display: 'flex', gap: '0.35rem' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleEdit(loc)}
                    className="btn-icon"
                    style={{ padding: '5px', borderRadius: '6px' }}
                    title="Edit Location"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id!)}
                    className="btn-icon"
                    style={{ padding: '5px', borderRadius: '6px', color: 'var(--danger)' }}
                    title="Delete Location"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Quick Look Breakdown Pills */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div
                  style={{
                    flex: 1,
                    minWidth: '85px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.45rem 0.6rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: '#a78bfa',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      marginBottom: 2,
                    }}
                  >
                    <Shield size={12} color="#a78bfa" /> Firearms
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 700 }}>
                    {locFirearms.length}
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: '85px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.45rem 0.6rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: '#60a5fa',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      marginBottom: 2,
                    }}
                  >
                    <AccessoriesNavIcon size={12} color="#60a5fa" /> Accessories
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 700 }}>
                    {locAccessories.length}
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: '85px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.45rem 0.6rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: '#f59e0b',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      marginBottom: 2,
                    }}
                  >
                    <CartridgesIcon size={12} color="#f59e0b" /> Ammo (rds)
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#f59e0b', fontWeight: 700 }}>
                    {totalRounds.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Capacity Progress Meter */}
              {loc.capacity ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Capacity</span>
                    <span
                      style={{
                        color: capacityPercent! >= 90 ? 'var(--danger)' : 'var(--text-primary)',
                        fontWeight: 600,
                      }}
                    >
                      {itemCount} / {loc.capacity} ({capacityPercent}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 6,
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${capacityPercent}%`,
                        height: '100%',
                        background: capacityPercent! >= 90 ? 'var(--danger)' : colorMeta.text,
                        borderRadius: 3,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {/* Sample Items Preview */}
              {itemCount > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    gap: '0.35rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  {locFirearms.slice(0, 2).map((f) => (
                    <span
                      key={f.id}
                      style={{
                        background: 'rgba(167, 139, 250, 0.1)',
                        border: '1px solid rgba(167, 139, 250, 0.3)',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: '0.72rem',
                        color: '#c4b5fd',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Shield size={11} color="#a78bfa" /> {f.make} {f.model}
                    </span>
                  ))}
                  {locAccessories.slice(0, 1).map((a) => {
                    const tc = getAccessoryTypeColor(a.type);
                    return (
                      <span
                        key={a.id}
                        style={{
                          background: tc.bg,
                          border: `1px solid ${tc.border}`,
                          borderRadius: 4,
                          padding: '2px 6px',
                          fontSize: '0.72rem',
                          color: tc.text,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {renderAccessoryIcon(a.type, 11, tc.text)}{' '}
                        {a.model || a.manufacturer || a.type}
                      </span>
                    );
                  })}
                  {locAmmo.slice(0, 1).map((am) => (
                    <span
                      key={am.id}
                      style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: '0.72rem',
                        color: '#fbbf24',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CartridgesIcon size={11} color="#f59e0b" /> {am.caliber} ({am.count} rds)
                    </span>
                  ))}
                  {itemCount > 3 && (
                    <span
                      style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}
                    >
                      +{itemCount - 3} more
                    </span>
                  )}
                </div>
              ) : (
                <div
                  style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}
                >
                  Empty location • Tap to assign items
                </div>
              )}

              {/* Card Footer prompt */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.6rem',
                  marginTop: 'auto',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FileText size={12} style={{ opacity: 0.7 }} />
                  {loc.notes
                    ? `${loc.notes.slice(0, 28)}${loc.notes.length > 28 ? '...' : ''}`
                    : 'No notes'}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  Quick Look <ChevronRight size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {locations.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '3.5rem',
            color: 'var(--text-muted)',
            background: 'var(--card-bg)',
            borderRadius: 16,
            border: '1px solid var(--border-light)',
          }}
        >
          <Shield size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
            No storage locations configured
          </h3>
          <p style={{ margin: '0 0 1.25rem' }}>
            Create safe, cabinet, or ammo can profiles to organize your armory inventory.
          </p>
          <button
            className="btn-primary"
            onClick={() => {
              setEditingLocation(null);
              setForm({
                name: '',
                type: 'Safe',
                capacity: undefined,
                notes: '',
                firearmIds: [],
                accessoryIds: [],
                ammoIds: [],
              });
              setIsAddModalOpen(true);
            }}
          >
            <PlusCircle size={16} /> Add Your First Location
          </button>
        </div>
      )}

      {/* ─── Location Details Modal (Quick Look / Manage) ─── */}
      {activeLocation &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setInspectingLocationId(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '750px',
                width: '92vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                overflow: 'hidden',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
                borderRadius: '18px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.95)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: (TYPE_COLORS[activeLocation.type] || TYPE_COLORS.Other).bg,
                      border: `1px solid ${(TYPE_COLORS[activeLocation.type] || TYPE_COLORS.Other).border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {STORAGE_ICONS[activeLocation.type]}
                  </div>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        color: 'var(--text-primary)',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                      }}
                    >
                      {activeLocation.name}
                    </h2>
                    <div
                      style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: 2 }}
                    >
                      <span
                        style={{
                          background: (TYPE_COLORS[activeLocation.type] || TYPE_COLORS.Other).bg,
                          color: (TYPE_COLORS[activeLocation.type] || TYPE_COLORS.Other).text,
                          border: `1px solid ${(TYPE_COLORS[activeLocation.type] || TYPE_COLORS.Other).border}`,
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {activeLocation.type}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {activeFirearms.length + activeAccessories.length + activeAmmo.length} items
                        assigned
                        {activeLocation.capacity ? ` • Capacity: ${activeLocation.capacity}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => {
                      setInspectingLocationId(null);
                      handleEdit(activeLocation);
                    }}
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    onClick={() => setInspectingLocationId(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '6px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div
                style={{
                  padding: '1.5rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                {/* Notes Banner if present */}
                {activeLocation.notes && (
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: 10,
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <strong style={{ color: 'var(--accent)' }}>Notes: </strong>
                    {activeLocation.notes}
                  </div>
                )}

                {/* Firearms Section */}
                <div
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 12,
                    padding: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Shield size={16} color="#a78bfa" />
                      <h4
                        style={{
                          margin: 0,
                          color: 'var(--text-primary)',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                        }}
                      >
                        Assigned Firearms ({activeFirearms.length})
                      </h4>
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', color: '#a78bfa' }}
                      onClick={() =>
                        setAssignModal({ locationId: activeLocation.id!, type: 'firearm' })
                      }
                    >
                      <Plus size={12} /> Assign Firearm
                    </button>
                  </div>

                  {activeFirearms.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {activeFirearms.map((f) => (
                        <div
                          key={f.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.6rem 0.8rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: 'rgba(167, 139, 250, 0.15)',
                                border: '1px solid rgba(167, 139, 250, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Shield size={14} color="#a78bfa" />
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                {f.make} {f.model}
                              </span>
                              <span
                                style={{
                                  color: 'var(--text-muted)',
                                  marginLeft: 8,
                                  fontSize: '0.8rem',
                                }}
                              >
                                • {f.caliber}
                              </span>
                              {f.serial_number && (
                                <span
                                  style={{
                                    color: 'var(--text-muted)',
                                    marginLeft: 8,
                                    fontSize: '0.75rem',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  SN: {f.serial_number}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnassignItem(activeLocation.id!, 'firearm', f.id!)}
                            className="btn-icon"
                            style={{ color: 'var(--danger)', padding: 4 }}
                            title="Unassign firearm"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '1rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontStyle: 'italic',
                      }}
                    >
                      No firearms currently assigned to this storage location.
                    </div>
                  )}
                </div>

                {/* Accessories Section */}
                <div
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 12,
                    padding: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AccessoriesNavIcon size={16} color="#60a5fa" />
                      <h4
                        style={{
                          margin: 0,
                          color: 'var(--text-primary)',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                        }}
                      >
                        Assigned Accessories ({activeAccessories.length})
                      </h4>
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', color: '#60a5fa' }}
                      onClick={() =>
                        setAssignModal({ locationId: activeLocation.id!, type: 'accessory' })
                      }
                    >
                      <Plus size={12} /> Assign Accessory
                    </button>
                  </div>

                  {activeAccessories.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {activeAccessories.map((a) => {
                        const tc = getAccessoryTypeColor(a.type);
                        return (
                          <div
                            key={a.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.6rem 0.8rem',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  background: tc.bg,
                                  border: `1px solid ${tc.border}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {renderAccessoryIcon(a.type, 14, tc.text)}
                              </div>
                              <div>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                  {a.manufacturer} {a.model}
                                </span>
                                <span
                                  style={{
                                    background: tc.bg,
                                    color: tc.text,
                                    border: `1px solid ${tc.border}`,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    marginLeft: 8,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {a.type}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleUnassignItem(activeLocation.id!, 'accessory', a.id!)
                              }
                              className="btn-icon"
                              style={{ color: 'var(--danger)', padding: 4 }}
                              title="Unassign accessory"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '1rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontStyle: 'italic',
                      }}
                    >
                      No accessories currently assigned to this storage location.
                    </div>
                  )}
                </div>

                {/* Ammunition Section */}
                <div
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 12,
                    padding: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CartridgesIcon size={16} color="#f59e0b" />
                      <h4
                        style={{
                          margin: 0,
                          color: 'var(--text-primary)',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                        }}
                      >
                        Assigned Ammunition ({activeAmmo.length})
                      </h4>
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', color: '#f59e0b' }}
                      onClick={() =>
                        setAssignModal({ locationId: activeLocation.id!, type: 'ammo' })
                      }
                    >
                      <Plus size={12} /> Assign Ammo
                    </button>
                  </div>

                  {activeAmmo.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {activeAmmo.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.6rem 0.8rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <CartridgesIcon size={15} color="#f59e0b" />
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                {a.manufacturer || 'Ammo'} {a.caliber}
                              </span>
                              {a.grain && (
                                <span
                                  style={{
                                    color: 'var(--text-muted)',
                                    marginLeft: 6,
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  {a.grain}gr
                                </span>
                              )}
                              <span
                                style={{
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#f59e0b',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  marginLeft: 8,
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                }}
                              >
                                {a.count.toLocaleString()} rds
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnassignItem(activeLocation.id!, 'ammo', a.id!)}
                            className="btn-icon"
                            style={{ color: 'var(--danger)', padding: 4 }}
                            title="Unassign ammunition"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '1rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontStyle: 'italic',
                      }}
                    >
                      No ammunition boxes currently assigned to this storage location.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.95)',
                }}
              >
                <button
                  className="btn-secondary"
                  style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  onClick={() => handleDelete(activeLocation.id!)}
                >
                  <Trash2 size={14} /> Delete Location
                </button>

                <button className="btn-primary" onClick={() => setInspectingLocationId(null)}>
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── Add/Edit Storage Location Modal ─── */}
      {isAddModalOpen &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => {
              setIsAddModalOpen(false);
              setEditingLocation(null);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '480px',
                width: '90vw',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.15rem' }}>
                  {editingLocation ? 'Edit Storage Location' : 'Add Storage Location'}
                </h2>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingLocation(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      marginBottom: 4,
                    }}
                  >
                    Location Name
                  </label>
                  <input
                    className="glass-input"
                    value={form.name || ''}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Main Gun Safe, Master Bedroom Safe"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      marginBottom: 4,
                    }}
                  >
                    Storage Type
                  </label>
                  <select
                    className="glass-input"
                    value={form.type || 'Safe'}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}
                  >
                    <option value="Safe">Safe</option>
                    <option value="Cabinet">Cabinet</option>
                    <option value="AmmoCan">Ammo Can</option>
                    <option value="Case">Case</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      marginBottom: 4,
                    }}
                  >
                    Capacity Limit (Optional)
                  </label>
                  <input
                    className="glass-input"
                    type="number"
                    value={form.capacity || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, capacity: Number(e.target.value) || undefined }))
                    }
                    placeholder="e.g. 24 (firearms or items)"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      marginBottom: 4,
                    }}
                  >
                    Notes & Combination Details
                  </label>
                  <textarea
                    className="glass-input"
                    rows={3}
                    value={form.notes || ''}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Combination backup, shelf layout, location details, etc."
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingLocation(null);
                  }}
                >
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSave}>
                  {editingLocation ? 'Update Location' : 'Add Location'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── Item Assignment Selector Modal ─── */}
      {assignModal &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setAssignModal(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '480px',
                width: '90vw',
                maxHeight: '75vh',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                  Assign{' '}
                  {assignModal.type === 'firearm'
                    ? 'Firearm'
                    : assignModal.type === 'accessory'
                      ? 'Accessory'
                      : 'Ammunition'}
                </h2>
                <button
                  onClick={() => setAssignModal(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div
                style={{
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  paddingRight: '4px',
                }}
              >
                {assignModal.type === 'firearm' &&
                  (firearms.filter((f) => !assignedFirearmIds.has(f.id!)).length > 0 ? (
                    firearms
                      .filter((f) => !assignedFirearmIds.has(f.id!))
                      .map((f) => (
                        <button
                          key={f.id}
                          onClick={() => handleAssignItem(assignModal.locationId, 'firearm', f.id!)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.65rem 0.85rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            textAlign: 'left',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 6,
                                background: 'rgba(167, 139, 250, 0.15)',
                                border: '1px solid rgba(167, 139, 250, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Shield size={13} color="#a78bfa" />
                            </div>
                            <span style={{ fontWeight: 600 }}>
                              {f.make} {f.model}
                            </span>
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            {f.caliber}
                          </span>
                        </button>
                      ))
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                      }}
                    >
                      All registered firearms are already assigned to storage locations.
                    </div>
                  ))}

                {assignModal.type === 'accessory' &&
                  (accessories.filter((a) => !assignedAccessoryIds.has(a.id!)).length > 0 ? (
                    accessories
                      .filter((a) => !assignedAccessoryIds.has(a.id!))
                      .map((a) => {
                        const tc = getAccessoryTypeColor(a.type);
                        return (
                          <button
                            key={a.id}
                            onClick={() =>
                              handleAssignItem(assignModal.locationId, 'accessory', a.id!)
                            }
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.65rem 0.85rem',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              textAlign: 'left',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 6,
                                  background: tc.bg,
                                  border: `1px solid ${tc.border}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {renderAccessoryIcon(a.type, 13, tc.text)}
                              </div>
                              <span style={{ fontWeight: 600 }}>
                                {a.manufacturer} {a.model}
                              </span>
                            </div>
                            <span
                              style={{
                                background: tc.bg,
                                color: tc.text,
                                border: `1px solid ${tc.border}`,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                              }}
                            >
                              {a.type}
                            </span>
                          </button>
                        );
                      })
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                      }}
                    >
                      All accessories are already assigned to storage locations.
                    </div>
                  ))}

                {assignModal.type === 'ammo' &&
                  (ammoList.filter((a) => !assignedAmmoIds.has(a.id!)).length > 0 ? (
                    ammoList
                      .filter((a) => !assignedAmmoIds.has(a.id!))
                      .map((a) => (
                        <button
                          key={a.id}
                          onClick={() => handleAssignItem(assignModal.locationId, 'ammo', a.id!)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.65rem 0.85rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            textAlign: 'left',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 6,
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <CartridgesIcon size={14} color="#f59e0b" />
                            </div>
                            <div>
                              <span style={{ fontWeight: 600 }}>
                                {a.manufacturer || 'Ammo'} {a.caliber}
                              </span>
                              {a.grain && (
                                <span
                                  style={{
                                    color: 'var(--text-muted)',
                                    marginLeft: 6,
                                    fontSize: '0.78rem',
                                  }}
                                >
                                  {a.grain}gr
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                            }}
                          >
                            {a.count.toLocaleString()} rds
                          </span>
                        </button>
                      ))
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                      }}
                    >
                      All ammunition inventory is already assigned to storage locations.
                    </div>
                  ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
