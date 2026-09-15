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
  Eye,
  EyeOff,
  FileText,
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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutocompleteInput } from '../components/AutocompleteInput';
import {
  CartridgesIcon,
  ChassisIcon,
  HandgunIcon,
  HolsterIcon,
  MagazineIcon,
  NfaTrackerNavIcon,
  PicatinnyMountIcon,
  RifleIcon,
  ScopeIcon,
  ShotgunIcon,
  StockIcon,
  SuppressorIcon,
  TacticalSlingIcon,
} from '../components/CustomIcons';
import { getAccessoryTypeColor } from '../components/modals/AccessoryDetailModal';
import { renderStorageIcon, StorageBadge } from '../components/StorageBadge';
import { useVaultData } from '../context/VaultDataContext';
import { Accessory, Ammo, Firearm, ReloadingComponent, StorageLocation } from '../types';
import { formatCurrency, parseCurrency } from '../utils/currency';
import { getLocalImageUrl } from '../utils/imageUrl';
import {
  getItemStorageLocation,
  getStorageCapacityUtilization,
  getStorageTypeTheme,
} from '../utils/StorageSync';
import { buildStorageIndex } from '../utils/storageIndex';
import {
  GridDensity,
  getStoredTheme,
  maskValue,
  saveTheme,
  ThemeConfig,
  WidgetVisibilityConfig,
} from '../utils/themeEngine';

type SortKey = 'make' | 'model' | 'caliber' | 'serial_number' | 'rounds' | 'status';
type SortDir = 'asc' | 'desc';
type CategoryChip = 'all' | 'handgun' | 'rifle' | 'shotgun' | 'vintage' | 'service_due' | 'nfa';

export const Dashboard = () => {
  const {
    firearms: vaultFirearms,
    ammoList: vaultAmmoList,
    accessories: vaultAccessories,
    components: vaultComponents,
    storageLocations: vaultStorageLocations,
  } = useVaultData();

  const [firearms, setFirearms] = useState<Firearm[]>(() => vaultFirearms || []);
  const [ammoList, setAmmoList] = useState<Ammo[]>(() => vaultAmmoList || []);
  const [accessories, setAccessories] = useState<Accessory[]>(() => vaultAccessories || []);
  const [components, setComponents] = useState<ReloadingComponent[]>(() => vaultComponents || []);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>(
    () => vaultStorageLocations || []
  );

  useEffect(() => {
    if (vaultFirearms && vaultFirearms.length > 0) setFirearms(vaultFirearms);
    if (vaultAmmoList && vaultAmmoList.length > 0) setAmmoList(vaultAmmoList);
    if (vaultAccessories && vaultAccessories.length > 0) setAccessories(vaultAccessories);
    if (vaultComponents && vaultComponents.length > 0) setComponents(vaultComponents);
    if (vaultStorageLocations && vaultStorageLocations.length > 0)
      setStorageLocations(vaultStorageLocations);
  }, [vaultFirearms, vaultAmmoList, vaultAccessories, vaultComponents, vaultStorageLocations]);

  // Theme & Personalization Engine state
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => getStoredTheme());

  const [search, setSearch] = useState('');
  const [filterSold, setFilterSold] = useState<'all' | 'available' | 'sold'>('all');
  const [categoryChip, setCategoryChip] = useState<CategoryChip>('all');
  const [sortKey, setSortKey] = useState<SortKey>('make');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // View mode preference (Grid vs Table)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    return (localStorage.getItem('armoryvault_dashboard_view') as 'grid' | 'table') || 'grid';
  });

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isExportingBinder, setIsExportingBinder] = useState(false);

  const navigate = useNavigate();

  const handleExportInsuranceBinder = async () => {
    if (!window.api?.generateArmoryBinder) return;
    try {
      setIsExportingBinder(true);
      const activeFirearms = firearms.filter((f) => !f.is_sold);
      const totalRounds = ammoList.reduce((sum, a) => sum + (Number(a.count) || 0), 0);
      const nfaItems = activeFirearms
        .filter((f) => f.is_nfa)
        .map((f) => ({
          name: `${f.make} ${f.model}`,
          serial: f.serial_number,
          type: f.nfa_type || 'NFA Registered',
          value: Number(f.purchase_price) || 0,
        }));

      let maskSerials = false;
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        try {
          maskSerials = window.confirm(
            'Mask firearm serial numbers (e.g. ***-1234) for privacy in this export?\n\n' +
              '• Click OK to MASK serial numbers (Recommended when sharing with underwriters)\n' +
              '• Click Cancel to include FULL serial numbers'
          );
        } catch {
          maskSerials = false;
        }
      }

      const payload = {
        maskSerials,
        date: new Date().toISOString().split('T')[0],
        owner_name: 'Armory Vault Holder',
        total_valuation: grandTotalVal.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        firearms_count: activeFirearms.length,
        firearms_val: firearmsVal.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        ammo_rounds: totalRounds,
        ammo_val: ammoVal.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        optics_count: accessories.filter(
          (a) => a.type?.toLowerCase().includes('optic') || a.type?.toLowerCase().includes('scope')
        ).length,
        optics_val: accessories
          .filter(
            (a) =>
              a.type?.toLowerCase().includes('optic') || a.type?.toLowerCase().includes('scope')
          )
          .reduce((s, a) => s + (Number(a.value) || 0), 0)
          .toLocaleString('en-US', { minimumFractionDigits: 2 }),
        nfa_count: nfaItems.length,
        nfa_val: nfaItems
          .reduce((s, n) => s + (Number(n.value) || 0), 0)
          .toLocaleString('en-US', { minimumFractionDigits: 2 }),
        accessories_count: accessories.length,
        accessories_val: accessoriesVal.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        firearms: activeFirearms.map((f) => ({
          make: f.make,
          model: f.model,
          serial_number: f.serial_number,
          caliber: f.caliber,
          action_type: f.action_type || (f as any).type || 'N/A',
          condition: f.condition || 'Excellent',
          finish: f.finish || 'Standard',
          purchase_date: f.purchase_date || 'N/A',
          purchase_price: (Number(f.purchase_price) || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
          }),
          replacement_price: ((Number(f.purchase_price) || 0) * 1.15).toLocaleString('en-US', {
            minimumFractionDigits: 2,
          }),
          round_count:
            f.logs
              ?.filter((l) => l.type === 'Range')
              .reduce((sum, l) => sum + (l.rounds_fired || 0), 0) ||
            (f as any).round_count ||
            0,
          notes: f.notes || '',
        })),
        nfa_items: nfaItems,
      };

      const res = await window.api.generateArmoryBinder(payload);
      if (res) {
        alert(
          'Armory Insurance & Appraisal Binder successfully compiled via Typst and saved to your Documents!'
        );
      }
    } catch (err: any) {
      console.error('Error generating insurance binder:', err);
      alert('Failed to generate insurance binder: ' + err.message);
    } finally {
      setIsExportingBinder(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleReload = () => loadData();
    const handleThemeChange = (e: any) => {
      if (e?.detail) {
        setThemeConfig(e.detail);
      }
    };
    window.addEventListener('armoryvault-reload', handleReload);
    window.addEventListener('armoryvault-theme-change', handleThemeChange);
    return () => {
      window.removeEventListener('armoryvault-reload', handleReload);
      window.removeEventListener('armoryvault-theme-change', handleThemeChange);
    };
  }, []);

  const loadData = async () => {
    if (window.api) {
      const [firearmData, ammoData, accsData, compsData, locsData] = await Promise.all([
        window.api.getFirearms(),
        window.api.getAmmo ? window.api.getAmmo() : Promise.resolve([]),
        window.api.getAccessories ? window.api.getAccessories() : Promise.resolve([]),
        window.api.getComponents ? window.api.getComponents() : Promise.resolve([]),
        window.api.getStorageLocations ? window.api.getStorageLocations() : Promise.resolve([]),
      ]);
      setFirearms(firearmData || []);
      setAmmoList(ammoData || []);
      setAccessories(accsData || []);
      setComponents(compsData || []);
      setStorageLocations(locsData || []);

      if (window.api.getConfig) {
        const cfg = await window.api.getConfig('theme_config');
        if (cfg) {
          setThemeConfig((prev) => ({
            ...prev,
            ...cfg,
            widgets: { ...prev.widgets, ...(cfg.widgets || {}) },
          }));
        }
      }
    }
  };

  const handleToggleViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('armoryvault_dashboard_view', mode);
  };

  const handleToggleWidget = async (key: keyof WidgetVisibilityConfig) => {
    const updated = {
      ...themeConfig.widgets,
      [key]: !themeConfig.widgets[key],
    };
    const next = await saveTheme({ widgets: updated });
    setThemeConfig(next);
  };

  const handleSetGridDensity = async (gridDensity: GridDensity) => {
    const next = await saveTheme({ gridDensity });
    setThemeConfig(next);
  };

  const handleResetWidgets = async () => {
    const next = await saveTheme({
      widgets: {
        ...themeConfig.widgets,
        statFirearms: true,
        statAmmo: true,
        statRounds: true,
        statValuation: true,
        statService: true,
        collectionAnalytics: true,
        storageOverview: true,
        storageValuations: true,
        categoryChips: true,
        exportBinder: true,
        wearGauges: true,
        mountedAccessories: true,
        telemetryStrip: true,
        storageBadges: true,
        showThumbnails: true,
      },
    });
    setThemeConfig(next);
  };

  // Image URI helper with thumbnail support
  const getFirearmImageSrc = (f: Firearm, isThumb = false) => {
    const raw = f.image_path || (f.photos && f.photos[0]);
    if (!raw) return null;
    return getLocalImageUrl(raw, isThumb);
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

  // Pre-index storage locations for O(1) instant badge lookups
  const storageIndex = useMemo(() => buildStorageIndex(storageLocations), [storageLocations]);

  // Pre-index mounted accessories to avoid O(N*M) scans in card render loops
  const mountedAccessoriesMap = useMemo(() => {
    const map = new Map<number, Accessory[]>();
    for (const acc of accessories) {
      if (acc.mounts) {
        for (const m of acc.mounts) {
          if (m.firearmId) {
            const list = map.get(m.firearmId) || [];
            list.push(acc);
            map.set(m.firearmId, list);
          }
        }
      }
    }
    return map;
  }, [accessories]);

  // Precompute telemetry rounds once per firearms list mutation to avoid O(N log N) log scans during sorting
  const firearmRoundsMap = useMemo(() => {
    const map = new Map<number, { lifetime: number; dirty: number }>();
    for (const f of firearms) {
      if (f.id !== undefined) {
        map.set(f.id, {
          lifetime: getLifetimeRounds(f),
          dirty: getDirtyRounds(f),
        });
      }
    }
    return map;
  }, [firearms]);

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

  // Filtered and Sorted list (strictly memoized to prevent re-filtering on unrelated state changes)
  const sorted = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = firearms.filter((f) => {
      // Text search
      if (query) {
        const matches =
          (f.make || '').toLowerCase().includes(query) ||
          (f.model || '').toLowerCase().includes(query) ||
          (f.caliber || '').toLowerCase().includes(query) ||
          (f.serial_number || '').toLowerCase().includes(query) ||
          (f.notes || '').toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Sold status filter
      if (filterSold === 'sold' && !f.is_sold) return false;
      if (filterSold === 'available' && f.is_sold) return false;

      // Category chip filter
      if (categoryChip !== 'all') {
        const typeStr = (f.firearm_type || '').toLowerCase();
        if (categoryChip === 'handgun') {
          if (
            !typeStr.includes('pistol') &&
            !typeStr.includes('revolver') &&
            !typeStr.includes('handgun')
          )
            return false;
        } else if (categoryChip === 'rifle') {
          if (!typeStr.includes('rifle') && !typeStr.includes('carbine')) return false;
        } else if (categoryChip === 'shotgun') {
          if (!typeStr.includes('shotgun')) return false;
        } else if (categoryChip === 'vintage') {
          if (!isVintageFirearm(f)) return false;
        } else if (categoryChip === 'service_due') {
          if (!isMaintenanceDue(f)) return false;
        } else if (categoryChip === 'nfa') {
          if (!f.is_nfa) return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortKey === 'status') {
        const valA = a.is_sold ? 'Sold' : 'Available';
        const valB = b.is_sold ? 'Sold' : 'Available';
        const cmp = valA.localeCompare(valB);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      if (sortKey === 'rounds') {
        const valA = (a.id !== undefined ? firearmRoundsMap.get(a.id)?.lifetime : 0) || 0;
        const valB = (b.id !== undefined ? firearmRoundsMap.get(b.id)?.lifetime : 0) || 0;
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      const valA = (a[sortKey] || '').toString().toLowerCase();
      const valB = (b[sortKey] || '').toString().toLowerCase();
      const cmp = String(valA).localeCompare(String(valB));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [firearms, search, filterSold, categoryChip, sortKey, sortDir, firearmRoundsMap]);

  // Progressive DOM windowing for large collections (renders initial 36, expands on scroll)
  const [visibleCount, setVisibleCount] = useState(36);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(36);
  }, [search, filterSold, categoryChip, sortKey, sortDir]);

  useEffect(() => {
    if (!loadMoreRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 36, sorted.length));
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [sorted.length]);

  const visibleFirearms = useMemo(() => {
    return sorted.slice(0, visibleCount);
  }, [sorted, visibleCount]);

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

  // Memoized Valuation breakdown — prevents expensive O(N) recalculations on keystroke input
  const firearmsVal = useMemo(
    () =>
      firearms
        .filter((f) => !f.is_sold)
        .reduce(
          (sum, f) =>
            sum +
            parseCurrency(f.purchase_price) +
            (f.logs?.reduce((lsum, l) => lsum + parseCurrency(l.cost), 0) || 0),
          0
        ),
    [firearms]
  );

  const accessoriesVal = useMemo(
    () =>
      accessories.reduce((sum, a) => sum + parseCurrency(a.value) * (Number(a.quantity) || 1), 0),
    [accessories]
  );

  const ammoVal = useMemo(
    () =>
      ammoList.reduce((sum, a) => sum + (Number(a.count) || 0) * parseCurrency(a.costPerRound), 0),
    [ammoList]
  );

  const componentsVal = useMemo(
    () => components.reduce((sum, c) => sum + parseCurrency(c.cost), 0),
    [components]
  );

  const grandTotalVal = useMemo(
    () => firearmsVal + accessoriesVal + ammoVal + componentsVal,
    [firearmsVal, accessoriesVal, ammoVal, componentsVal]
  );

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {themeConfig.widgets.exportBinder && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleExportInsuranceBinder}
              disabled={isExportingBinder}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                fontSize: '0.85rem',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
              }}
              title="Export Full Armory Insurance & Appraisal Binder (Typst PDF)"
            >
              <FileText size={15} color="#60a5fa" />
              <span>{isExportingBinder ? 'Compiling...' : 'Export Insurance Binder (PDF)'}</span>
            </button>
          )}

          {/* Customize Dashboard Widgets Dropdown */}
          <div className="customize-metrics-wrap">
            <button
              className="btn-secondary"
              onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
              title="Customize Dashboard Layout & Widgets"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <SlidersHorizontal size={15} />
              <span>Customize Widgets</span>
            </button>

            {isCustomizeOpen && (
              <div className="customize-metrics-popover">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-light)',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <div
                    style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}
                  >
                    Customize Dashboard
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={handleResetWidgets}
                    title="Restore default widget layout"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                  >
                    Reset
                  </button>
                </div>

                {/* Grid Density Selector */}
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-muted)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Card Grid Density
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.35rem',
                    }}
                  >
                    {(['compact', 'standard', 'showcase'] as GridDensity[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`btn-secondary ${themeConfig.gridDensity === mode ? 'btn-primary' : ''}`}
                        onClick={() => handleSetGridDensity(mode)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.3rem 0.4rem',
                          textTransform: 'capitalize',
                          fontWeight: themeConfig.gridDensity === mode ? 700 : 500,
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 1: Command Metric Cards */}
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-muted)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Metric Stat Cards
                  </div>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Shield size={14} style={{ color: 'var(--accent)' }} />
                      <span>Total Firearms</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.statFirearms}
                      onChange={() => handleToggleWidget('statFirearms')}
                    />
                  </label>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <CartridgesIcon size={14} color="#f59e0b" />
                      <span>Ammunition Stock</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.statAmmo}
                      onChange={() => handleToggleWidget('statAmmo')}
                    />
                  </label>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Flame size={14} color="#f97316" />
                      <span>Lifetime Rounds</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.statRounds}
                      onChange={() => handleToggleWidget('statRounds')}
                    />
                  </label>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <DollarSign size={14} color="#10b981" />
                      <span>Vault Valuation</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.statValuation}
                      onChange={() => handleToggleWidget('statValuation')}
                    />
                  </label>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} color="#f59e0b" />
                      <span>Service Status</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.statService}
                      onChange={() => handleToggleWidget('statService')}
                    />
                  </label>
                </div>

                {/* Section 2: Major Sectional Widgets */}
                <div
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-muted)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Sectional Widgets
                  </div>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <PieChart size={14} color="#60a5fa" />
                      <span>Collection Net Worth</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.collectionAnalytics}
                      onChange={() => handleToggleWidget('collectionAnalytics')}
                    />
                  </label>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Shield size={14} color="#34d399" />
                      <span>Storage Security Overview</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.storageOverview}
                      onChange={() => handleToggleWidget('storageOverview')}
                    />
                  </label>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <DollarSign size={14} color="#34d399" />
                      <span>Storage Container Valuations</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.storageValuations}
                      onChange={() => handleToggleWidget('storageValuations')}
                    />
                  </label>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Target size={14} color="#a78bfa" />
                      <span>Category Filter Chips</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.categoryChips}
                      onChange={() => handleToggleWidget('categoryChips')}
                    />
                  </label>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} color="#60a5fa" />
                      <span>Export Insurance PDF</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.exportBinder}
                      onChange={() => handleToggleWidget('exportBinder')}
                    />
                  </label>
                </div>

                {/* Section 3: Card Micro-Widgets */}
                <div
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-muted)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Card Details
                  </div>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Camera size={14} color="#60a5fa" />
                      <span>Photo Thumbnails</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.showThumbnails}
                      onChange={() => handleToggleWidget('showThumbnails')}
                    />
                  </label>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} color="#f59e0b" />
                      <span>Wear &amp; Maintenance Gauge</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.wearGauges}
                      onChange={() => handleToggleWidget('wearGauges')}
                    />
                  </label>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <ScopeIcon size={14} color="#34d399" />
                      <span>Mounted Accessories Cloud</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.mountedAccessories}
                      onChange={() => handleToggleWidget('mountedAccessories')}
                    />
                  </label>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Shield size={14} color="#60a5fa" />
                      <span>Storage Location Badges</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.storageBadges}
                      onChange={() => handleToggleWidget('storageBadges')}
                    />
                  </label>
                  <label className="metric-toggle-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Flame size={14} color="#f87171" />
                      <span>Lifetime Telemetry Strip</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={themeConfig.widgets.telemetryStrip}
                      onChange={() => handleToggleWidget('telemetryStrip')}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
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
        {themeConfig.widgets.statFirearms && (
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
        {themeConfig.widgets.statAmmo && (
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
        {themeConfig.widgets.statRounds && (
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
        {themeConfig.widgets.statValuation && (
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
                  {maskValue(formatCurrency(totalInvested), 'currency', themeConfig.privacyMode)}
                </div>
                {totalSoldValue > 0 ? (
                  <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
                    {themeConfig.privacyMode
                      ? '••••••'
                      : `+$${totalSoldValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} Disposed`}
                  </div>
                ) : (
                  <div className="stat-sub">Insurance Baseline</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Metric 5: Service Status Alert Card */}
        {themeConfig.widgets.statService && (
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
      {themeConfig.widgets.collectionAnalytics && grandTotalVal > 0 && (
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
              Total Vault Net Worth:{' '}
              {maskValue(formatCurrency(grandTotalVal), 'currency', themeConfig.privacyMode)}
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
                {maskValue(formatCurrency(firearmsVal), 'currency', themeConfig.privacyMode)}
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
                {maskValue(formatCurrency(accessoriesVal), 'currency', themeConfig.privacyMode)}
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
                {maskValue(formatCurrency(ammoVal), 'currency', themeConfig.privacyMode)}
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
                {maskValue(formatCurrency(componentsVal), 'currency', themeConfig.privacyMode)}
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

      {/* Storage & Security Overview Card */}
      {themeConfig.widgets.storageOverview && storageLocations.length > 0 && (
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
              <Shield size={18} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>
                Storage &amp; Physical Security Overview
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ({storageLocations.length} Containers Active)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleToggleWidget('storageValuations')}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.6rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
                title={
                  themeConfig.widgets.storageValuations
                    ? 'Hide financial dollar values'
                    : 'Show financial dollar values'
                }
              >
                {themeConfig.widgets.storageValuations ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>
                  {themeConfig.widgets.storageValuations
                    ? 'Valuations Visible'
                    : 'Valuations Hidden'}
                </span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/storage')}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.6rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>Storage Organizer</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '0.85rem',
            }}
          >
            {storageLocations.slice(0, 4).map((loc) => {
              const theme = getStorageTypeTheme(loc.type);
              const fCount = loc.firearmIds?.length || 0;
              const accCount = loc.accessoryIds?.length || 0;
              const ammoCount = loc.ammoIds?.length || 0;
              const compCount = loc.componentIds?.length || 0;
              const capUtil = getStorageCapacityUtilization(
                loc,
                fCount,
                accCount,
                ammoCount,
                compCount
              );

              // Calculate valuation for this storage container
              const locFirearmsVal = firearms
                .filter((f) => loc.firearmIds?.includes(f.id!))
                .reduce((sum, f) => sum + parseCurrency(f.purchase_price), 0);
              const locAccsVal = accessories
                .filter((a) => loc.accessoryIds?.includes(a.id!))
                .reduce((sum, a) => sum + parseCurrency(a.value) * (Number(a.quantity) || 1), 0);
              const locAmmoVal = ammoList
                .filter((am) => loc.ammoIds?.includes(am.id!))
                .reduce(
                  (sum, am) => sum + (Number(am.count) || 0) * parseCurrency(am.costPerRound),
                  0
                );
              const locCompsVal = components
                .filter((c) => loc.componentIds?.includes(c.id!))
                .reduce((sum, c) => sum + parseCurrency(c.cost), 0);
              const locTotalVal = locFirearmsVal + locAccsVal + locAmmoVal + locCompsVal;

              return (
                <div
                  key={loc.id}
                  onClick={() => navigate('/storage')}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={`View ${loc.name} in Storage Organizer`}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {renderStorageIcon(loc.type, 16)}
                      <strong style={{ fontSize: '0.95rem', color: theme.text }}>
                        {maskValue(loc.name, 'location', themeConfig.privacyMode)}
                      </strong>
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: theme.bg,
                        color: theme.text,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {loc.type}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    {fCount} Guns • {accCount} Accs • {ammoCount} Ammo • {compCount} Powders
                  </div>

                  {capUtil.max !== null && (
                    <div style={{ marginBottom: '0.4rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          marginBottom: '2px',
                        }}
                      >
                        <span>{capUtil.unitLabel} Capacity</span>
                        <span
                          style={{
                            fontWeight: 600,
                            color:
                              capUtil.isOverCapacity || (capUtil.percent && capUtil.percent >= 90)
                                ? 'var(--danger)'
                                : 'var(--text-primary)',
                          }}
                        >
                          {capUtil.used} / {capUtil.max} {capUtil.unitLabel} ({capUtil.percent}%)
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '4px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, capUtil.percent || 0)}%`,
                            height: '100%',
                            background:
                              capUtil.isOverCapacity || (capUtil.percent && capUtil.percent >= 90)
                                ? '#ef4444'
                                : theme.text,
                            transition: 'width 0.3s ease',
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
                      fontSize: '0.8rem',
                      marginTop: '0.3rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      Stored Value:
                    </span>
                    <strong style={{ color: 'var(--success)' }}>
                      {themeConfig.privacyMode
                        ? '$••••••'
                        : themeConfig.widgets.storageValuations
                          ? formatCurrency(locTotalVal)
                          : '•••••'}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unified Dashboard Control Deck */}
      <div className="dashboard-control-deck">
        {/* Left: Category Filter Chips */}
        {themeConfig.widgets.categoryChips && (
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
        )}

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
        <>
          <div className="tactical-grid">
            {visibleFirearms.map((f) => {
              const roundsInfo = (f.id !== undefined ? firearmRoundsMap.get(f.id) : null) || {
                lifetime: 0,
                dirty: 0,
              };
              const lifetimeRounds = roundsInfo.lifetime;
              const dirtyRounds = roundsInfo.dirty;
              const threshold = f.maintenance_round_threshold || 500;
              const wearPct = Math.min(100, Math.round((dirtyRounds / threshold) * 100));
              const isDue = isMaintenanceDue(f);
              const mountedAccs =
                (f.id !== undefined ? mountedAccessoriesMap.get(f.id) : null) || [];
              const imageSrc = getFirearmImageSrc(f, true);
              const isVintage = isVintageFirearm(f);

              return (
                <div
                  key={f.id}
                  className="tactical-card"
                  onClick={() => navigate(`/details/${f.id}`)}
                >
                  {/* Card Banner / Photo */}
                  {themeConfig.widgets.showThumbnails && (
                    <div className="tactical-card-image-wrap">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={f.model}
                          className="tactical-card-image"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="tactical-card-placeholder">
                          <Camera size={32} opacity={0.3} />
                          <span style={{ fontSize: '0.75rem' }}>No Photo Attached</span>
                        </div>
                      )}

                      {/* Badges Overlay */}
                      <div className="tactical-card-badges-overlay">
                        {f.is_sold ? (
                          <span className="status-badge sold">Sold</span>
                        ) : (
                          themeConfig.widgets.storageBadges && (
                            <StorageBadge
                              location={storageIndex.getLocation('firearm', f.id)}
                              onClick={(e) => {
                                e?.stopPropagation();
                                navigate('/storage');
                              }}
                              size="sm"
                            />
                          )
                        )}
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
                  )}

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
                          {maskValue(f.serial_number, 'serial', themeConfig.privacyMode)}
                        </strong>
                      </span>
                      {f.condition && <span>{f.condition}</span>}
                    </div>

                    {/* Mounted Accessories Tag Cloud */}
                    {themeConfig.widgets.mountedAccessories && mountedAccs.length > 0 && (
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
                              ) : a.type === 'Stock' ? (
                                <StockIcon size={11} color={tc.text} />
                              ) : a.type === 'Chassis' ? (
                                <ChassisIcon size={11} color={tc.text} />
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
                    {themeConfig.widgets.wearGauges && !f.is_sold && (
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

                    {/* Lifetime Telemetry Strip */}
                    {themeConfig.widgets.telemetryStrip && (
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
                    )}
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
          {visibleCount < sorted.length && (
            <div ref={loadMoreRef} style={{ height: '40px', margin: '1rem 0' }} />
          )}
        </>
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
              {visibleFirearms.map((f) => {
                const roundsInfo = (f.id !== undefined ? firearmRoundsMap.get(f.id) : null) || {
                  lifetime: 0,
                  dirty: 0,
                };
                const lifetimeRounds = roundsInfo.lifetime;
                const dirtyRounds = roundsInfo.dirty;
                const isDue = isMaintenanceDue(f);
                const imageSrc = getFirearmImageSrc(f, true);

                return (
                  <tr
                    key={f.id}
                    className={f.is_sold ? 'row-sold clickable-row' : 'clickable-row'}
                    onClick={() => navigate(`/details/${f.id}`)}
                  >
                    <td>
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt=""
                          className="table-thumbnail"
                          loading="lazy"
                          decoding="async"
                        />
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
                      {maskValue(f.serial_number, 'serial', themeConfig.privacyMode)}
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
          {visibleCount < sorted.length && (
            <div ref={loadMoreRef} style={{ height: '40px', margin: '1rem 0' }} />
          )}
        </div>
      )}
    </div>
  );
};
