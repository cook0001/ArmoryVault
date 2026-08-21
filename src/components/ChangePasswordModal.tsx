import {
  AlertCircle,
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
  ShieldCheck,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regenerateKey, setRegenerateKey] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New key generated state
  const [newGeneratedCode, setNewGeneratedCode] = useState<string | null>(null);
  const [copiedNew, setCopiedNew] = useState(false);
  const [downloadedNew, setDownloadedNew] = useState(false);

  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setRegenerateKey(false);
      setError(null);
      setSuccess(null);
      setNewGeneratedCode(null);
      setCopiedNew(false);
      setDownloadedNew(false);
      setCopiedRecovery(false);
      loadRecoveryCode();
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

  const isLengthValid = newPassword.length >= 8;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = isLengthValid && isMatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isLengthValid) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (!isMatch) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (window.api && window.api.changePassword) {
        const result = await window.api.changePassword(currentPassword, newPassword, regenerateKey);
        if (result.success) {
          if (result.newRecoveryCode) {
            setNewGeneratedCode(result.newRecoveryCode);
            setRecoveryCode(result.newRecoveryCode);
          } else {
            setSuccess(result.message || 'Master vault password updated successfully!');
            setTimeout(() => {
              onClose();
            }, 1800);
          }
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          setError(
            result.error || 'Failed to update master password. Please verify your current password.'
          );
        }
      } else {
        if (regenerateKey) {
          setNewGeneratedCode('mock-new-recovery-code-9876543210fedcba9876543210fedcba');
        } else {
          setSuccess('Master password updated (Mock).');
          setTimeout(() => onClose(), 1500);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while changing password.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string, isNew: boolean = false) => {
    navigator.clipboard.writeText(code);
    if (isNew) {
      setCopiedNew(true);
      setTimeout(() => setCopiedNew(false), 2500);
    } else {
      setCopiedRecovery(true);
      setTimeout(() => setCopiedRecovery(false), 2500);
    }
  };

  const handleDownloadNewKey = () => {
    if (!newGeneratedCode) return;
    const fileContent = `=====================================================
ARMORYVAULT NEW EMERGENCY VAULT RECOVERY KEY
=====================================================
Generated: ${new Date().toLocaleString()}
Application: ArmoryVault Local Encrypted Database

YOUR 64-CHARACTER RECOVERY KEY:
${newGeneratedCode}

=====================================================
INSTRUCTIONS:
1. Store this key in a secure, offline location (e.g. fireproof safe, encrypted USB).
2. If you ever forget your master vault password, click "Forgot Password? Use Recovery Code".
3. Any previous recovery keys have been invalidated.
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
    setDownloadedNew(true);
    setTimeout(() => setDownloadedNew(false), 3000);
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
          maxWidth: '540px',
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
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <Key size={20} style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 600 }}>
                {newGeneratedCode ? 'New Recovery Key Generated' : 'Change Master Password'}
              </h2>
              <p style={{ margin: '0.15rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                {newGeneratedCode
                  ? 'Record your new emergency master key'
                  : 'Update your AES-256 vault encryption key phrase'}
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

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {newGeneratedCode ? (
            /* New Key Display Screen */
            <div>
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
                  size={22}
                  style={{ color: '#34d399', flexShrink: 0, marginTop: '2px' }}
                />
                <div>
                  <strong
                    style={{
                      color: '#6ee7b7',
                      display: 'block',
                      fontSize: '0.95rem',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Password Updated & Vault Re-Keyed!
                  </strong>
                  <span style={{ color: '#a7f3d0', fontSize: '0.8rem', lineHeight: 1.4 }}>
                    Your password has been changed and a <strong>brand new Recovery Key</strong> was
                    issued. All previous recovery codes are permanently disabled.
                  </span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#090d16',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.6rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#fbbf24',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    ⚠️ Your New 64-Character Recovery Key
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
                  }}
                >
                  {newGeneratedCode}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleCopy(newGeneratedCode, true)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1rem',
                      fontSize: '0.85rem',
                      backgroundColor: copiedNew ? '#059669' : '#2563eb',
                    }}
                  >
                    {copiedNew ? <Check size={16} /> : <Copy size={16} />}
                    {copiedNew ? 'Copied to Clipboard!' : 'Copy Key'}
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleDownloadNewKey}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1rem',
                      fontSize: '0.85rem',
                      color: downloadedNew ? '#34d399' : '#e2e8f0',
                      borderColor: downloadedNew ? '#059669' : '#475569',
                    }}
                  >
                    {downloadedNew ? <Check size={16} /> : <Download size={16} />}
                    {downloadedNew ? 'Downloaded!' : 'Download .txt'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onClose}
                  style={{ minWidth: '120px' }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Standard Password Change Form */
            <>
              {error && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    color: '#fca5a5',
                    fontSize: '0.85rem',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, color: '#ef4444' }} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    color: '#6ee7b7',
                    fontSize: '0.85rem',
                  }}
                >
                  <CheckCircle2 size={18} style={{ flexShrink: 0, color: '#10b981' }} />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Current Password Field */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#e2e8f0',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Current Master Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '0.95rem',
                      }}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#e2e8f0',
                      marginBottom: '0.4rem',
                    }}
                  >
                    New Master Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNew ? 'text' : 'password'}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                        backgroundColor: '#0f172a',
                        border: `1px solid ${newPassword.length > 0 ? (isLengthValid ? '#10b981' : '#f59e0b') : '#334155'}`,
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '0.95rem',
                      }}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginTop: '0.35rem',
                      fontSize: '0.75rem',
                      color: isLengthValid ? '#10b981' : '#94a3b8',
                    }}
                  >
                    {isLengthValid ? (
                      <Check size={14} />
                    ) : (
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          display: 'inline-block',
                          borderRadius: '50%',
                          border: '1px solid #64748b',
                        }}
                      />
                    )}
                    <span>Minimum 8 characters</span>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#e2e8f0',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Confirm New Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                        backgroundColor: '#0f172a',
                        border: `1px solid ${confirmPassword.length > 0 ? (isMatch ? '#10b981' : '#ef4444') : '#334155'}`,
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '0.95rem',
                      }}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginTop: '0.35rem',
                        fontSize: '0.75rem',
                        color: isMatch ? '#10b981' : '#ef4444',
                      }}
                    >
                      {isMatch ? <Check size={14} /> : <AlertCircle size={14} />}
                      <span>{isMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                    </div>
                  )}
                </div>

                {/* Regenerate Recovery Key Checkbox */}
                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={regenerateKey}
                      onChange={(e) => setRegenerateKey(e.target.checked)}
                      style={{
                        marginTop: '3px',
                        width: '1rem',
                        height: '1rem',
                        accentColor: '#3b82f6',
                        cursor: 'pointer',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                        Also generate a new Recovery Key (Re-keys vault)
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          marginTop: '0.15rem',
                          lineHeight: 1.3,
                        }}
                      >
                        Check this if your previous recovery sheet was lost or compromised. This
                        creates a brand new 64-character recovery code and invalidates older keys.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={onClose}
                    disabled={loading}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      border: '1px solid #475569',
                      backgroundColor: 'transparent',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!canSubmit}
                    style={{
                      padding: '0.65rem 1.5rem',
                      borderRadius: '8px',
                      backgroundColor: canSubmit ? '#3b82f6' : '#1e3a8a',
                      color: '#fff',
                      border: 'none',
                      cursor: canSubmit ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <ShieldCheck size={16} />
                    {loading
                      ? 'Updating Key...'
                      : regenerateKey
                        ? 'Update & Re-Key'
                        : 'Update Password'}
                  </button>
                </div>
              </form>

              {/* Current Recovery Key Reference */}
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  marginTop: '0.5rem',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert size={16} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                      Current Recovery Code
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRecovery(!showRecovery)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {showRecovery ? 'Hide' : 'View Current Key'}
                  </button>
                </div>

                {showRecovery && recoveryCode && (
                  <div
                    style={{
                      marginTop: '0.6rem',
                      padding: '0.6rem 0.75rem',
                      backgroundColor: '#090d16',
                      borderRadius: '6px',
                      border: '1px solid #1e293b',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: '#34d399',
                        wordBreak: 'break-all',
                        userSelect: 'all',
                        marginBottom: '0.4rem',
                      }}
                    >
                      {recoveryCode}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(recoveryCode, false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.25rem 0.6rem',
                        backgroundColor: copiedRecovery ? '#065f46' : 'rgba(255, 255, 255, 0.08)',
                        color: copiedRecovery ? '#34d399' : '#e2e8f0',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                      }}
                    >
                      {copiedRecovery ? <Check size={12} /> : <Copy size={12} />}
                      {copiedRecovery ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
