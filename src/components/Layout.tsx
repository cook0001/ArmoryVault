import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Shield, PlusCircle, LayoutDashboard, BookOpen, DownloadCloud, RefreshCw, Target, Settings, FolderOpen, Edit, Trash2, Database, Crosshair, Wrench, Package } from 'lucide-react';
import { CustomSkuDatabase, Ammo } from '../types';
import packageJson from '../../package.json';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'downloading' | 'ready'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [platform, setPlatform] = useState('');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backupPath, setBackupPath] = useState<string | null>(null);
  const [showTotalSetupValue, setShowTotalSetupValue] = useState(false);

  // SKU Manager State
  const [skuDatabase, setSkuDatabase] = useState<CustomSkuDatabase>({});
  const [newSku, setNewSku] = useState('');
  const [newSkuData, setNewSkuData] = useState<Partial<Ammo>>({});
  const [newSkuBoxPrice, setNewSkuBoxPrice] = useState('');
  const [isSkuManagerOpen, setIsSkuManagerOpen] = useState(false);

  useEffect(() => {
    if (window.api && window.api.onUpdateMessage) {
      window.api.onUpdateMessage((msg: any) => {
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
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (window.api && window.api.getBackupFolder) {
      const path = await window.api.getBackupFolder();
      setBackupPath(path);
    }
    if (window.api && window.api.getConfig) {
      const showSetupValue = await window.api.getConfig('showTotalSetupValue');
      setShowTotalSetupValue(!!showSetupValue);
    }
    if (window.api && window.api.getSkus) {
      const skus = await window.api.getSkus();
      setSkuDatabase(skus);
    }
  };

  const handleSaveSku = async () => {
    if (!newSku.trim()) return;
    const key = newSku.trim().toUpperCase();
    
    let finalData = { ...newSkuData };
    if (newSkuBoxPrice && finalData.count) {
      const price = parseFloat(newSkuBoxPrice);
      if (!isNaN(price) && price > 0) {
        finalData.costPerRound = Number((price / finalData.count).toFixed(2));
      }
    }
    
    const updated = { ...skuDatabase, [key]: finalData };
    setSkuDatabase(updated);
    if (window.api && window.api.saveSkus) {
      await window.api.saveSkus(updated);
    }
    setNewSku('');
    setNewSkuData({});
    setNewSkuBoxPrice('');
  };

  const handleDeleteSku = async (sku: string) => {
    const updated = { ...skuDatabase };
    delete updated[sku];
    setSkuDatabase(updated);
    if (window.api && window.api.deleteSku) {
      await window.api.deleteSku(sku);
    }
  };

  const handleSelectBackup = async () => {
    if (window.api && window.api.selectBackupFolder) {
      const path = await window.api.selectBackupFolder();
      if (path) {
        setBackupPath(path);
      }
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
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Shield className="logo-icon" size={28} />
          <h2>ArmoryVault</h2>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => navigate('/')} className={`nav-item ${isActive('/')}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button onClick={() => navigate('/add')} className={`nav-item ${isActive('/add')}`}>
            <PlusCircle size={20} />
            <span>Add Firearm</span>
          </button>
          <button className={`nav-item ${isActive('/bound-book')}`} onClick={() => navigate('/bound-book')}>
            <BookOpen size={20} />
            Bound Book
          </button>
          <button className={`nav-item ${isActive('/ammo')}`} onClick={() => navigate('/ammo')}>
            <Target size={20} />
            Ammo & Handloads
          </button>
          <button className={`nav-item ${isActive('/accessories')}`} onClick={() => navigate('/accessories')}>
            <Package size={20} />
            <span>Accessories</span>
          </button>
          <button className={`nav-item ${isActive('/maintenance')}`} onClick={() => navigate('/maintenance')}>
            <Wrench size={20} />
            <span>Maintenance</span>
          </button>
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={() => setIsSettingsOpen(true)} className="nav-item" style={{ width: '100%' }}>
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>
            ArmoryVault v{packageJson.version}
          </div>
        </div>
      </aside>
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
                      window.api.openUrl('https://github.com/cook0001/ArmouryVault/releases/latest');
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
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, padding: 0, border: 'none' }}>Settings</h2>
              <button className="btn-icon" onClick={() => setIsSettingsOpen(false)}>×</button>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Auto-Backups</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Select a folder (like Dropbox, OneDrive, or an external drive) to automatically backup your encrypted vault file whenever changes are made.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '0.8rem 1rem', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.9rem', color: backupPath ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {backupPath || 'No backup folder selected.'}
                </div>
                <button className="btn-secondary" onClick={handleSelectBackup} style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FolderOpen size={18} /> Browse...
                </button>
              </div>
              
              {backupPath && (
                <div style={{ marginTop: '1rem', color: 'var(--success)', fontSize: '0.85rem' }}>
                  ✓ Your `.enc` vault will be automatically backed up here.
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Insurance & Export</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Generate a comprehensive PDF report of your entire collection, including all firearms, accessories, values, and NFA statuses for insurance purposes.
              </p>
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
              }} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                <BookOpen size={18} /> Generate Insurance Report PDF
              </button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Data Management</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Manage custom inventory mappings and dictionaries.
              </p>
              <button className="btn-secondary" onClick={() => setIsSkuManagerOpen(true)} style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <Database size={18} /> Open Custom SKU Manager
              </button>

              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', marginTop: '1.5rem' }}>View Preferences</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input 
                  type="checkbox" 
                  checked={showTotalSetupValue} 
                  onChange={async (e) => {
                    setShowTotalSetupValue(e.target.checked);
                    if (window.api && window.api.setConfig) {
                      await window.api.setConfig('showTotalSetupValue', e.target.checked);
                    }
                  }} 
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent)' }} 
                />
                Show "Total Setup Value" (Firearm + Accessories) on Firearm Details
              </label>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Application Updates</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Currently running ArmoryVault v{packageJson.version}. You can manually download the newest release directly from GitHub at any time.
              </p>
              <button className="btn-secondary" onClick={() => {
                if (window.api && window.api.openUrl) {
                  window.api.openUrl('https://github.com/cook0001/ArmouryVault/releases/latest');
                }
              }} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                <DownloadCloud size={18} /> Download Latest Release
              </button>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setIsSettingsOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {isSkuManagerOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, padding: 0, border: 'none' }}>Custom SKU Manager</h2>
              <button type="button" className="btn-icon" onClick={() => setIsSkuManagerOpen(false)}>×</button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Map custom alphanumeric SKUs (like <code>44MG240HRN20</code>) so they automatically populate data when scanned in the Ammo Dashboard.
            </p>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Add New SKU Mapping</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <input type="text" className="form-input" placeholder="SKU ID (e.g. 44MG240HRN20)" value={newSku} onChange={e => setNewSku(e.target.value)} />
                <input type="text" className="form-input" placeholder="Manufacturer (e.g. Steinel)" value={newSkuData.manufacturer || ''} onChange={e => setNewSkuData({...newSkuData, manufacturer: e.target.value})} />
                <input type="text" className="form-input" placeholder="Caliber (e.g. .44 Mag)" value={newSkuData.caliber || ''} onChange={e => setNewSkuData({...newSkuData, caliber: e.target.value})} />
                <input type="number" className="form-input" placeholder="Grain (e.g. 240)" value={newSkuData.grain || ''} onChange={e => setNewSkuData({...newSkuData, grain: parseInt(e.target.value) || undefined})} />
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  <input type="text" className="form-input" style={{ flex: 1, minWidth: 0 }} placeholder="Bullet Type (e.g. XTP)" value={newSkuData.projectile || ''} onChange={e => setNewSkuData({...newSkuData, projectile: e.target.value})} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', cursor: 'pointer', paddingRight: '0.5rem', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={newSkuData.isPlusP || false} onChange={e => setNewSkuData({...newSkuData, isPlusP: e.target.checked})} style={{ width: '1.3rem', height: '1.3rem', accentColor: 'var(--danger)' }} />
                    <span style={{ fontWeight: 600 }}>+P</span>
                  </label>
                </div>
                <input type="number" className="form-input" placeholder="Rounds/Box" value={newSkuData.count || ''} onChange={e => setNewSkuData({...newSkuData, count: parseInt(e.target.value) || undefined})} />
                <input type="number" step="0.01" className="form-input" placeholder="Price/Box ($)" value={newSkuBoxPrice} onChange={e => setNewSkuBoxPrice(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={handleSaveSku} disabled={!newSku.trim()}>Add Mapping</button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Existing SKUs</h3>
              {Object.keys(skuDatabase).length === 0 && (
                <p style={{ color: 'var(--text-secondary)' }}>No custom SKUs mapped yet.</p>
              )}
              {Object.entries(skuDatabase).map(([sku, data]) => (
                <div key={sku} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>{sku}</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {data.manufacturer || 'Unknown Make'} - {data.caliber || 'Unknown Cal'} {data.isPlusP && <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '0.25rem', marginRight: '0.25rem' }}>+P</span>} - {data.grain ? data.grain + 'gr ' : ''}{data.projectile || 'Unknown Bullet'} ({data.count ? data.count + ' rds' : 'Unknown count'})
                      {data.costPerRound ? ` - $${data.costPerRound}/rd` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => {
                      setNewSku(sku);
                      setNewSkuData(data);
                      if (data.costPerRound && data.count) {
                        setNewSkuBoxPrice((data.costPerRound * data.count).toFixed(2));
                      } else {
                        setNewSkuBoxPrice('');
                      }
                    }} className="btn-icon" style={{ color: 'var(--accent)', background: 'rgba(56,189,248,0.1)', padding: '0.5rem', borderRadius: '4px' }}><Edit size={16} /></button>
                    <button onClick={() => handleDeleteSku(sku)} className="btn-icon" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '4px' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
