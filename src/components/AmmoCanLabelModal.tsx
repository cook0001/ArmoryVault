import { Box, HardDrive, Printer, Sparkles, Tag, X } from 'lucide-react';
import QRCode from 'qrcode';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ammo } from '../types';

interface AmmoCanLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  ammo: Ammo | null;
}

export const AmmoCanLabelModal: React.FC<AmmoCanLabelModalProps> = ({ isOpen, onClose, ammo }) => {
  const [labelFormat, setLabelFormat] = useState<'compact' | 'large'>('compact');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ammo && ammo.id) {
      const qrPayload = `AV-AMMO-${ammo.id}`;
      QRCode.toDataURL(qrPayload, {
        width: labelFormat === 'compact' ? 140 : 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [ammo, labelFormat]);

  if (!isOpen || !ammo) return null;

  const handlePrint = () => {
    window.print();
  };

  const isHandload = ammo.type === 'handload';
  const isShotgun =
    (ammo.caliber || '').toLowerCase().includes('ga') ||
    (ammo.caliber || '').toLowerCase().includes('gauge') ||
    (ammo.caliber || '').includes('.410');

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Tag size={22} style={{ color: 'var(--accent)' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Print Ammo Container Label</h2>
              <p
                style={{
                  margin: '0.2rem 0 0',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                }}
              >
                Print adhesive sticker label with load recipe & live mobile scan QR code.
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Format Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Select Label Size:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setLabelFormat('compact')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border:
                  labelFormat === 'compact'
                    ? '2px solid var(--accent)'
                    : '1px solid var(--border-light)',
                background:
                  labelFormat === 'compact' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(0,0,0,0.15)',
                color: labelFormat === 'compact' ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Box size={22} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  Compact Box Label
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  For 20 / 50 / 100-rd Ammo Boxes
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setLabelFormat('large')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border:
                  labelFormat === 'large'
                    ? '2px solid var(--accent)'
                    : '1px solid var(--border-light)',
                background:
                  labelFormat === 'large' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(0,0,0,0.15)',
                color: labelFormat === 'large' ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <HardDrive size={22} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  Large Can Label
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  For 30-Cal / 50-Cal Ammo Cans
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Real-time Label Preview */}
        <div
          style={{
            background: '#1e293b',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            ref={printRef}
            id="printable-ammo-label"
            style={{
              background: '#ffffff',
              color: '#000000',
              padding: labelFormat === 'compact' ? '0.75rem' : '1.25rem',
              borderRadius: '6px',
              border: '2px solid #000000',
              width: labelFormat === 'compact' ? '320px' : '420px',
              fontFamily: 'Arial, sans-serif',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            {/* Header: Caliber & Type */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2px solid #000',
                paddingBottom: '0.35rem',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: labelFormat === 'compact' ? '1.25rem' : '1.55rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                  }}
                >
                  {ammo.caliber}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#333',
                    textTransform: 'uppercase',
                    marginTop: '0.15rem',
                  }}
                >
                  {isHandload ? 'HANDLOAD' : ammo.manufacturer || 'FACTORY'}
                  {ammo.isPlusP ? ' +P' : ''}
                </div>
              </div>
              <div
                style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: '#555' }}
              >
                ARMORYVAULT
              </div>
            </div>

            {/* Main Details Body */}
            <div
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  fontSize: labelFormat === 'compact' ? '0.75rem' : '0.85rem',
                }}
              >
                {/* Projectile Info */}
                <div>
                  <span style={{ fontWeight: 700 }}>BULLET: </span>
                  <span>
                    {ammo.grain ? `${ammo.grain}gr ` : ''}
                    {ammo.projectile || 'Standard'}{' '}
                    {ammo.bullet_manufacturer ? `(${ammo.bullet_manufacturer})` : ''}
                  </span>
                </div>

                {/* Handload Recipe Details */}
                {isHandload && (
                  <>
                    {ammo.powder && (
                      <div>
                        <span style={{ fontWeight: 700 }}>POWDER: </span>
                        <span>
                          {ammo.powder} {ammo.powderCharge ? `@ ${ammo.powderCharge} gr` : ''}
                        </span>
                      </div>
                    )}
                    {(ammo.primer || ammo.primer_type) && (
                      <div>
                        <span style={{ fontWeight: 700 }}>PRIMER: </span>
                        <span>{ammo.primer || ammo.primer_type}</span>
                      </div>
                    )}
                    {ammo.brass && (
                      <div>
                        <span style={{ fontWeight: 700 }}>BRASS: </span>
                        <span>{ammo.brass}</span>
                      </div>
                    )}
                    {ammo.oal && (
                      <div>
                        <span style={{ fontWeight: 700 }}>OAL: </span>
                        <span>{ammo.oal}"</span>
                      </div>
                    )}
                    {isShotgun && (
                      <div>
                        <span style={{ fontWeight: 700 }}>LOAD: </span>
                        <span>
                          {ammo.shell_length ? `${ammo.shell_length} ` : ''}
                          {ammo.shot_size || ''}
                          {ammo.oz_payload ? ` (${ammo.oz_payload})` : ''}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Factory Details */}
                {!isHandload && (
                  <>
                    {ammo.upc_code && (
                      <div>
                        <span style={{ fontWeight: 700 }}>UPC: </span>
                        <span style={{ fontFamily: 'monospace' }}>{ammo.upc_code}</span>
                      </div>
                    )}
                    {isShotgun && (
                      <div>
                        <span style={{ fontWeight: 700 }}>SHELL: </span>
                        <span>
                          {ammo.shell_length ? `${ammo.shell_length} ` : ''}
                          {ammo.shot_size || ''}
                          {ammo.oz_payload ? ` (${ammo.oz_payload})` : ''}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* QR Code */}
              {qrDataUrl && (
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    style={{
                      width: labelFormat === 'compact' ? '70px' : '90px',
                      height: labelFormat === 'compact' ? '70px' : '90px',
                      display: 'block',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      marginTop: '0.1rem',
                      color: '#444',
                    }}
                  >
                    SCAN TO ADJUST
                  </div>
                </div>
              )}
            </div>

            {/* Notes if present */}
            {ammo.notes && (
              <div
                style={{
                  fontSize: '0.65rem',
                  borderTop: '1px dashed #999',
                  paddingTop: '0.2rem',
                  color: '#444',
                  fontStyle: 'italic',
                }}
              >
                Note: {ammo.notes}
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div
          className="modal-actions"
          style={{
            marginTop: '0.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Printer size={16} /> Print Label
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
