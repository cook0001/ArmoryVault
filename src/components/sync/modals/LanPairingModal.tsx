import { Info, RefreshCw, Smartphone, Sparkles, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

export interface LanPairingModalProps {
  isOpen: boolean;
  syncQrUrl: string;
  localIp: string;
  networkInterfaces: Array<{ name: string; address: string; score: number; isVirtual: boolean }>;
  onClose: () => void;
  onSelectIp: (ip: string) => void;
  onTestPair: (deviceName: string) => void;
}

export const LanPairingModal: React.FC<LanPairingModalProps> = ({
  isOpen,
  syncQrUrl,
  localIp,
  networkInterfaces,
  onClose,
  onSelectIp,
  onTestPair,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', textAlign: 'center' }}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              textAlign: 'left',
            }}
          >
            <Smartphone size={22} style={{ color: 'var(--accent)' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Pair Mobile Companion</h2>
              <p
                style={{
                  margin: '0.15rem 0 0',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                }}
              >
                Connect phone over Wi-Fi to sync barcode scans &amp; logs.
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Open the <strong>ArmoryVault Companion App</strong> on your phone and point your camera
            at this QR code.
          </p>

          <div
            style={{
              background: '#ffffff',
              padding: '1rem',
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {syncQrUrl ? (
              <img
                src={syncQrUrl}
                alt="Pairing QR Code"
                style={{
                  width: '220px',
                  height: '220px',
                  display: 'block',
                  borderRadius: '8px',
                }}
              />
            ) : (
              <div
                style={{
                  width: '220px',
                  height: '220px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                <RefreshCw size={24} className="spin" />
              </div>
            )}
          </div>

          {/* Real-time Listening Badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '20px',
                padding: '0.4rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
              }}
            >
              <span className="pulse-dot" />
              <span>
                LAN Service: <strong>{localIp || 'Local Network'}:3456</strong>
              </span>
            </div>

            {networkInterfaces.filter((nic) => !nic.isVirtual).length > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>Adapter:</span>
                <select
                  value={localIp}
                  onChange={(e) => onSelectIp(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '6px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.75rem',
                    outline: 'none',
                  }}
                >
                  {networkInterfaces
                    .filter((nic) => !nic.isVirtual)
                    .map((nic) => (
                      <option key={nic.address} value={nic.address}>
                        {nic.name} ({nic.address})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.02)',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Info size={15} color="#38bdf8" style={{ flexShrink: 0 }} />
            <span>
              Once scanned, this window will automatically close and show your paired confirmation.
            </span>
          </div>
        </div>

        <div
          className="modal-actions"
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onTestPair('Companion App (Simulated)')}
            style={{ fontSize: '0.8rem', opacity: 0.7 }}
            title="Test pair event locally"
          >
            <Sparkles size={14} /> Test Pair
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
