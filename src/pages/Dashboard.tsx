import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Firearm, Ammo, Accessory, ReloadingComponent } from '../types';
import { Search, Info, Target, DollarSign, Package, ArrowUpDown, ArrowUp, ArrowDown, PieChart, Shield, Wrench, Database } from 'lucide-react';

type SortKey = 'make' | 'model' | 'caliber' | 'serial_number' | 'status';
type SortDir = 'asc' | 'desc';

export const Dashboard = () => {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [ammoList, setAmmoList] = useState<Ammo[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [components, setComponents] = useState<ReloadingComponent[]>([]);
  const [showCollectionAnalytics, setShowCollectionAnalytics] = useState(false);

  const [search, setSearch] = useState('');
  const [filterSold, setFilterSold] = useState<'all' | 'available' | 'sold'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('make');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const handleReload = () => loadData();
    window.addEventListener('armoryvault-reload', handleReload);
    return () => window.removeEventListener('armoryvault-reload', handleReload);
  }, []);

  const loadData = async () => {
    if (window.api) {
      const data = await window.api.getFirearms();
      setFirearms(data);

      if (window.api.getConfig) {
        const showAnalytics = await window.api.getConfig('showCollectionAnalytics');
        setShowCollectionAnalytics(!!showAnalytics);
        
        if (showAnalytics) {
          const [ammo, accs, comps] = await Promise.all([
            window.api.getAmmo(),
            window.api.getAccessories ? window.api.getAccessories() : Promise.resolve([]),
            window.api.getComponents ? window.api.getComponents() : Promise.resolve([])
          ]);
          setAmmoList(ammo);
          setAccessories(accs);
          setComponents(comps);
        }
      }
    }
  };

  const filtered = firearms.filter(f => {
    const matchesSearch = `${f.make} ${f.model} ${f.caliber}`.toLowerCase().includes(search.toLowerCase());
    const matchesSold = filterSold === 'all' || (filterSold === 'sold' && f.is_sold) || (filterSold === 'available' && !f.is_sold);
    return matchesSearch && matchesSold;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA: string, valB: string;
    if (sortKey === 'status') {
      valA = a.is_sold ? 'Sold' : 'Available';
      valB = b.is_sold ? 'Sold' : 'Available';
    } else {
      valA = (a[sortKey] || '').toString().toLowerCase();
      valB = (b[sortKey] || '').toString().toLowerCase();
    }
    const cmp = valA.localeCompare(valB);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown size={14} style={{ opacity: 0.3, marginLeft: '0.3rem' }} />;
    return sortDir === 'asc'
      ? <ArrowUp size={14} style={{ color: 'var(--accent)', marginLeft: '0.3rem' }} />
      : <ArrowDown size={14} style={{ color: 'var(--accent)', marginLeft: '0.3rem' }} />;
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

  const isMaintenanceDue = (f: Firearm) => {
    if (f.is_sold) return false;
    const totalLifetimeRounds = f.logs?.filter(l => l.type === 'Range').reduce((sum, l) => sum + (Number(l.rounds_fired) || 0), 0) || 0;
    
    // Check custom scheduled tasks
    if (f.maintenance_schedules && f.maintenance_schedules.length > 0) {
      const anyDue = f.maintenance_schedules.some(s => {
        const roundsSince = totalLifetimeRounds - (s.last_performed_rounds || 0);
        return roundsSince >= (s.interval_rounds || 3000);
      });
      if (anyDue) return true;
    }

    // Check dirty rounds threshold
    if (getDirtyRounds(f) >= (f.maintenance_round_threshold || 500)) {
      return true;
    }

    return false;
  };

  // Analytics totals
  const firearmsVal = firearms.filter(f => !f.is_sold).reduce((sum, f) => sum + (Number(f.purchase_price) || 0) + (f.logs?.reduce((lsum, l) => lsum + (Number(l.cost) || 0), 0) || 0), 0);
  const accessoriesVal = accessories.reduce((sum, a) => sum + (Number(a.value) || 0) * (a.quantity || 1), 0);
  const ammoVal = ammoList.reduce((sum, a) => sum + (Number(a.count) || 0) * (Number(a.costPerRound) || 0), 0);
  const componentsVal = components.reduce((sum, c) => sum + (Number(c.cost) || 0), 0);
  const grandTotalVal = firearmsVal + accessoriesVal + ammoVal + componentsVal;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Inventory Dashboard</h1>
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

      {/* Optional Collection Value Analytics Breakdown Card */}
      {showCollectionAnalytics && grandTotalVal > 0 && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Collection Value & Asset Breakdown</h3>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--success)' }}>
              Total Vault Net Worth: ${grandTotalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Firearms */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Firearms ({firearms.filter(f => !f.is_sold).length})</span>
                <span style={{ fontWeight: 600, color: '#60a5fa' }}>{Math.round((firearmsVal / grandTotalVal) * 100)}%</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.3rem 0', color: '#fff' }}>
                ${firearmsVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${(firearmsVal / grandTotalVal) * 100}%`, background: '#60a5fa', height: '100%' }} />
              </div>
            </div>

            {/* Accessories */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Optics & Accessories</span>
                <span style={{ fontWeight: 600, color: '#34d399' }}>{Math.round((accessoriesVal / grandTotalVal) * 100)}%</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.3rem 0', color: '#fff' }}>
                ${accessoriesVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${(accessoriesVal / grandTotalVal) * 100}%`, background: '#34d399', height: '100%' }} />
              </div>
            </div>

            {/* Ammo */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Ammunition</span>
                <span style={{ fontWeight: 600, color: '#fbbf24' }}>{Math.round((ammoVal / grandTotalVal) * 100)}%</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.3rem 0', color: '#fff' }}>
                ${ammoVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${(ammoVal / grandTotalVal) * 100}%`, background: '#fbbf24', height: '100%' }} />
              </div>
            </div>

            {/* Reloading */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Reloading Supplies</span>
                <span style={{ fontWeight: 600, color: '#c084fc' }}>{Math.round((componentsVal / grandTotalVal) * 100)}%</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.3rem 0', color: '#fff' }}>
                ${componentsVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${(componentsVal / grandTotalVal) * 100}%`, background: '#c084fc', height: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('make')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>Make <SortIcon column="make" /></span>
              </th>
              <th onClick={() => handleSort('model')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>Model <SortIcon column="model" /></span>
              </th>
              <th onClick={() => handleSort('caliber')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>Caliber <SortIcon column="caliber" /></span>
              </th>
              <th onClick={() => handleSort('serial_number')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>Serial Number <SortIcon column="serial_number" /></span>
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>Status <SortIcon column="status" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f, i) => (
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
                    {!f.is_sold && isMaintenanceDue(f) && (
                      <span className="status-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', fontWeight: 600 }} title="Scheduled maintenance or cleaning is due">
                        ⚠️ Service Due
                      </span>
                    )}
                    {!f.is_sold && !isMaintenanceDue(f) && getDirtyRounds(f) >= 300 && (
                      <span className="status-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)' }} title={`${getDirtyRounds(f)} rounds since last cleaning`}>
                        Dirty ({getDirtyRounds(f)} rds)
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
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
