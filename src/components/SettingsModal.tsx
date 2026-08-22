import {
  BookOpen,
  CheckCircle,
  Database,
  Download,
  DownloadCloud,
  ExternalLink,
  FolderOpen,
  HardDrive,
  Key,
  Lock,
  Settings,
  Shield,
  Sliders,
  UploadCloud,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import packageJson from '../../package.json';
import { exportToCSV } from '../utils/csvExport';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLockVault?: () => void;
  onOpenSkuManager: () => void;
  onOpenChangePassword: () => void;
  onOpenRecoveryKey: () => void;
  onSettingsSaved?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = React.memo(
  ({
    isOpen,
    onClose,
    onLockVault,
    onOpenSkuManager,
    onOpenChangePassword,
    onOpenRecoveryKey,
    onSettingsSaved,
  }) => {
    const [backupPath, setBackupPath] = useState<string | null>(null);
    const [showTotalSetupValue, setShowTotalSetupValue] = useState(false);
    const [showCollectionAnalytics, setShowCollectionAnalytics] = useState(false);

    const loadSettings = useCallback(async () => {
      if (window.api && window.api.getBackupFolder) {
        const path = await window.api.getBackupFolder();
        setBackupPath(path);
      }
      if (window.api && window.api.getConfig) {
        const showSetupValue = await window.api.getConfig('showTotalSetupValue');
        setShowTotalSetupValue(!!showSetupValue);
        const showAnalytics = await window.api.getConfig('showCollectionAnalytics');
        setShowCollectionAnalytics(!!showAnalytics);
      }
    }, []);

    useEffect(() => {
      if (isOpen) {
        loadSettings();
      }
    }, [isOpen, loadSettings]);

    if (!isOpen) return null;

    const handleSelectBackup = async () => {
      if (window.api && window.api.selectBackupFolder) {
        const path = await window.api.selectBackupFolder();
        if (path) {
          setBackupPath(path);
        }
      }
    };

    const handleCreateZipBackup = async () => {
      if (window.api && window.api.createZipBackup) {
        try {
          const res: any = await window.api.createZipBackup();
          if (res === true || (res && res.success)) {
            alert('Full archive backup (.zip) successfully created!');
          } else if (res && res.canceled) {
            // User canceled file dialog
          } else {
            const detail = res && res.error ? `: ${res.error}` : '';
            alert(`Failed to create full zip archive${detail}`);
          }
        } catch (e: any) {
          console.error('Create zip backup error:', e);
          alert(`Failed to create full zip archive: ${e?.message || 'Unknown error'}`);
        }
      }
    };

    const handleRestoreBackup = async () => {
      if (!window.api || !window.api.restoreBackup) return;

      const confirmed = window.confirm(
        'Are you sure you want to restore from a backup?\n\n' +
          'This will replace your current active vault with the selected backup file (.enc or .zip).\n\n' +
          'A safety copy of your current database will be created automatically before restoring.'
      );
      if (!confirmed) return;

      try {
        const res = await window.api.restoreBackup();
        if (res.canceled) return;

        if (res.success) {
          if (res.requiresRelogin) {
            alert(
              'Vault restored successfully!\n\nThe restored backup was created with a different password or encryption key. The vault will now lock so you can log in.'
            );
            if (onLockVault) {
              onLockVault();
            } else if (window.api.lockVault) {
              await window.api.lockVault();
            }
            onClose();
          } else {
            alert('Database successfully restored from backup!');
            onClose();
            if (onSettingsSaved) onSettingsSaved();
            window.location.reload();
          }
        } else {
          alert(`Failed to restore backup: ${res.error || 'Unknown error'}`);
        }
      } catch (e: any) {
        console.error('Error restoring backup:', e);
        alert(`An error occurred while restoring the backup: ${e.message || e}`);
      }
    };

    return createPortal(
      <div
        className="modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          className="modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '680px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Settings className="text-accent" size={24} style={{ color: 'var(--accent)' }} />
              <div>
                <h2 style={{ margin: 0, padding: 0, border: 'none', fontSize: '1.4rem' }}>
                  Vault Settings
                </h2>
                <p
                  style={{
                    margin: '0.2rem 0 0',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                  }}
                >
                  Configure backups, data exports, dictionary mappings, and display preferences.
                </p>
              </div>
            </div>
            <button className="btn-icon" onClick={onClose} title="Close Settings">
              ×
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Backups Section */}
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
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <HardDrive size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>
                  Backups & Redundancy
                </h3>
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  margin: '0 0 1rem',
                }}
              >
                Keep your encrypted inventory safe across external drives or cloud sync folders
                (e.g. Dropbox, OneDrive).
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.25)',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.85rem',
                    color: backupPath ? 'var(--text-primary)' : 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {backupPath || 'No auto-backup folder configured.'}
                </div>
                <button
                  className="btn-secondary"
                  onClick={handleSelectBackup}
                  style={{
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <FolderOpen size={16} /> Choose Folder...
                </button>
              </div>

              {backupPath && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: 'var(--success)',
                    fontSize: '0.8rem',
                    marginBottom: '1rem',
                  }}
                >
                  <CheckCircle size={14} /> Auto-rotates up to 5 date-stamped encrypted vault
                  backups in this folder.
                </div>
              )}

              <div
                style={{
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-light)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <button
                  className="btn-primary"
                  onClick={handleCreateZipBackup}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'var(--success)',
                    justifyContent: 'center',
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <DownloadCloud size={16} />
                  Create Full .zip Archive
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleRestoreBackup}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                    color: 'var(--accent)',
                    borderColor: 'rgba(59, 130, 246, 0.4)',
                  }}
                  title="Restore database from an encrypted .enc or .zip backup"
                >
                  <UploadCloud size={16} />
                  Restore from Backup (.enc / .zip)
                </button>
              </div>
            </div>

            {/* Reports & Export Section */}
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
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <BookOpen size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>
                  Insurance & Reports
                </h3>
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  margin: '0 0 1rem',
                }}
              >
                Generate comprehensive documentation of your firearms and accessories for insurance
                or recordkeeping.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    if (window.api && window.api.generateInsuranceReport) {
                      try {
                        const firearms = await window.api.getFirearms();
                        const accessories = await window.api.getAccessories();
                        const totalValue =
                          firearms.reduce((sum, f) => sum + (Number(f.purchase_price) || 0), 0) +
                          accessories.reduce(
                            (sum, a) => sum + (Number(a.value) || 0) * (Number(a.quantity) || 1),
                            0
                          );

                        const reportPath = await window.api.generateInsuranceReport({
                          firearms,
                          accessories,
                          totalValue,
                        });

                        if (reportPath) {
                          alert(`Report generated successfully at:\n${reportPath}`);
                        }
                      } catch (e) {
                        console.error('Failed to generate report', e);
                        alert('An error occurred while generating the report.');
                      }
                    }
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    alignItems: 'center',
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <BookOpen size={16} /> Insurance Report (PDF)
                </button>
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    if (window.api && window.api.getFirearms && window.api.exportData) {
                      try {
                        const firearms = await window.api.getFirearms();
                        const csvString = exportToCSV(firearms);
                        await window.api.exportData(csvString, 'firearms_inventory.csv');
                      } catch (e) {
                        console.error('Failed to export CSV', e);
                        alert('An error occurred while exporting CSV.');
                      }
                    }
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    alignItems: 'center',
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <Download size={16} /> Export Firearms (CSV)
                </button>
              </div>
            </div>

            {/* Vault Security & Password Section */}
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
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <Shield size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>
                  Vault Security & Encryption
                </h3>
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  margin: '0 0 1rem',
                }}
              >
                Update your master password or view and copy your 64-character offline emergency
                recovery key.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <button
                  className="btn-secondary"
                  onClick={onOpenChangePassword}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    alignItems: 'center',
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <Key size={16} /> Change Master Password
                </button>
                <button
                  className="btn-secondary"
                  onClick={onOpenRecoveryKey}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    alignItems: 'center',
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                    color: '#60a5fa',
                  }}
                >
                  <Lock size={16} /> View Vault Recovery Key
                </button>
              </div>
            </div>

            {/* Data & Preferences Section */}
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
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <Sliders size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>
                  Preferences & Mappings
                </h3>
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  margin: '0 0 1rem',
                }}
              >
                Manage custom inventory mappings and configure view options.
              </p>

              <button
                className="btn-secondary"
                onClick={onOpenSkuManager}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                }}
              >
                <Database size={16} /> Open Custom SKU & Barcode Manager
              </button>

              <div
                style={{
                  background: 'rgba(0,0,0,0.15)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showTotalSetupValue}
                    onChange={async (e) => {
                      setShowTotalSetupValue(e.target.checked);
                      if (window.api && window.api.setConfig) {
                        await window.api.setConfig('showTotalSetupValue', e.target.checked);
                      }
                    }}
                    style={{
                      width: '1.15rem',
                      height: '1.15rem',
                      accentColor: 'var(--accent)',
                      cursor: 'pointer',
                    }}
                  />
                  <span>
                    Show <strong>Total Setup Value</strong> (Firearm + Mounted Accessories) on
                    Firearm Details
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showCollectionAnalytics}
                    onChange={async (e) => {
                      setShowCollectionAnalytics(e.target.checked);
                      if (window.api && window.api.setConfig) {
                        await window.api.setConfig('showCollectionAnalytics', e.target.checked);
                      }
                    }}
                    style={{
                      width: '1.15rem',
                      height: '1.15rem',
                      accentColor: 'var(--accent)',
                      cursor: 'pointer',
                    }}
                  />
                  <span>
                    Show <strong>Collection Value & Investment Analytics</strong> on Dashboard
                  </span>
                </label>
              </div>
            </div>

            {/* App Version & Updates Section */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  ArmoryVault{' '}
                  <span
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--accent)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      marginLeft: '0.4rem',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    v{packageJson.version}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.2rem',
                  }}
                >
                  Desktop Edition &bull; Local Encrypted Storage
                </div>
              </div>
              <button
                className="btn-secondary"
                onClick={() => {
                  if (window.api && window.api.openUrl) {
                    window.api.openUrl('https://github.com/cook0001/ArmoryVault/releases/latest');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.85rem',
                }}
              >
                <ExternalLink size={14} /> Releases & Updates
              </button>
            </div>
          </div>

          <div
            className="modal-actions"
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <button className="btn-primary" onClick={onClose} style={{ minWidth: '100px' }}>
              Done
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }
);
