import { Shield, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import type { Accessory, Ammo, Firearm, ReloadingComponent } from '../../../types';
import { CartridgesIcon, GunpowderIcon } from '../../CustomIcons';
import { getAccessoryTypeColor } from '../../modals/AccessoryDetailModal';
import { renderAccessoryIcon } from '../types';

export interface StorageAssignItemModalProps {
  isOpen: boolean;
  assignModal: {
    locationId: number;
    type: 'firearm' | 'accessory' | 'ammo' | 'component';
  } | null;
  firearms: Firearm[];
  accessories: Accessory[];
  ammoList: Ammo[];
  components: ReloadingComponent[];
  assignedFirearmIds: Set<number>;
  assignedAccessoryIds: Set<number>;
  assignedAmmoIds: Set<number>;
  assignedComponentIds: Set<number>;
  onClose: () => void;
  onAssign: (
    locationId: number,
    type: 'firearm' | 'accessory' | 'ammo' | 'component',
    itemId: number
  ) => Promise<void> | void;
}

export const StorageAssignItemModal: React.FC<StorageAssignItemModalProps> = ({
  isOpen,
  assignModal,
  firearms,
  accessories,
  ammoList,
  components,
  assignedFirearmIds,
  assignedAccessoryIds,
  assignedAmmoIds,
  assignedComponentIds,
  onClose,
  onAssign,
}) => {
  if (!isOpen || !assignModal) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
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
                : assignModal.type === 'ammo'
                  ? 'Ammunition'
                  : 'Reloading Supply'}
          </h2>
          <button
            onClick={onClose}
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
                    onClick={() => onAssign(assignModal.locationId, 'firearm', f.id!)}
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
                      onClick={() => onAssign(assignModal.locationId, 'accessory', a.id!)}
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
                    onClick={() => onAssign(assignModal.locationId, 'ammo', a.id!)}
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
                    onClick={() => onAssign(assignModal.locationId, 'component', c.id!)}
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
  );
};
