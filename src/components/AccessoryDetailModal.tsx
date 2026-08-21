import {
  AlertTriangle,
  Calendar,
  Camera,
  CheckCircle,
  Crosshair,
  DollarSign,
  Edit,
  ExternalLink,
  Info,
  Layers,
  Link as LinkIcon,
  Maximize2,
  Shield,
  Sparkles,
  Tag,
  Target,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Accessory, Firearm } from '../types';
import { Lightbox } from './Lightbox';

interface AccessoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessory: Accessory | null;
  firearms: Firearm[];
  onEdit?: (accessory: Accessory) => void;
  onDelete?: (id: number) => void;
}

export const getAccessoryTypeColor = (type: string) => {
  switch (type) {
    case 'Optic':
      return {
        text: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.15)',
        border: 'rgba(56, 189, 248, 0.35)',
      };
    case 'Suppressor':
      return {
        text: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.35)',
      };
    case 'Light':
      return {
        text: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.15)',
        border: 'rgba(251, 191, 36, 0.35)',
      };
    case 'Magazine':
      return {
        text: '#c084fc',
        bg: 'rgba(192, 132, 252, 0.15)',
        border: 'rgba(192, 132, 252, 0.35)',
      };
    case 'Holster':
      return {
        text: '#34d399',
        bg: 'rgba(52, 211, 153, 0.15)',
        border: 'rgba(52, 211, 153, 0.35)',
      };
    case 'Mount':
      return {
        text: '#60a5fa',
        bg: 'rgba(96, 165, 250, 0.15)',
        border: 'rgba(96, 165, 250, 0.35)',
      };
    case 'Sling':
      return {
        text: '#fb923c',
        bg: 'rgba(251, 146, 60, 0.15)',
        border: 'rgba(251, 146, 60, 0.35)',
      };
    default:
      return {
        text: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.15)',
        border: 'rgba(148, 163, 184, 0.35)',
      };
  }
};

export const AccessoryDetailModal: React.FC<AccessoryDetailModalProps> = ({
  isOpen,
  onClose,
  accessory,
  firearms,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  if (!isOpen || !accessory) return null;

  const typeStyle = getAccessoryTypeColor(accessory.type);

  // Compile all photos (photo + photos array)
  const allPhotos: string[] = [];
  if (accessory.photo) allPhotos.push(accessory.photo);
  if (accessory.photos && accessory.photos.length > 0) {
    accessory.photos.forEach((p) => {
      if (p && !allPhotos.includes(p)) allPhotos.push(p);
    });
  }

  const quantity = accessory.quantity && accessory.quantity > 0 ? accessory.quantity : 1;
  const unitValue = accessory.value || 0;
  const totalValue = unitValue * quantity;

  // Calculate total mounted quantity
  const totalMounted = accessory.mounts
    ? accessory.mounts.reduce((sum, m) => sum + (m.quantity || 1), 0)
    : 0;
  const unmountedCount = Math.max(0, quantity - totalMounted);

  const getMountedFirearm = (firearmId: number) => {
    return firearms.find((f) => f.id === firearmId);
  };

  const handleNavigateToFirearm = (firearmId: number) => {
    onClose();
    navigate(`/details/${firearmId}`);
  };

  return createPortal(
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100100 }}>
        <div
          className="modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '780px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
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
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}
            >
              <span
                style={{
                  background: typeStyle.bg,
                  color: typeStyle.text,
                  border: `1px solid ${typeStyle.border}`,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {accessory.type}
              </span>

              {accessory.round_count !== undefined && accessory.round_count > 0 && (
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Target size={13} /> {accessory.round_count.toLocaleString()} rounds logged
                </span>
              )}

              {accessory.is_nfa && (
                <span
                  style={{
                    background:
                      accessory.stamp_status === 'Approved'
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)',
                    color: accessory.stamp_status === 'Approved' ? '#4ade80' : '#fbbf24',
                    border: `1px solid ${accessory.stamp_status === 'Approved' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  🛡️ NFA{' '}
                  {accessory.stamp_status ? accessory.stamp_status.toUpperCase() : 'REGISTERED'}
                </span>
              )}

              {accessory.upc_code && (
                <span
                  style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#c084fc',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                  }}
                >
                  SKU: {accessory.upc_code}
                </span>
              )}
            </div>

            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              title="Close"
              style={{ fontSize: '1.25rem' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div
            style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Title & Valuation Hero Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                paddingBottom: '1rem',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {accessory.manufacturer} {accessory.model}
                </h2>
                <div
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {accessory.supportedModels
                    ? `Designed for: ${accessory.supportedModels}`
                    : `${accessory.type} Component & Gear`}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>
                  $
                  {totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                {quantity > 1 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    $
                    {unitValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    each ({quantity} in stock)
                  </div>
                )}
              </div>
            </div>

            {/* Photo Gallery & Hero Visual */}
            {allPhotos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                  onClick={() => setActivePhotoIndex(0)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '240px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-light)',
                    cursor: 'pointer',
                  }}
                  title="Click to view full-resolution photo in Lightbox"
                >
                  <img
                    src={
                      allPhotos[0].startsWith('local-file://')
                        ? allPhotos[0]
                        : `local-file://${allPhotos[0]}`
                    }
                    alt={accessory.model}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      background: 'rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(4px)',
                      color: '#fff',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Maximize2 size={13} /> Fullscreen Lightbox
                  </div>
                </div>

                {allPhotos.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      overflowX: 'auto',
                      paddingBottom: '0.25rem',
                    }}
                  >
                    {allPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--border-light)',
                          flexShrink: 0,
                          cursor: 'pointer',
                        }}
                      >
                        <img
                          src={photo.startsWith('local-file://') ? photo : `local-file://${photo}`}
                          alt={`Thumbnail ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Technical Specifications Deck */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '1.25rem',
              }}
            >
              <h3
                style={{
                  fontSize: '0.95rem',
                  margin: '0 0 1rem 0',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Technical Specifications & Logistics
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Specific field tiles */}
                {accessory.magnification && (
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.2rem',
                      }}
                    >
                      Magnification / Objective
                    </div>
                    <strong style={{ fontSize: '0.95rem', color: '#38bdf8' }}>
                      {accessory.magnification}
                    </strong>
                  </div>
                )}

                {accessory.lumens && (
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.2rem',
                      }}
                    >
                      Output Lumens
                    </div>
                    <strong style={{ fontSize: '0.95rem', color: '#fbbf24' }}>
                      {accessory.lumens.toLocaleString()} Lumens
                    </strong>
                  </div>
                )}

                {accessory.ratedCalibers && (
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.2rem',
                      }}
                    >
                      Rated Calibers
                    </div>
                    <strong style={{ fontSize: '0.95rem', color: '#f59e0b' }}>
                      {accessory.ratedCalibers}
                    </strong>
                  </div>
                )}

                {accessory.caliber && (
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.2rem',
                      }}
                    >
                      Caliber
                    </div>
                    <strong style={{ fontSize: '0.95rem' }}>{accessory.caliber}</strong>
                  </div>
                )}

                {accessory.capacity && (
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.2rem',
                      }}
                    >
                      Magazine Capacity
                    </div>
                    <strong style={{ fontSize: '0.95rem', color: '#c084fc' }}>
                      {accessory.capacity} Rounds
                    </strong>
                  </div>
                )}

                {accessory.serialNumber && (
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.2rem',
                      }}
                    >
                      Serial Number
                    </div>
                    <strong style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}>
                      {accessory.serialNumber}
                    </strong>
                  </div>
                )}

                {accessory.purchaseDate && (
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.2rem',
                      }}
                    >
                      Purchase Date
                    </div>
                    <strong style={{ fontSize: '0.95rem' }}>{accessory.purchaseDate}</strong>
                  </div>
                )}

                <div
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Inventory Status
                  </div>
                  <strong style={{ fontSize: '0.95rem' }}>
                    {totalMounted > 0 ? (
                      <span style={{ color: '#38bdf8' }}>
                        Mounted ({totalMounted}) • In Storage ({unmountedCount})
                      </span>
                    ) : (
                      <span style={{ color: '#4ade80' }}>In Storage ({quantity})</span>
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {/* NFA Compliance Card (if applicable) */}
            {accessory.is_nfa && (
              <div
                style={{
                  background: 'rgba(234, 179, 8, 0.05)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <Shield size={18} style={{ color: '#fbbf24' }} />
                  <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 600, color: '#fbbf24' }}>
                    ATF / NFA Registration Details
                  </h3>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      NFA Item Classification
                    </div>
                    <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>
                      {accessory.nfa_type || 'Suppressor'}
                    </strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Registration Type
                    </div>
                    <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>
                      {accessory.registration_type || 'Trust'}
                    </strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Tax Stamp Status
                    </div>
                    <strong
                      style={{
                        fontSize: '0.85rem',
                        color: accessory.stamp_status === 'Approved' ? '#4ade80' : '#fbbf24',
                      }}
                    >
                      {accessory.stamp_status || 'Pending'}
                    </strong>
                  </div>
                  {accessory.stamp_submitted_date && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Form 4 Submitted
                      </div>
                      <strong style={{ fontSize: '0.85rem' }}>
                        {accessory.stamp_submitted_date}
                      </strong>
                    </div>
                  )}
                  {accessory.stamp_approved_date && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Stamp Approved
                      </div>
                      <strong style={{ fontSize: '0.85rem', color: '#4ade80' }}>
                        {accessory.stamp_approved_date}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mounted Firearms Allocations Deck */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '1.25rem',
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
                <h3
                  style={{
                    fontSize: '0.95rem',
                    margin: 0,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Firearm Mounting Deployments
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {totalMounted} of {quantity} units deployed
                </span>
              </div>

              {accessory.mounts && accessory.mounts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {accessory.mounts.map((mount, idx) => {
                    const firearm = getMountedFirearm(mount.firearmId);
                    return (
                      <div
                        key={idx}
                        onClick={() => firearm && handleNavigateToFirearm(mount.firearmId)}
                        style={{
                          background: 'rgba(56, 189, 248, 0.07)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: firearm ? 'pointer' : 'default',
                          transition: 'background 0.15s ease',
                        }}
                        className="hover-card"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <LinkIcon size={16} style={{ color: 'var(--accent)' }} />
                          <div>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                              {firearm
                                ? `${firearm.make} ${firearm.model}`
                                : `Firearm #${mount.firearmId}`}
                            </strong>
                            {firearm && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {firearm.caliber} &bull; SN: {firearm.serial_number || 'N/A'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span
                            style={{
                              background: 'rgba(0,0,0,0.3)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            Mounted Qty: {mount.quantity}
                          </span>
                          {firearm && <ExternalLink size={15} style={{ color: 'var(--accent)' }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '1rem',
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-light)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                  }}
                >
                  Not currently mounted to any firearm. In standalone vault storage.
                </div>
              )}
            </div>

            {/* Notes Section */}
            {accessory.notes && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <h3
                  style={{
                    fontSize: '0.85rem',
                    margin: '0 0 0.5rem 0',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Field Notes & Configuration
                </h3>
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                  }}
                >
                  {accessory.notes}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.95)',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              {onDelete && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to delete ${accessory.manufacturer} ${accessory.model}?`
                      )
                    ) {
                      onDelete(accessory.id!);
                      onClose();
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 0.9rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <Trash2 size={15} /> Delete Accessory
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {onEdit && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    onClose();
                    onEdit(accessory);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 1rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <Edit size={15} /> Edit Accessory
                </button>
              )}
              <button
                type="button"
                className="btn-primary"
                onClick={onClose}
                style={{ minWidth: '90px', padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {activePhotoIndex !== null && (
        <Lightbox
          images={allPhotos}
          initialIndex={activePhotoIndex}
          onClose={() => setActivePhotoIndex(null)}
        />
      )}
    </>,
    document.body
  );
};
