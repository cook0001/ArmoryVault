import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Shield, PlusCircle, LayoutDashboard, BookOpen, DownloadCloud, RefreshCw } from 'lucide-react';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'downloading' | 'ready'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);

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
  }, []);

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
          <button onClick={() => navigate('/bound-book')} className={`nav-item ${isActive('/bound-book')}`}>
            <BookOpen size={20} />
            <span>Bound Book</span>
          </button>
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          ArmoryVault v1.0.0
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
              <button className="btn-primary" onClick={handleRestart} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Restart & Install
              </button>
            )}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};
