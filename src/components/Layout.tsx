import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Shield, PlusCircle, LayoutDashboard, BookOpen, DownloadCloud, RefreshCw, Target, Settings, FolderOpen, Edit, Trash2, Database, Crosshair, Wrench, Package, Smartphone, Lock, Download, HardDrive, ExternalLink, Sliders, CheckCircle, UploadCloud, RotateCcw, Key, Layers } from 'lucide-react';
import { CustomSkuDatabase, CustomSkuItem, Ammo } from '../types';
import { exportToCSV } from '../utils/csvExport';
import { RangeSessionModal } from './RangeSessionModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { RecoveryKeyModal } from './RecoveryKeyModal';
import packageJson from '../../package.json';

export const Layout = ({ onLockVault }: { onLockVault?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'downloading' | 'ready'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [platform, setPlatform] = useState('');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backupPath, setBackupPath] = useState<string | null>(null);
  const [showTotalSetupValue, setShowTotalSetupValue] = useState(false);
  const [showCollectionAnalytics, setShowCollectionAnalytics] = useState(false);
  
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isRecoveryKeyModalOpen, setIsRecoveryKeyModalOpen] = useState(false);

  // SKU Manager State
  const [skuDatabase, setSkuDatabase] = useState<CustomSkuDatabase>({});
  const [skuCategory, setSkuCategory] = useState<'ammo' | 'accessory' | 'component'>('ammo');
  const [skuFilter, setSkuFilter] = useState<'all' | 'ammo' | 'accessory' | 'component'>('all');
  const [newSku, setNewSku] = useState('');
  const [newSkuData, setNewSkuData] = useState<CustomSkuItem>({ category: 'ammo' });
  const [newSkuBoxPrice, setNewSkuBoxPrice] = useState('');
  const [isSkuManagerOpen, setIsSkuManagerOpen] = useState(false);

  useEffect(() => {
    let unsubSync: (() => void) | undefined;
    let unsubUpdate: (() => void) | undefined;

    if (window.api && window.api.onUpdateMessage) {
      unsubUpdate = window.api.onUpdateMessage((msg: any) => {
        if (msg.type === 'update-available') {
          setUpdateStatus('downloading');
          setDownloadProgress(0);
        } else if (msg.type === 'download-progress') {
          setUpdateStatus('downloading');
          setDownloadProgress(Math.round(msg.data.percent || 0));
        } else if (msg.type === 'update-downloaded') {
          setUpdateStatus('ready');
        }
      });
    }
    if (window.api && window.api.getPlatform) {
      setPlatform(window.api.getPlatform());
    }
    if (window.api && window.api.onSyncReceived) {
      unsubSync = window.api.onSyncReceived(() => {
        loadSettings();
      });
    }
    loadSettings();

    return () => {
      if (unsubSync) unsubSync();
      if (unsubUpdate) unsubUpdate();
    };
  }, []);

  const loadSettings = async () => {
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
    if (window.api && window.api.getSkus) {
      const skus = await window.api.getSkus();
      setSkuDatabase(skus || {});
    }
    if (window.api && window.api.getSyncQueue) {
      const queue = await window.api.getSyncQueue();
      setSyncQueueCount(queue.length);
    }
  };

  useEffect(() => {
    if (isSkuManagerOpen && window.api && window.api.getSkus) {
      window.api.getSkus().then(skus => setSkuDatabase(skus || {}));
    }
  }, [isSkuManagerOpen]);

  const handleSaveSku = async () => {
    if (!newSku.trim()) return;
    const key = newSku.trim().toUpperCase();
    
    let finalData: CustomSkuItem = { ...newSkuData, category: skuCategory };
    if (skuCategory === 'ammo') {
      if (newSkuBoxPrice && finalData.count) {
        const price = parseFloat(newSkuBoxPrice);
        if (!isNaN(price) && price > 0) {
          finalData.costPerRound = Number((price / finalData.count).toFixed(3));
          finalData.boxPrice = price;
        }
      }
    } else if (skuCategory === 'accessory') {
      if (newSkuBoxPrice) {
        const val = parseFloat(newSkuBoxPrice);
        if (!isNaN(val)) finalData.value = val;
      }
    } else if (skuCategory === 'component') {
      if (newSkuBoxPrice) {
        const cost = parseFloat(newSkuBoxPrice);
        if (!isNaN(cost)) finalData.cost = cost;
      }
    }
    
    const currentSkus = (window.api && window.api.getSkus) ? await window.api.getSkus() : skuDatabase;
    const updated = { ...currentSkus, [key]: finalData };
    setSkuDatabase(updated);
    if (window.api && window.api.saveSkus) {
      await window.api.saveSkus(updated);
    }
    setNewSku('');
    setNewSkuData({ category: skuCategory });
    setNewSkuBoxPrice('');
  };

  const handleDeleteSku = async (sku: string) => {
    if (window.api && window.api.deleteSku) {
      await window.api.deleteSku(sku);
    }
    const currentSkus = (window.api && window.api.getSkus) ? await window.api.getSkus() : skuDatabase;
    const updated = { ...currentSkus };
    delete updated[sku];
    setSkuDatabase(updated);
  };

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
          // User canceled file dialog - do nothing
        } else {
          const detail = (res && res.error) ? `: ${res.error}` : '';
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
      "Are you sure you want to restore from a backup?\n\n" +
      "This will replace your current active vault with the selected backup file (.enc or .zip).\n\n" +
      "A safety copy of your current database will be created automatically before restoring."
    );
    if (!confirmed) return;

    try {
      const res = await window.api.restoreBackup();
      if (res.canceled) return;

      if (res.success) {
        if (res.requiresRelogin) {
          alert("Vault restored successfully!\n\nThe restored backup was created with a different password or encryption key. The vault will now lock so you can log in.");
          if (onLockVault) {
            onLockVault();
          } else if (window.api.lockVault) {
            await window.api.lockVault();
          }
          setIsSettingsOpen(false);
        } else {
          alert("Database successfully restored from backup!");
          setIsSettingsOpen(false);
          await loadSettings();
          navigate('/');
        }
      } else {
        alert(`Failed to restore backup: ${res.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error("Error restoring backup:", e);
      alert(`An error occurred while restoring the backup: ${e.message || e}`);
    }
  };

  const handleRestart = () => {
    if (window.api && window.api.restartApp) {
      window.api.restartApp();
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return '';
    if (path !== '/' && location.pathname.startsWith(path)) return 'active';
    if (path === '/' && location.pathname === '/') return 'active';
    return '';
  };

  return (
    <div className="app-layout">
      {/* Ambient background mesh & grid */}
      <div className="bg-mesh" aria-hidden="true"></div>
      <div className="bg-grid" aria-hidden="true"></div>

      <header className="app-topbar">
        {/* Brand Header */}
        <div className="topbar-brand" onClick={() => navigate('/')}>
          <div className="topbar-brand-icon">
            <Shield size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <span>ArmoryVault</span>
          <span className="topbar-version-tag">v{packageJson.version}</span>
        </div>

        {/* Center Navigation Links */}
        <nav className="topbar-nav">
          <button onClick={() => navigate('/')} className={`topbar-nav-link ${isActive('/')}`}>
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          <button className={`topbar-nav-link ${isActive('/bound-book')}`} onClick={() => navigate('/bound-book')}>
            <BookOpen size={16} />
            <span>Bound Book</span>
          </button>
          <button className={`topbar-nav-link ${isActive('/ammo') || isActive('/components')}`} onClick={() => navigate('/ammo')}>
            <Layers size={16} />
            <span>Ammo & Reloading</span>
          </button>
          <button className={`topbar-nav-link ${isActive('/accessories')}`} onClick={() => navigate('/accessories')}>
            <Package size={16} />
            <span>Accessories</span>
          </button>
          <button className={`topbar-nav-link ${isActive('/maintenance')}`} onClick={() => navigate('/maintenance')}>
            <Wrench size={16} />
            <span>Maintenance</span>
          </button>
        </nav>

        {/* Right Action Tools */}
        <div className="topbar-actions">
          <button 
            className="btn-secondary" 
            onClick={() => setIsRangeModalOpen(true)} 
            title="Quickly log rounds fired and deduct ammo in one action"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            <Crosshair size={16} style={{ color: 'var(--accent)' }} />
            <span>Log Range Trip</span>
          </button>

          <button 
            onClick={() => navigate('/add')} 
            className="btn-primary"
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
          >
            <PlusCircle size={16} />
            <span>Add Firearm</span>
          </button>

          <button 
            className={`btn-icon ${isActive('/sync') ? 'active' : ''}`} 
            onClick={() => navigate('/sync')} 
            title="Mobile Sync Inbox"
            style={{ position: 'relative' }}
          >
            <Smartphone size={18} />
            {syncQueueCount > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: '-2px', 
                right: '-2px', 
                background: '#ef4444', 
                color: '#fff', 
                fontSize: '0.65rem', 
                fontWeight: 'bold', 
                padding: '0.1rem 0.35rem', 
                borderRadius: '10px',
                boxShadow: '0 0 8px rgba(239,68,68,0.8)'
              }}>
                {syncQueueCount}
              </span>
            )}
          </button>

          <button className="btn-icon" onClick={() => setIsSettingsOpen(true)} title="Vault Settings">
            <Settings size={18} />
          </button>

          {onLockVault && (
            <button className="btn-icon" onClick={onLockVault} title="Lock Vault" style={{ color: 'var(--warning)' }}>
              <Lock size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {updateStatus !== 'idle' && (
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid var(--border-light)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-primary)' }}>
              {updateStatus === 'downloading' ? <DownloadCloud style={{ color: 'var(--accent)' }} size={24} /> : <RefreshCw style={{ color: 'var(--success)' }} size={24} />}
              <div>
                <strong style={{ display: 'block', fontSize: '1rem' }}>
                  {updateStatus === 'downloading' ? 'Downloading Update...' : 'Update Ready'}
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {updateStatus === 'downloading' 
                    ? `A new version of ArmoryVault is downloading (${downloadProgress}%).` 
                    : 'A new version has been downloaded and is ready to install.'}
                </span>
              </div>
            </div>
            {updateStatus === 'downloading' && (
              <div style={{ width: '200px', background: 'rgba(0,0,0,0.3)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${downloadProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.2s' }}></div>
              </div>
            )}
            {updateStatus === 'ready' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {platform !== 'darwin' && (
                  <button className="btn-primary" onClick={handleRestart} title="Restart to install the update automatically" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    Restart & Install
                  </button>
                )}
                {platform === 'darwin' && (
                  <button className="btn-primary" onClick={() => {
                    if (window.api && window.api.openUrl) {
                      window.api.openUrl('https://github.com/cook0001/ArmoryVault/releases/latest');
                    }
                  }} title="Download the newest installer from GitHub" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    Download Mac Update
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        <Outlet />
      </main>

      {isSettingsOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Settings className="text-accent" size={24} style={{ color: 'var(--accent)' }} />
                <div>
                  <h2 style={{ margin: 0, padding: 0, border: 'none', fontSize: '1.4rem' }}>Vault Settings</h2>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Configure backups, data exports, dictionary mappings, and display preferences.
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setIsSettingsOpen(false)} title="Close Settings">×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Backups Section */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <HardDrive size={18} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>Backups & Redundancy</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                  Keep your encrypted inventory safe across external drives or cloud sync folders (e.g. Dropbox, OneDrive).
                </p>
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.25)', padding: '0.65rem 0.9rem', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.85rem', color: backupPath ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {backupPath || 'No auto-backup folder configured.'}
                  </div>
                  <button className="btn-secondary" onClick={handleSelectBackup} style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1rem', fontSize: '0.85rem' }}>
                    <FolderOpen size={16} /> Choose Folder...
                  </button>
                </div>
                
                {backupPath && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    <CheckCircle size={14} /> Auto-rotates up to 5 date-stamped encrypted vault backups in this folder.
                  </div>
                )}
                
                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  <button className="btn-primary" onClick={handleCreateZipBackup} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--success)', justifyContent: 'center', padding: '0.65rem 1rem', fontSize: '0.85rem' }}>
                    <DownloadCloud size={16} />
                    Create Full .zip Archive
                  </button>
                  <button className="btn-secondary" onClick={handleRestoreBackup} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', padding: '0.65rem 1rem', fontSize: '0.85rem', color: 'var(--accent)', borderColor: 'rgba(59, 130, 246, 0.4)' }} title="Restore database from an encrypted .enc or .zip backup">
                    <UploadCloud size={16} />
                    Restore from Backup (.enc / .zip)
                  </button>
                </div>
              </div>

              {/* Reports & Export Section */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <BookOpen size={18} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>Insurance & Reports</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                  Generate comprehensive documentation of your firearms and accessories for insurance or recordkeeping.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  <button className="btn-secondary" onClick={async () => {
                    if (window.api && window.api.generateInsuranceReport) {
                      try {
                        const firearms = await window.api.getFirearms();
                        const accessories = await window.api.getAccessories();
                        const totalValue = firearms.reduce((sum, f) => sum + (Number(f.purchase_price) || 0), 0) + accessories.reduce((sum, a) => sum + ((Number(a.value) || 0) * (Number(a.quantity) || 1)), 0);
                        
                        const reportPath = await window.api.generateInsuranceReport({
                          firearms,
                          accessories,
                          totalValue
                        });
                        
                        if (reportPath) {
                          alert(`Report generated successfully at:\n${reportPath}`);
                        }
                      } catch (e) {
                        console.error("Failed to generate report", e);
                        alert("An error occurred while generating the report.");
                      }
                    }
                  }} style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', padding: '0.65rem 1rem', fontSize: '0.85rem' }}>
                    <BookOpen size={16} /> Insurance Report (PDF)
                  </button>
                  <button className="btn-secondary" onClick={async () => {
                    if (window.api && window.api.getFirearms && window.api.exportData) {
                      try {
                        const firearms = await window.api.getFirearms();
                        const csvString = exportToCSV(firearms);
                        await window.api.exportData(csvString, 'firearms_inventory.csv');
                      } catch (e) {
                        console.error("Failed to export CSV", e);
                        alert("An error occurred while exporting CSV.");
                      }
                    }
                  }} style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', padding: '0.65rem 1rem', fontSize: '0.85rem' }}>
                    <Download size={16} /> Export Firearms (CSV)
                  </button>
                </div>
              </div>

              {/* Vault Security & Password Section */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Shield size={18} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>Vault Security & Encryption</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                  Update your master password or view and copy your 64-character offline emergency recovery key.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setIsChangePasswordOpen(true)} 
                    style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                  >
                    <Key size={16} /> Change Master Password
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setIsRecoveryKeyModalOpen(true)} 
                    style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', padding: '0.65rem 1rem', fontSize: '0.85rem', color: '#60a5fa' }}
                  >
                    <Lock size={16} /> View Vault Recovery Key
                  </button>
                </div>
              </div>

              {/* Data & Preferences Section */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Sliders size={18} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>Preferences & Mappings</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                  Manage custom inventory mappings and configure view options.
                </p>
                
                <button className="btn-secondary" onClick={() => setIsSkuManagerOpen(true)} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', padding: '0.65rem 1rem', fontSize: '0.85rem' }}>
                  <Database size={16} /> Open Custom SKU & Barcode Manager
                </button>

                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={showTotalSetupValue} 
                      onChange={async (e) => {
                        setShowTotalSetupValue(e.target.checked);
                        if (window.api && window.api.setConfig) {
                          await window.api.setConfig('showTotalSetupValue', e.target.checked);
                        }
                      }} 
                      style={{ width: '1.15rem', height: '1.15rem', accentColor: 'var(--accent)', cursor: 'pointer' }} 
                    />
                    <span>Show <strong>Total Setup Value</strong> (Firearm + Mounted Accessories) on Firearm Details</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.9rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <input 
                      type="checkbox" 
                      checked={showCollectionAnalytics} 
                      onChange={async (e) => {
                        setShowCollectionAnalytics(e.target.checked);
                        if (window.api && window.api.setConfig) {
                          await window.api.setConfig('showCollectionAnalytics', e.target.checked);
                        }
                      }} 
                      style={{ width: '1.15rem', height: '1.15rem', accentColor: 'var(--accent)', cursor: 'pointer' }} 
                    />
                    <span>Show <strong>Collection Value & Investment Analytics</strong> on Dashboard</span>
                  </label>
                </div>
              </div>

              {/* App Version & Updates Section */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    ArmoryVault <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent)', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', marginLeft: '0.4rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>v{packageJson.version}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Desktop Edition &bull; Local Encrypted Storage
                  </div>
                </div>
                <button className="btn-secondary" onClick={() => {
                  if (window.api && window.api.openUrl) {
                    window.api.openUrl('https://github.com/cook0001/ArmoryVault/releases/latest');
                  }
                }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
                  <ExternalLink size={14} /> Releases & Updates
                </button>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <button className="btn-primary" onClick={() => setIsSettingsOpen(false)} style={{ minWidth: '100px' }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {isSkuManagerOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ maxWidth: '960px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={22} style={{ color: 'var(--accent)' }} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Custom SKU & Barcode Dictionary</h2>
                  <p style={{ margin: '0.15rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Map manufacturer part numbers & custom SKUs for Ammunition, Parts/Accessories, and Reloading Supplies for instant scanning.
                  </p>
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={() => setIsSkuManagerOpen(false)}>×</button>
            </div>

            <div style={{ overflowY: 'auto', paddingRight: '0.5rem', flex: 1 }}>
              {/* Category Selector for New SKU */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>Add or Edit Custom SKU</h3>
                  <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '8px' }}>
                    <button
                      type="button"
                      onClick={() => { setSkuCategory('ammo'); setNewSkuData({ category: 'ammo' }); }}
                      style={{
                        padding: '0.35rem 0.8rem',
                        fontSize: '0.85rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: skuCategory === 'ammo' ? 'var(--accent)' : 'transparent',
                        color: skuCategory === 'ammo' ? '#fff' : 'var(--text-secondary)',
                        fontWeight: 600
                      }}
                    >
                      📦 Ammunition
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSkuCategory('accessory'); setNewSkuData({ category: 'accessory', accessoryType: 'Optic' }); }}
                      style={{
                        padding: '0.35rem 0.8rem',
                        fontSize: '0.85rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: skuCategory === 'accessory' ? '#8b5cf6' : 'transparent',
                        color: skuCategory === 'accessory' ? '#fff' : 'var(--text-secondary)',
                        fontWeight: 600
                      }}
                    >
                      🔍 Parts & Accessories
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSkuCategory('component'); setNewSkuData({ category: 'component', componentType: 'Powder' }); }}
                      style={{
                        padding: '0.35rem 0.8rem',
                        fontSize: '0.85rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: skuCategory === 'component' ? '#f59e0b' : 'transparent',
                        color: skuCategory === 'component' ? '#fff' : 'var(--text-secondary)',
                        fontWeight: 600
                      }}
                    >
                      ⚗️ Reloading Supplies
                    </button>
                  </div>
                </div>

                {/* Form for Ammo */}
                {skuCategory === 'ammo' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>SKU / Barcode ID *</label>
                      <input type="text" className="form-input" placeholder="e.g. 44MG240HRN20" value={newSku} onChange={e => setNewSku(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Manufacturer</label>
                      <input type="text" className="form-input" placeholder="e.g. Hornady, Steinel" value={newSkuData.manufacturer || ''} onChange={e => setNewSkuData({...newSkuData, manufacturer: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Caliber</label>
                      <input type="text" className="form-input" placeholder="e.g. .44 Mag, 9mm" value={newSkuData.caliber || ''} onChange={e => setNewSkuData({...newSkuData, caliber: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Bullet Weight (gr)</label>
                      <input type="number" className="form-input" placeholder="e.g. 240" value={newSkuData.grain ?? ''} onChange={e => setNewSkuData({...newSkuData, grain: e.target.value === '' ? undefined : parseInt(e.target.value)})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Bullet Type</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="text" className="form-input" style={{ flex: 1, minWidth: 0 }} placeholder="e.g. XTP, FMJ" value={newSkuData.projectile || ''} onChange={e => setNewSkuData({...newSkuData, projectile: e.target.value})} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <input type="checkbox" checked={newSkuData.isPlusP || false} onChange={e => setNewSkuData({...newSkuData, isPlusP: e.target.checked})} style={{ accentColor: 'var(--danger)' }} />
                          <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>+P</span>
                        </label>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Rounds / Box</label>
                      <input type="number" className="form-input" placeholder="e.g. 20, 50" value={newSkuData.count ?? ''} onChange={e => setNewSkuData({...newSkuData, count: e.target.value === '' ? undefined : parseInt(e.target.value)})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Box Price ($)</label>
                      <input type="number" step="0.01" className="form-input" placeholder="e.g. 28.50" value={newSkuBoxPrice} onChange={e => setNewSkuBoxPrice(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Form for Parts & Accessories */}
                {skuCategory === 'accessory' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Part # / SKU ID *</label>
                      <input type="text" className="form-input" placeholder="e.g. APX-EXT-100, HS507C-X2" value={newSku} onChange={e => setNewSku(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Accessory Type</label>
                      <select className="form-input" value={newSkuData.accessoryType || 'Optic'} onChange={e => setNewSkuData({...newSkuData, accessoryType: e.target.value as any})}>
                        <option value="Optic">Optic / Sight</option>
                        <option value="Light">Light / Laser</option>
                        <option value="Suppressor">Suppressor / Silencer</option>
                        <option value="Holster">Holster</option>
                        <option value="Magazine">Magazine</option>
                        <option value="Mount">Mount / Adapter</option>
                        <option value="Sling">Sling</option>
                        <option value="Other">Other Part</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Manufacturer</label>
                      <input type="text" className="form-input" placeholder="e.g. Apex Tactical, Holosun" value={newSkuData.manufacturer || ''} onChange={e => setNewSkuData({...newSkuData, manufacturer: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Model / Part Description</label>
                      <input type="text" className="form-input" placeholder="e.g. Heavy Duty Extractor" value={newSkuData.model || ''} onChange={e => setNewSkuData({...newSkuData, model: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Caliber / Supported Models</label>
                      <input type="text" className="form-input" placeholder="e.g. 9mm / Glock Gen 5" value={newSkuData.caliber || newSkuData.supportedModels || ''} onChange={e => setNewSkuData({...newSkuData, caliber: e.target.value, supportedModels: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Part Price / Value ($)</label>
                      <input type="number" step="0.01" className="form-input" placeholder="e.g. 59.95" value={newSkuBoxPrice || (newSkuData.value ? String(newSkuData.value) : '')} onChange={e => setNewSkuBoxPrice(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Notes / Features</label>
                      <input type="text" className="form-input" placeholder="e.g. Melonite finish" value={newSkuData.notes || ''} onChange={e => setNewSkuData({...newSkuData, notes: e.target.value})} />
                    </div>
                  </div>
                )}

                {/* Form for Reloading Supplies */}
                {skuCategory === 'component' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>SKU / Barcode ID *</label>
                      <input type="text" className="form-input" placeholder="e.g. HODG-VARGET-1LB" value={newSku} onChange={e => setNewSku(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Component Type</label>
                      <select className="form-input" value={newSkuData.componentType || 'Powder'} onChange={e => setNewSkuData({...newSkuData, componentType: e.target.value as any})}>
                        <option value="Powder">Powder</option>
                        <option value="Brass">Brass / Hulls</option>
                        <option value="Primer">Primers</option>
                        <option value="Bullet">Bullets / Projectiles</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Manufacturer</label>
                      <input type="text" className="form-input" placeholder="e.g. Hodgdon, CCI, Starline" value={newSkuData.manufacturer || ''} onChange={e => setNewSkuData({...newSkuData, manufacturer: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Name / Powder / Primer Type</label>
                      <input type="text" className="form-input" placeholder="e.g. Varget, #400 Small Rifle" value={newSkuData.name || ''} onChange={e => setNewSkuData({...newSkuData, name: e.target.value})} />
                    </div>
                    {(newSkuData.componentType === 'Brass' || newSkuData.componentType === 'Bullet') && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem' }}>Caliber</label>
                        <input type="text" className="form-input" placeholder="e.g. .308 Win, 6.5 CM" value={newSkuData.caliber || ''} onChange={e => setNewSkuData({...newSkuData, caliber: e.target.value})} />
                      </div>
                    )}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Quantity / Amount</label>
                      <input type="number" step="0.01" className="form-input" placeholder="e.g. 1 (lb) or 1000" value={newSkuData.quantity ?? ''} onChange={e => setNewSkuData({...newSkuData, quantity: e.target.value === '' ? undefined : parseFloat(e.target.value)})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Cost / Value ($)</label>
                      <input type="number" step="0.01" className="form-input" placeholder="e.g. 45.00" value={newSkuBoxPrice || (newSkuData.cost ? String(newSkuData.cost) : '')} onChange={e => setNewSkuBoxPrice(e.target.value)} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {(newSku || newSkuData.manufacturer) && (
                    <button type="button" className="btn-secondary" onClick={() => { setNewSku(''); setNewSkuData({ category: skuCategory }); setNewSkuBoxPrice(''); }}>
                      Clear
                    </button>
                  )}
                  <button className="btn-primary" onClick={handleSaveSku} disabled={!newSku.trim()}>
                    Save SKU Mapping
                  </button>
                </div>
              </div>

              {/* Filter Tabs for Existing SKUs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Mapped Dictionary ({Object.keys(skuDatabase).length})</h3>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {(['all', 'ammo', 'accessory', 'component'] as const).map(tab => {
                    const count = Object.values(skuDatabase).filter(item => {
                      if (tab === 'all') return true;
                      const cat = item.category || (item.accessoryType ? 'accessory' : item.componentType ? 'component' : 'ammo');
                      return cat === tab;
                    }).length;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setSkuFilter(tab)}
                        style={{
                          padding: '0.25rem 0.6rem',
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          background: skuFilter === tab ? 'rgba(255,255,255,0.15)' : 'transparent',
                          color: skuFilter === tab ? '#fff' : 'var(--text-secondary)',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}
                      >
                        {tab === 'accessory' ? 'Accessories/Parts' : tab === 'component' ? 'Reloading' : tab} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Existing SKUs List */}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {Object.keys(skuDatabase).length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem 0' }}>No custom SKUs mapped yet.</p>
                )}
                {Object.entries(skuDatabase)
                  .filter(([_, data]) => {
                    if (skuFilter === 'all') return true;
                    const cat = data.category || (data.accessoryType ? 'accessory' : data.componentType ? 'component' : 'ammo');
                    return cat === skuFilter;
                  })
                  .map(([sku, data]) => {
                    const cat = data.category || (data.accessoryType ? 'accessory' : data.componentType ? 'component' : 'ammo');
                    const badgeColor = cat === 'accessory' ? '#8b5cf6' : cat === 'component' ? '#f59e0b' : '#38bdf8';
                    const badgeBg = cat === 'accessory' ? 'rgba(139, 92, 246, 0.15)' : cat === 'component' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)';
                    const badgeLabel = cat === 'accessory' ? (data.accessoryType || 'PART / ACC') : cat === 'component' ? (data.componentType || 'RELOADING') : 'AMMO';

                    return (
                      <div key={sku} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{sku}</strong>
                            <span style={{ background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}40`, padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                              {badgeLabel}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {cat === 'accessory' ? (
                              <>
                                <strong style={{ color: 'var(--text-primary)' }}>{data.manufacturer || ''} {data.model || 'Accessory'}</strong>
                                {(data.caliber || data.supportedModels) && ` • Fits: ${data.caliber || data.supportedModels}`}
                                {data.value !== undefined && data.value !== null && ` • $${Number(data.value).toFixed(2)}`}
                                {data.notes && ` (${data.notes})`}
                              </>
                            ) : cat === 'component' ? (
                              <>
                                <strong style={{ color: 'var(--text-primary)' }}>{data.manufacturer || ''} {data.name || data.componentType || 'Component'}</strong>
                                {data.caliber && ` • ${data.caliber}`}
                                {data.quantity !== undefined && ` • ${data.quantity} ${data.weightUnit || 'units'}`}
                                {data.cost !== undefined && data.cost !== null && ` • $${Number(data.cost).toFixed(2)}`}
                              </>
                            ) : (
                              <>
                                <strong style={{ color: 'var(--text-primary)' }}>{data.manufacturer || 'Unknown Make'} {data.caliber || ''}</strong>
                                {data.isPlusP && <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.05rem 0.3rem', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 'bold', marginLeft: '0.3rem', marginRight: '0.3rem' }}>+P</span>}
                                {data.grain ? ` • ${data.grain}gr ` : ''}{data.projectile || ''}
                                {data.count ? ` • ${data.count} rds/box` : ''}
                                {data.boxPrice ? ` • $${Number(data.boxPrice).toFixed(2)}/box` : data.costPerRound ? ` • $${data.costPerRound}/rd` : ''}
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => {
                            setNewSku(sku);
                            setSkuCategory(cat);
                            setNewSkuData(data);
                            if (cat === 'ammo') {
                              if (data.boxPrice) setNewSkuBoxPrice(String(data.boxPrice));
                              else if (data.costPerRound && data.count) setNewSkuBoxPrice((data.costPerRound * data.count).toFixed(2));
                              else setNewSkuBoxPrice('');
                            } else if (cat === 'accessory') {
                              setNewSkuBoxPrice(data.value !== undefined ? String(data.value) : '');
                            } else if (cat === 'component') {
                              setNewSkuBoxPrice(data.cost !== undefined ? String(data.cost) : '');
                            }
                          }} className="btn-icon" style={{ color: 'var(--accent)', background: 'rgba(56,189,248,0.1)', padding: '0.4rem', borderRadius: '4px' }} title="Edit SKU"><Edit size={15} /></button>
                          <button onClick={() => handleDeleteSku(sku)} className="btn-icon" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.4rem', borderRadius: '4px' }} title="Delete SKU"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {isRangeModalOpen && (
        <RangeSessionModal
          isOpen={isRangeModalOpen}
          onClose={() => setIsRangeModalOpen(false)}
          onSaved={() => {
            loadSettings();
            // Trigger refresh
            window.dispatchEvent(new Event('armoryvault-reload'));
          }}
        />
      )}

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <RecoveryKeyModal
        isOpen={isRecoveryKeyModalOpen}
        onClose={() => setIsRecoveryKeyModalOpen(false)}
      />

    </div>
  );
};
