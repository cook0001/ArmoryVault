import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Firearm } from '../types';
import { Search, Info, Download, Target, DollarSign, Package } from 'lucide-react';
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

  const totalValue = firearms.reduce((acc, f) => {
    const logsCost = f.logs?.reduce((sum, log) => sum + (Number(log.cost) || 0), 0) || 0;
    return acc + (Number(f.purchase_price) || 0) + logsCost;
  }, 0);
  const totalSoldValue = firearms.reduce((acc, f) => acc + (f.is_sold ? (Number(f.sold_price) || 0) : 0), 0);
  const availableCount = firearms.filter(f => !f.is_sold).length;

  const getDirtyRounds = (f: Firearm) => {
    if (!f.logs || f.logs.length === 0) return 0;
    const cleaningLogs = f.logs.filter(l => l.type === 'Cleaning').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastCleaningDate = cleaningLogs.length > 0 ? new Date(cleaningLogs[0].date).getTime() : 0;
    
    return f.logs
      .filter(l => l.type === 'Range' && new Date(l.date).getTime() >= lastCleaningDate)
      .reduce((sum, l) => sum + (l.rounds_fired || 0), 0);
  };

  return (
    <div className="dashboard">
      <div className="page-header">
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(59, 130, 246, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', animation: 'fadeIn 0.5s ease-out forwards', opacity: 0 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))', padding: '1rem', borderRadius: '12px', color: '#60a5fa', boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)' }}>
            <Target size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Firearms</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{firearms.length}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', animation: 'fadeIn 0.5s ease-out forwards', animationDelay: '0.1s', opacity: 0 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))', padding: '1rem', borderRadius: '12px', color: '#34d399', boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)' }}>
            <Package size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Available in Safe</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{availableCount}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(245, 158, 11, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', animation: 'fadeIn 0.5s ease-out forwards', animationDelay: '0.2s', opacity: 0 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))', padding: '1rem', borderRadius: '12px', color: '#fbbf24', boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)' }}>
            <DollarSign size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Invested</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
        </div>

        {totalSoldValue > 0 && (
          <div className="card stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', animation: 'fadeIn 0.5s ease-out forwards', animationDelay: '0.3s', opacity: 0 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))', padding: '1rem', borderRadius: '12px', color: '#f87171', boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)' }}>
              <DollarSign size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Sold</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>${totalSoldValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
          </div>
        )}
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
            {filtered.map((f, i) => (
              <tr 
                key={f.id} 
                className={f.is_sold ? 'row-sold clickable-row' : 'clickable-row'}
                onClick={() => navigate(`/details/${f.id}`)}
                style={{ animation: 'fadeIn 0.3s ease-out forwards', animationDelay: `${0.1 + (i * 0.05)}s`, opacity: 0 }}
              >
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{f.make}</td>
                <td>{f.model}</td>
                <td style={{ color: 'var(--accent)' }}>{f.caliber}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>{f.serial_number}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`status-badge ${f.is_sold ? 'sold' : 'available'}`}>
                      {f.is_sold ? 'Sold' : 'Available'}
                    </span>
                    {f.is_nfa && (
                      <span className="status-badge" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.5)' }}>
                        NFA
                      </span>
                    )}
                    {!f.is_sold && getDirtyRounds(f) >= 500 && (
                      <span className="status-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)' }} title={`${getDirtyRounds(f)} rounds since last cleaning`}>
                        Needs Cleaning
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">No firearms found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
