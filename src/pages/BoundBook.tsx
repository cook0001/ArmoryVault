import {
  AlertTriangle,
  ArrowRightLeft,
  Award,
  BookOpen,
  Download,
  FileCheck2,
  Printer,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Firearm } from '../types';
import { exportToCSV } from '../utils/csvExport';

type BoundBookFilter = 'all' | 'open' | 'disposed' | 'vintage';

export const BoundBook = () => {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<BoundBookFilter>('all');
  const [isAtfComplianceMode, setIsAtfComplianceMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('av_bound_book_compliance_mode') === 'true';
    } catch {
      return false;
    }
  });

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

  const handleToggleMode = (enableAtf: boolean) => {
    setIsAtfComplianceMode(enableAtf);
    try {
      localStorage.setItem('av_bound_book_compliance_mode', String(enableAtf));
    } catch {}
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

  // ATF Compliance Validator
  const getComplianceStatus = (f: Firearm) => {
    const issues: string[] = [];
    if (!f.serial_number || f.serial_number.trim() === '') issues.push('Missing Serial');
    if (!f.make || f.make.trim() === '') issues.push('Missing Manufacturer');
    if (!f.model || f.model.trim() === '') issues.push('Missing Model');
    if (!f.caliber || f.caliber.trim() === '') issues.push('Missing Caliber');
    if (!f.purchase_date) issues.push('Missing Acquisition Date');
    if (f.is_sold && !f.sold_date) issues.push('Missing Disposition Date');
    return issues;
  };

  // Metrics summary
  const totalCount = firearms.length;
  const openCount = firearms.filter((f) => !f.is_sold).length;
  const disposedCount = firearms.filter((f) => f.is_sold).length;
  const vintageCount = firearms.filter((f) => isVintage(f)).length;
  const nonCompliantCount = firearms.filter((f) => getComplianceStatus(f).length > 0).length;

  // Filtered dataset
  const filteredFirearms = useMemo(() => {
    return firearms.filter((f) => {
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
      const filename = isAtfComplianceMode
        ? 'atf_bound_book_records.csv'
        : 'collector_firearm_ledger.csv';
      if (window.api?.exportData) {
        await window.api.exportData(csvString, filename);
      } else {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.25rem',
            }}
          >
            <h1>{isAtfComplianceMode ? 'ATF A&D Bound Book' : 'Collector Firearms Ledger'}</h1>
            <div
              style={{
                display: 'flex',
                background: 'rgba(0,0,0,0.35)',
                padding: '2px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
              }}
            >
              <button
                type="button"
                onClick={() => handleToggleMode(false)}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: !isAtfComplianceMode ? 'var(--accent)' : 'transparent',
                  color: !isAtfComplianceMode ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Collector View
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode(true)}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: isAtfComplianceMode ? '#8b5cf6' : 'transparent',
                  color: isAtfComplianceMode ? '#fff' : 'var(--text-secondary)',
                }}
              >
                ATF / FFL Mode
              </button>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            {isAtfComplianceMode
              ? 'Official 27 CFR § 478.125(e) Acquisition & Disposition Ledger • Audit & Inspection Records'
              : 'Personal acquisition history, purchase dates, source records, and disposition tracking.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn-secondary"
            onClick={handleExportCSV}
            title="Export filtered records to spreadsheet"
            style={{ padding: '0.5rem 0.95rem', fontSize: '0.85rem' }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            className="btn-primary"
            onClick={() => window.print()}
            title={
              isAtfComplianceMode
                ? 'Print official 8.5x11 landscape ATF record ledger'
                : 'Print Collector Ledger'
            }
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              backgroundColor: isAtfComplianceMode ? '#8b5cf6' : undefined,
            }}
          >
            <Printer size={16} />
            <span>{isAtfComplianceMode ? 'Print ATF Ledger' : 'Print Ledger'}</span>
          </button>
        </div>
      </div>

      {/* Compliance & Ledger Metrics */}
      <div
        className="no-print"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '0.75rem',
                borderRadius: '12px',
                color: '#60a5fa',
              }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <div className="stat-label">Total Recorded</div>
              <div className="stat-val">{totalCount}</div>
              <div className="stat-sub">Lifetime Entries</div>
            </div>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setFilterStatus(filterStatus === 'open' ? 'all' : 'open')}
          style={{ cursor: 'pointer' }}
          title="Filter to Active Firearms"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '0.75rem',
                borderRadius: '12px',
                color: '#34d399',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="stat-label">Active in Vault</div>
              <div className="stat-val" style={{ color: '#34d399' }}>
                {openCount}
              </div>
              <div className="stat-sub">In Safe / Collection</div>
            </div>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setFilterStatus(filterStatus === 'disposed' ? 'all' : 'disposed')}
          style={{ cursor: 'pointer' }}
          title="Filter to Disposed Records"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '0.75rem',
                borderRadius: '12px',
                color: '#fbbf24',
              }}
            >
              <ArrowRightLeft size={22} />
            </div>
            <div>
              <div className="stat-label">Disposed / Sold</div>
              <div className="stat-val">{disposedCount}</div>
              <div className="stat-sub">Transferred Records</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                background: isAtfComplianceMode
                  ? 'rgba(168, 85, 247, 0.12)'
                  : 'rgba(56, 189, 248, 0.12)',
                border: `1px solid ${isAtfComplianceMode ? 'rgba(168, 85, 247, 0.25)' : 'rgba(56, 189, 248, 0.25)'}`,
                padding: '0.75rem',
                borderRadius: '12px',
                color: isAtfComplianceMode ? '#c084fc' : '#38bdf8',
              }}
            >
              {isAtfComplianceMode ? <Scale size={22} /> : <FileCheck2 size={22} />}
            </div>
            <div>
              <div className="stat-label">Ledger Standard</div>
              <div
                className="stat-val"
                style={{
                  fontSize: '1.15rem',
                  color: isAtfComplianceMode ? '#c084fc' : 'var(--text-primary)',
                }}
              >
                {isAtfComplianceMode ? '27 CFR § 478' : 'Collector Standard'}
              </div>
              <div
                className="stat-sub"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {isAtfComplianceMode && nonCompliantCount > 0 ? (
                  <>
                    <AlertTriangle size={12} style={{ color: '#f59e0b' }} />
                    <span>{nonCompliantCount} Missing Fields</span>
                  </>
                ) : (
                  'Audit Verified'
                )}
              </div>
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
            <ShieldCheck size={14} style={{ color: '#34d399' }} />
            <span>Active in Safe</span>
            <span className="filter-chip-count">{openCount}</span>
          </button>

          <button
            className={`filter-chip ${filterStatus === 'disposed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('disposed')}
          >
            <ArrowRightLeft size={14} style={{ color: '#fbbf24' }} />
            <span>Disposed / Sold</span>
            <span className="filter-chip-count">{disposedCount}</span>
          </button>

          {vintageCount > 0 && (
            <button
              className={`filter-chip ${filterStatus === 'vintage' ? 'active' : ''}`}
              onClick={() => setFilterStatus('vintage')}
            >
              <Award size={14} style={{ color: '#c084fc' }} />
              <span>Curio &amp; Relic</span>
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

      {/* Print-Only Stark Header */}
      <div className="print-header" style={{ display: 'none' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '2px solid black',
            paddingBottom: '8px',
            marginBottom: '12px',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '16pt',
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              {isAtfComplianceMode
                ? 'Acquisition and Disposition Record'
                : 'Firearm Collection & Acquisition Ledger'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '9pt', color: '#333' }}>
              {isAtfComplianceMode
                ? 'Standard Federal Firearms Record • ATF 27 CFR Compliance'
                : 'ArmoryVault Personal Inventory Ledger'}
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '9pt' }}>
            <div>
              <strong>Generated:</strong> {new Date().toLocaleDateString()}{' '}
              {new Date().toLocaleTimeString()}
            </div>
            <div>
              <strong>Total Records:</strong> {filteredFirearms.length}
            </div>
          </div>
        </div>
      </div>

      {/* Bound Book Table */}
      <div className="bound-book-table-container">
        <table className="bound-book-table">
          <thead>
            {isAtfComplianceMode ? (
              <>
                <tr>
                  <th
                    colSpan={6}
                    className="bound-book-table-section-acq"
                    style={{ textAlign: 'center' }}
                  >
                    &bull; ACQUISITION RECORD &bull;
                  </th>
                  <th
                    colSpan={3}
                    className="bound-book-table-section-disp"
                    style={{ textAlign: 'center' }}
                  >
                    &bull; DISPOSITION RECORD &bull;
                  </th>
                </tr>
                <tr>
                  <th style={{ width: '130px' }}>Serial Number</th>
                  <th>Manufacturer / Importer</th>
                  <th>Model</th>
                  <th>Type / Caliber</th>
                  <th style={{ width: '105px' }}>Date Acquired</th>
                  <th style={{ borderRight: '2px solid rgba(59, 130, 246, 0.3)' }}>
                    Name &amp; Address From Whom Acquired
                  </th>
                  <th style={{ width: '105px' }}>Date Disposed</th>
                  <th>Name &amp; Address Disposed To</th>
                  <th>Disposition Status &amp; Notes</th>
                </tr>
              </>
            ) : (
              <tr>
                <th style={{ width: '130px' }}>Serial Number</th>
                <th>Make &amp; Model</th>
                <th>Caliber / Gauge</th>
                <th>Type</th>
                <th style={{ width: '105px' }}>Acquired</th>
                <th>Purchased From</th>
                <th style={{ width: '90px' }}>Cost</th>
                <th>Current Status</th>
              </tr>
            )}
          </thead>
          <tbody>
            {filteredFirearms.map((f) => {
              const issues = isAtfComplianceMode ? getComplianceStatus(f) : [];
              return (
                <tr
                  key={f.id}
                  onClick={() => navigate(`/details/${f.id}`)}
                  title="Click to view full firearm details"
                >
                  {isAtfComplianceMode ? (
                    // ATF Compliance Columns
                    <>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span className="mono-serial-badge">
                            {f.serial_number || 'NO SERIAL'}
                          </span>
                          {issues.length > 0 && (
                            <span
                              title={issues.join(', ')}
                              style={{ display: 'inline-flex', alignItems: 'center' }}
                            >
                              <AlertTriangle
                                size={13}
                                style={{ color: '#f59e0b', cursor: 'help' }}
                              />
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.make}</td>
                      <td style={{ fontWeight: 500 }}>{f.model}</td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {f.firearm_type || 'Firearm'}
                        </span>{' '}
                        &bull;{' '}
                        <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                          {f.caliber}
                        </strong>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {f.purchase_date || '—'}
                      </td>
                      <td
                        style={{
                          borderRight: '2px solid rgba(59, 130, 246, 0.3)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {f.purchased_from || 'Private Party'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {f.is_sold ? (
                          f.sold_date || '—'
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {f.is_sold ? (
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {f.sold_to_name || 'Private Buyer'}
                          </strong>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {f.is_sold ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span className="status-badge sold">Transferred / Disposed</span>
                            {f.sale_notes && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                ({f.sale_notes})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span className="status-badge available">● In Active Vault</span>
                            {f.is_nfa && (
                              <span
                                className="status-badge"
                                style={{
                                  background: 'rgba(234, 179, 8, 0.2)',
                                  color: '#eab308',
                                  border: '1px solid rgba(234, 179, 8, 0.4)',
                                }}
                              >
                                NFA
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </>
                  ) : (
                    // Simple Collector Columns
                    <>
                      <td>
                        <span className="mono-serial-badge">{f.serial_number || '—'}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {f.make} {f.model}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                          {f.caliber}
                        </strong>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {f.firearm_type || 'Firearm'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {f.purchase_date || '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{f.purchased_from || '—'}</td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {f.purchase_price ? `$${Number(f.purchase_price).toFixed(2)}` : '—'}
                      </td>
                      <td>
                        {f.is_sold ? (
                          <span className="status-badge sold">Sold / Transferred</span>
                        ) : (
                          <span className="status-badge available">● Active In Vault</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}

            {filteredFirearms.length === 0 && (
              <tr>
                <td
                  colSpan={isAtfComplianceMode ? 9 : 8}
                  style={{
                    textAlign: 'center',
                    padding: '3.5rem 1rem',
                    background: 'var(--bg-surface)',
                  }}
                >
                  <BookOpen size={36} opacity={0.3} style={{ marginBottom: '0.75rem' }} />
                  <h3>No Bound Book Records Match Your Filter</h3>
                  <p
                    style={{
                      marginTop: '0.35rem',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Try clearing search criteria or selecting "All Records".
                  </p>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      setSearch('');
                      setFilterStatus('all');
                    }}
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
