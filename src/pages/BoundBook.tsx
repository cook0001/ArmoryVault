import React, { useEffect, useState } from 'react';
import { Firearm } from '../types';
import { Printer, Filter } from 'lucide-react';

export const BoundBook = () => {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [showOpenOnly, setShowOpenOnly] = useState(false);

  useEffect(() => {
    loadFirearms();
  }, []);

  const loadFirearms = async () => {
    if (window.api) {
      const data = await window.api.getFirearms();
      setFirearms(data);
    }
  };

  const filteredFirearms = showOpenOnly ? firearms.filter(f => !f.is_sold) : firearms;

  return (
    <div className="bound-book-page">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>A&D Bound Book</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={`btn-secondary ${showOpenOnly ? 'active-filter' : ''}`} onClick={() => setShowOpenOnly(!showOpenOnly)} style={showOpenOnly ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : {}}>
            <Filter size={18} /> {showOpenOnly ? 'Showing Open Dispositions' : 'Show All Records'}
          </button>
          <button className="btn-primary" onClick={() => window.print()}>
            <Printer size={18} /> Print Record
          </button>
        </div>
      </div>

      <div className="print-header" style={{ display: 'none' }}>
        <h2>Acquisition and Disposition Record</h2>
        <p>Printed on: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bound-book-table-container">
        <table className="bound-book-table">
          <thead>
            <tr>
              <th colSpan={6} style={{ textAlign: 'center', borderRight: '2px solid var(--border-light)' }}>ACQUISITION</th>
              <th colSpan={3} style={{ textAlign: 'center' }}>DISPOSITION</th>
            </tr>
            <tr>
              <th>Manufacturer / Importer</th>
              <th>Model</th>
              <th>Serial Number</th>
              <th>Type / Caliber</th>
              <th>Date Acquired</th>
              <th style={{ borderRight: '2px solid var(--border-light)' }}>Name & Address From Whom Acquired</th>
              <th>Date Disposed</th>
              <th>Name & Address Disposed To</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredFirearms.map(f => (
              <tr key={f.id}>
                <td>{f.make}</td>
                <td>{f.model}</td>
                <td>{f.serial_number}</td>
                <td>{f.firearm_type || '-'} / {f.caliber || '-'}</td>
                <td>{f.purchase_date}</td>
                <td style={{ borderRight: '2px solid var(--border-light)' }}>{f.purchased_from || 'Private'}</td>
                <td>{f.is_sold ? f.sold_date : ''}</td>
                <td>{f.is_sold ? f.sold_to_name : ''}</td>
                <td>{f.is_sold ? f.sale_notes : f.notes}</td>
              </tr>
            ))}
            {filteredFirearms.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
