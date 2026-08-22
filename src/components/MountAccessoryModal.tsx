import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  CheckCircle,
  Crosshair,
  DollarSign,
  ExternalLink,
  Eye,
  Filter,
  Flashlight,
  Layers,
  Link as LinkIcon,
  Package,
  Plus,
  PlusCircle,
  Search,
  Shield,
  Tag,
  Target,
  Unlink,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Accessory, AccessoryMount, Firearm } from '../types';
import { getAccessoryTypeColor } from './AccessoryDetailModal';
import {
  ChassisIcon,
  GunBeltIcon,
  HolsterIcon,
  MagazineIcon,
  PicatinnyMountIcon,
  ScopeIcon,
  StockIcon,
  SuppressorIcon,
  TacticalSlingIcon,
} from './CustomIcons';

export interface MountAccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFirearm: Firearm | null;
  allAccessories: Accessory[];
  allFirearms: Firearm[];
  onMountChanged: () => void;
  onOpenCreateNew?: () => void;
}

const CATEGORIES = [
  'All',
  'Optic',
  'Suppressor',
  'Light',
  'Magazine',
  'Stock',
  'Chassis',
  'Belt',
  'Holster',
  'Mount',
  'Sling',
  'Other',
] as const;

export const MountAccessoryModal: React.FC<MountAccessoryModalProps> = ({
  isOpen,
  onClose,
  targetFirearm,
  allAccessories,
  allFirearms,
  onMountChanged,
  onOpenCreateNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unmounted' | 'mounted_here'>('all');
  const [quantitiesToMount, setQuantitiesToMount] = useState<Record<number, number>>({});
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  const firearmId = targetFirearm?.id ? Number(targetFirearm.id) : null;

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 2800);
  };

  const getMountedFirearmNames = (acc: Accessory) => {
    if (!acc.mounts || acc.mounts.length === 0) return [];
    return acc.mounts
      .map((m) => {
        const found = allFirearms.find((f) => f.id === m.firearmId);
        return found ? `${found.make} ${found.model}` : `Firearm #${m.firearmId}`;
      })
      .filter(Boolean);
  };

  const filteredAccessories = useMemo(() => {
    return allAccessories.filter((acc) => {
      // Category filter
      if (selectedCategory !== 'All' && acc.type !== selectedCategory) {
        return false;
      }

      const isMountedHere = acc.mounts?.some((m) => m.firearmId === firearmId);
      const isUnmounted = !acc.mounts || acc.mounts.length === 0;

      // Status filter
      if (statusFilter === 'unmounted' && !isUnmounted) return false;
      if (statusFilter === 'mounted_here' && !isMountedHere) return false;

      // Search term filter
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const matchName = `${acc.manufacturer} ${acc.model}`.toLowerCase();
      const matchSerial = (acc.serialNumber || '').toLowerCase();
      const matchUpc = (acc.upc_code || '').toLowerCase();
      const matchNotes = (acc.notes || '').toLowerCase();
      const matchCaliber = (acc.caliber || acc.ratedCalibers || '').toLowerCase();

      return (
        matchName.includes(q) ||
        matchSerial.includes(q) ||
        matchUpc.includes(q) ||
        matchNotes.includes(q) ||
        matchCaliber.includes(q)
      );
    });
  }, [allAccessories, selectedCategory, statusFilter, searchTerm, firearmId]);

  const handleMount = async (acc: Accessory, overrideQty?: number) => {
    if (!firearmId || !window.api?.updateAccessory) return;
    setIsProcessing(acc.id || null);

    try {
      const currentMounts = acc.mounts ? [...acc.mounts] : [];
      const existingMountIdx = currentMounts.findIndex((m) => m.firearmId === firearmId);
      const chosenQty = overrideQty || quantitiesToMount[acc.id!] || 1;

      let updatedMounts: AccessoryMount[];
      if (existingMountIdx >= 0) {
        updatedMounts = currentMounts.map((m, idx) =>
          idx === existingMountIdx ? { ...m, quantity: chosenQty } : m
        );
      } else {
        updatedMounts = [...currentMounts, { firearmId, quantity: chosenQty }];
      }

      const updatedAcc: Accessory = {
        ...acc,
        mounts: updatedMounts,
      };

      await window.api.updateAccessory(acc.id!, updatedAcc);
      onMountChanged();
      showToast(
        `Mounted ${acc.manufacturer} ${acc.model} to ${targetFirearm?.make} ${targetFirearm?.model}!`,
        'success'
      );
    } catch (err: any) {
      console.error('Failed to mount accessory:', err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleUnmount = async (acc: Accessory) => {
    if (!firearmId || !window.api?.updateAccessory) return;
    setIsProcessing(acc.id || null);

    try {
      const currentMounts = acc.mounts || [];
      const updatedMounts = currentMounts.filter((m) => m.firearmId !== firearmId);

      const updatedAcc: Accessory = {
        ...acc,
        mounts: updatedMounts,
      };

      await window.api.updateAccessory(acc.id!, updatedAcc);
      onMountChanged();
      showToast(
        `Detached ${acc.manufacturer} ${acc.model} from ${targetFirearm?.make} ${targetFirearm?.model}.`,
        'info'
      );
    } catch (err: any) {
      console.error('Failed to unmount accessory:', err);
    } finally {
      setIsProcessing(null);
    }
  };

  const renderAccessoryIcon = (type: string) => {
    switch (type) {
      case 'Optic':
        return <ScopeIcon size={20} color="#38bdf8" />;
      case 'Suppressor':
        return <SuppressorIcon size={20} color="#f59e0b" />;
      case 'Light':
        return <Flashlight size={20} color="#fbbf24" />;
      case 'Magazine':
        return <MagazineIcon size={20} color="#c084fc" />;
      case 'Stock':
        return <StockIcon size={20} color="#10b981" />;
      case 'Chassis':
        return <ChassisIcon size={20} color="#06b6d4" />;
      case 'Belt':
        return <GunBeltIcon size={20} color="#eab308" />;
      case 'Holster':
        return <HolsterIcon size={20} color="#34d399" />;
      case 'Mount':
        return <PicatinnyMountIcon size={20} color="#60a5fa" />;
      case 'Sling':
        return <TacticalSlingIcon size={20} color="#ec4899" />;
      default:
        return <Package size={20} color="var(--text-secondary)" />;
    }
  };

  if (!isOpen || !targetFirearm) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: '95%',
          maxWidth: '850px',
          maxHeight: '90vh',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LinkIcon size={20} color="#38bdf8" />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                Mount Accessory to Firearm
              </h2>
              <p
                style={{
                  margin: '0.15rem 0 0',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Target:{' '}
                <strong style={{ color: '#38bdf8' }}>
                  {targetFirearm.make} {targetFirearm.model}
                </strong>{' '}
                {targetFirearm.caliber ? `(${targetFirearm.caliber})` : ''}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onOpenCreateNew && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  onClose();
                  onOpenCreateNew();
                }}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <PlusCircle size={15} /> + Create New Accessory
              </button>
            )}
            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              style={{ padding: '0.4rem', borderRadius: '8px' }}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Feedback Toast Banner */}
        {feedbackToast && (
          <div
            style={{
              padding: '0.6rem 1.5rem',
              background:
                feedbackToast.type === 'success'
                  ? 'rgba(34, 197, 94, 0.2)'
                  : 'rgba(56, 189, 248, 0.2)',
              borderBottom: `1px solid ${
                feedbackToast.type === 'success'
                  ? 'rgba(34, 197, 94, 0.4)'
                  : 'rgba(56, 189, 248, 0.4)'
              }`,
              color: feedbackToast.type === 'success' ? '#4ade80' : '#38bdf8',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle size={16} />
            <span>{feedbackToast.message}</span>
          </div>
        )}

        {/* Controls: Search, Category Chips & Status Filter */}
        <div
          style={{
            padding: '1rem 1.5rem 0.5rem',
            background: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Search Bar & Status Tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div
              style={{
                position: 'relative',
                flex: 1,
                minWidth: '220px',
              }}
            >
              <Search
                size={16}
                color="var(--text-secondary)"
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search by manufacturer, model, serial #, caliber..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '2.4rem',
                  height: '38px',
                  fontSize: '0.85rem',
                }}
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '0.6rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '8px',
                padding: '2px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: statusFilter === 'all' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                  color: statusFilter === 'all' ? '#38bdf8' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                All ({allAccessories.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('unmounted')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    statusFilter === 'unmounted' ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
                  color: statusFilter === 'unmounted' ? '#4ade80' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                Available / Unmounted (
                {allAccessories.filter((a) => !a.mounts || a.mounts.length === 0).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('mounted_here')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    statusFilter === 'mounted_here' ? 'rgba(192, 132, 252, 0.25)' : 'transparent',
                  color: statusFilter === 'mounted_here' ? '#c084fc' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                Mounted Here (
                {
                  allAccessories.filter((a) => a.mounts?.some((m) => m.firearmId === firearmId))
                    .length
                }
                )
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div
            style={{
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              paddingBottom: '0.35rem',
            }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === 'All'
                  ? allAccessories.length
                  : allAccessories.filter((a) => a.type === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: isSelected
                      ? '1px solid #38bdf8'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                    color: isSelected ? '#38bdf8' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <span>{cat}</span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      opacity: 0.75,
                      background: 'rgba(255,255,255,0.08)',
                      padding: '1px 5px',
                      borderRadius: '10px',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Accessory Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {filteredAccessories.length > 0 ? (
            filteredAccessories.map((acc) => {
              const typeColor = getAccessoryTypeColor(acc.type);
              const isMountedHere = acc.mounts?.some((m) => m.firearmId === firearmId);
              const currentMountHere = acc.mounts?.find((m) => m.firearmId === firearmId);
              const mountedFirearms = getMountedFirearmNames(acc);
              const isMountedElsewhere = !isMountedHere && mountedFirearms.length > 0;
              const isUnmounted = !acc.mounts || acc.mounts.length === 0;

              const totalQty = acc.quantity || 1;
              const currentlyMountedHereQty = currentMountHere?.quantity || 1;
              const selectedQty =
                quantitiesToMount[acc.id!] !== undefined
                  ? quantitiesToMount[acc.id!]
                  : isMountedHere
                    ? currentlyMountedHereQty
                    : 1;

              const isItemBusy = isProcessing === acc.id;

              return (
                <div
                  key={acc.id}
                  style={{
                    background: isMountedHere
                      ? 'rgba(192, 132, 252, 0.06)'
                      : 'rgba(30, 41, 59, 0.4)',
                    border: isMountedHere
                      ? '1px solid rgba(192, 132, 252, 0.35)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Left: Thumbnail & Core Info */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '10px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {acc.photo ? (
                        <img
                          src={
                            acc.photo.startsWith('local-file://')
                              ? acc.photo
                              : `local-file://${acc.photo}`
                          }
                          alt={acc.model}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        renderAccessoryIcon(acc.type)
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          marginBottom: '0.2rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            background: typeColor.bg,
                            color: typeColor.text,
                            border: `1px solid ${typeColor.border}`,
                            padding: '0.08rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {acc.type}
                        </span>

                        {/* Status Badges */}
                        {isMountedHere ? (
                          <span
                            style={{
                              background: 'rgba(192, 132, 252, 0.2)',
                              color: '#c084fc',
                              border: '1px solid rgba(192, 132, 252, 0.4)',
                              padding: '0.08rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <CheckCircle size={10} color="#c084fc" />
                            <span>Mounted to this Firearm ({currentlyMountedHereQty}x)</span>
                          </span>
                        ) : isMountedElsewhere ? (
                          <span
                            style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                              padding: '0.08rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <LinkIcon size={10} color="#f59e0b" />
                            <span>Mounted on: {mountedFirearms.join(', ')}</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: '#4ade80',
                              border: '1px solid rgba(34, 197, 94, 0.35)',
                              padding: '0.08rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Shield size={10} color="#4ade80" />
                            <span>Available / In Storage</span>
                          </span>
                        )}

                        {acc.round_count !== undefined && acc.round_count > 0 && (
                          <span
                            style={{
                              background: 'rgba(56, 189, 248, 0.1)',
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              padding: '0.08rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Target size={10} color="#38bdf8" />
                            <span>{acc.round_count.toLocaleString()} rds</span>
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {totalQty > 1 ? `${totalQty}x ` : ''}
                        {acc.manufacturer} {acc.model}
                      </div>

                      {/* Specs snippet */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          marginTop: '0.2rem',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          flexWrap: 'wrap',
                        }}
                      >
                        {acc.value !== null && acc.value !== undefined && (
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            ${acc.value.toLocaleString()}
                          </span>
                        )}
                        {acc.magnification && <span>Magnification: {acc.magnification}</span>}
                        {acc.lumens && <span>{acc.lumens} Lumens</span>}
                        {acc.caliber && <span>Caliber: {acc.caliber}</span>}
                        {acc.capacity && <span>Capacity: {acc.capacity}rd</span>}
                        {acc.actionInlet && <span>Inlet: {acc.actionInlet}</span>}
                        {acc.stockType && <span>Type: {acc.stockType}</span>}
                        {acc.lengthOfPull && <span>LOP: {acc.lengthOfPull}</span>}
                        {acc.beltType && <span>Belt: {acc.beltType}</span>}
                        {acc.beltWidth && <span>Width: {acc.beltWidth}</span>}
                        {acc.cartridgeLoopCaliber && (
                          <span>
                            Loops: {acc.cartridgeLoopCount ? `${acc.cartridgeLoopCount}x ` : ''}
                            {acc.cartridgeLoopCaliber}
                          </span>
                        )}
                        {acc.serialNumber && <span>SN: {acc.serialNumber}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions & Quantity Stepper */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flexShrink: 0,
                    }}
                  >
                    {/* Quantity Selector if multi-quantity */}
                    {totalQty > 1 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'rgba(0, 0, 0, 0.3)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Qty:
                        </span>
                        <input
                          type="number"
                          min="1"
                          max={totalQty}
                          value={selectedQty}
                          onChange={(e) => {
                            const val = Math.max(
                              1,
                              Math.min(totalQty, parseInt(e.target.value) || 1)
                            );
                            setQuantitiesToMount((prev) => ({ ...prev, [acc.id!]: val }));
                          }}
                          style={{
                            width: '45px',
                            padding: '0.15rem 0.3rem',
                            fontSize: '0.8rem',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            textAlign: 'center',
                          }}
                          disabled={isItemBusy}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          / {totalQty}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {isMountedHere ? (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {totalQty > 1 && selectedQty !== currentlyMountedHereQty && (
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => handleMount(acc, selectedQty)}
                            disabled={isItemBusy}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.4rem 0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Check size={13} /> Update Qty
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleUnmount(acc)}
                          disabled={isItemBusy}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.4rem 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: '#f87171',
                            borderColor: 'rgba(248, 113, 113, 0.3)',
                          }}
                        >
                          <Unlink size={13} /> Unmount
                        </button>
                      </div>
                    ) : isMountedElsewhere ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleMount(acc, selectedQty)}
                        disabled={isItemBusy}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.4rem 0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: '#fbbf24',
                          borderColor: 'rgba(251, 191, 36, 0.35)',
                        }}
                      >
                        <ArrowRightLeft size={13} /> Transfer &amp; Mount
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleMount(acc, selectedQty)}
                        disabled={isItemBusy}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.4rem 0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <LinkIcon size={13} /> Mount to Firearm
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '12px',
                border: '1px dashed rgba(255,255,255,0.1)',
              }}
            >
              <Package
                size={36}
                color="var(--text-secondary)"
                style={{ opacity: 0.5, marginBottom: '0.5rem' }}
              />
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 0.25rem' }}>
                No matching accessories found
              </p>
              <p
                style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1rem' }}
              >
                {searchTerm
                  ? `No accessories matched "${searchTerm}". Try a different filter or search term.`
                  : 'You have no accessories in inventory under this category.'}
              </p>
              {onOpenCreateNew && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    onClose();
                    onOpenCreateNew();
                  }}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.45rem 1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <PlusCircle size={16} /> + Add New Accessory to Inventory
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.8)',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing <strong>{filteredAccessories.length}</strong> of{' '}
            <strong>{allAccessories.length}</strong> total accessories in your vault.
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
