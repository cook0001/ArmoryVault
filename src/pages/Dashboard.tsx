import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Firearm } from '../types';
import { Search, Info, Download } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';

export const Dashboard = () => {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [search, setSearch] = useState('');
  const [filterSold, setFilterSold] = useState<'all' | 'available' | 'sold'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadFirearms();
  }, []);

  const loadFirearms = async () => {
    if (window.api) {
      const data = await window.api.getFirearms();
      setFirearms(data);
    }
  };

  const filtered = firearms.filter(f => {
    const matchesSearch = `${f.make} ${f.model} ${f.caliber}`.toLowerCase().includes(search.toLowerCase());
    const matchesSold = filterSold === 'all' || (filterSold === 'sold' && f.is_sold) || (filterSold === 'available' && !f.is_sold);
    return matchesSearch && matchesSold;
  });

  const handleExport = async () => {
    const csvString = exportToCSV(firearms);
    await window.api.exportData(csvString, 'firearms_inventory.csv');
  };

  return (
    <div className="dashboard">
      <div className="header-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1>Inventory Dashboard</h1>
          <button className="btn-secondary" onClick={handleExport} title="Export to CSV">
            <Download size={18} /> Export
          </button>
        </div>
        <div className="filters">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search make, model, caliber..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select value={filterSold} onChange={(e) => setFilterSold(e.target.value as any)} className="select-box">
            <option value="all">All Items</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Make</th>
              <th>Model</th>
              <th>Caliber</th>
              <th>Serial Number</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr 
                key={f.id} 
                className={f.is_sold ? 'row-sold clickable-row' : 'clickable-row'}
                onClick={() => navigate(`/details/${f.id}`)}
              >
                <td>{f.make}</td>
                <td>{f.model}</td>
                <td>{f.caliber}</td>
                <td>{f.serial_number}</td>
                <td>
                  <span className={`status-badge ${f.is_sold ? 'sold' : 'available'}`}>
                    {f.is_sold ? 'Sold' : 'Available'}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
              <tr>
                <td colSpan={5} className="empty-state">No firearms found.</td>
              </tr>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
