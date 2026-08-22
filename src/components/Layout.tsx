import {
  ChevronLeft,
  ChevronRight,
  DownloadCloud,
  LayoutDashboard,
  Lock,
  PlusCircle,
  RefreshCw,
  Settings,
  Shield,
  Smartphone,
  Target,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import packageJson from '../../package.json';
import { useScrollRestoration } from '../utils/scrollRestoration';
import { ActivityLogModal } from './ActivityLogModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import {
  AccessoriesNavIcon,
  BallisticsNavIcon,
  BoundBookNavIcon,
  CartridgesIcon,
  LoadDevNavIcon,
  MaintenanceNavIcon,
  NfaTrackerNavIcon,
  SafeIcon,
} from './CustomIcons';
import { RangeSessionModal } from './RangeSessionModal';
import { RecoveryKeyModal } from './RecoveryKeyModal';
import { SettingsModal } from './SettingsModal';
import { SkuManagerModal } from './SkuManagerModal';

export const Layout = ({ onLockVault }: { onLockVault?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const mainContentRef = useRef<HTMLElement | null>(null);

  // Manage automatic scroll position restoration across route navigation
  useScrollRestoration(mainContentRef);

  const [updateStatus, setUpdateStatus] = useState<'idle' | 'downloading' | 'ready'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [platform, setPlatform] = useState('');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isRecoveryKeyModalOpen, setIsRecoveryKeyModalOpen] = useState(false);
  const [isSkuManagerOpen, setIsSkuManagerOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);

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
        loadSyncQueue();
      });
    }
    loadSyncQueue();

    const handleOpenActivityLog = () => setIsActivityLogOpen(true);
    window.addEventListener('armoryvault-open-activity-log', handleOpenActivityLog);

    return () => {
      if (unsubSync) unsubSync();
      if (unsubUpdate) unsubUpdate();
      window.removeEventListener('armoryvault-open-activity-log', handleOpenActivityLog);
    };
  }, []);

  const loadSyncQueue = async () => {
    if (window.api && window.api.getSyncQueue) {
      const queue = await window.api.getSyncQueue();
      setSyncQueueCount(queue?.length || 0);
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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('av_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem('av_sidebar_collapsed', String(next));
    } catch {}
  };

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Ambient background mesh & grid */}
      <div className="bg-mesh" aria-hidden="true"></div>
      <div className="bg-grid" aria-hidden="true"></div>

      {/* ─── Collapsible Sidebar ─── */}
      <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Brand */}
        <div className="sidebar-brand" onClick={() => navigate('/')}>
          <div className="topbar-brand-icon">
            <Shield size={20} style={{ color: 'var(--accent)' }} />
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-brand-text">
              <span>ArmoryVault</span>
              <span className="topbar-version-tag">v{packageJson.version}</span>
            </div>
          )}
        </div>

        {/* Primary Nav Group */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-group">
            {!sidebarCollapsed && <div className="sidebar-group-label">Vault</div>}
            {[
              { path: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
              { path: '/bound-book', icon: <BoundBookNavIcon size={18} />, label: 'Bound Book' },
              {
                path: '/ammo',
                icon: <CartridgesIcon size={18} />,
                label: 'Ammo & Reloading',
                activePaths: ['/ammo', '/components'],
              },
              {
                path: '/accessories',
                icon: <AccessoriesNavIcon size={18} />,
                label: 'Accessories',
              },
              {
                path: '/maintenance',
                icon: <MaintenanceNavIcon size={18} />,
                label: 'Maintenance',
              },
            ].map((item) => (
              <button
                key={item.path}
                className={`sidebar-nav-link ${
                  item.activePaths
                    ? item.activePaths.some((p) => isActive(p))
                      ? 'active'
                      : ''
                    : isActive(item.path)
                }`}
                onClick={() => navigate(item.path)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          <div className="sidebar-nav-divider" />

          {/* Tools Nav Group */}
          <div className="sidebar-nav-group">
            {!sidebarCollapsed && <div className="sidebar-group-label">Tools</div>}
            {[
              { path: '/ballistics', icon: <BallisticsNavIcon size={18} />, label: 'Ballistics' },
              { path: '/storage', icon: <SafeIcon size={18} />, label: 'Storage' },
              { path: '/load-development', icon: <LoadDevNavIcon size={18} />, label: 'Load Dev' },
              { path: '/nfa-tracker', icon: <NfaTrackerNavIcon size={18} />, label: 'NFA Tracker' },
            ].map((item) => (
              <button
                key={item.path}
                className={`sidebar-nav-link ${isActive(item.path)}`}
                onClick={() => navigate(item.path)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer — Collapse Toggle + Sync + Settings */}
        <div className="sidebar-footer">
          <button
            className={`sidebar-nav-link ${isActive('/sync') ? 'active' : ''}`}
            onClick={() => navigate('/sync')}
            title={sidebarCollapsed ? 'Mobile Sync' : undefined}
            style={{ position: 'relative' }}
          >
            <Smartphone size={18} />
            {!sidebarCollapsed && <span>Mobile Sync</span>}
            {syncQueueCount > 0 && <span className="sidebar-badge">{syncQueueCount}</span>}
          </button>
          <button
            className="sidebar-nav-link"
            onClick={() => setIsSettingsOpen(true)}
            title={sidebarCollapsed ? 'Settings' : undefined}
          >
            <Settings size={18} />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
          <button
            className="sidebar-collapse-btn"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* ─── Main Area (Topbar + Content) ─── */}
      <div className="app-main-area">
        <header className="app-topbar">
          {/* Slim topbar — just actions */}
          <div className="topbar-actions" style={{ marginLeft: 'auto' }}>
            <button
              className="btn-secondary"
              onClick={() => setIsRangeModalOpen(true)}
              title="Quickly log rounds fired and deduct ammo in one action"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <Target size={16} style={{ color: 'var(--accent)' }} />
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

            {onLockVault && (
              <button
                className="btn-icon"
                onClick={onLockVault}
                title="Lock Vault"
                style={{ color: 'var(--warning)' }}
              >
                <Lock size={18} />
              </button>
            )}
          </div>
        </header>

        <main className="main-content" ref={mainContentRef}>
          {updateStatus !== 'idle' && (
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                borderBottom: '1px solid var(--border-light)',
                padding: '1rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                animation: 'fadeIn 0.3s ease-out',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  color: 'var(--text-primary)',
                }}
              >
                {updateStatus === 'downloading' ? (
                  <DownloadCloud style={{ color: 'var(--accent)' }} size={24} />
                ) : (
                  <RefreshCw style={{ color: 'var(--success)' }} size={24} />
                )}
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
                <div
                  style={{
                    width: '200px',
                    background: 'rgba(0,0,0,0.3)',
                    height: '6px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${downloadProgress}%`,
                      height: '100%',
                      background: 'var(--accent)',
                      transition: 'width 0.2s',
                    }}
                  ></div>
                </div>
              )}
              {updateStatus === 'ready' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {platform !== 'darwin' && (
                    <button
                      className="btn-primary"
                      onClick={handleRestart}
                      title="Restart to install the update automatically"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      Restart & Install
                    </button>
                  )}
                  {platform === 'darwin' && (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        if (window.api && window.api.openUrl) {
                          window.api.openUrl(
                            'https://github.com/cook0001/ArmoryVault/releases/latest'
                          );
                        }
                      }}
                      title="Download the newest installer from GitHub"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      Download Mac Update
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {/* ─── Modals (Isolated & Memoized) ─── */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLockVault={onLockVault}
        onOpenSkuManager={() => setIsSkuManagerOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenRecoveryKey={() => setIsRecoveryKeyModalOpen(true)}
        onOpenActivityLog={() => setIsActivityLogOpen(true)}
        onSettingsSaved={() => {
          loadSyncQueue();
          window.dispatchEvent(new Event('armoryvault-reload'));
        }}
      />

      <SkuManagerModal isOpen={isSkuManagerOpen} onClose={() => setIsSkuManagerOpen(false)} />

      <ActivityLogModal isOpen={isActivityLogOpen} onClose={() => setIsActivityLogOpen(false)} />

      {isRangeModalOpen && (
        <RangeSessionModal
          isOpen={isRangeModalOpen}
          onClose={() => setIsRangeModalOpen(false)}
          onSaved={() => {
            loadSyncQueue();
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
