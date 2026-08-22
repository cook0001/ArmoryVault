import { Check, Copy, Download, Printer, QrCode, Shield, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { StorageLocation } from '../types';
import { getStorageCapacityUtilization } from '../utils/StorageSync';
import { renderStorageIcon } from './StorageBadge';

interface StorageLocationQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: StorageLocation | null;
  itemCount?: number;
}

export const StorageLocationQRModal: React.FC<StorageLocationQRModalProps> = ({
  isOpen,
  onClose,
  location,
  itemCount = 0,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const qrPayload = location ? `armoryvault://storage/${location.id}` : '';

  useEffect(() => {
    if (isOpen && location) {
      generateQR();
    } else {
      setQrDataUrl('');
      setCopied(false);
    }
  }, [isOpen, location]);

  const generateQR = async () => {
    if (!location) return;
    try {
      const QRCode = (await import('qrcode')).default;
      const url = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate Storage QR code:', err);
    }
  };

  const handleCopyLink = () => {
    if (!qrPayload) return;
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveImage = () => {
    if (!qrDataUrl || !location) return;
    if (window.api && window.api.saveQRImage) {
      window.api.saveQRImage({
        itemName: `${location.name.replace(/[^a-z0-9]/gi, '_')}_Storage_QR`,
        qrDataUrl,
      });
    } else {
      const a = document.createElement('a');
      a.href = qrDataUrl;
      a.download = `${location.name.replace(/[^a-z0-9]/gi, '_')}_Storage_QR.png`;
      a.click();
    }
  };

  const fCount = location?.firearmIds?.length || 0;
  const accCount = location?.accessoryIds?.length || 0;
  const ammoCount = location?.ammoIds?.length || 0;
  const compCount = location?.componentIds?.length || 0;

  const capUtil = location
    ? getStorageCapacityUtilization(location, fCount, accCount, ammoCount, compCount)
    : null;

  const handlePrintLabel = async () => {
    if (!location || !qrDataUrl) return;
    setIsPrinting(true);
    try {
      const details = [
        `[${location.type}] Storage Container`,
        capUtil?.max
          ? `Capacity: ${capUtil.used} / ${capUtil.max} ${capUtil.unitLabel}`
          : `Items Stored: ${capUtil?.totalItems || itemCount}`,
        `ArmoryVault ID: #${location.id}`,
      ].join('\n');

      if (window.api && window.api.printQRLabel) {
        await window.api.printQRLabel({
          itemName: location.name,
          itemDetails: details,
          qrDataUrl,
        });
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Failed to print storage label:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  if (!isOpen || !location) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '92vw',
          padding: 0,
          background: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Storage Location QR Label
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Print or scan to manage container inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Label Card Preview */}
        <div
          style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '12px',
              padding: '1.25rem',
              width: '100%',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              border: '2px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* Storage Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.35rem',
              }}
            >
              {renderStorageIcon(location.type, 18)}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#64748b',
                }}
              >
                {location.type} Container
              </span>
            </div>

            {/* Storage Name - Prominently Displayed */}
            <h2
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.2,
                wordBreak: 'break-word',
              }}
            >
              {location.name}
            </h2>

            {/* QR Code Canvas/Image */}
            <div
              style={{
                background: '#ffffff',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                margin: '0.5rem 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '190px',
                height: '190px',
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${location.name}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Generating QR...</div>
              )}
            </div>

            {/* Footer Metadata */}
            <div
              style={{
                fontSize: '0.75rem',
                color: '#475569',
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                borderTop: '1px dashed #cbd5e1',
                paddingTop: '0.6rem',
                marginTop: '0.35rem',
              }}
            >
              <span>
                Capacity:{' '}
                <strong>
                  {capUtil?.max
                    ? `${capUtil.used} / ${capUtil.max} ${capUtil.unitLabel}`
                    : 'Uncapped'}
                </strong>
              </span>
              <span className="mono">ID: #{location.id}</span>
            </div>
          </div>

          {/* Deep Link Bar */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8rem',
            }}
          >
            <span
              className="mono"
              style={{
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {qrPayload}
            </span>
            <button
              onClick={handleCopyLink}
              className="btn-icon"
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Copy deep link URI"
            >
              {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            background: 'rgba(15, 23, 42, 0.95)',
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSaveImage}
            disabled={!qrDataUrl}
          >
            <Download size={15} /> Save PNG
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handlePrintLabel}
            disabled={!qrDataUrl || isPrinting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Printer size={15} /> {isPrinting ? 'Printing...' : 'Print Physical Label'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
