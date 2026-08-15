import React, { useEffect, useState } from 'react';
import { Firearm } from '../types';
import { Printer } from 'lucide-react';

export const BoundBook = () => {
  const [firearms, setFirearms] = useState<Firearm[]>([]);

  useEffect(() => {
    loadFirearms();
  }, []);

  const loadFirearms = async () => {
    if (window.api) {
      const data = await window.api.getFirearms();
      setFirearms(data);
    }
  };

  return (
    <div className="bound-book-page">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>A&D Bound Book</h1>
        <button className="btn-primary" onClick={() => window.print()}>
          <Printer size={18} /> Print Record
        </button>
      </div>

      <div className="print-header" style={{ display: 'none' }}>
        <h2>Acquisition and Disposition Record</h2>
        <p>Printed on: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bound-book-table-container">
        <table className="bound-book-table">
          <thead>
            <tr>
              <th colSpan={5} style={{ textAlign: 'center', borderRight: '2px solid var(--border-light)' }}>ACQUISITION</th>
              <th colSpan={3} style={{ textAlign: 'center' }}>DISPOSITION</th>
            </tr>
            <tr>
              <th>Manufacturer</th>
              <th>Model</th>
              <th>Serial Number</th>
              <th>Caliber / Type</th>
              <th style={{ borderRight: '2px solid var(--border-light)' }}>Date Acquired</th>
              <th>Date Disposed</th>
              <th>Name / Address Disposed To</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {firearms.map(f => (
              <tr key={f.id}>
                <td>{f.make}</td>
                <td>{f.model}</td>
                <td>{f.serial_number}</td>
                <td>{f.caliber || '-'} / {f.action_type || '-'}</td>
                <td style={{ borderRight: '2px solid var(--border-light)' }}>{f.purchase_date}</td>
                <td>{f.is_sold ? f.sold_date : ''}</td>
                <td>{f.is_sold ? f.sold_to_name : ''}</td>
                <td>{f.is_sold ? f.sale_notes : f.notes}</td>
              </tr>
            ))}
            {firearms.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No firearms in inventory.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
