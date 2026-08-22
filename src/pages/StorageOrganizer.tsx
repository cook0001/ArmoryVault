import {
  Archive,
  Box,
  Car,
  ChevronRight,
  Crosshair,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Flashlight,
  Layers,
  Lock,
  MapPin,
  Package,
  Plus,
  PlusCircle,
  QrCode,
  ScanBarcode,
  Search,
  Shield,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAccessoryTypeColor } from '../components/AccessoryDetailModal';
import {
  AccessoriesNavIcon,
  AmmoCanIcon,
  CabinetIcon,
  CartridgesIcon,
  ChassisIcon,
  GunBeltIcon,
  GunCaseIcon,
  GunpowderIcon,
  HolsterIcon,
  MagazineIcon,
  PicatinnyMountIcon,
  SafeIcon,
  ScopeIcon,
  StockIcon,
  SuppressorIcon,
  TacticalSlingIcon,
  VehicleVaultIcon,
} from '../components/CustomIcons';
import { StorageLocationQRModal } from '../components/StorageLocationQRModal';
import { useUndoToast } from '../components/UndoToast';
import type { Accessory, Ammo, Firearm, ReloadingComponent, StorageLocation } from '../types';
import { parseStorageUri } from '../utils/BarcodeEngine';
import {
  assignItemToStorage,
  getStorageCapacityUtilization,
  removeItemFromAllStorage,
  saveStorageLocations,
} from '../utils/StorageSync';

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
    case 'Stock':
      return <StockIcon size={size} color={color || '#10b981'} />;
    case 'Chassis':
      return <ChassisIcon size={size} color={color || '#06b6d4'} />;
    case 'Belt':
      return <GunBeltIcon size={size} color={color || '#eab308'} />;
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
  const { showUndo } = useUndoToast();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [ammoList, setAmmoList] = useState<Ammo[]>([]);
  const [components, setComponents] = useState<ReloadingComponent[]>([]);
  const [showValuations, setShowValuations] = useState<boolean>(() => {
    return localStorage.getItem('armoryvault_storage_valuations') !== 'false';
  });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [inspectingLocationId, setInspectingLocationId] = useState<number | null>(null);
  const [assignModal, setAssignModal] = useState<{
    locationId: number;
    type: 'firearm' | 'accessory' | 'ammo' | 'component';
  } | null>(null);

  const [form, setForm] = useState<Partial<StorageLocation>>({
    name: '',
    type: 'Safe',
    capacity: undefined,
    capacityMode: undefined,
    notes: '',
    firearmIds: [],
    accessoryIds: [],
    ammoIds: [],
    componentIds: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (window.api) {
      const [locs, f, a, am, comps, storedValPref] = await Promise.all([
        window.api.getStorageLocations ? window.api.getStorageLocations() : Promise.resolve([]),
        window.api.getFirearms ? window.api.getFirearms() : Promise.resolve([]),
        window.api.getAccessories ? window.api.getAccessories() : Promise.resolve([]),
        window.api.getAmmo ? window.api.getAmmo() : Promise.resolve([]),
        window.api.getComponents ? window.api.getComponents() : Promise.resolve([]),
        window.api.getConfig
          ? window.api.getConfig('showStorageValuations')
          : Promise.resolve(null),
      ]);
      setLocations(locs || []);
      setFirearms(f || []);
      setAccessories(a || []);
      setAmmoList(am || []);
      setComponents(comps || []);
      if (storedValPref !== null && storedValPref !== undefined) {
        setShowValuations(!!storedValPref);
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
        capacityMode: undefined,
        notes: '',
        firearmIds: [],
        accessoryIds: [],
        ammoIds: [],
        componentIds: [],
      });
    }
  };

  const handleOpenAddModal = (defaultType?: StorageLocation['type']) => {
    setEditingLocation(null);
    if (defaultType) {
      setForm({
        name: '',
        type: defaultType,
        capacity: undefined,
        capacityMode: undefined,
        notes: '',
        firearmIds: [],
        accessoryIds: [],
        ammoIds: [],
        componentIds: [],
      });
    } else {
      setForm({
        name: '',
        type: 'Safe',
        capacity: undefined,
        capacityMode: undefined,
        notes: '',
        firearmIds: [],
        accessoryIds: [],
        ammoIds: [],
        componentIds: [],
      });
    }
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const targetLoc = locations.find((l) => l.id === id);
    if (!targetLoc) return;
    if (window.api?.deleteStorageLocation) {
      await window.api.deleteStorageLocation(id);
      if (inspectingLocationId === id) setInspectingLocationId(null);
      await loadData();
      showUndo(`Deleted storage location "${targetLoc.name}"`, async () => {
        if (window.api?.addStorageLocation) {
          const { id: _oldId, ...rest } = targetLoc;
          await window.api.addStorageLocation(rest as StorageLocation);
          await loadData();
        }
      });
    }
  };

  const handleEdit = (loc: StorageLocation) => {
    setForm({ ...loc });
    setEditingLocation(loc);
    setIsAddModalOpen(true);
  };

  // QR Code Modal State
  const [qrModalLocation, setQrModalLocation] = useState<StorageLocation | null>(null);

  // Search / Scanner Filter
  const [searchFilter, setSearchFilter] = useState('');

  // Barcode / QR Item Quick Check-in/out State
  const [modalScanCode, setModalScanCode] = useState('');

  const handleAssignItem = async (
    locationId: number,
    type: 'firearm' | 'accessory' | 'ammo' | 'component',
    itemId: number
  ) => {
    const updated = assignItemToStorage(type, itemId, locationId, locations);
    await saveStorageLocations(updated);
    await loadData();
    setAssignModal(null);
    setModalScanCode('');
  };

  const handleUnassignItem = async (
    locationId: number,
    type: 'firearm' | 'accessory' | 'ammo' | 'component',
    itemId: number
  ) => {
    const updated = assignItemToStorage(type, itemId, null, locations);
    await saveStorageLocations(updated);
    await loadData();
    setModalScanCode('');
  };

  // Items already assigned anywhere
  const assignedFirearmIds = new Set(locations.flatMap((l) => l.firearmIds || []));
  const assignedAccessoryIds = new Set(locations.flatMap((l) => l.accessoryIds || []));
  const assignedAmmoIds = new Set(locations.flatMap((l) => l.ammoIds || []));
  const assignedComponentIds = new Set(locations.flatMap((l) => l.componentIds || []));

  const totalItems = locations.reduce(
    (sum, l) =>
      sum +
      (l.firearmIds?.length || 0) +
      (l.accessoryIds?.length || 0) +
      (l.ammoIds?.length || 0) +
      (l.componentIds?.length || 0),
    0
  );

  const activeLocation =
    locations.find((l) => Number(l.id) === Number(inspectingLocationId)) || null;
  const activeFirearms = activeLocation
    ? firearms.filter((f) => (activeLocation.firearmIds || []).includes(f.id!))
    : [];
  const activeAccessories = activeLocation
    ? accessories.filter((a) => (activeLocation.accessoryIds || []).includes(a.id!))
    : [];
  const activeAmmo = activeLocation
    ? ammoList.filter((a) => (activeLocation.ammoIds || []).includes(a.id!))
    : [];
  const activeComponents = activeLocation
    ? components.filter((c) => (activeLocation.componentIds || []).includes(c.id!))
    : [];

  const handleSearchOrScan = (input: string) => {
    const parsedId = parseStorageUri(input);
    if (parsedId !== null && parsedId !== undefined) {
      const match = locations.find((l) => Number(l.id) === Number(parsedId));
      if (match) {
        setInspectingLocationId(match.id!);
        setSearchFilter('');
        return;
      }
    }
    setSearchFilter(input);
  };

  // Find matched item from modalScanCode inside active location
  const matchedScanItem = useMemo(() => {
    if (!modalScanCode || !activeLocation) return null;
    const term = modalScanCode.trim();

    // Check Firearm QR (armoryvault://firearm/:id) or Serial or ID
    const firearmUriMatch = term.match(/^armoryvault:\/\/firearm\/(\d+)$/i);
    const firearmId = firearmUriMatch ? parseInt(firearmUriMatch[1], 10) : parseInt(term, 10);
    const matchedGun = firearms.find(
      (f) =>
        f.id === firearmId ||
        (f.serial_number && f.serial_number.toLowerCase() === term.toLowerCase())
    );
    if (matchedGun) {
      const isAssignedHere = (activeLocation.firearmIds || []).includes(matchedGun.id!);
      const currentLoc = locations.find((l) => (l.firearmIds || []).includes(matchedGun.id!));
      return {
        category: 'firearm' as const,
        id: matchedGun.id!,
        name: `${matchedGun.make} ${matchedGun.model}`,
        details: `${matchedGun.caliber} • SN: ${matchedGun.serial_number}`,
        isAssignedHere,
        currentLocationName: currentLoc?.name,
      };
    }

    // Check Ammo QR (armoryvault://ammo/:id) or UPC/SKU
    const ammoUriMatch = term.match(/^armoryvault:\/\/ammo\/(\d+)$/i);
    const ammoId = ammoUriMatch ? parseInt(ammoUriMatch[1], 10) : null;
    const matchedAmmo = ammoList.find(
      (a) =>
        (ammoId && a.id === ammoId) ||
        (a.upc_code && a.upc_code.toLowerCase() === term.toLowerCase())
    );
    if (matchedAmmo) {
      const isAssignedHere = (activeLocation.ammoIds || []).includes(matchedAmmo.id!);
      const currentLoc = locations.find((l) => (l.ammoIds || []).includes(matchedAmmo.id!));
      return {
        category: 'ammo' as const,
        id: matchedAmmo.id!,
        name: `${matchedAmmo.manufacturer || 'Ammo'} ${matchedAmmo.caliber}`,
        details: `${matchedAmmo.count} rounds • ${matchedAmmo.grain || ''}gr`,
        isAssignedHere,
        currentLocationName: currentLoc?.name,
      };
    }

    // Check Accessory serialNumber, UPC
    const matchedAcc = accessories.find(
      (a) =>
        (a.serialNumber && a.serialNumber.toLowerCase() === term.toLowerCase()) ||
        (a.upc_code && a.upc_code.toLowerCase() === term.toLowerCase())
    );
    if (matchedAcc) {
      const isAssignedHere = (activeLocation.accessoryIds || []).includes(matchedAcc.id!);
      const currentLoc = locations.find((l) => (l.accessoryIds || []).includes(matchedAcc.id!));
      return {
        category: 'accessory' as const,
        id: matchedAcc.id!,
        name: `${matchedAcc.manufacturer || ''} ${matchedAcc.model || matchedAcc.type}`,
        details: `[${matchedAcc.type}] ${matchedAcc.serialNumber ? `SN: ${matchedAcc.serialNumber}` : ''}`,
        isAssignedHere,
        currentLocationName: currentLoc?.name,
      };
    }

    // Check Component UPC or name
    const matchedComp = components.find(
      (c) =>
        (c.upc_code && c.upc_code.toLowerCase() === term.toLowerCase()) ||
        (c.name && c.name.toLowerCase() === term.toLowerCase())
    );
    if (matchedComp) {
      const isAssignedHere = (activeLocation.componentIds || []).includes(matchedComp.id!);
      const currentLoc = locations.find((l) => (l.componentIds || []).includes(matchedComp.id!));
      return {
        category: 'component' as const,
        id: matchedComp.id!,
        name: `${matchedComp.manufacturer} ${matchedComp.name || matchedComp.type}`,
        details: `[${matchedComp.type}] ${matchedComp.quantity} ${matchedComp.weightUnit || 'ct'}`,
        isAssignedHere,
        currentLocationName: currentLoc?.name,
      };
    }

    return null;
  }, [modalScanCode, activeLocation, firearms, ammoList, accessories, components, locations]);

  const filteredLocations = locations.filter((l) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      (l.notes && l.notes.toLowerCase().includes(q)) ||
      l.type.toLowerCase().includes(q)
    );
  });

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
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const newVal = !showValuations;
              setShowValuations(newVal);
              localStorage.setItem('armoryvault_storage_valuations', String(newVal));
              if (window.api?.setConfig) window.api.setConfig('showStorageValuations', newVal);
            }}
            title={showValuations ? 'Hide financial dollar values' : 'Show financial dollar values'}
          >
            {showValuations ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>{showValuations ? 'Valuations Visible' : 'Valuations Hidden'}</span>
          </button>
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
                componentIds: [],
              });
              setIsAddModalOpen(true);
            }}
          >
            <PlusCircle size={16} /> Add Location
          </button>
        </div>
      </div>

      {/* Quick Search & Scanner Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: '280px',
            maxWidth: '520px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{
              width: '100%',
              paddingLeft: '2.25rem',
              paddingRight: searchFilter ? '2.25rem' : '0.85rem',
              fontSize: '0.85rem',
            }}
            placeholder="Scan storage QR, or search safe name, container type, notes..."
            value={searchFilter}
            onChange={(e) => handleSearchOrScan(e.target.value)}
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {searchFilter && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {filteredLocations.length} of {locations.length} locations
          </span>
        )}
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
        {filteredLocations.map((loc) => {
          const locFirearms = firearms.filter((f) => (loc.firearmIds || []).includes(f.id!));
          const locAccessories = accessories.filter((a) =>
            (loc.accessoryIds || []).includes(a.id!)
          );
          const locAmmo = ammoList.filter((a) => (loc.ammoIds || []).includes(a.id!));
          const locComps = components.filter((c) => (loc.componentIds || []).includes(c.id!));
          const totalRounds = locAmmo.reduce((sum, a) => sum + (a.count || 0), 0);
          const colorMeta = TYPE_COLORS[loc.type] || TYPE_COLORS.Other;

          const capUtil = getStorageCapacityUtilization(
            loc,
            locFirearms.length,
            locAccessories.length,
            locAmmo.length,
            locComps.length
          );

          const locFirearmsVal = locFirearms.reduce((sum, f) => sum + (f.purchase_price || 0), 0);
          const locAccsVal = locAccessories.reduce(
            (sum, a) => sum + (a.value || 0) * (a.quantity || 1),
            0
          );
          const locAmmoVal = locAmmo.reduce(
            (sum, am) => sum + (am.count || 0) * (am.costPerRound || 0),
            0
          );
          const locCompsVal = locComps.reduce((sum, c) => sum + (c.cost || 0), 0);
          const locTotalVal = locFirearmsVal + locAccsVal + locAmmoVal + locCompsVal;

          return (
            <div
              key={loc.id}
              data-testid={`storage-card-${loc.id}`}
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
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.35rem',
                        alignItems: 'center',
                        marginTop: 2,
                      }}
                    >
                      <span
                        style={{
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
                      {capUtil.mode === 'firearms' && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--text-muted)',
                            background: 'rgba(255,255,255,0.04)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                          }}
                        >
                          Gun Capacity
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{ display: 'flex', gap: '0.35rem' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setQrModalLocation(loc)}
                    className="btn-icon"
                    style={{ padding: '5px', borderRadius: '6px' }}
                    title="Generate & Print Storage QR Code"
                  >
                    <QrCode size={14} />
                  </button>
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

              {/* Quick Look Breakdown Pills (All 4 Categories) */}
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}
              >
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.3rem',
                    textAlign: 'center',
                  }}
                  title={`${locFirearms.length} Firearms stored`}
                >
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: '#a78bfa',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      marginBottom: 2,
                    }}
                  >
                    <Shield size={11} color="#a78bfa" /> Guns
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 700 }}>
                    {locFirearms.length}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.3rem',
                    textAlign: 'center',
                  }}
                  title={`${locAccessories.length} Accessories stored`}
                >
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: '#60a5fa',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      marginBottom: 2,
                    }}
                  >
                    <AccessoriesNavIcon size={11} color="#60a5fa" /> Accs
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 700 }}>
                    {locAccessories.length}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.3rem',
                    textAlign: 'center',
                  }}
                  title={`${locAmmo.length} Ammo Lots (${totalRounds.toLocaleString()} rounds)`}
                >
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: '#f59e0b',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      marginBottom: 2,
                    }}
                  >
                    <CartridgesIcon size={11} color="#f59e0b" /> Ammo
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#f59e0b', fontWeight: 700 }}>
                    {locAmmo.length}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.3rem',
                    textAlign: 'center',
                  }}
                  title={`${locComps.length} Reloading Components stored`}
                >
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: '#c084fc',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      marginBottom: 2,
                    }}
                  >
                    <GunpowderIcon size={11} color="#c084fc" /> Powders
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#c084fc', fontWeight: 700 }}>
                    {locComps.length}
                  </div>
                </div>
              </div>

              {/* Capacity Progress Meter */}
              {capUtil.max ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>{capUtil.unitLabel} Capacity</span>
                    </span>
                    <span
                      style={{
                        color:
                          capUtil.isOverCapacity || (capUtil.percent && capUtil.percent >= 90)
                            ? 'var(--danger)'
                            : 'var(--text-primary)',
                        fontWeight: 700,
                      }}
                    >
                      {capUtil.used} / {capUtil.max} {capUtil.unitLabel} ({capUtil.percent}%)
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
                        width: `${Math.min(100, capUtil.percent || 0)}%`,
                        height: '100%',
                        background:
                          capUtil.isOverCapacity || (capUtil.percent && capUtil.percent >= 90)
                            ? 'var(--danger)'
                            : colorMeta.text,
                        borderRadius: 3,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {/* Stored Valuation Line */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  marginTop: '0.2rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Total Stored Value:
                </span>
                <strong style={{ color: 'var(--success)', fontSize: '0.9rem' }}>
                  {showValuations
                    ? `$${locTotalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '•••••'}
                </strong>
              </div>

              {/* Sample Items Preview */}
              {capUtil.totalItems > 0 ? (
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
                  {capUtil.totalItems > 3 && (
                    <span
                      style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}
                    >
                      +{capUtil.totalItems - 3} more
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
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setInspectingLocationId(null);
                setModalScanCode('');
              }
            }}
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
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        marginTop: 2,
                        flexWrap: 'wrap',
                      }}
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
                      {(() => {
                        const cap = getStorageCapacityUtilization(
                          activeLocation,
                          activeFirearms.length,
                          activeAccessories.length,
                          activeAmmo.length,
                          activeComponents.length
                        );
                        return (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {cap.max
                              ? `${cap.used} / ${cap.max} ${cap.unitLabel} (${cap.percent}%)`
                              : `${cap.used} ${cap.unitLabel}`}
                            {activeAccessories.length +
                              activeAmmo.length +
                              activeComponents.length >
                              0 &&
                              cap.mode === 'firearms' && (
                                <span>
                                  {' '}
                                  • {activeAccessories.length} Accs • {activeAmmo.length} Ammo •{' '}
                                  {activeComponents.length} Powders
                                </span>
                              )}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    className="btn-secondary"
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    onClick={() => setQrModalLocation(activeLocation)}
                    title="View & Print QR Code Label"
                  >
                    <QrCode size={14} /> QR Label
                  </button>
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
                    onClick={() => {
                      setInspectingLocationId(null);
                      setModalScanCode('');
                    }}
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
                {/* Rapid Scan Barcode / QR Item Management Bar */}
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.07)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                  }}
                >
                  <label
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '0.45rem',
                    }}
                  >
                    <ScanBarcode size={15} /> Rapid Barcode / QR Item Check-In &amp; Check-Out
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1, fontSize: '0.85rem' }}
                      placeholder="Scan firearm QR, ammo UPC/SKU, accessory or component barcode to add/remove..."
                      value={modalScanCode}
                      onChange={(e) => setModalScanCode(e.target.value)}
                    />
                    {modalScanCode && (
                      <button
                        className="btn-secondary"
                        onClick={() => setModalScanCode('')}
                        style={{ padding: '0.4rem 0.6rem' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Matched item quick action card */}
                  {matchedScanItem ? (
                    <div
                      style={{
                        marginTop: '0.65rem',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                          }}
                        >
                          {matchedScanItem.name}
                        </div>
                        <div
                          style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}
                        >
                          {matchedScanItem.details} • Current Location:{' '}
                          <strong
                            style={{
                              color: matchedScanItem.isAssignedHere
                                ? '#34d399'
                                : 'var(--text-secondary)',
                            }}
                          >
                            {matchedScanItem.isAssignedHere
                              ? 'Assigned to this container'
                              : matchedScanItem.currentLocationName || 'Unassigned'}
                          </strong>
                        </div>
                      </div>
                      {matchedScanItem.isAssignedHere ? (
                        <button
                          className="btn-danger"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                          }}
                          onClick={() =>
                            handleUnassignItem(
                              activeLocation.id!,
                              matchedScanItem.category,
                              matchedScanItem.id
                            )
                          }
                        >
                          Remove from {activeLocation.name}
                        </button>
                      ) : (
                        <button
                          className="btn-primary"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                          }}
                          onClick={() =>
                            handleAssignItem(
                              activeLocation.id!,
                              matchedScanItem.category,
                              matchedScanItem.id
                            )
                          }
                        >
                          Assign to {activeLocation.name}
                        </button>
                      )}
                    </div>
                  ) : (
                    modalScanCode.trim().length > 0 && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.4rem',
                          fontStyle: 'italic',
                        }}
                      >
                        No inventory item found matching "{modalScanCode}". Try scanning a valid
                        firearm QR, ammo UPC/SKU, or accessory SKU.
                      </div>
                    )
                  )}
                </div>

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

                {/* Reloading Supplies Section */}
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
                      <GunpowderIcon size={16} color="#c084fc" />
                      <h4
                        style={{
                          margin: 0,
                          color: 'var(--text-primary)',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                        }}
                      >
                        Assigned Reloading Supplies ({activeComponents.length})
                      </h4>
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', color: '#c084fc' }}
                      onClick={() =>
                        setAssignModal({ locationId: activeLocation.id!, type: 'component' })
                      }
                    >
                      <Plus size={12} /> Assign Component
                    </button>
                  </div>

                  {activeComponents.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {activeComponents.map((c) => (
                        <div
                          key={c.id}
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
                                background: 'rgba(192, 132, 252, 0.15)',
                                border: '1px solid rgba(192, 132, 252, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <GunpowderIcon size={15} color="#c084fc" />
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                {c.manufacturer} {c.name || c.type}
                              </span>
                              <span
                                style={{
                                  color: 'var(--text-muted)',
                                  marginLeft: 6,
                                  fontSize: '0.8rem',
                                }}
                              >
                                [{c.type}]
                              </span>
                              <span
                                style={{
                                  background: 'rgba(192, 132, 252, 0.15)',
                                  color: '#c084fc',
                                  border: '1px solid rgba(192, 132, 252, 0.35)',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  marginLeft: 8,
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                }}
                              >
                                {c.quantity} {c.weightUnit || 'ct'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleUnassignItem(activeLocation.id!, 'component', c.id!)
                            }
                            className="btn-icon"
                            style={{ color: 'var(--danger)', padding: 4 }}
                            title="Unassign component"
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
                      No reloading supplies currently assigned to this storage location.
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
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsAddModalOpen(false);
                setEditingLocation(null);
              }
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
                    Capacity Tracking Mode
                  </label>
                  <select
                    className="glass-input"
                    value={
                      form.capacityMode ||
                      (form.type === 'AmmoCan'
                        ? 'ammo'
                        : form.type === 'Other'
                          ? 'all'
                          : 'firearms')
                    }
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        capacityMode: e.target.value as 'firearms' | 'ammo' | 'all',
                      }))
                    }
                  >
                    <option value="firearms">
                      Firearms / Guns Only (Standard for Safes & Cabinets)
                    </option>
                    <option value="ammo">Ammunition Lots / Boxes (Standard for Ammo Cans)</option>
                    <option value="all">
                      All Stored Items Combined (Firearms + Accs + Ammo + Powders)
                    </option>
                  </select>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      marginTop: '2px',
                      display: 'block',
                    }}
                  >
                    {form.capacityMode === 'all'
                      ? 'Counts all stored firearms, accessories, ammunition lots, and reloading powders.'
                      : form.capacityMode === 'ammo' || form.type === 'AmmoCan'
                        ? 'Counts only ammunition lots/boxes towards the capacity limit.'
                        : 'Counts only firearms towards the capacity limit. Accessories & ammo can be stored without filling gun slots.'}
                  </span>
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
                    placeholder={
                      form.capacityMode === 'ammo' || form.type === 'AmmoCan'
                        ? 'e.g. 10 (Ammo Lots / Boxes)'
                        : form.capacityMode === 'all' || form.type === 'Other'
                          ? 'e.g. 50 (Total Stored Items)'
                          : form.type === 'Case'
                            ? 'e.g. 2 (Handguns or Long Guns)'
                            : 'e.g. 24 (Gun Capacity)'
                    }
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
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setAssignModal(null);
              }
            }}
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

                {assignModal.type === 'component' &&
                  (components.filter((c) => !assignedComponentIds.has(c.id!)).length > 0 ? (
                    components
                      .filter((c) => !assignedComponentIds.has(c.id!))
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() =>
                            handleAssignItem(assignModal.locationId, 'component', c.id!)
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
                                background: 'rgba(192, 132, 252, 0.15)',
                                border: '1px solid rgba(192, 132, 252, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <GunpowderIcon size={14} color="#c084fc" />
                            </div>
                            <div>
                              <span style={{ fontWeight: 600 }}>
                                {c.manufacturer} {c.name || c.type}
                              </span>
                              <span
                                style={{
                                  color: 'var(--text-muted)',
                                  marginLeft: 6,
                                  fontSize: '0.78rem',
                                }}
                              >
                                ({c.type})
                              </span>
                            </div>
                          </div>
                          <span
                            style={{
                              background: 'rgba(192, 132, 252, 0.15)',
                              color: '#c084fc',
                              border: '1px solid rgba(192, 132, 252, 0.35)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                            }}
                          >
                            {c.quantity} {c.weightUnit || 'ct'}
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
                      All reloading components are already assigned to storage locations.
                    </div>
                  ))}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── Storage Location QR Code Modal ─── */}
      <StorageLocationQRModal
        isOpen={!!qrModalLocation}
        onClose={() => setQrModalLocation(null)}
        location={qrModalLocation}
        itemCount={
          qrModalLocation
            ? (qrModalLocation.firearmIds?.length || 0) +
              (qrModalLocation.accessoryIds?.length || 0) +
              (qrModalLocation.ammoIds?.length || 0) +
              (qrModalLocation.componentIds?.length || 0)
            : 0
        }
      />
    </div>
  );
};
