import { Edit, Plus, QrCode, ScanBarcode, Shield, Trash2, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Accessory, Ammo, Firearm, ReloadingComponent, StorageLocation } from '../../../types';
import { getStorageCapacityUtilization } from '../../../utils/StorageSync';
import { AccessoriesNavIcon, CartridgesIcon, GunpowderIcon } from '../../CustomIcons';
import { getAccessoryTypeColor } from '../../modals/AccessoryDetailModal';
import { renderAccessoryIcon, STORAGE_ICONS, TYPE_COLORS } from '../types';

export interface StorageLocationDetailModalProps {
  isOpen: boolean;
  location: StorageLocation | null;
  locations: StorageLocation[];
  activeFirearms: Firearm[];
  activeAccessories: Accessory[];
  activeAmmo: Ammo[];
  activeComponents: ReloadingComponent[];
  allFirearms: Firearm[];
  allAccessories: Accessory[];
  allAmmo: Ammo[];
  allComponents: ReloadingComponent[];
  onClose: () => void;
  onEdit: (loc: StorageLocation) => void;
  onDelete: (id: number) => void;
  onShowQR: (loc: StorageLocation) => void;
  onOpenAssignModal: (type: 'firearm' | 'accessory' | 'ammo' | 'component') => void;
  onAssignItem: (
    locationId: number,
    type: 'firearm' | 'accessory' | 'ammo' | 'component',
    itemId: number
  ) => Promise<void> | void;
  onUnassignItem: (
    locationId: number,
    type: 'firearm' | 'accessory' | 'ammo' | 'component',
    itemId: number
  ) => Promise<void> | void;
}

export const StorageLocationDetailModal: React.FC<StorageLocationDetailModalProps> = ({
  isOpen,
  location: activeLocation,
  locations,
  activeFirearms,
  activeAccessories,
  activeAmmo,
  activeComponents,
  allFirearms,
  allAccessories,
  allAmmo,
  allComponents,
  onClose,
  onEdit,
  onDelete,
  onShowQR,
  onOpenAssignModal,
  onAssignItem,
  onUnassignItem,
}) => {
  const [modalScanCode, setModalScanCode] = useState('');

  const handleClose = () => {
    setModalScanCode('');
    onClose();
  };

  // Find matched item from modalScanCode inside active location
  const matchedScanItem = useMemo(() => {
    if (!modalScanCode || !activeLocation) return null;
    const term = modalScanCode.trim();

    // Check Firearm QR (armoryvault://firearm/:id) or Serial or ID
    const firearmUriMatch = term.match(/^armoryvault:\/\/firearm\/(\d+)$/i);
    const firearmId = firearmUriMatch ? parseInt(firearmUriMatch[1], 10) : parseInt(term, 10);
    const matchedGun = allFirearms.find(
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
    const matchedAmmo = allAmmo.find(
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
    const matchedAcc = allAccessories.find(
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
    const matchedComp = allComponents.find(
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
  }, [
    modalScanCode,
    activeLocation,
    allFirearms,
    allAmmo,
    allAccessories,
    allComponents,
    locations,
  ]);

  if (!isOpen || !activeLocation) return null;

  const typeColor = TYPE_COLORS[activeLocation.type] || TYPE_COLORS.Other;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
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
                background: typeColor.bg,
                border: `1px solid ${typeColor.border}`,
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
                    background: typeColor.bg,
                    color: typeColor.text,
                    border: `1px solid ${typeColor.border}`,
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
                      {activeAccessories.length + activeAmmo.length + activeComponents.length > 0 &&
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
              onClick={() => onShowQR(activeLocation)}
              title="View & Print QR Code Label"
            >
              <QrCode size={14} /> QR Label
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => {
                onClose();
                onEdit(activeLocation);
              }}
            >
              <Edit size={14} /> Edit
            </button>
            <button
              onClick={handleClose}
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {matchedScanItem.details} • Current Location:{' '}
                    <strong
                      style={{
                        color: matchedScanItem.isAssignedHere ? '#34d399' : 'var(--text-secondary)',
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
                    onClick={async () => {
                      await onUnassignItem(
                        activeLocation.id!,
                        matchedScanItem.category,
                        matchedScanItem.id
                      );
                      setModalScanCode('');
                    }}
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
                    onClick={async () => {
                      await onAssignItem(
                        activeLocation.id!,
                        matchedScanItem.category,
                        matchedScanItem.id
                      );
                      setModalScanCode('');
                    }}
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
                  No inventory item found matching "{modalScanCode}". Try scanning a valid firearm
                  QR, ammo UPC/SKU, or accessory SKU.
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
                onClick={() => onOpenAssignModal('firearm')}
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
                      onClick={() => onUnassignItem(activeLocation.id!, 'firearm', f.id!)}
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
                onClick={() => onOpenAssignModal('accessory')}
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
                        onClick={() => onUnassignItem(activeLocation.id!, 'accessory', a.id!)}
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
                onClick={() => onOpenAssignModal('ammo')}
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
                      onClick={() => onUnassignItem(activeLocation.id!, 'ammo', a.id!)}
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
                onClick={() => onOpenAssignModal('component')}
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
                      onClick={() => onUnassignItem(activeLocation.id!, 'component', c.id!)}
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
            onClick={() => onDelete(activeLocation.id!)}
          >
            <Trash2 size={14} /> Delete Location
          </button>

          <button className="btn-primary" onClick={handleClose}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
