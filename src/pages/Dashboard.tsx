import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Award,
  Camera,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  DollarSign,
  Flame,
  Flashlight,
  LayoutGrid,
  List,
  Package,
  PieChart,
  Search,
  Shield,
  SlidersHorizontal,
  Target,
  Wrench,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessoryTypeColor } from '../components/AccessoryDetailModal';
import { AutocompleteInput } from '../components/AutocompleteInput';
import {
  CartridgesIcon,
  HandgunIcon,
  HolsterIcon,
  MagazineIcon,
  NfaTrackerNavIcon,
  PicatinnyMountIcon,
  RifleIcon,
  ScopeIcon,
  ShotgunIcon,
  SuppressorIcon,
  TacticalSlingIcon,
} from '../components/CustomIcons';
import { Accessory, Ammo, Firearm, ReloadingComponent } from '../types';

type SortKey = 'make' | 'model' | 'caliber' | 'serial_number' | 'rounds' | 'status';
type SortDir = 'asc' | 'desc';
type CategoryChip = 'all' | 'handgun' | 'rifle' | 'shotgun' | 'vintage' | 'service_due' | 'nfa';

interface StatVisibility {
  firearms: boolean;
  ammo: boolean;
  rounds: boolean;
  valuation: boolean;
  service: boolean;
}

const DEFAULT_STAT_VISIBILITY: StatVisibility = {
  firearms: true,
  ammo: true,
  rounds: true,
  valuation: true,
  service: true,
};

export const Dashboard = () => {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [ammoList, setAmmoList] = useState<Ammo[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [components, setComponents] = useState<ReloadingComponent[]>([]);
  const [showCollectionAnalytics, setShowCollectionAnalytics] = useState(false);

  const [search, setSearch] = useState('');
  const [filterSold, setFilterSold] = useState<'all' | 'available' | 'sold'>('all');
  const [categoryChip, setCategoryChip] = useState<CategoryChip>('all');
  const [sortKey, setSortKey] = useState<SortKey>('make');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // View mode preference (Grid vs Table)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    return (localStorage.getItem('armoryvault_dashboard_view') as 'grid' | 'table') || 'grid';
  });

  // Metric card visibility preferences
  const [statVisibility, setStatVisibility] = useState<StatVisibility>(() => {
    try {
      const saved = localStorage.getItem('armoryvault_stat_visibility');
      return saved ? { ...DEFAULT_STAT_VISIBILITY, ...JSON.parse(saved) } : DEFAULT_STAT_VISIBILITY;
    } catch {
      return DEFAULT_STAT_VISIBILITY;
    }
  });
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const handleReload = () => loadData();
    window.addEventListener('armoryvault-reload', handleReload);
    return () => window.removeEventListener('armoryvault-reload', handleReload);
  }, []);

  const loadData = async () => {
    if (window.api) {
      const [firearmData, ammoData, accsData, compsData] = await Promise.all([
        window.api.getFirearms(),
        window.api.getAmmo ? window.api.getAmmo() : Promise.resolve([]),
        window.api.getAccessories ? window.api.getAccessories() : Promise.resolve([]),
        window.api.getComponents ? window.api.getComponents() : Promise.resolve([]),
      ]);
      setFirearms(firearmData || []);
      setAmmoList(ammoData || []);
      setAccessories(accsData || []);
      setComponents(compsData || []);

      if (window.api.getConfig) {
        const showAnalytics = await window.api.getConfig('showCollectionAnalytics');
        setShowCollectionAnalytics(!!showAnalytics);
      }
    }
  };

  const handleToggleViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('armoryvault_dashboard_view', mode);
  };

  const handleToggleStat = (key: keyof StatVisibility) => {
    const updated = { ...statVisibility, [key]: !statVisibility[key] };
    setStatVisibility(updated);
    localStorage.setItem('armoryvault_stat_visibility', JSON.stringify(updated));
  };

  // Image URI helper
  const getFirearmImageSrc = (f: Firearm) => {
    const raw = f.image_path || (f.photos && f.photos[0]);
    if (!raw) return null;
    if (raw.startsWith('http') || raw.startsWith('data:') || raw.startsWith('local-file://')) {
      return raw;
    }
    return `local-file://${raw}`;
  };

  // Telemetry & Maintenance Calculations
  const getLifetimeRounds = (f: Firearm) => {
    return (
      f.logs
        ?.filter((l) => l.type === 'Range')
        .reduce((sum, l) => sum + (Number(l.rounds_fired) || 0), 0) || 0
    );
  };

  const getDirtyRounds = (f: Firearm) => {
    if (!f.logs || f.logs.length === 0) return 0;
    const cleaningLogs = f.logs
      .filter((l) => l.type === 'Cleaning')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastCleaningDate = cleaningLogs.length > 0 ? new Date(cleaningLogs[0].date).getTime() : 0;

    return f.logs
      .filter((l) => l.type === 'Range' && new Date(l.date).getTime() >= lastCleaningDate)
      .reduce((sum, l) => sum + (l.rounds_fired || 0), 0);
  };

  const isMaintenanceDue = (f: Firearm) => {
    if (f.is_sold) return false;
    const totalLifetimeRounds = getLifetimeRounds(f);

    // Custom scheduled tasks
    if (f.maintenance_schedules && f.maintenance_schedules.length > 0) {
      const anyDue = f.maintenance_schedules.some((s) => {
        const roundsSince = totalLifetimeRounds - (s.last_performed_rounds || 0);
        return roundsSince >= (s.interval_rounds || 3000);
      });
      if (anyDue) return true;
    }

    // Dirty rounds threshold
    if (getDirtyRounds(f) >= (f.maintenance_round_threshold || 500)) {
      return true;
    }

    return false;
  };

  const isVintageFirearm = (f: Firearm) => {
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

  // Metrics summaries
  const totalFirearms = firearms.length;
  const availableCount = firearms.filter((f) => !f.is_sold).length;
  const totalAmmoCount = ammoList.reduce((sum, a) => sum + (Number(a.count) || 0), 0);
  const totalLifetimeRounds = firearms.reduce((sum, f) => sum + getLifetimeRounds(f), 0);

  const totalInvested = firearms.reduce((acc, f) => {
    const logsCost = f.logs?.reduce((sum, log) => sum + (Number(log.cost) || 0), 0) || 0;
    return acc + (Number(f.purchase_price) || 0) + logsCost;
  }, 0);
  const totalSoldValue = firearms.reduce(
    (acc, f) => acc + (f.is_sold ? Number(f.sold_price) || 0 : 0),
    0
  );

  const serviceDueCount = firearms.filter((f) => isMaintenanceDue(f)).length;

  // Category counts for chip badges
  const categoryCounts = useMemo(() => {
    return {
      all: firearms.length,
      handgun: firearms.filter((f) => {
        const t = (f.firearm_type || '').toLowerCase();
        return t.includes('pistol') || t.includes('revolver') || t.includes('handgun');
      }).length,
      rifle: firearms.filter((f) => {
        const t = (f.firearm_type || '').toLowerCase();
        return t.includes('rifle') || t.includes('carbine');
      }).length,
      shotgun: firearms.filter((f) => (f.firearm_type || '').toLowerCase().includes('shotgun'))
        .length,
      vintage: firearms.filter((f) => isVintageFirearm(f)).length,
      service_due: serviceDueCount,
      nfa: firearms.filter((f) => f.is_nfa).length,
    };
  }, [firearms, serviceDueCount]);

  // Filtered list
  const filtered = firearms.filter((f) => {
    // Text search
    const query = search.toLowerCase();
    const matchesSearch =
      (f.make || '').toLowerCase().includes(query) ||
      (f.model || '').toLowerCase().includes(query) ||
      (f.caliber || '').toLowerCase().includes(query) ||
      (f.serial_number || '').toLowerCase().includes(query) ||
      (f.notes || '').toLowerCase().includes(query);

    // Sold status filter
    const matchesSold =
      filterSold === 'all' ||
      (filterSold === 'sold' && f.is_sold) ||
      (filterSold === 'available' && !f.is_sold);

    // Category chip filter
    let matchesCategory = true;
    const typeStr = (f.firearm_type || '').toLowerCase();

    if (categoryChip === 'handgun') {
      matchesCategory =
        typeStr.includes('pistol') || typeStr.includes('revolver') || typeStr.includes('handgun');
    } else if (categoryChip === 'rifle') {
      matchesCategory = typeStr.includes('rifle') || typeStr.includes('carbine');
    } else if (categoryChip === 'shotgun') {
      matchesCategory = typeStr.includes('shotgun');
    } else if (categoryChip === 'vintage') {
      matchesCategory = isVintageFirearm(f);
    } else if (categoryChip === 'service_due') {
      matchesCategory = isMaintenanceDue(f);
    } else if (categoryChip === 'nfa') {
      matchesCategory = !!f.is_nfa;
    }

    return matchesSearch && matchesSold && matchesCategory;
  });

  // Sorted list
  const sorted = [...filtered].sort((a, b) => {
    let valA: any, valB: any;
    if (sortKey === 'status') {
      valA = a.is_sold ? 'Sold' : 'Available';
      valB = b.is_sold ? 'Sold' : 'Available';
    } else if (sortKey === 'rounds') {
      valA = getLifetimeRounds(a);
      valB = getLifetimeRounds(b);
      return sortDir === 'asc' ? valA - valB : valB - valA;
    } else {
      valA = (a[sortKey] || '').toString().toLowerCase();
      valB = (b[sortKey] || '').toString().toLowerCase();
    }
    const cmp = String(valA).localeCompare(String(valB));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column)
      return <ArrowUpDown size={13} style={{ opacity: 0.3, marginLeft: '0.3rem' }} />;
    return sortDir === 'asc' ? (
      <ArrowUp size={13} style={{ color: 'var(--accent)', marginLeft: '0.3rem' }} />
    ) : (
      <ArrowDown size={13} style={{ color: 'var(--accent)', marginLeft: '0.3rem' }} />
    );
  };

  // Helper for mounted accessories on card
  const getMountedAccessories = (firearmId?: number) => {
    if (!firearmId) return [];
    return accessories.filter((a) => {
      if (a.mounts && a.mounts.length > 0) {
        return a.mounts.some((m) => m.firearmId === firearmId);
      }
      return false;
    });
  };

  // Valuation breakdown
  const firearmsVal = firearms
    .filter((f) => !f.is_sold)
    .reduce(
      (sum, f) =>
        sum +
        (Number(f.purchase_price) || 0) +
        (f.logs?.reduce((lsum, l) => lsum + (Number(l.cost) || 0), 0) || 0),
      0
    );
  const accessoriesVal = accessories.reduce(
    (sum, a) => sum + (Number(a.value) || 0) * (a.quantity || 1),
    0
  );
  const ammoVal = ammoList.reduce(
    (sum, a) => sum + (Number(a.count) || 0) * (Number(a.costPerRound) || 0),
    0
  );
  const componentsVal = components.reduce((sum, c) => sum + (Number(c.cost) || 0), 0);
  const grandTotalVal = firearmsVal + accessoriesVal + ammoVal + componentsVal;

  return (
    <div className="dashboard">
      {/* Header Bar */}
      <div className="page-header">
        <div>
          <h1>Inventory Dashboard</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Command Center &bull; Active Inventory, Live Telemetry & Maintenance Status
          </p>
        </div>

        {/* Customize Cards Dropdown */}
        <div className="customize-metrics-wrap">
          <button
            className="btn-secondary"
            onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
            title="Customize Metric Cards"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            <SlidersHorizontal size={15} />
            <span>Customize Cards</span>
          </button>

          {isCustomizeOpen && (
            <div className="customize-metrics-popover">
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  marginBottom: '0.4rem',
                }}
              >
                Metric Cards Display
              </div>
              <label className="metric-toggle-row">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={14} style={{ color: 'var(--accent)' }} />
                  <span>Total Firearms</span>
                </span>
                <input
                  type="checkbox"
                  checked={statVisibility.firearms}
                  onChange={() => handleToggleStat('firearms')}
                />
              </label>
              <label className="metric-toggle-row">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CartridgesIcon size={14} color="#f59e0b" />
                  <span>Ammunition Stock</span>
                </span>
                <input
                  type="checkbox"
                  checked={statVisibility.ammo}
                  onChange={() => handleToggleStat('ammo')}
                />
              </label>
              <label className="metric-toggle-row">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Flame size={14} color="#f97316" />
                  <span>Lifetime Rounds</span>
                </span>
                <input
                  type="checkbox"
                  checked={statVisibility.rounds}
                  onChange={() => handleToggleStat('rounds')}
                />
              </label>
              <label className="metric-toggle-row">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={14} color="#10b981" />
                  <span>Vault Valuation</span>
                </span>
                <input
                  type="checkbox"
                  checked={statVisibility.valuation}
                  onChange={() => handleToggleStat('valuation')}
                />
              </label>
              <label className="metric-toggle-row">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} color="#f59e0b" />
                  <span>Service Status</span>
                </span>
                <input
                  type="checkbox"
                  checked={statVisibility.service}
                  onChange={() => handleToggleStat('service')}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Togglable Command Metrics Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Metric 1: Total Firearms */}
        {statVisibility.firearms && (
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  color: '#60a5fa',
                }}
              >
                <Target size={22} />
              </div>
              <div>
                <div className="stat-label">Total Firearms</div>
                <div className="stat-val">{totalFirearms}</div>
                <div className="stat-sub">
                  {availableCount} in Safe &bull; {totalFirearms - availableCount} Sold
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metric 2: Live Ammo Stock */}
        {statVisibility.ammo && (
          <div
            className="stat-card"
            onClick={() => navigate('/ammo')}
            style={{ cursor: 'pointer' }}
            title="Click to open Ammo Depot"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  color: '#34d399',
                }}
              >
                <CartridgesIcon size={22} color="#34d399" />
              </div>
              <div>
                <div className="stat-label">Ammunition Stock</div>
                <div className="stat-val">
                  {totalAmmoCount.toLocaleString()}{' '}
                  <span
                    style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}
                  >
                    rds
                  </span>
                </div>
                <div className="stat-sub">{ammoList.length} Caliber Profiles</div>
              </div>
            </div>
          </div>
        )}

        {/* Metric 3: Lifetime Rounds Fired */}
        {statVisibility.rounds && (
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  color: '#f87171',
                }}
              >
                <Flame size={22} />
              </div>
              <div>
                <div className="stat-label">Lifetime Rounds</div>
                <div className="stat-val">{totalLifetimeRounds.toLocaleString()}</div>
                <div className="stat-sub" style={{ color: '#f87171' }}>
                  Cumulative Telemetry
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metric 4: Valuation */}
        {statVisibility.valuation && (
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  color: '#fbbf24',
                }}
              >
                <DollarSign size={22} />
              </div>
              <div>
                <div className="stat-label">Total Invested</div>
                <div className="stat-val" style={{ fontSize: '1.4rem' }}>
                  $
                  {totalInvested.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                {totalSoldValue > 0 ? (
                  <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
                    +${totalSoldValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
                    Disposed
                  </div>
                ) : (
                  <div className="stat-sub">Insurance Baseline</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Metric 5: Service Status Alert Card */}
        {statVisibility.service && (
          <div
            className="stat-card"
            onClick={() => setCategoryChip(categoryChip === 'service_due' ? 'all' : 'service_due')}
            style={{
              cursor: 'pointer',
              borderLeft:
                serviceDueCount > 0 ? '4px solid var(--danger)' : '1px solid var(--border-subtle)',
            }}
            title="Click to filter firearms due for service"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div
                style={{
                  background:
                    serviceDueCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                  border: `1px solid ${serviceDueCount > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`,
                  padding: '0.75rem',
                  borderRadius: '12px',
                  color: serviceDueCount > 0 ? '#ef4444' : '#10b981',
                }}
              >
                {serviceDueCount > 0 ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
              </div>
              <div>
                <div className="stat-label">Service Status</div>
                <div
                  className="stat-val"
                  style={{ color: serviceDueCount > 0 ? '#ef4444' : '#10b981' }}
                >
                  {serviceDueCount > 0 ? `${serviceDueCount} Due` : '100% Ready'}
                </div>
                <div
                  className="stat-sub"
                  style={{ color: serviceDueCount > 0 ? '#f87171' : '#34d399' }}
                >
                  {serviceDueCount > 0 ? 'Click to filter due items' : 'All maintenance current'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Optional Collection Value Analytics Breakdown Card */}
      {showCollectionAnalytics && grandTotalVal > 0 && (
        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            border: '1px solid var(--border-highlight)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.6rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Collection Value & Asset Breakdown</h3>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--success)' }}>
              Total Vault Net Worth: $
              {grandTotalVal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.85rem',
            }}
          >
            {/* Firearms */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>Firearms ({firearms.filter((f) => !f.is_sold).length})</span>
                <span style={{ fontWeight: 600, color: '#60a5fa' }}>
                  {Math.round((firearmsVal / grandTotalVal) * 100)}%
                </span>
              </div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  margin: '0.2rem 0',
                  color: '#fff',
                }}
              >
                $
                {firearmsVal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  height: '5px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(firearmsVal / grandTotalVal) * 100}%`,
                    background: '#60a5fa',
                    height: '100%',
                  }}
                />
              </div>
            </div>

            {/* Accessories */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>Optics & Mounted</span>
                <span style={{ fontWeight: 600, color: '#34d399' }}>
                  {Math.round((accessoriesVal / grandTotalVal) * 100)}%
                </span>
              </div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  margin: '0.2rem 0',
                  color: '#fff',
                }}
              >
                $
                {accessoriesVal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  height: '5px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(accessoriesVal / grandTotalVal) * 100}%`,
                    background: '#34d399',
                    height: '100%',
                  }}
                />
              </div>
            </div>

            {/* Ammo */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>Ammunition Stock</span>
                <span style={{ fontWeight: 600, color: '#fbbf24' }}>
                  {Math.round((ammoVal / grandTotalVal) * 100)}%
                </span>
              </div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  margin: '0.2rem 0',
                  color: '#fff',
                }}
              >
                $
                {ammoVal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  height: '5px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(ammoVal / grandTotalVal) * 100}%`,
                    background: '#fbbf24',
                    height: '100%',
                  }}
                />
              </div>
            </div>

            {/* Reloading */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(168, 85, 247, 0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>Reloading Supplies</span>
                <span style={{ fontWeight: 600, color: '#c084fc' }}>
                  {Math.round((componentsVal / grandTotalVal) * 100)}%
                </span>
              </div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  margin: '0.2rem 0',
                  color: '#fff',
                }}
              >
                $
                {componentsVal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  height: '5px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(componentsVal / grandTotalVal) * 100}%`,
                    background: '#c084fc',
                    height: '100%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Dashboard Control Deck */}
      <div className="dashboard-control-deck">
        {/* Left: Category Filter Chips */}
        <div className="filter-chips-bar">
          <button
            className={`filter-chip ${categoryChip === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryChip('all')}
          >
            <span>All</span>
            <span className="filter-chip-count">{categoryCounts.all}</span>
          </button>

          <button
            className={`filter-chip ${categoryChip === 'handgun' ? 'active' : ''}`}
            onClick={() => setCategoryChip('handgun')}
          >
            <HandgunIcon size={14} />
            <span>Handguns</span>
            <span className="filter-chip-count">{categoryCounts.handgun}</span>
          </button>

          <button
            className={`filter-chip ${categoryChip === 'rifle' ? 'active' : ''}`}
            onClick={() => setCategoryChip('rifle')}
          >
            <RifleIcon size={14} />
            <span>Rifles</span>
            <span className="filter-chip-count">{categoryCounts.rifle}</span>
          </button>

          <button
            className={`filter-chip ${categoryChip === 'shotgun' ? 'active' : ''}`}
            onClick={() => setCategoryChip('shotgun')}
          >
            <ShotgunIcon size={14} />
            <span>Shotguns</span>
            <span className="filter-chip-count">{categoryCounts.shotgun}</span>
          </button>

          <button
            className={`filter-chip ${categoryChip === 'vintage' ? 'active' : ''}`}
            onClick={() => setCategoryChip('vintage')}
          >
            <Award size={14} style={{ color: '#c084fc' }} />
            <span>C&amp;R</span>
            <span className="filter-chip-count">{categoryCounts.vintage}</span>
          </button>

          {categoryCounts.nfa > 0 && (
            <button
              className={`filter-chip ${categoryChip === 'nfa' ? 'active' : ''}`}
              onClick={() => setCategoryChip('nfa')}
            >
              <NfaTrackerNavIcon size={14} color="#a78bfa" />
              <span>NFA</span>
              <span className="filter-chip-count">{categoryCounts.nfa}</span>
            </button>
          )}

          <button
            className={`filter-chip ${categoryChip === 'service_due' ? 'active' : ''}`}
            onClick={() => setCategoryChip('service_due')}
            style={{
              borderColor: categoryCounts.service_due > 0 ? 'rgba(239, 68, 68, 0.5)' : undefined,
              color: categoryCounts.service_due > 0 ? '#f87171' : undefined,
            }}
          >
            <AlertTriangle size={14} style={{ color: '#f87171' }} />
            <span>Service Due</span>
            <span
              className="filter-chip-count"
              style={{
                background: categoryCounts.service_due > 0 ? 'rgba(239,68,68,0.3)' : undefined,
              }}
            >
              {categoryCounts.service_due}
            </span>
          </button>
        </div>

        {/* Right: Search + Status Dropdown + View Mode Switcher */}
        <div className="dashboard-control-right">
          {/* Search Box */}
          <div className="search-box">
            <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search make, model, caliber..."
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

          {/* Status Select */}
          <div style={{ minWidth: '150px' }}>
            <AutocompleteInput
              mode="select"
              name="filterSold"
              value={filterSold}
              onChange={(e) => setFilterSold(e.target.value as any)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'available', label: 'In Safe Only' },
                { value: 'sold', label: 'Sold Only' },
              ]}
            />
          </div>

          {/* View Mode Switcher */}
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => handleToggleViewMode('grid')}
              title="Tactical Card Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => handleToggleViewMode('table')}
              title="Compact Ledger Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main View Renderers: Tactical Cards vs Compact Table */}
      {viewMode === 'grid' ? (
        /* Tactical Card View */
        <div className="tactical-grid">
          {sorted.map((f) => {
            const lifetimeRounds = getLifetimeRounds(f);
            const dirtyRounds = getDirtyRounds(f);
            const threshold = f.maintenance_round_threshold || 500;
            const wearPct = Math.min(100, Math.round((dirtyRounds / threshold) * 100));
            const isDue = isMaintenanceDue(f);
            const mountedAccs = getMountedAccessories(f.id);
            const imageSrc = getFirearmImageSrc(f);
            const isVintage = isVintageFirearm(f);

            return (
              <div
                key={f.id}
                className="tactical-card"
                onClick={() => navigate(`/details/${f.id}`)}
              >
                {/* Card Banner / Photo */}
                <div className="tactical-card-image-wrap">
                  {imageSrc ? (
                    <img src={imageSrc} alt={f.model} className="tactical-card-image" />
                  ) : (
                    <div className="tactical-card-placeholder">
                      <Camera size={32} opacity={0.3} />
                      <span style={{ fontSize: '0.75rem' }}>No Photo Attached</span>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="tactical-card-badges-overlay">
                    <span className={`status-badge ${f.is_sold ? 'sold' : 'available'}`}>
                      {f.is_sold ? 'Sold' : 'In Safe'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {f.is_nfa && (
                        <span
                          className="status-badge"
                          style={{
                            background: 'rgba(234, 179, 8, 0.25)',
                            color: '#eab308',
                            border: '1px solid rgba(234, 179, 8, 0.5)',
                          }}
                        >
                          NFA
                        </span>
                      )}
                      {isVintage && (
                        <span
                          className="status-badge"
                          style={{
                            background: 'rgba(168, 85, 247, 0.25)',
                            color: '#c084fc',
                            border: '1px solid rgba(168, 85, 247, 0.5)',
                          }}
                        >
                          C&R
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="tactical-card-body">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span className="tactical-card-make">{f.make}</span>
                    <span className="inventory-caliber-badge">{f.caliber}</span>
                  </div>

                  <div className="tactical-card-title">{f.model}</div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>
                      SN:{' '}
                      <strong className="mono" style={{ color: 'var(--text-primary)' }}>
                        {f.serial_number}
                      </strong>
                    </span>
                    {f.condition && <span>{f.condition}</span>}
                  </div>

                  {/* Mounted Accessories Tag Cloud */}
                  {mountedAccs.length > 0 && (
                    <div className="tactical-accessories-cloud">
                      {mountedAccs.slice(0, 3).map((a) => {
                        const tc = getAccessoryTypeColor(a.type);
                        return (
                          <span
                            key={a.id}
                            className="accessory-pill-tag"
                            style={{ color: tc.text, background: tc.bg, borderColor: tc.border }}
                          >
                            {a.type === 'Optic' ? (
                              <ScopeIcon size={11} color={tc.text} />
                            ) : a.type === 'Suppressor' ? (
                              <SuppressorIcon size={11} color={tc.text} />
                            ) : a.type === 'Light' ? (
                              <Flashlight size={11} />
                            ) : a.type === 'Holster' ? (
                              <HolsterIcon size={11} color={tc.text} />
                            ) : a.type === 'Mount' ? (
                              <PicatinnyMountIcon size={11} color={tc.text} />
                            ) : a.type === 'Sling' ? (
                              <TacticalSlingIcon size={11} color={tc.text} />
                            ) : a.type === 'Magazine' ? (
                              <MagazineIcon size={11} color={tc.text} />
                            ) : (
                              <Package size={11} />
                            )}{' '}
                            {a.model || a.manufacturer || a.type}
                          </span>
                        );
                      })}
                      {mountedAccs.length > 3 && (
                        <span className="accessory-pill-tag">+{mountedAccs.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Wear & Telemetry Bar */}
                  {!f.is_sold && (
                    <div className="wear-gauge-block">
                      <div className="wear-gauge-header">
                        <span>
                          Wear: {dirtyRounds} / {threshold} rds
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isDue ? '#ef4444' : wearPct > 70 ? '#fbbf24' : '#10b981',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          {isDue ? (
                            <>
                              <AlertTriangle size={12} color="#ef4444" />
                              <span>Service Due</span>
                            </>
                          ) : (
                            `${wearPct}%`
                          )}
                        </span>
                      </div>
                      <div className="wear-bar-track">
                        <div
                          className="wear-bar-fill"
                          style={{
                            width: `${wearPct}%`,
                            background: isDue ? '#ef4444' : wearPct > 70 ? '#fbbf24' : '#10b981',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.2rem',
                      paddingTop: '0.4rem',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: '0.775rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>
                      Lifetime:{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {lifetimeRounds.toLocaleString()} rds
                      </strong>
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        color: 'var(--accent)',
                      }}
                    >
                      Details <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {sorted.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '4rem 1rem',
                background: 'var(--bg-surface)',
                borderRadius: '14px',
                border: '1px dashed var(--border-light)',
              }}
            >
              <Target size={40} opacity={0.3} style={{ marginBottom: '1rem' }} />
              <h3>No Firearms Match Current Filters</h3>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Try clearing search terms or selecting "All Firearms".
              </p>
              <button
                className="btn-secondary btn-sm"
                onClick={() => {
                  setSearch('');
                  setCategoryChip('all');
                  setFilterSold('all');
                }}
                style={{ marginTop: '1.25rem' }}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Compact Ledger Table View */
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}></th>
                <th
                  onClick={() => handleSort('make')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    Make <SortIcon column="make" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('model')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    Model <SortIcon column="model" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('caliber')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    Caliber <SortIcon column="caliber" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('serial_number')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    Serial Number <SortIcon column="serial_number" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('rounds')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    Lifetime Rounds <SortIcon column="rounds" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    Status / Service <SortIcon column="status" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => {
                const lifetimeRounds = getLifetimeRounds(f);
                const dirtyRounds = getDirtyRounds(f);
                const isDue = isMaintenanceDue(f);
                const imageSrc = getFirearmImageSrc(f);

                return (
                  <tr
                    key={f.id}
                    className={f.is_sold ? 'row-sold clickable-row' : 'clickable-row'}
                    onClick={() => navigate(`/details/${f.id}`)}
                  >
                    <td>
                      {imageSrc ? (
                        <img src={imageSrc} alt="" className="table-thumbnail" />
                      ) : (
                        <div
                          className="table-thumbnail"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <Camera size={14} />
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.make}</td>
                    <td>{f.model}</td>
                    <td style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                      {f.caliber}
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {f.serial_number}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {lifetimeRounds.toLocaleString()} rds
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.4rem',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span className={`status-badge ${f.is_sold ? 'sold' : 'available'}`}>
                          {f.is_sold ? 'Sold' : 'In Safe'}
                        </span>
                        {f.is_nfa && (
                          <span
                            className="status-badge"
                            style={{
                              background: 'rgba(234, 179, 8, 0.2)',
                              color: '#eab308',
                              border: '1px solid rgba(234, 179, 8, 0.5)',
                            }}
                          >
                            NFA
                          </span>
                        )}
                        {!f.is_sold && isDue && (
                          <span
                            className="status-badge"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <AlertTriangle size={11} color="#f87171" />
                            <span>Service Due</span>
                          </span>
                        )}
                        {!f.is_sold && !isDue && dirtyRounds >= 250 && (
                          <span
                            className="status-badge"
                            style={{
                              background: 'rgba(245, 158, 11, 0.1)',
                              color: 'var(--warning)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                            }}
                          >
                            Dirty ({dirtyRounds} rds)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="empty-state"
                    style={{ textAlign: 'center', padding: '3rem' }}
                  >
                    No firearms found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
