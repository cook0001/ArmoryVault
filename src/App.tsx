import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

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
  }, []);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Secure Vault...</div>;
  }

  if (isLocked) {
    return <VaultLogin isSetup={isSetup} onUnlocked={() => setIsLocked(false)} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="add" element={<FirearmForm />} />
          <Route path="edit/:id" element={<FirearmForm />} />
          <Route path="details/:id" element={<FirearmDetails />} />
          <Route path="bound-book" element={<BoundBook />} />
          <Route path="ammo" element={<AmmoDashboard />} />
          <Route path="accessories" element={<Accessories />} />
          <Route path="maintenance" element={<MaintenanceDashboard />} />
          <Route path="sync" element={<SyncInbox />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
