import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { CommandPalette } from './components/CommandPalette';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { UndoToastProvider } from './components/UndoToast';
import { Accessories } from './pages/Accessories';
import { BallisticsCalculator } from './pages/BallisticsCalculator';
import { BoundBook } from './pages/BoundBook';
import { FirearmForm } from './pages/FirearmForm';
import { LoadDevelopment } from './pages/LoadDevelopment';
import { MaintenanceDashboard } from './pages/MaintenanceDashboard';
import { NfaTracker } from './pages/NfaTracker';
import { ReloadingComponents } from './pages/ReloadingComponents';
import { StorageOrganizer } from './pages/StorageOrganizer';
import { SyncInbox } from './pages/SyncInbox';
import { VaultLogin } from './pages/VaultLogin';

// Code-split modules with >1,000 lines
const Dashboard = React.lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const AmmoDashboard = React.lazy(() =>
  import('./pages/AmmoDashboard').then((m) => ({ default: m.AmmoDashboard }))
);
const FirearmDetails = React.lazy(() =>
  import('./pages/FirearmDetails').then((m) => ({ default: m.FirearmDetails }))
);

const PageLoader = () => (
  <div
    style={{
      height: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-secondary, #94a3b8)',
      gap: 12,
    }}
  >
    <div className="vault-spinner" />
    <span style={{ fontSize: 13, opacity: 0.7 }}>Loading module...</span>
  </div>
);

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
    events.forEach((e) => window.addEventListener(e, resetAutoLock));

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetAutoLock));
      if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
    };
  }, [isLocked, resetAutoLock]);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        Loading Secure Vault...
      </div>
    );
  }

  if (isLocked) {
    return <VaultLogin isSetup={isSetup} onUnlocked={() => setIsLocked(false)} />;
  }

  return (
    <HashRouter>
      <ErrorBoundary>
        <UndoToastProvider>
          <CommandPalette />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Layout onLockVault={lockVault} />}>
                <Route index element={<Dashboard />} />
                <Route path="add" element={<FirearmForm />} />
                <Route path="edit/:id" element={<FirearmForm />} />
                <Route path="details/:id" element={<FirearmDetails />} />
                <Route path="firearms/:id" element={<FirearmDetails />} />
                <Route path="bound-book" element={<BoundBook />} />
                <Route path="ammo" element={<AmmoDashboard />} />
                <Route path="components" element={<ReloadingComponents />} />
                <Route path="accessories" element={<Accessories />} />
                <Route path="maintenance" element={<MaintenanceDashboard />} />
                <Route path="sync" element={<SyncInbox />} />
                <Route path="ballistics" element={<BallisticsCalculator />} />
                <Route path="storage" element={<StorageOrganizer />} />
                <Route path="load-development" element={<LoadDevelopment />} />
                <Route path="nfa-tracker" element={<NfaTracker />} />
              </Route>
            </Routes>
          </Suspense>
        </UndoToastProvider>
      </ErrorBoundary>
    </HashRouter>
  );
}

export default App;
