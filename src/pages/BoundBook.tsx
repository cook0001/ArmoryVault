import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Firearm } from '../types';
import { 
  Printer, 
  Download, 
  Search, 
  BookOpen, 
  ShieldCheck, 
  ArrowRightLeft, 
  Scale, 
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';

type BoundBookFilter = 'all' | 'open' | 'disposed' | 'vintage';

export const BoundBook = () => {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<BoundBookFilter>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadFirearms();
    const handleReload = () => loadFirearms();
    window.addEventListener('armoryvault-reload', handleReload);
    return () => window.removeEventListener('armoryvault-reload', handleReload);
  }, []);

  const loadFirearms = async () => {
    if (window.api) {
      const data = await window.api.getFirearms();
      setFirearms(data || []);
    }
  };

  const isVintage = (f: Firearm) => {
    const typeStr = (f.firearm_type || '').toLowerCase();
    const condStr = (f.condition || '').toLowerCase();
    return (
      typeStr.includes('curio') ||
      typeStr.includes('surplus') ||
      typeStr.includes('antique') ||
      condStr.includes('cmp') ||
      condStr.includes('nra')
    );
  };

  // Metrics summary
  const totalCount = firearms.length;
  const openCount = firearms.filter(f => !f.is_sold).length;
  const disposedCount = firearms.filter(f => f.is_sold).length;
  const vintageCount = firearms.filter(f => isVintage(f)).length;

  // Filtered dataset
  const filteredFirearms = useMemo(() => {
    return firearms.filter(f => {
      // Text query
      const query = search.toLowerCase();
      const matchesSearch = 
        (f.make || '').toLowerCase().includes(query) ||
        (f.model || '').toLowerCase().includes(query) ||
        (f.caliber || '').toLowerCase().includes(query) ||
        (f.serial_number || '').toLowerCase().includes(query) ||
        (f.purchased_from || '').toLowerCase().includes(query) ||
        (f.sold_to_name || '').toLowerCase().includes(query) ||
        (f.firearm_type || '').toLowerCase().includes(query) ||
        (f.notes || '').toLowerCase().includes(query) ||
        (f.sale_notes || '').toLowerCase().includes(query);

      // Status chip
      let matchesStatus = true;
      if (filterStatus === 'open') matchesStatus = !f.is_sold;
      else if (filterStatus === 'disposed') matchesStatus = f.is_sold;
      else if (filterStatus === 'vintage') matchesStatus = isVintage(f);

      return matchesSearch && matchesStatus;
    });
  }, [firearms, search, filterStatus]);

  const handleExportCSV = async () => {
    if (filteredFirearms.length === 0) return;
    try {
      const csvString = exportToCSV(filteredFirearms);
      if (window.api?.exportData) {
        await window.api.exportData(csvString, 'bound_book_records.csv');
      } else {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'bound_book_records.csv';
        link.click();
      }
    } catch (e) {
      console.error('Failed to export CSV', e);
      alert('An error occurred while exporting the Bound Book CSV.');
    }
  };

  return (
    <div className="bound-book-page">
      {/* Top Header */}
      <div className="no-print page-header">
        <div>
          <h1>A&D Bound Book</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            ATF Acquisition &amp; Disposition Ledger &bull; Permanent Federal Firearms Records
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="btn-secondary" 
            onClick={handleExportCSV}
            title="Export filtered records to RFC 4180 CSV spreadsheet"
            style={{ padding: '0.5rem 0.95rem', fontSize: '0.85rem' }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          
          <button 
            className="btn-primary" 
            onClick={() => window.print()}
            title="Print official 8.5x11 landscape ATF record ledger"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Printer size={16} />
            <span>Print 8.5x11 Ledger</span>
          </button>
        </div>
      </div>

      {/* Compliance & Ledger Metrics */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '0.75rem', borderRadius: '12px', color: '#60a5fa' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <div className="stat-label">Total Bound Entries</div>
              <div className="stat-val">{totalCount}</div>
              <div className="stat-sub">Lifetime Acquisitions</div>
            </div>
          </div>
        </div>

        <div className="stat-card" onClick={() => setFilterStatus(filterStatus === 'open' ? 'all' : 'open')} style={{ cursor: 'pointer' }} title="Filter to Open Acquisitions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.75rem', borderRadius: '12px', color: '#34d399' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="stat-label">Active in Vault</div>
              <div className="stat-val" style={{ color: '#34d399' }}>{openCount}</div>
              <div className="stat-sub">Open Dispositions</div>
            </div>
          </div>
        </div>

        <div className="stat-card" onClick={() => setFilterStatus(filterStatus === 'disposed' ? 'all' : 'disposed')} style={{ cursor: 'pointer' }} title="Filter to Disposed Records">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.75rem', borderRadius: '12px', color: '#fbbf24' }}>
              <ArrowRightLeft size={22} />
            </div>
            <div>
              <div className="stat-label">Transferred / Sold</div>
              <div className="stat-val">{disposedCount}</div>
              <div className="stat-sub">Closed Dispositions</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '0.75rem', borderRadius: '12px', color: '#c084fc' }}>
              <Scale size={22} />
            </div>
            <div>
              <div className="stat-label">Compliance Format</div>
              <div className="stat-val" style={{ fontSize: '1.25rem', color: '#c084fc' }}>ATF P 5300.4</div>
              <div className="stat-sub">Permanent A&amp;D Record</div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Search & Filter Deck */}
      <div className="no-print dashboard-control-deck">
        {/* Filter Chips */}
        <div className="filter-chips-bar">
          <button 
            className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            <span>All Records</span>
            <span className="filter-chip-count">{totalCount}</span>
          </button>

          <button 
            className={`filter-chip ${filterStatus === 'open' ? 'active' : ''}`}
            onClick={() => setFilterStatus('open')}
          >
            <span>🛡️ Active in Safe</span>
            <span className="filter-chip-count">{openCount}</span>
          </button>

          <button 
            className={`filter-chip ${filterStatus === 'disposed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('disposed')}
          >
            <span>🤝 Disposed / Sold</span>
            <span className="filter-chip-count">{disposedCount}</span>
          </button>

          {vintageCount > 0 && (
            <button 
              className={`filter-chip ${filterStatus === 'vintage' ? 'active' : ''}`}
              onClick={() => setFilterStatus('vintage')}
            >
              <span>🎖️ Curio &amp; Relic</span>
              <span className="filter-chip-count">{vintageCount}</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="dashboard-control-right">
          <div className="search-box">
            <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder="Search serial, make, model, acquired/disposed from..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Print-Only Stark ATF Header */}
      <div className="print-header" style={{ display: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid black', paddingBottom: '8px', marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Acquisition and Disposition Record
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '9pt', color: '#333' }}>
              Standard Federal Firearms Record &bull; ATF Compliance Standard
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '9pt' }}>
            <div><strong>Generated:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
            <div><strong>Total Records:</strong> {filteredFirearms.length}</div>
          </div>
        </div>
      </div>

      {/* Bound Book Table */}
      <div className="bound-book-table-container">
        <table className="bound-book-table">
          <thead>
            <tr>
              <th colSpan={6} className="bound-book-table-section-acq" style={{ textAlign: 'center' }}>
                &bull; ACQUISITION RECORD &bull;
              </th>
              <th colSpan={3} className="bound-book-table-section-disp" style={{ textAlign: 'center' }}>
                &bull; DISPOSITION RECORD &bull;
              </th>
            </tr>
            <tr>
              <th style={{ width: '130px' }}>Serial Number</th>
              <th>Manufacturer / Importer</th>
              <th>Model</th>
              <th>Type / Caliber</th>
              <th style={{ width: '105px' }}>Date Acquired</th>
              <th style={{ borderRight: '2px solid rgba(59, 130, 246, 0.3)' }}>Name &amp; Address From Whom Acquired</th>
              <th style={{ width: '105px' }}>Date Disposed</th>
              <th>Name &amp; Address Disposed To</th>
              <th>Disposition Status &amp; Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredFirearms.map(f => (
              <tr 
                key={f.id}
                onClick={() => navigate(`/details/${f.id}`)}
                title="Click to view full firearm dossier"
              >
                <td>
                  <span className="mono-serial-badge">{f.serial_number}</span>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.make}</td>
                <td style={{ fontWeight: 500 }}>{f.model}</td>
                <td>
                  <span style={{ color: 'var(--text-secondary)' }}>{f.firearm_type || 'Firearm'}</span> &bull; <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{f.caliber}</strong>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  {f.purchase_date || '—'}
                </td>
                <td style={{ borderRight: '2px solid rgba(59, 130, 246, 0.3)', color: 'var(--text-secondary)' }}>
                  {f.purchased_from || 'Private Party'}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  {f.is_sold ? (f.sold_date || '—') : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td>
                  {f.is_sold ? (
                    <strong style={{ color: 'var(--text-primary)' }}>{f.sold_to_name || 'Private Buyer'}</strong>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td>
                  {f.is_sold ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span className="status-badge sold">Transferred / Disposed</span>
                      {f.sale_notes && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({f.sale_notes})</span>}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span className="status-badge available">● In Active Vault</span>
                      {f.is_nfa && (
                        <span className="status-badge" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.4)' }}>
                          NFA
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {filteredFirearms.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--bg-surface)' }}>
                  <BookOpen size={36} opacity={0.3} style={{ marginBottom: '0.75rem' }} />
                  <h3>No Bound Book Records Match Your Filter</h3>
                  <p style={{ marginTop: '0.35rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Try clearing search criteria or selecting "All Records".
                  </p>
                  <button 
                    className="btn-secondary btn-sm" 
                    onClick={() => { setSearch(''); setFilterStatus('all'); }} 
                    style={{ marginTop: '1rem' }}
                  >
                    Reset Filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
