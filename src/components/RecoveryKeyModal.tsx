import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  Key,
  Lock,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface RecoveryKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecoveryKeyModal: React.FC<RecoveryKeyModalProps> = ({ isOpen, onClose }) => {
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Regenerate Flow
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKeyGenerated, setNewKeyGenerated] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRecoveryCode();
      setIsRegenerating(false);
      setConfirmPassword('');
      setError(null);
      setNewKeyGenerated(false);
      setCopied(false);
      setDownloaded(false);
    }
  }, [isOpen]);

  const loadRecoveryCode = async () => {
    if (window.api && window.api.getRecoveryCode) {
      try {
        const code = await window.api.getRecoveryCode();
        setRecoveryCode(code);
      } catch (e) {
        console.error('Failed to load recovery code:', e);
      }
    }
  };

  if (!isOpen) return null;

  const handleCopy = (textToCopy?: string) => {
    const key = textToCopy || recoveryCode;
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!recoveryCode) return;
    const fileContent = `=====================================================
ARMORYVAULT EMERGENCY VAULT RECOVERY KEY
=====================================================
Generated: ${new Date().toLocaleString()}
Application: ArmoryVault Local Encrypted Database

YOUR 64-CHARACTER RECOVERY KEY:
${recoveryCode}

=====================================================
INSTRUCTIONS:
1. Store this key in a secure, offline location (e.g. fireproof safe, encrypted USB).
2. If you ever forget your master vault password, launch ArmoryVault and click "Forgot Password? Use Recovery Code".
3. Paste or enter this 64-character key to instantly unlock your encrypted firearms, ammunition, and reloading database.
4. Anyone with this key can decrypt your vault. Never share it or store it in unencrypted plain text online.
=====================================================`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ArmoryVault_Recovery_Key_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleRegenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!confirmPassword) {
      setError('Please enter your current master password to re-key the vault.');
      return;
    }

    setLoading(true);
    try {
      if (window.api && window.api.regenerateRecoveryKey) {
        const res = await window.api.regenerateRecoveryKey(confirmPassword);
        if (res.success && res.newRecoveryCode) {
          setRecoveryCode(res.newRecoveryCode);
          setNewKeyGenerated(true);
          setIsRegenerating(false);
          setConfirmPassword('');
        } else {
          setError(res.error || 'Failed to regenerate recovery key. Please check your password.');
        }
      } else {
        setRecoveryCode('mock-new-regenerated-key-1234567890abcdef1234567890abcdef');
        setNewKeyGenerated(true);
        setIsRegenerating(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while re-keying the vault.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100100,
        padding: '1rem',
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          border: '1px solid #334155',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to right, rgba(30, 41, 59, 1), rgba(15, 23, 42, 1))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              <ShieldAlert size={20} style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 600 }}>
                Emergency Recovery Key
              </h2>
              <p style={{ margin: '0.15rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                Master cryptographic unlock key for your local encrypted database
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {newKeyGenerated && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
              }}
            >
              <CheckCircle2
                size={20}
                style={{ color: '#34d399', flexShrink: 0, marginTop: '2px' }}
              />
              <div>
                <strong
                  style={{
                    color: '#6ee7b7',
                    display: 'block',
                    fontSize: '0.9rem',
                    marginBottom: '0.2rem',
                  }}
                >
                  Vault Re-Keyed Successfully!
                </strong>
                <span style={{ color: '#a7f3d0', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  All database records have been re-encrypted with your new Master Key. Your old
                  recovery code is now obsolete. Please save the new key below!
                </span>
              </div>
            </div>
          )}

          {/* Key Display Card */}
          <div
            style={{
              backgroundColor: '#090d16',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.25rem',
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
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Active 64-Character Key
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                AES-256 Master
              </span>
            </div>

            <div
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.85rem',
                color: '#38bdf8',
                backgroundColor: '#030712',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                border: '1px solid #1e293b',
                wordBreak: 'break-all',
                lineHeight: 1.6,
                userSelect: 'all',
                marginBottom: '1rem',
                letterSpacing: '0.5px',
              }}
            >
              {recoveryCode || 'Loading recovery key...'}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleCopy()}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  backgroundColor: copied ? '#059669' : '#2563eb',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Recovery Key'}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleDownload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  color: downloaded ? '#34d399' : '#e2e8f0',
                  borderColor: downloaded ? '#059669' : '#475569',
                }}
              >
                {downloaded ? <Check size={16} /> : <Download size={16} />}
                {downloaded ? 'Downloaded!' : 'Download .txt Backup'}
              </button>
            </div>
          </div>

          {/* Explanation Banner */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.25rem',
              fontSize: '0.8rem',
              color: '#94a3b8',
              lineHeight: 1.5,
            }}
          >
            <p style={{ margin: '0 0 0.5rem', color: '#e2e8f0', fontWeight: 600 }}>
              💡 What is the Recovery Key?
            </p>
            <p style={{ margin: 0 }}>
              This key is the raw cryptographic Master Key that encrypts your vault. If you ever
              forget your master password, clicking{' '}
              <strong>"Forgot Password? Use Recovery Code"</strong> on the login screen and entering
              this key will immediately restore access to all your firearms, ammunition, and logs.
            </p>
          </div>

          {/* Regenerate Key Section */}
          {!isRegenerating ? (
            <div
              style={{
                borderTop: '1px solid #334155',
                paddingTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  Lost or Compromised Key?
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                  Generate a brand new recovery key and re-encrypt your vault database.
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsRegenerating(true);
                  setError(null);
                }}
                style={{
                  color: '#f59e0b',
                  borderColor: 'rgba(245, 158, 11, 0.4)',
                  fontSize: '0.8rem',
                  padding: '0.5rem 0.85rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <RefreshCw size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                Regenerate Key
              </button>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                padding: '1.25rem',
                marginTop: '0.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fbbf24', fontWeight: 600 }}>
                  Confirm Vault Re-Keying
                </h4>
              </div>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#fcd34d',
                  margin: '0 0 1rem',
                  lineHeight: 1.4,
                }}
              >
                This will generate a brand new 64-character recovery key and re-encrypt your entire
                database. Any previously printed or saved recovery keys will permanently stop
                working.
              </p>

              {error && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '6px',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '0.75rem',
                    color: '#fca5a5',
                    fontSize: '0.8rem',
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleRegenerateKey}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#e2e8f0',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Enter Current Master Password to Confirm *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '0.6rem 2.5rem 0.6rem 0.75rem',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                      }}
                      placeholder="Master Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setIsRegenerating(false);
                      setConfirmPassword('');
                    }}
                    disabled={loading}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || !confirmPassword}
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.5rem 1.25rem',
                      backgroundColor: '#d97706',
                      borderColor: '#b45309',
                    }}
                  >
                    {loading ? 'Re-Keying Vault...' : 'Confirm & Re-Key'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
            style={{ minWidth: '90px' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
