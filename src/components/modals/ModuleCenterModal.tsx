import {
  AlertTriangle,
  Blocks,
  BookOpen,
  Check,
  Crosshair,
  Database,
  Download,
  FlaskConical,
  HardDrive,
  Info,
  Layers,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useModules } from '../../modules/registry/ModuleContext';
import { ArmoryModule } from '../../modules/registry/types';

interface ModuleCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetModuleId?: string;
}

const MODULE_ESTIMATED_SIZES: Record<string, string> = {
  reloading: '26 KB',
  maintenance: '22 KB',
  ballistics: '11 KB',
  boundbook: '7 KB',
  nfa: '6 KB',
};

export const ModuleCenterModal: React.FC<ModuleCenterModalProps> = ({
  isOpen,
  onClose,
  targetModuleId,
}) => {
  const {
    availableModules,
    installedModules,
    diskModules,
    remoteModules,
    isCheckingRemote,
    lastCheckedRemote,
    checkRemote,
    isInstalled,
    isDownloaded,
    isDownloading,
    downloadProgress,
    installModule,
    downloadAndInstallModule,
    uninstallModule,
    deleteDiskFiles,
    archives,
  } = useModules();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmUninstallMod, setConfirmUninstallMod] = useState<ArmoryModule | null>(null);
  const [deleteFilesOnUninstall, setDeleteFilesOnUninstall] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  if (!isOpen) return null;

  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'reloading':
        return <FlaskConical size={24} className="text-purple-400" />;
      case 'maintenance':
        return <Wrench size={24} className="text-amber-400" />;
      case 'ballistics':
        return <Crosshair size={24} className="text-emerald-400" />;
      case 'nfa':
        return <ShieldCheck size={24} className="text-blue-400" />;
      case 'boundbook':
        return <BookOpen size={24} className="text-indigo-400" />;
      default:
        return <Blocks size={24} className="text-cyan-400" />;
    }
  };

  const handleInstall = async (mod: ArmoryModule) => {
    setProcessingId(mod.manifest.id);
    try {
      const downloaded = isDownloaded(mod.manifest.id);
      let res: { success: boolean; restoredRecords?: number; error?: string };

      if (downloaded) {
        res = await installModule(mod.manifest.id, true);
      } else {
        res = await downloadAndInstallModule(mod.manifest.id);
      }

      if (!res.success) {
        throw new Error(res.error || 'Installation failed');
      }

      if (res.restoredRecords && res.restoredRecords > 0) {
        setFeedbackNotice({
          text: `Installed ${mod.manifest.name} and restored ${res.restoredRecords} archived records!`,
          type: 'success',
        });
      } else {
        setFeedbackNotice({
          text: `Successfully ${downloaded ? 'activated' : 'downloaded & installed'} ${mod.manifest.name}!`,
          type: 'success',
        });
      }
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (e: any) {
      setFeedbackNotice({
        text: `Failed to install ${mod.manifest.name}: ${e.message}`,
        type: 'info',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmUninstall = async () => {
    if (!confirmUninstallMod) return;
    const mod = confirmUninstallMod;
    setProcessingId(mod.manifest.id);
    setConfirmUninstallMod(null);

    try {
      const res = await uninstallModule(mod.manifest.id, true, deleteFilesOnUninstall);
      const count = res.totalRecords || 0;
      const fileNotice = deleteFilesOnUninstall ? ' and module files removed from disk' : '';
      setFeedbackNotice({
        text: `Uninstalled ${mod.manifest.name}. Archived ${count} records${fileNotice}.`,
        type: 'info',
      });
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (e: any) {
      setFeedbackNotice({
        text: `Error uninstalling ${mod.manifest.name}: ${e.message}`,
        type: 'info',
      });
    } finally {
      setProcessingId(null);
      setDeleteFilesOnUninstall(false);
    }
  };

  const handlePurgeFiles = async (mod: ArmoryModule) => {
    setProcessingId(mod.manifest.id);
    try {
      const res = await deleteDiskFiles(mod.manifest.id);
      if (res.success) {
        setFeedbackNotice({
          text: `Removed module files for ${mod.manifest.name} from disk.`,
          type: 'info',
        });
        setTimeout(() => setFeedbackNotice(null), 4000);
      }
    } catch (e: any) {
      setFeedbackNotice({
        text: `Failed to remove files: ${e.message}`,
        type: 'info',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckRemote = async () => {
    try {
      await checkRemote();
      setFeedbackNotice({
        text: 'Checked GitHub (cook0001/ArmoryVault-Modules). Catalog is up to date!',
        type: 'info',
      });
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (e: any) {
      setFeedbackNotice({
        text: `Error checking GitHub: ${e.message}`,
        type: 'info',
      });
      setTimeout(() => setFeedbackNotice(null), 4000);
    }
  };

  const filteredModules = availableModules.filter((mod) => {
    const matchesSearch =
      mod.manifest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.manifest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.manifest.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || mod.manifest.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, #38bdf8)',
              }}
            >
              <Blocks size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                Module Center
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Install and manage modular extensions from GitHub. Archived module data travels with
                your backups.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              className="btn-secondary"
              disabled={isCheckingRemote}
              onClick={handleCheckRemote}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                cursor: isCheckingRemote ? 'default' : 'pointer',
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
              title="Query cook0001/ArmoryVault-Modules on GitHub for new or updated extensions"
            >
              <RefreshCw
                size={14}
                className={isCheckingRemote ? 'animate-spin text-sky-400' : ''}
              />
              <span>{isCheckingRemote ? 'Checking GitHub...' : 'Check for New Modules'}</span>
            </button>
            <button
              className="btn-icon"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '8px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackNotice && (
          <div
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor:
                feedbackNotice.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(56, 189, 248, 0.15)',
              borderBottom: `1px solid ${
                feedbackNotice.type === 'success'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : 'rgba(56, 189, 248, 0.3)'
              }`,
              color: feedbackNotice.type === 'success' ? '#34d399' : '#38bdf8',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Sparkles size={16} />
            <span>{feedbackNotice.text}</span>
          </div>
        )}

        {/* Filter / Search Deck */}
        <div
          style={{
            padding: '1rem 1.5rem',
            display: 'flex',
            gap: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
              }}
            />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {(['all', 'bench', 'armorer', 'range', 'compliance'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor:
                    selectedCategory === cat
                      ? 'var(--accent, #38bdf8)'
                      : 'rgba(255, 255, 255, 0.08)',
                  background: selectedCategory === cat ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: selectedCategory === cat ? '#38bdf8' : '#94a3b8',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  fontWeight: selectedCategory === cat ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Modules List Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {filteredModules.length === 0 ? (
            <div
              style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <Blocks size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p>No modules match your current filter.</p>
            </div>
          ) : (
            filteredModules.map((mod) => {
              const installed = isInstalled(mod.manifest.id);
              const downloaded = isDownloaded(mod.manifest.id);
              const downloading = isDownloading(mod.manifest.id);
              const progress = downloadProgress[mod.manifest.id] || 0;
              const archive = archives[mod.manifest.id];
              const isProcessing = processingId === mod.manifest.id;
              const isTargeted = targetModuleId === mod.manifest.id;
              const remoteMeta = remoteModules[mod.manifest.id];
              const estSize = remoteMeta?.sizeKb
                ? `${remoteMeta.sizeKb} KB`
                : MODULE_ESTIMATED_SIZES[mod.manifest.id] || '20 KB';

              return (
                <div
                  key={mod.manifest.id}
                  style={{
                    backgroundColor: isTargeted
                      ? 'rgba(56, 189, 248, 0.06)'
                      : 'rgba(30, 41, 59, 0.4)',
                    border: `1px solid ${
                      isTargeted
                        ? 'rgba(56, 189, 248, 0.4)'
                        : installed
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.04)'
                    }`,
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    gap: '1.25rem',
                    alignItems: 'flex-start',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  {/* Module Icon Container */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getModuleIcon(mod.manifest.id)}
                  </div>

                  {/* Module Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.35rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 600,
                          margin: 0,
                          color: '#f8fafc',
                        }}
                      >
                        {mod.manifest.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          color: '#94a3b8',
                        }}
                      >
                        v{mod.manifest.version}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          color: '#38bdf8',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                        }}
                      >
                        {mod.manifest.category}
                      </span>
                      {remoteMeta && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(168, 85, 247, 0.12)',
                            color: '#c084fc',
                            fontWeight: 600,
                          }}
                        >
                          GitHub Release
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: '#cbd5e1',
                        margin: '0 0 0.75rem 0',
                        lineHeight: 1.4,
                      }}
                    >
                      {mod.manifest.description}
                    </p>

                    {/* Meta info & Archive indicator */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        fontSize: '0.75rem',
                        color: '#64748b',
                      }}
                    >
                      <span>Data scope: {mod.manifest.dataKeys.join(', ')}</span>
                      {downloaded && !installed && (
                        <span
                          style={{
                            color: '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <HardDrive size={13} />
                          Cached on disk (~{estSize})
                        </span>
                      )}
                      {!downloaded && !installed && (
                        <span
                          style={{
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <Download size={13} />
                          Package size: ~{estSize}
                        </span>
                      )}
                      {archive && !installed && (
                        <span
                          style={{
                            color: '#fbbf24',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <Database size={13} />
                          Encrypted archive available ({archive.totalRecords || 0} records)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      flexShrink: 0,
                      minWidth: '150px',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                    }}
                  >
                    {downloading ? (
                      <div
                        style={{
                          width: '100%',
                          minWidth: '150px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: '#38bdf8',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Downloading...</span>
                          </span>
                          <span style={{ fontWeight: 600 }}>{progress}%</span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(progress, 5)}%`,
                              height: '100%',
                              backgroundColor: '#38bdf8',
                              transition: 'width 0.2s ease',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                      </div>
                    ) : isProcessing ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: '#94a3b8',
                          fontSize: '0.82rem',
                          padding: '0.45rem 0.5rem',
                        }}
                      >
                        <Loader2 size={15} className="animate-spin text-sky-400" />
                        <span>Processing...</span>
                      </div>
                    ) : installed ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: '#34d399',
                            fontWeight: 500,
                            padding: '0.35rem 0.65rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '6px',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                          }}
                        >
                          <Check size={14} /> Installed
                        </span>
                        <button
                          className="btn-danger-outline"
                          disabled={isProcessing}
                          onClick={() => {
                            setConfirmUninstallMod(mod);
                            setDeleteFilesOnUninstall(false);
                          }}
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.4rem 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            backgroundColor: 'transparent',
                            color: '#f87171',
                            border: '1px solid rgba(248, 113, 113, 0.3)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                          title="Uninstall module and archive data"
                        >
                          <Trash2 size={13} /> Uninstall
                        </button>
                      </div>
                    ) : downloaded ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          className="btn-primary"
                          disabled={isProcessing}
                          onClick={() => handleInstall(mod)}
                          style={{
                            fontSize: '0.82rem',
                            padding: '0.45rem 0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            backgroundColor: 'var(--accent, #0284c7)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          {archive ? (
                            <>
                              <RotateCcw size={14} /> Install & Restore
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} /> Activate Module
                            </>
                          )}
                        </button>
                        <button
                          className="btn-icon"
                          disabled={isProcessing}
                          onClick={() => handlePurgeFiles(mod)}
                          title="Delete downloaded files from disk to free up space"
                          style={{
                            padding: '0.45rem 0.55rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-primary"
                        disabled={isProcessing}
                        onClick={() => handleInstall(mod)}
                        style={{
                          fontSize: '0.82rem',
                          padding: '0.45rem 0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          backgroundColor: 'var(--accent, #0284c7)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Download size={14} />
                        <span>
                          {archive ? 'Download & Restore' : 'Download & Install'} (~{estSize})
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Notes */}
        <div
          style={{
            padding: '0.9rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={14} color="#34d399" />
              <span>
                Encrypted module archives are safely included in full database backups (.zip).
              </span>
            </div>
            <span style={{ color: '#475569' }}>|</span>
            <span>
              Modules hosted at{' '}
              <strong style={{ color: '#94a3b8' }}>cook0001/ArmoryVault-Modules</strong>
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.35rem 0.9rem',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Sub-Modal for Module Uninstallation */}
      {confirmUninstallMod && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1.5rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
                color: '#f87171',
              }}
            >
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
                Uninstall {confirmUninstallMod.manifest.name}?
              </h3>
            </div>

            <p
              style={{
                fontSize: '0.875rem',
                color: '#cbd5e1',
                lineHeight: 1.5,
                margin: '0 0 1rem 0',
              }}
            >
              Uninstalling will remove this feature from your navigation and routes. All active data
              (
              <strong style={{ color: '#f8fafc' }}>
                {confirmUninstallMod.manifest.dataKeys.join(', ')}
              </strong>
              ) will be securely encrypted and archived to disk, reducing your active database size.
            </p>

            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={deleteFilesOnUninstall}
                  onChange={(e) => setDeleteFilesOnUninstall(e.target.checked)}
                  style={{
                    marginTop: '0.2rem',
                    accentColor: '#ef4444',
                    cursor: 'pointer',
                    width: '16px',
                    height: '16px',
                  }}
                />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#f1f5f9' }}>
                    Also delete downloaded module files from disk
                  </span>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      margin: '0.25rem 0 0 0',
                      lineHeight: 1.4,
                    }}
                  >
                    {deleteFilesOnUninstall
                      ? 'Frees up disk space (~' +
                        (MODULE_ESTIMATED_SIZES[confirmUninstallMod.manifest.id] || '20 KB') +
                        '). If you re-enable this module later, it will be downloaded again from GitHub. Your inventory data is always safely kept in the encrypted archive.'
                      : 'Keeps downloaded code on disk so you can immediately reactivate it anytime without downloading.'}
                  </p>
                </div>
              </label>
            </div>

            <p
              style={{
                fontSize: '0.78rem',
                color: '#64748b',
                margin: '0 0 1.25rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Your inventory data is encrypted and preserved in all cases.</span>
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setConfirmUninstallMod(null);
                  setDeleteFilesOnUninstall(false);
                }}
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleConfirmUninstall}
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Confirm Uninstall & Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
