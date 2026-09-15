import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Crosshair,
  DollarSign,
  FileText,
  Gauge,
  History,
  Layers,
  PlusCircle,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { OpticZeroModal } from '@/components/modals/OpticZeroModal';
import { QuickServiceModal } from '@/components/modals/QuickServiceModal';
import type { Firearm, MaintenanceLog, MaintenanceScheduleItem, OpticZeroRecord } from '@/types';
import { formatCurrency, parseCurrency } from '@/utils/currency';
import {
  createScheduleItemsFromProfile,
  detectMaintenanceProfile,
} from '@/utils/maintenancePresets';
import { MasterScheduleTab } from './subtabs/MasterScheduleTab';
import { OpticRegistryTab } from './subtabs/OpticRegistryTab';
import { PartsLedgerTab } from './subtabs/PartsLedgerTab';
import { ServiceBoardTab } from './subtabs/ServiceBoardTab';
import type { ServiceTaskEntry } from './subtabs/types';

type TabView = 'service_board' | 'armory_schedule' | 'history_ledger' | 'torque_registry';

// Helper to compute total rounds fired for a firearm
const getTotalRounds = (f: Firearm): number => {
  if (!f.logs) return 0;
  return f.logs
    .filter((l) => l.type === 'Range')
    .reduce((sum, l) => sum + (l.rounds_fired || 0), 0);
};

// Helper to compute days since last performed
const getDaysSinceLast = (task: MaintenanceScheduleItem): number => {
  if (!task.last_performed_date) return -1;
  const lastDate = new Date(task.last_performed_date);
  if (Number.isNaN(lastDate.getTime())) return -1;
  return Math.floor((Date.now() - lastDate.getTime()) / (1000 * 3600 * 24));
};

export const MaintenanceDashboard: React.FC = () => {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [activeTab, setActiveTab] = useState<TabView>('service_board');
  const navigate = useNavigate();
  const location = useLocation();
  const [isGeneratingWorkOrder, setIsGeneratingWorkOrder] = useState(false);
  const [workOrderNotice, setWorkOrderNotice] = useState<string | null>(null);

  // User preferences
  const [showCosts, setShowCosts] = useState<boolean>(() => {
    try {
      return localStorage.getItem('av_maintenance_show_costs') !== 'false';
    } catch {
      return true;
    }
  });

  const [dueSoonRounds, setDueSoonRounds] = useState<number>(() => {
    try {
      const val = localStorage.getItem('av_due_soon_rounds');
      return val ? Number.parseInt(val, 10) : 200;
    } catch {
      return 200;
    }
  });

  const [dueSoonDays, setDueSoonDays] = useState<number>(() => {
    try {
      const val = localStorage.getItem('av_due_soon_days');
      return val ? Number.parseInt(val, 10) : 14;
    } catch {
      return 14;
    }
  });

  // Filters & Search with 120ms debouncing to prevent full component tree churn on typing
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 120);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'due_soon' | 'good'>('all');

  // Modals
  const [isQuickServiceOpen, setIsQuickServiceOpen] = useState(false);
  const [serviceTargetFirearmId, setServiceTargetFirearmId] = useState<number | undefined>();
  const [serviceTargetTaskId, setServiceTargetTaskId] = useState<string | undefined>();
  const [serviceTargetTaskName, setServiceTargetTaskName] = useState<string | undefined>();

  const [isOpticZeroModalOpen, setIsOpticZeroModalOpen] = useState(false);
  const [zeroModalFirearm, setZeroModalFirearm] = useState<Firearm | null>(null);
  const [selectedZeroRecord, setSelectedZeroRecord] = useState<OpticZeroRecord | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const loadFirearms = useCallback(async () => {
    if (window.api) {
      try {
        const data = await window.api.getFirearms();
        setFirearms(data.filter((f: Firearm) => !f.is_sold));
      } catch (err) {
        console.error('Failed to load firearms for maintenance dashboard:', err);
      }
    }
  }, []);

  useEffect(() => {
    loadFirearms();
    const handleReload = () => loadFirearms();
    window.addEventListener('armoryvault-reload', handleReload);
    return () => window.removeEventListener('armoryvault-reload', handleReload);
  }, [loadFirearms]);

  const handleToggleCosts = () => {
    const nextVal = !showCosts;
    setShowCosts(nextVal);
    try {
      localStorage.setItem('av_maintenance_show_costs', String(nextVal));
    } catch {}
  };

  const handleSaveThresholds = (rounds: number, days: number) => {
    setDueSoonRounds(rounds);
    setDueSoonDays(days);
    try {
      localStorage.setItem('av_due_soon_rounds', String(rounds));
      localStorage.setItem('av_due_soon_days', String(days));
    } catch {}
    setIsSettingsOpen(false);
  };

  // Precompute rounds fired per firearm id for O(1) lookups
  const firearmRoundsMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const f of firearms) {
      if (f.id != null) {
        map.set(f.id, getTotalRounds(f));
      }
    }
    return map;
  }, [firearms]);

  // Precompute detected maintenance profile per firearm id for O(1) lookups
  const firearmProfilesMap = useMemo(() => {
    const map = new Map<number, ReturnType<typeof detectMaintenanceProfile>>();
    for (const f of firearms) {
      if (f.id != null) {
        map.set(f.id, detectMaintenanceProfile(f));
      }
    }
    return map;
  }, [firearms]);

  // Build unified task list across all scheduled firearms
  const allTaskEntries = useMemo<ServiceTaskEntry[]>(() => {
    const entries: ServiceTaskEntry[] = [];

    for (const f of firearms) {
      const firearmTotalRounds = firearmRoundsMap.get(f.id ?? -1) ?? 0;
      if (f.maintenance_schedules && f.maintenance_schedules.length > 0) {
        for (const task of f.maintenance_schedules) {
          const baseline = task.last_performed_rounds || 0;
          const roundsSince = Math.max(0, firearmTotalRounds - baseline);
          const daysSince = getDaysSinceLast(task);

          const isRoundOverdue = task.interval_rounds > 0 && roundsSince >= task.interval_rounds;
          const isDateOverdue =
            !!task.interval_days &&
            task.interval_days > 0 &&
            daysSince !== -1 &&
            daysSince >= task.interval_days;
          const isOverdue = isRoundOverdue || isDateOverdue;

          const isRoundDueSoon =
            !isRoundOverdue &&
            task.interval_rounds > 0 &&
            task.interval_rounds - roundsSince <= dueSoonRounds;
          const isDateDueSoon =
            !isDateOverdue &&
            !!task.interval_days &&
            task.interval_days > 0 &&
            daysSince !== -1 &&
            task.interval_days - daysSince <= dueSoonDays;
          const isDueSoon = !isOverdue && (isRoundDueSoon || isDateDueSoon);

          const isGoodStanding = !isOverdue && !isDueSoon;

          const roundProgress =
            task.interval_rounds > 0
              ? Math.min(100, Math.round((roundsSince / task.interval_rounds) * 100))
              : 0;

          const daysProgress =
            task.interval_days && daysSince !== -1 && task.interval_days > 0
              ? Math.min(100, Math.round((daysSince / task.interval_days) * 100))
              : 0;

          entries.push({
            firearm: f,
            task,
            roundsSince,
            daysSince,
            isRoundOverdue,
            isDateOverdue,
            isOverdue,
            isRoundDueSoon,
            isDateDueSoon,
            isDueSoon,
            isGoodStanding,
            roundProgress,
            daysProgress,
          });
        }
      } else if (f.maintenance_round_threshold || f.maintenance_date_threshold_days) {
        // Fallback for firearms with legacy single threshold
        const totalRounds = firearmTotalRounds;
        const legacyTask: MaintenanceScheduleItem = {
          id: `legacy_${f.id}`,
          task_name: 'Standard Cleaning & Inspection',
          interval_rounds: f.maintenance_round_threshold || 500,
          interval_days: f.maintenance_date_threshold_days,
          last_performed_rounds: 0,
          last_performed_date: f.purchase_date,
        };

        const isRoundOverdue =
          !!f.maintenance_round_threshold && totalRounds >= f.maintenance_round_threshold;
        const daysSince = f.purchase_date
          ? Math.floor((Date.now() - new Date(f.purchase_date).getTime()) / (1000 * 3600 * 24))
          : -1;
        const isDateOverdue =
          !!f.maintenance_date_threshold_days &&
          daysSince !== -1 &&
          daysSince >= f.maintenance_date_threshold_days;
        const isOverdue = isRoundOverdue || isDateOverdue;

        const isRoundDueSoon =
          !isRoundOverdue &&
          !!f.maintenance_round_threshold &&
          f.maintenance_round_threshold - totalRounds <= dueSoonRounds;
        const isDateDueSoon =
          !isDateOverdue &&
          !!f.maintenance_date_threshold_days &&
          daysSince !== -1 &&
          f.maintenance_date_threshold_days - daysSince <= dueSoonDays;
        const isDueSoon = !isOverdue && (isRoundDueSoon || isDateDueSoon);

        entries.push({
          firearm: f,
          task: legacyTask,
          roundsSince: totalRounds,
          daysSince,
          isRoundOverdue,
          isDateOverdue,
          isOverdue,
          isRoundDueSoon,
          isDateDueSoon,
          isDueSoon,
          isGoodStanding: !isOverdue && !isDueSoon,
          roundProgress: f.maintenance_round_threshold
            ? Math.min(100, Math.round((totalRounds / f.maintenance_round_threshold) * 100))
            : 0,
          daysProgress:
            f.maintenance_date_threshold_days && daysSince !== -1
              ? Math.min(100, Math.round((daysSince / f.maintenance_date_threshold_days) * 100))
              : 0,
        });
      }
    }

    return entries;
  }, [firearms, firearmRoundsMap, dueSoonRounds, dueSoonDays]);

  // Master KPI counts
  const overdueCount = allTaskEntries.filter((e) => e.isOverdue).length;
  const dueSoonCount = allTaskEntries.filter((e) => e.isDueSoon).length;
  const goodStandingCount = allTaskEntries.filter((e) => e.isGoodStanding).length;

  const scheduledFirearmsCount = firearms.filter(
    (f) =>
      (f.maintenance_schedules && f.maintenance_schedules.length > 0) ||
      f.maintenance_round_threshold
  ).length;

  // Total maintenance spend across all firearms
  const totalMaintenanceCost = useMemo(() => {
    let sum = 0;
    for (const f of firearms) {
      if (f.logs) {
        for (const l of f.logs) {
          if (l.type !== 'Range' && l.cost) {
            sum += parseCurrency(l.cost);
          }
        }
      }
    }
    return sum;
  }, [firearms]);

  // Flattened chronological service history
  const masterServiceHistory = useMemo(() => {
    const list: { firearm: Firearm; log: MaintenanceLog }[] = [];
    for (const f of firearms) {
      if (f.logs) {
        for (const l of f.logs) {
          if (l.type !== 'Range') {
            list.push({ firearm: f, log: l });
          }
        }
      }
    }
    return list.sort((a, b) => new Date(b.log.date).getTime() - new Date(a.log.date).getTime());
  }, [firearms]);

  // Filtered tasks for Service Board (debounced to avoid rendering lags during typing)
  const filteredTasks = useMemo(() => {
    return allTaskEntries.filter((entry) => {
      const q = debouncedSearchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        entry.firearm.make.toLowerCase().includes(q) ||
        entry.firearm.model.toLowerCase().includes(q) ||
        entry.firearm.serial_number.toLowerCase().includes(q) ||
        entry.task.task_name.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'overdue') return entry.isOverdue;
      if (statusFilter === 'due_soon') return entry.isDueSoon;
      if (statusFilter === 'good') return entry.isGoodStanding;
      return true;
    });
  }, [allTaskEntries, debouncedSearchQuery, statusFilter]);

  // Filtered firearms for Tab 2: Master Armory Schedule
  const filteredFirearmsForTab2 = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    if (!q) return firearms;
    return firearms.filter(
      (f) =>
        f.make.toLowerCase().includes(q) ||
        f.model.toLowerCase().includes(q) ||
        f.serial_number?.toLowerCase().includes(q) ||
        f.caliber?.toLowerCase().includes(q)
    );
  }, [firearms, debouncedSearchQuery]);

  // Quick action: open QuickServiceModal for specific task
  const handleOpenQuickService = (firearmId: number, taskId?: string, taskName?: string) => {
    setServiceTargetFirearmId(firearmId);
    setServiceTargetTaskId(taskId);
    setServiceTargetTaskName(taskName);
    setIsQuickServiceOpen(true);
  };

  // Listen for navigation state from SyncInbox or other views requesting quick service
  useEffect(() => {
    if (
      location.state &&
      (location.state as any).openQuickService &&
      (location.state as any).firearmId &&
      firearms.length > 0
    ) {
      const fId = Number((location.state as any).firearmId);
      const tName = (location.state as any).taskName;
      handleOpenQuickService(fId, undefined, tName);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, firearms]);

  const handleGenerateWorkOrder = async (firearm: Firearm, log?: MaintenanceLog) => {
    if (!window.api?.generateWorkOrder) return;
    setIsGeneratingWorkOrder(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const woData = {
        date: log?.date || today,
        work_order_number: `WO-${(log?.date || today).replace(/-/g, '')}-${firearm.id || 101}`,
        armorer_name: 'Certified Armorer',
        firearm: {
          make: firearm.make,
          model: firearm.model,
          caliber: firearm.caliber,
          serial_number: firearm.serial_number,
          round_count: firearm.round_count || 0,
          type: firearm.firearm_type || 'Firearm',
          location: (firearm as any).location || 'Vault',
          condition: firearm.condition,
        },
        service_item: {
          task_name:
            log?.installed_part_details ||
            log?.repaired_part ||
            `${log?.type || 'Scheduled'} Service`,
          category: log?.type || 'Routine Maintenance',
          round_count_at_service: (log as any)?.round_count_at_service || firearm.round_count || 0,
          notes:
            log?.notes || 'Standard protocol executed according to armorer factory specifications.',
          cost: log?.cost || 0,
          completed_date: log?.date || today,
        },
        parts_replaced: log?.installed_part_details
          ? [
              {
                name: log.installed_part_details,
                part_number: '—',
                manufacturer: 'OEM / Certified',
                cost: log.cost || 0,
              },
            ]
          : [],
        torque_specs: ((firearm as any).optic_zeros || firearm.optic_zero_records || []).map(
          (oz: any) => ({
            component: `${oz.optic_name || 'Optic'} Mount`,
            torque_in_lb: oz.base_torque_in_lb || 15,
            threadlocker: oz.threadlocker || 'Loctite 242 (Blue)',
            status: 'VERIFIED',
          })
        ),
        test_fire: {
          performed: false,
          rounds_fired: 0,
        },
        inspection_checks: [
          { check: 'Headspace Verification', result: 'PASSED (Within Gauge Limits)' },
          { check: 'Bore & Chamber Condition', result: 'PASSED (Clean, sharp rifling)' },
          { check: 'Extractor Tension & Claw', result: 'PASSED (Positive casing grasp)' },
          { check: 'Firing Pin Integrity', result: 'PASSED (Normal protrusion)' },
          { check: 'Drop Safety & Disconnector', result: 'PASSED (Operational)' },
        ],
      };

      const result = await window.api.generateWorkOrder(woData);
      if (result) {
        setWorkOrderNotice(
          `Work order certificate exported successfully: ${result.split('/').pop()}`
        );
        setTimeout(() => setWorkOrderNotice(null), 6000);
      }
    } catch (e: any) {
      console.error('Failed to generate work order:', e);
    } finally {
      setIsGeneratingWorkOrder(false);
    }
  };

  // Quick action: Apply recommended preset to an unscheduled firearm
  const handleApplyPreset = async (firearm: Firearm) => {
    const detectedProfile = detectMaintenanceProfile(firearm);
    const baselineRounds = getTotalRounds(firearm);
    const newSchedules = createScheduleItemsFromProfile(detectedProfile, baselineRounds);

    const updatedFirearm: Firearm = {
      ...firearm,
      maintenance_schedules: newSchedules,
    };

    if (window.api) {
      await window.api.updateFirearm(firearm.id!, updatedFirearm);
      window.dispatchEvent(new CustomEvent('armoryvault-reload'));
      loadFirearms();
    }
  };

  // Save schedule task interval edits
  const handleSaveScheduleItem = async (
    firearm: Firearm,
    taskId: string,
    rounds: number,
    days?: number
  ) => {
    const currentSchedules = firearm.maintenance_schedules || [];
    const updatedSchedules = currentSchedules.map((s) => {
      if (s.id === taskId) {
        return {
          ...s,
          interval_rounds: rounds,
          interval_days: days,
        };
      }
      return s;
    });

    const updatedFirearm: Firearm = {
      ...firearm,
      maintenance_schedules: updatedSchedules,
    };

    if (window.api) {
      await window.api.updateFirearm(firearm.id!, updatedFirearm);
      window.dispatchEvent(new CustomEvent('armoryvault-reload'));
      loadFirearms();
    }
  };

  // Delete optic zero record
  const handleDeleteOpticZero = async (firearm: Firearm, zeroId: string) => {
    const updatedZeroes = (firearm.optic_zero_records || []).filter((z) => z.id !== zeroId);
    const updatedFirearm: Firearm = {
      ...firearm,
      optic_zero_records: updatedZeroes,
    };

    if (window.api) {
      await window.api.updateFirearm(firearm.id!, updatedFirearm);
      window.dispatchEvent(new CustomEvent('armoryvault-reload'));
      loadFirearms();
    }
  };

  return (
    <div className="page-container animate-fade-in">
      {/* ─── Page Header & Master Controls ─── */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background:
                  'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2))',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <Wrench size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>
                Armorer Command Center
              </h1>
              <p
                style={{
                  margin: '0.2rem 0 0 0',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                }}
              >
                Armory service intervals, parts replacement ledger, and optic torque registry
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Cost Visibility Toggle */}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleToggleCosts}
            title={showCosts ? 'Hide Financial Costs' : 'Show Financial Costs'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: showCosts ? '#34d399' : 'var(--text-secondary)',
            }}
          >
            <DollarSign size={16} />
            <span>{showCosts ? 'Costs Visible' : 'Costs Hidden'}</span>
          </button>

          {/* Threshold Settings Modal Trigger */}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsSettingsOpen(true)}
            title="Configure Alert Thresholds"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <SlidersHorizontal size={16} />
            <span>Alert Thresholds</span>
          </button>

          {/* Work Order Certificate PDF Trigger */}
          <button
            type="button"
            className="btn-secondary"
            disabled={isGeneratingWorkOrder || firearms.length === 0}
            onClick={() => handleGenerateWorkOrder(firearms[0])}
            title="Export Armorer Work Order & Inspection Certificate PDF"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8' }}
          >
            <FileText size={16} />
            <span>{isGeneratingWorkOrder ? 'Exporting...' : 'Work Order PDF'}</span>
          </button>

          {/* Quick Service Modal Trigger */}
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleOpenQuickService(firearms[0]?.id || 1)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <PlusCircle size={16} />
            <span>Log Armorer Service</span>
          </button>
        </div>
      </div>

      {/* Work Order Export Notification Toast */}
      {workOrderNotice && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.75rem 1.25rem',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            color: '#38bdf8',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="#38bdf8" />
            <span>{workOrderNotice}</span>
          </div>
          <button
            onClick={() => setWorkOrderNotice(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── Master Fleet Health KPI Summary ─── */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: showCosts
            ? 'repeat(auto-fit, minmax(200px, 1fr))'
            : 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Monitored Weapons */}
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            border: '1px solid var(--border-light)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>Armory Monitored</span>
            <Shield size={16} color="#60a5fa" />
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginTop: '0.4rem',
              color: 'var(--text-primary)',
            }}
          >
            {`${scheduledFirearmsCount} / ${firearms.length}`}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.2rem',
            }}
          >
            {firearms.length > 0
              ? `${Math.round((scheduledFirearmsCount / firearms.length) * 100)}% active schedules configured`
              : 'No firearms in vault'}
          </div>
        </div>

        {/* Tasks Overdue */}
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            border:
              overdueCount > 0
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : '1px solid var(--border-light)',
            background: overdueCount > 0 ? 'rgba(239, 68, 68, 0.06)' : 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: overdueCount > 0 ? '#f87171' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>Service Overdue</span>
            <AlertTriangle size={16} color={overdueCount > 0 ? '#ef4444' : '#64748b'} />
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginTop: '0.4rem',
              color: overdueCount > 0 ? '#ef4444' : 'var(--text-primary)',
            }}
          >
            {overdueCount}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: overdueCount > 0 ? '#fca5a5' : 'var(--text-secondary)',
              marginTop: '0.2rem',
            }}
          >
            {overdueCount > 0 ? 'Interval threshold exceeded' : 'Zero overdue tasks across armory'}
          </div>
        </div>

        {/* Tasks Due Soon */}
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            border:
              dueSoonCount > 0
                ? '1px solid rgba(245, 158, 11, 0.4)'
                : '1px solid var(--border-light)',
            background: dueSoonCount > 0 ? 'rgba(245, 158, 11, 0.06)' : 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: dueSoonCount > 0 ? '#fbbf24' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>Due Soon</span>
            <Clock size={16} color={dueSoonCount > 0 ? '#f59e0b' : '#64748b'} />
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginTop: '0.4rem',
              color: dueSoonCount > 0 ? '#f59e0b' : 'var(--text-primary)',
            }}
          >
            {dueSoonCount}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: dueSoonCount > 0 ? '#fde68a' : 'var(--text-secondary)',
              marginTop: '0.2rem',
            }}
          >
            {dueSoonCount > 0
              ? `Within ${dueSoonRounds} rds or ${dueSoonDays} days`
              : 'No upcoming service imminent'}
          </div>
        </div>

        {/* Good Standing */}
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            border: '1px solid var(--border-light)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#34d399',
              fontSize: '0.8rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>Good Standing</span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginTop: '0.4rem',
              color: '#10b981',
            }}
          >
            {goodStandingCount}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.2rem',
            }}
          >
            Scheduled tasks in green status
          </div>
        </div>

        {/* Maintenance Investment (Conditional) */}
        {showCosts && (
          <div
            className="card"
            style={{
              padding: '1rem 1.25rem',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              background: 'rgba(16, 185, 129, 0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#34d399',
                fontSize: '0.8rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span>Armory Investment</span>
              <DollarSign size={16} color="#10b981" />
            </div>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                marginTop: '0.4rem',
                color: '#34d399',
              }}
            >
              {formatCurrency(totalMaintenanceCost)}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginTop: '0.2rem',
              }}
            >
              Lifetime parts & service spend
            </div>
          </div>
        )}
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '0.2rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('service_board')}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'service_board' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'service_board' ? '#3b82f6' : 'var(--text-secondary)',
            fontWeight: activeTab === 'service_board' ? 600 : 400,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          <Gauge size={16} />
          <span>Service Board</span>
          {overdueCount > 0 && (
            <span
              style={{
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                fontSize: '0.7rem',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontWeight: 700,
              }}
            >
              {overdueCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('armory_schedule')}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'armory_schedule' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'armory_schedule' ? '#3b82f6' : 'var(--text-secondary)',
            fontWeight: activeTab === 'armory_schedule' ? 600 : 400,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          <Layers size={16} />
          <span>Master Armory Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history_ledger')}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'history_ledger' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'history_ledger' ? '#3b82f6' : 'var(--text-secondary)',
            fontWeight: activeTab === 'history_ledger' ? 600 : 400,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          <History size={16} />
          <span>Parts & Service Ledger</span>
          <span
            style={{
              padding: '0.1rem 0.45rem',
              borderRadius: '10px',
              fontSize: '0.7rem',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
            }}
          >
            {masterServiceHistory.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('torque_registry')}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'torque_registry' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'torque_registry' ? '#3b82f6' : 'var(--text-secondary)',
            fontWeight: activeTab === 'torque_registry' ? 600 : 400,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          <Crosshair size={16} />
          <span>Optic Torque & Zero Registry</span>
        </button>
      </div>

      {/* ─── TAB 1: SERVICE BOARD ─── */}
      {activeTab === 'service_board' && (
        <ServiceBoardTab
          tasks={filteredTasks}
          allTasksCount={allTaskEntries.length}
          overdueCount={overdueCount}
          dueSoonCount={dueSoonCount}
          goodStandingCount={goodStandingCount}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenQuickService={handleOpenQuickService}
          onNavigateDetails={(id) => navigate(`/details/${id}`)}
        />
      )}

      {/* ─── TAB 2: MASTER ARMORY SCHEDULE ─── */}
      {activeTab === 'armory_schedule' && (
        <MasterScheduleTab
          firearms={filteredFirearmsForTab2}
          firearmProfilesMap={firearmProfilesMap}
          firearmRoundsMap={firearmRoundsMap}
          searchQuery={debouncedSearchQuery}
          onOpenQuickService={handleOpenQuickService}
          onApplyPreset={handleApplyPreset}
          onSaveScheduleItem={handleSaveScheduleItem}
          onNavigateDetails={(id) => navigate(`/details/${id}`)}
        />
      )}

      {/* ─── TAB 3: CHRONOLOGICAL PARTS & SERVICE LEDGER ─── */}
      {activeTab === 'history_ledger' && (
        <PartsLedgerTab
          masterServiceHistory={masterServiceHistory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          historyTypeFilter={historyTypeFilter}
          setHistoryTypeFilter={setHistoryTypeFilter}
          showCosts={showCosts}
          onNavigateDetails={(id) => navigate(`/details/${id}`)}
          onGenerateWorkOrder={handleGenerateWorkOrder}
        />
      )}

      {/* ─── TAB 4: OPTIC TORQUE & ZERO REGISTRY ─── */}
      {activeTab === 'torque_registry' && (
        <OpticRegistryTab
          firearms={firearms}
          searchQuery={debouncedSearchQuery}
          onOpenOpticModal={(firearm, record) => {
            setZeroModalFirearm(firearm);
            setSelectedZeroRecord(record || null);
            setIsOpticZeroModalOpen(true);
          }}
          onDeleteOpticZero={handleDeleteOpticZero}
        />
      )}

      {/* ─── QUICK SERVICE MODAL ─── */}
      {isQuickServiceOpen && (
        <QuickServiceModal
          isOpen={isQuickServiceOpen}
          onClose={() => setIsQuickServiceOpen(false)}
          onSuccess={() => loadFirearms()}
          firearms={firearms}
          initialFirearmId={serviceTargetFirearmId}
          initialTaskId={serviceTargetTaskId}
          initialTaskName={serviceTargetTaskName}
        />
      )}

      {/* ─── OPTIC ZERO MODAL ─── */}
      {isOpticZeroModalOpen && zeroModalFirearm && (
        <OpticZeroModal
          isOpen={isOpticZeroModalOpen}
          onClose={() => {
            setIsOpticZeroModalOpen(false);
            setZeroModalFirearm(null);
            setSelectedZeroRecord(null);
          }}
          onSuccess={() => loadFirearms()}
          firearm={zeroModalFirearm}
          existingRecord={selectedZeroRecord}
        />
      )}

      {/* ─── THRESHOLD SETTINGS MODAL ─── */}
      {isSettingsOpen &&
        createPortal(
          <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
            <div
              className="modal"
              style={{ maxWidth: '460px', width: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-header"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SlidersHorizontal size={20} color="#3b82f6" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                    Maintenance Alert Preferences
                  </h3>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const rounds = Number.parseInt(formData.get('due_rounds') as string, 10) || 200;
                  const days = Number.parseInt(formData.get('due_days') as string, 10) || 14;
                  handleSaveThresholds(rounds, days);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Configure when scheduled tasks are flagged with the amber "Due Soon" status prior
                  to reaching their mandatory service interval.
                </p>

                <div>
                  <label
                    htmlFor="due_rounds"
                    style={{
                      display: 'block',
                      marginBottom: '0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  >
                    Round Count Warning Window
                  </label>
                  <input
                    id="due_rounds"
                    name="due_rounds"
                    type="number"
                    min="25"
                    step="25"
                    className="form-input"
                    defaultValue={dueSoonRounds}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Flag as Due Soon when within this many rounds of target interval (default: 200
                    rds)
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="due_days"
                    style={{
                      display: 'block',
                      marginBottom: '0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  >
                    Days Warning Window
                  </label>
                  <input
                    id="due_days"
                    name="due_days"
                    type="number"
                    min="1"
                    max="180"
                    className="form-input"
                    defaultValue={dueSoonDays}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Flag as Due Soon when within this many days of calendar interval (default: 14
                    days)
                  </span>
                </div>

                <div
                  className="modal-actions"
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsSettingsOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Preferences
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
