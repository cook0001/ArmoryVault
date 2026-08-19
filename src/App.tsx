import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { FirearmForm } from './pages/FirearmForm';
import { FirearmDetails } from './pages/FirearmDetails';
import { BoundBook } from './pages/BoundBook';
import { VaultLogin } from './pages/VaultLogin';
import { AmmoDashboard } from './pages/AmmoDashboard';
import { Accessories } from './pages/Accessories';
import { MaintenanceDashboard } from './pages/MaintenanceDashboard';
import { SyncInbox } from './pages/SyncInbox';
import { ReloadingComponents } from './pages/ReloadingComponents';

const AUTO_LOCK_MS = 15 * 60 * 1000; // 15 minutes of inactivity

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const autoLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkVault = async () => {
      if (window.api && window.api.isVaultSetup) {
        const setup = await window.api.isVaultSetup();
        const locked = await window.api.isVaultLocked();
        setIsSetup(setup);
        setIsLocked(locked);
      } else {
        // Fallback for tests/environments without the updated api
        setIsLocked(false);
        setIsSetup(true);
      }
      setLoading(false);
    };
    checkVault();

    // Listen for remote vault lock from mobile companion app
    if (window.api && window.api.onVaultLocked) {
      const unsub = window.api.onVaultLocked(() => {
        setIsLocked(true);
      });
      return () => unsub();
    }
  }, []);

  const lockVault = useCallback(async () => {
    if (window.api && window.api.lockVault) {
      await window.api.lockVault();
    }
    setIsLocked(true);
  }, []);

  // Auto-lock timer: resets on user activity
  const resetAutoLock = useCallback(() => {
    if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
    if (!isLocked) {
      autoLockTimer.current = setTimeout(() => {
        lockVault();
      }, AUTO_LOCK_MS);
    }
  }, [isLocked, lockVault]);

  useEffect(() => {
    if (isLocked) return;

    // Start the timer and listen for user activity
    resetAutoLock();
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetAutoLock));

    return () => {
      events.forEach(e => window.removeEventListener(e, resetAutoLock));
      if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
    };
  }, [isLocked, resetAutoLock]);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Secure Vault...</div>;
  }

  if (isLocked) {
    return <VaultLogin isSetup={isSetup} onUnlocked={() => setIsLocked(false)} />;
  }

  return (
    <HashRouter>
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Layout onLockVault={lockVault} />}>
          <Route index element={<Dashboard />} />
          <Route path="add" element={<FirearmForm />} />
          <Route path="edit/:id" element={<FirearmForm />} />
          <Route path="details/:id" element={<FirearmDetails />} />
          <Route path="bound-book" element={<BoundBook />} />
          <Route path="ammo" element={<AmmoDashboard />} />
          <Route path="components" element={<ReloadingComponents />} />
          <Route path="accessories" element={<Accessories />} />
          <Route path="maintenance" element={<MaintenanceDashboard />} />
          <Route path="sync" element={<SyncInbox />} />
        </Route>
      </Routes>
      </ErrorBoundary>
    </HashRouter>
  );
}

export default App;
