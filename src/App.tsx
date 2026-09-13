import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { CommandPalette } from './components/CommandPalette';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { ModulePromptView } from './components/ModulePromptView';
import { UndoToastProvider } from './components/UndoToast';
import { ModuleProvider, useModules } from './modules/registry/ModuleContext';
import { VaultLogin } from './pages/VaultLogin';

// Code-split route modules to minimize initial bundle size and memory footprint
const Dashboard = React.lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const AmmoDashboard = React.lazy(() =>
  import('./pages/AmmoDashboard').then((m) => ({ default: m.AmmoDashboard }))
);
const FirearmDetails = React.lazy(() =>
  import('./pages/FirearmDetails').then((m) => ({ default: m.FirearmDetails }))
);
const Accessories = React.lazy(() =>
  import('./pages/Accessories').then((m) => ({ default: m.Accessories }))
);
const BallisticsCalculator = React.lazy(() =>
  import('./pages/BallisticsCalculator').then((m) => ({ default: m.BallisticsCalculator }))
);
const BoundBook = React.lazy(() =>
  import('./pages/BoundBook').then((m) => ({ default: m.BoundBook }))
);
const FirearmForm = React.lazy(() =>
  import('./pages/FirearmForm').then((m) => ({ default: m.FirearmForm }))
);
const LoadDevelopment = React.lazy(() =>
  import('./pages/LoadDevelopment').then((m) => ({ default: m.LoadDevelopment }))
);
const MaintenanceDashboard = React.lazy(() =>
  import('./pages/MaintenanceDashboard').then((m) => ({ default: m.MaintenanceDashboard }))
);
const NfaTracker = React.lazy(() =>
  import('./pages/NfaTracker').then((m) => ({ default: m.NfaTracker }))
);
const ReloadingComponents = React.lazy(() =>
  import('./pages/ReloadingComponents').then((m) => ({ default: m.ReloadingComponents }))
);
const StorageOrganizer = React.lazy(() =>
  import('./pages/StorageOrganizer').then((m) => ({ default: m.StorageOrganizer }))
);
const SyncInbox = React.lazy(() =>
  import('./pages/SyncInbox').then((m) => ({ default: m.SyncInbox }))
);

const ModularRoute: React.FC<{
  moduleId: string;
  featureName: string;
  element: React.ReactElement;
}> = ({ moduleId, featureName, element }) => {
  const { isInstalled } = useModules();
  if (!isInstalled(moduleId)) {
    return <ModulePromptView moduleId={moduleId} featureName={featureName} />;
  }
  return element;
};

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
      if (window.api?.isVaultSetup) {
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
    if (window.api?.onVaultLocked) {
      const unsub = window.api.onVaultLocked(() => {
        setIsLocked(true);
      });
      return () => unsub();
    }
  }, []);

  const lockVault = useCallback(async () => {
    if (window.api?.lockVault) {
      await window.api.lockVault();
    }
    setIsLocked(true);
  }, []);

  const lastActivityRef = useRef<number>(0);

  // Auto-lock timer: resets on user activity (throttled to at most once per 5s)
  const resetAutoLock = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current < 5000 && autoLockTimer.current) return;
    lastActivityRef.current = now;

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
    <ModuleProvider>
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
                  <Route
                    path="bound-book"
                    element={
                      <ModularRoute
                        moduleId="boundbook"
                        featureName="FFL / C&R Bound Book"
                        element={<BoundBook />}
                      />
                    }
                  />
                  <Route path="ammo" element={<AmmoDashboard />} />
                  <Route
                    path="components"
                    element={
                      <ModularRoute
                        moduleId="reloading"
                        featureName="Reloading Components"
                        element={<ReloadingComponents />}
                      />
                    }
                  />
                  <Route path="accessories" element={<Accessories />} />
                  <Route
                    path="maintenance"
                    element={
                      <ModularRoute
                        moduleId="maintenance"
                        featureName="Armorer & Maintenance"
                        element={<MaintenanceDashboard />}
                      />
                    }
                  />
                  <Route path="sync" element={<SyncInbox />} />
                  <Route
                    path="ballistics"
                    element={
                      <ModularRoute
                        moduleId="ballistics"
                        featureName="Ballistics Calculator"
                        element={<BallisticsCalculator />}
                      />
                    }
                  />
                  <Route path="storage" element={<StorageOrganizer />} />
                  <Route
                    path="load-development"
                    element={
                      <ModularRoute
                        moduleId="reloading"
                        featureName="Load Development"
                        element={<LoadDevelopment />}
                      />
                    }
                  />
                  <Route
                    path="nfa-tracker"
                    element={
                      <ModularRoute
                        moduleId="nfa"
                        featureName="NFA Tracker"
                        element={<NfaTracker />}
                      />
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </UndoToastProvider>
        </ErrorBoundary>
      </HashRouter>
    </ModuleProvider>
  );
}

export default App;
