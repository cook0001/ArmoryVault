import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { FirearmForm } from './pages/FirearmForm';
import { FirearmDetails } from './pages/FirearmDetails';
import { BoundBook } from './pages/BoundBook';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="add" element={<FirearmForm />} />
          <Route path="edit/:id" element={<FirearmForm />} />
          <Route path="details/:id" element={<FirearmDetails />} />
          <Route path="bound-book" element={<BoundBook />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
