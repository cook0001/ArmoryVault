import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Calendar,
  Check,
  CheckCircle,
  ClipboardList,
  Clock,
  Crosshair,
  DollarSign,
  Edit,
  Eye,
  FileText,
  Flashlight,
  PlusCircle,
  Printer,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Target,
  Trash2,
  Upload,
  Wrench,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { AccessoryDetailModal, getAccessoryTypeColor } from '../components/AccessoryDetailModal';
import { AccessoryModal } from '../components/AccessoryModal';
import { AutocompleteInput } from '../components/AutocompleteInput';
import { ScopeIcon } from '../components/CustomIcons';
import { Lightbox } from '../components/Lightbox';
import {
  Accessory,
  Ammo,
  CustomSchedulePreset,
  Firearm,
  MaintenanceLog,
  MaintenanceScheduleItem,
} from '../types';
import {
  createScheduleItemsFromProfile,
  detectFirearmScheduleProfile,
  MAINTENANCE_PROFILES,
  MaintenanceProfile,
} from '../utils/maintenancePresets';

export const FirearmDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [firearm, setFirearm] = useState<Firearm | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [sellForm, setSellForm] = useState({
    seller_name: '',
    sold_to_name: '',
    sold_date: '',
    sold_price: '',
    sale_notes: '',
  });
  const [logForm, setLogForm] = useState<Partial<MaintenanceLog>>({
    date: new Date().toISOString().split('T')[0],
    type: 'Range',
    notes: '',
    rounds_fired: '' as any,
    ammo_used: '',
    malfunctions: '' as any,
    repaired_part: '',
    part_manufacturer: '',
    installed_part_details: '',
    cost: '' as any,
    image_path: '',
  });
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [inventoryAmmo, setInventoryAmmo] = useState<Ammo[]>([]);
  const [attachedAccessories, setAttachedAccessories] = useState<Accessory[]>([]);
  const [showTotalSetupValue, setShowTotalSetupValue] = useState(false);
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState(false);
  const [editingAccessoryId, setEditingAccessoryId] = useState<number | null>(null);
  const [accessoryFormData, setAccessoryFormData] = useState<Partial<Accessory>>({});
  const [selectedAccessoryForDetail, setSelectedAccessoryForDetail] = useState<Accessory | null>(
    null
  );
  const [allFirearms, setAllFirearms] = useState<Firearm[]>([]);

  // Maintenance Scheduler State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<{
    id?: string;
    task_name: string;
    interval_rounds: number;
    enableDays?: boolean;
    interval_days?: number;
    notes: string;
  }>({ task_name: '', interval_rounds: 3000, enableDays: false, interval_days: 90, notes: '' });
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('semi_pistol');
  const [presetTab, setPresetTab] = useState<'profiles' | 'custom'>('profiles');
  const [customPresets, setCustomPresets] = useState<CustomSchedulePreset[]>([]);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [customPresetForm, setCustomPresetForm] = useState({ name: '', description: '' });

  // Dossier State
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Task Completion & Part Replacement Modal State
  const [isTaskCompletionModalOpen, setIsTaskCompletionModalOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<any>(null);
  const [completionForm, setCompletionForm] = useState({
    action_performed: '',
    part_details: '',
    part_manufacturer: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const getAmmoString = (a: Ammo) => {
    const isShotgun =
      a.caliber?.toLowerCase().includes('gauge') ||
      a.caliber?.toLowerCase().includes('ga') ||
      a.caliber?.includes('.410');
    const payloadStr = a.oz_payload
      ? ` (${a.oz_payload.toLowerCase().includes('oz') ? a.oz_payload : a.oz_payload + ' oz'})`
      : a.pellet_count
        ? ` (${a.pellet_count} pellets)`
        : '';
    const shellStr = a.shell_length
      ? `${a.shell_length.includes('"') || a.shell_length.toLowerCase().includes('in') ? a.shell_length : a.shell_length + '"'} `
      : '';
    if (a.type === 'factory') {
      if (isShotgun) {
        return `[Factory] ${a.manufacturer || 'Unknown'} ${a.caliber} - ${shellStr}${a.shot_size || 'Unknown Shot'}${payloadStr} (${a.count} in stock)`;
      }
      return `[Factory] ${a.manufacturer || 'Unknown'} ${a.caliber} - ${a.grain}gr (${a.count} in stock)`;
    }
    if (isShotgun) {
      return `[Handload] ${a.caliber} - ${shellStr}${a.shot_size || 'Unknown Shot'}${payloadStr} (${a.count} in stock)`;
    }
    return `[Handload] ${a.caliber} - ${a.powder} (${a.count} in stock)`;
  };

  useEffect(() => {
    loadFirearm();
  }, [id]);

  const loadFirearm = async () => {
    if (window.api && id) {
      const all = await window.api.getFirearms();
      setAllFirearms(all);
      const found = all.find((f) => f.id === Number(id));
      setFirearm(found || null);

      const ammo = await window.api.getAmmo();
      setInventoryAmmo(ammo);

      if (window.api.getAccessories) {
        const allAcc = await window.api.getAccessories();
        const attached = allAcc.filter((a) => a.mounts?.some((m) => m.firearmId === Number(id)));
        setAttachedAccessories(attached);

        if (selectedAccessoryForDetail) {
          const refreshed = allAcc.find((a) => a.id === selectedAccessoryForDetail.id);
          setSelectedAccessoryForDetail(refreshed || null);
        }
      }

      if (window.api.getConfig) {
        const showSetup = await window.api.getConfig('showTotalSetupValue');
        setShowTotalSetupValue(!!showSetup);
      }

      if (window.api.getCustomSchedulePresets) {
        const presets = await window.api.getCustomSchedulePresets();
        setCustomPresets(presets || []);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      await window.api.deleteFirearm(Number(id));
      navigate('/');
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (firearm) {
      const updated = {
        ...firearm,
        is_sold: true,
        ...sellForm,
        sold_price: parseFloat(sellForm.sold_price) || 0,
      };
      await window.api.updateFirearm(firearm.id!, updated);
      setFirearm(updated);
      setIsSelling(false);
    }
  };

  const handleEditLog = (log: MaintenanceLog) => {
    setEditingLogId(log.id);
    setLogForm({
      date: log.date,
      type: log.type,
      notes: log.notes,
      rounds_fired: log.rounds_fired === undefined ? ('' as any) : log.rounds_fired,
      ammo_used: log.ammo_used || '',
      malfunctions: log.malfunctions === undefined ? ('' as any) : log.malfunctions,
      repaired_part: log.repaired_part || '',
      part_manufacturer: log.part_manufacturer || '',
      installed_part_details: log.installed_part_details || '',
      cost: log.cost === undefined ? ('' as any) : log.cost,
      image_path: log.image_path || '',
    });
    setIsLogging(true);
  };

  const handleDeleteLog = async (logId: number) => {
    if (window.confirm('Are you sure you want to delete this log entry?')) {
      if (firearm) {
        const updatedLogs = (firearm.logs || []).filter((l) => l.id !== logId);
        const updated = { ...firearm, logs: updatedLogs };
        await window.api.updateFirearm(firearm.id!, updated);
        setFirearm(updated);
      }
    }
  };

  const handleDocumentSelect = async () => {
    if (!window.api || !firearm) return;
    try {
      const doc = await window.api.selectAndSaveDocument();
      if (doc && doc.path) {
        const updatedDocs = [
          ...(firearm.documents || []),
          { name: doc.name, path: doc.path, date_added: new Date().toISOString().split('T')[0] },
        ];
        const updated = { ...firearm, documents: updatedDocs };
        await window.api.updateFirearm(firearm.id!, updated);
        setFirearm(updated);
      }
    } catch (err) {
      console.error('Failed to attach document', err);
    }
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firearm) return;

    let updatedLogs: MaintenanceLog[] = [];
    const newLogData: MaintenanceLog = {
      id: editingLogId ? editingLogId : Date.now(),
      date: logForm.date || new Date().toISOString().split('T')[0],
      type: logForm.type || 'Range',
      notes: logForm.notes || '',
      rounds_fired: logForm.type === 'Range' ? Number(logForm.rounds_fired) || 0 : undefined,
      ammo_used: logForm.type === 'Range' ? logForm.ammo_used : undefined,
      malfunctions: logForm.type === 'Range' ? Number(logForm.malfunctions) || 0 : undefined,
      repaired_part:
        logForm.type === 'Modification' || logForm.type === 'Repair' || logForm.type === 'Other'
          ? logForm.repaired_part
          : undefined,
      part_manufacturer:
        logForm.type === 'Modification' || logForm.type === 'Repair' || logForm.type === 'Other'
          ? logForm.part_manufacturer
          : undefined,
      installed_part_details:
        logForm.type === 'Modification' || logForm.type === 'Repair' || logForm.type === 'Other'
          ? logForm.installed_part_details
          : undefined,
      cost:
        logForm.type === 'Modification' || logForm.type === 'Repair' || logForm.type === 'Other'
          ? Number(logForm.cost) || 0
          : undefined,
      image_path: logForm.image_path,
    };

    if (editingLogId) {
      updatedLogs = (firearm.logs || []).map((l) => (l.id === editingLogId ? newLogData : l));
    } else {
      updatedLogs = [...(firearm.logs || []), newLogData];
    }

    const updated = { ...firearm, logs: updatedLogs };
    await window.api.updateFirearm(firearm.id!, updated);
    setFirearm(updated);
    setIsLogging(false);
    setEditingLogId(null);
    setLogForm({
      date: new Date().toISOString().split('T')[0],
      type: 'Range',
      notes: '',
      rounds_fired: '' as any,
      ammo_used: '',
      malfunctions: '' as any,
      repaired_part: '',
      part_manufacturer: '',
      installed_part_details: '',
      cost: '' as any,
      image_path: '',
    });
  };

  const handleLogImage = async () => {
    if (window.api && window.api.selectAndSavePhoto) {
      const paths = await window.api.selectAndSavePhoto();
      if (paths && paths.length > 0) {
        setLogForm((prev) => ({ ...prev, image_path: paths[0] }));
      }
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firearm || !scheduleForm.task_name.trim()) return;

    const totalRounds =
      firearm.logs
        ?.filter((l) => l.type === 'Range')
        .reduce((sum, l) => sum + (Number(l.rounds_fired) || 0), 0) || 0;
    const currentSchedules = [...(firearm.maintenance_schedules || [])];
    const intervalDays =
      scheduleForm.enableDays && scheduleForm.interval_days
        ? Number(scheduleForm.interval_days)
        : undefined;

    if (editingScheduleId) {
      const idx = currentSchedules.findIndex((s) => s.id === editingScheduleId);
      if (idx !== -1) {
        currentSchedules[idx] = {
          ...currentSchedules[idx],
          task_name: scheduleForm.task_name,
          interval_rounds: Number(scheduleForm.interval_rounds) || 3000,
          interval_days: intervalDays,
          notes: scheduleForm.notes,
        };
      }
    } else {
      currentSchedules.push({
        id: `sched_${Date.now()}`,
        task_name: scheduleForm.task_name,
        interval_rounds: Number(scheduleForm.interval_rounds) || 3000,
        interval_days: intervalDays,
        last_performed_rounds: totalRounds,
        last_performed_date: new Date().toISOString().split('T')[0],
        notes: scheduleForm.notes,
      });
    }

    const updated = { ...firearm, maintenance_schedules: currentSchedules };
    await window.api.updateFirearm(firearm.id!, updated);
    setFirearm(updated);
    setIsScheduleModalOpen(false);
    setEditingScheduleId(null);
    setScheduleForm({
      task_name: '',
      interval_rounds: 3000,
      enableDays: false,
      interval_days: 90,
      notes: '',
    });
  };

  const handleDeleteSchedule = async (taskId: string) => {
    if (
      !firearm ||
      !window.confirm('Are you sure you want to delete this maintenance schedule task?')
    )
      return;
    const updatedSchedules = (firearm.maintenance_schedules || []).filter((s) => s.id !== taskId);
    const updated = { ...firearm, maintenance_schedules: updatedSchedules };
    await window.api.updateFirearm(firearm.id!, updated);
    setFirearm(updated);
  };

  const handleLoadPreset = async (
    profileOrCustomId: string,
    mode: 'replace' | 'append' = 'replace',
    isCustom: boolean = false
  ) => {
    if (!firearm) return;
    const totalRounds =
      firearm.logs
        ?.filter((l) => l.type === 'Range')
        .reduce((sum, l) => sum + (Number(l.rounds_fired) || 0), 0) || 0;
    const today = new Date().toISOString().split('T')[0];
    let newItems: MaintenanceScheduleItem[] = [];

    if (isCustom) {
      const custom = customPresets.find((p) => p.id === profileOrCustomId);
      if (custom) {
        newItems = custom.tasks.map((t, idx) => ({
          id: `sched_custom_${Date.now()}_${idx}`,
          task_name: t.task_name,
          interval_rounds: t.interval_rounds,
          interval_days: t.interval_days,
          last_performed_rounds: totalRounds,
          last_performed_date: today,
          notes: t.notes,
        }));
      }
    } else {
      const profile =
        MAINTENANCE_PROFILES[profileOrCustomId] || detectFirearmScheduleProfile(firearm);
      newItems = createScheduleItemsFromProfile(profile, totalRounds);
    }

    let updatedSchedules: MaintenanceScheduleItem[];
    if (
      mode === 'append' &&
      firearm.maintenance_schedules &&
      firearm.maintenance_schedules.length > 0
    ) {
      const existingNames = new Set(
        firearm.maintenance_schedules.map((s) => s.task_name.toLowerCase().trim())
      );
      const nonDuplicates = newItems.filter(
        (item) => !existingNames.has(item.task_name.toLowerCase().trim())
      );
      updatedSchedules = [...firearm.maintenance_schedules, ...nonDuplicates];
    } else {
      updatedSchedules = newItems;
    }

    const updated = { ...firearm, maintenance_schedules: updatedSchedules };
    await window.api.updateFirearm(firearm.id!, updated);
    setFirearm(updated);
    setIsPresetModalOpen(false);
  };

  const handleSaveAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firearm || !customPresetForm.name.trim()) return;
    const currentSchedules = firearm.maintenance_schedules || [];
    if (currentSchedules.length === 0) {
      alert('Add at least one scheduled maintenance task before saving as a template.');
      return;
    }
    const newPreset: CustomSchedulePreset = {
      id: `custom_${Date.now()}`,
      name: customPresetForm.name.trim(),
      description:
        customPresetForm.description.trim() || `${firearm.make} ${firearm.model} custom schedule`,
      category: firearm.action_type || 'Custom',
      tasks: currentSchedules.map((s) => ({
        task_name: s.task_name,
        interval_rounds: s.interval_rounds,
        interval_days: s.interval_days,
        notes: s.notes,
      })),
    };
    const updated = [...customPresets, newPreset];
    await window.api.saveCustomSchedulePresets(updated);
    setCustomPresets(updated);
    setIsSavePresetModalOpen(false);
    setCustomPresetForm({ name: '', description: '' });
  };

  const handleDeleteCustomPreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this custom maintenance template?')) return;
    const updated = customPresets.filter((p) => p.id !== presetId);
    await window.api.saveCustomSchedulePresets(updated);
    setCustomPresets(updated);
  };

  const openCompleteTaskModal = (task: any) => {
    setCompletingTask(task);
    setCompletionForm({
      action_performed: task.task_name,
      part_details: '',
      part_manufacturer: '',
      cost: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsTaskCompletionModalOpen(true);
  };

  const handleSaveTaskCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firearm || !completingTask) return;

    if (window.api && window.api.completeMaintenanceTask) {
      const partDetailStr = completionForm.part_details
        ? `${completionForm.part_manufacturer ? completionForm.part_manufacturer + ' ' : ''}${completionForm.part_details}`
        : completionForm.action_performed;
      await window.api.completeMaintenanceTask(firearm.id!, completingTask.id, {
        action_performed: completionForm.action_performed,
        part_details: partDetailStr,
        cost: completionForm.cost ? parseFloat(completionForm.cost) : 0,
        date: completionForm.date,
        notes: completionForm.notes,
      });
      await loadFirearm();
      setIsTaskCompletionModalOpen(false);
      setCompletingTask(null);
    }
  };

  const handleQuickClean = async () => {
    if (!firearm) return;
    const totalRounds =
      firearm.logs
        ?.filter((l) => l.type === 'Range')
        .reduce((sum, l) => sum + (Number(l.rounds_fired) || 0), 0) || 0;
    const newLog: MaintenanceLog = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'Cleaning',
      notes: 'Standard field strip, cleaning, and lubrication',
    };
    const updatedLogs = [...(firearm.logs || []), newLog];

    // Reset any cleaning schedule if defined
    const updatedSchedules = (firearm.maintenance_schedules || []).map((s) => {
      if (s.task_name.toLowerCase().includes('clean')) {
        return {
          ...s,
          last_performed_rounds: totalRounds,
          last_performed_date: new Date().toISOString().split('T')[0],
        };
      }
      return s;
    });

    const updated = { ...firearm, logs: updatedLogs, maintenance_schedules: updatedSchedules };
    await window.api.updateFirearm(firearm.id!, updated);
    setFirearm(updated);
    alert('Cleaning logged successfully! Dirty round count reset.');
  };

  if (!firearm) return <div className="loading">Loading...</div>;

  return (
    <>
      <div className="details-page">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              className="btn-icon"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              title="Back to Inventory Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}
              >
                <h1 style={{ margin: 0 }}>
                  {firearm.make} {firearm.model}
                </h1>
                {firearm.caliber && (
                  <span className="inventory-caliber-badge">{firearm.caliber}</span>
                )}
                {firearm.is_sold ? (
                  <span className="status-badge sold">Sold Ledger</span>
                ) : (
                  <span className="status-badge available">● In Safe</span>
                )}
                {firearm.is_nfa && (
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
              {showTotalSetupValue && (
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.25rem',
                    fontWeight: 500,
                  }}
                >
                  Total Setup Value:{' '}
                  <strong style={{ color: 'var(--success)' }}>
                    $
                    {(
                      (firearm.purchase_price || 0) +
                      attachedAccessories.reduce((sum, a) => {
                        const allocatedQty =
                          a.mounts?.find((m) => m.firearmId === Number(id))?.quantity || 1;
                        return sum + (a.value || 0) * allocatedQty;
                      }, 0)
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              )}
            </div>
          </div>
          <div
            className="header-actions"
            style={{
              gap: '0.5rem',
              background: 'rgba(11, 15, 25, 0.6)',
              padding: '0.35rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
            }}
          >
            {!firearm.is_sold && (
              <button
                className="btn-success"
                onClick={() => setIsSelling(true)}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.85rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#4ade80',
                }}
              >
                <DollarSign size={14} /> Mark Sold
              </button>
            )}
            <button
              className="btn-secondary"
              onClick={() => navigate(`/edit/${firearm.id}`)}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                background: 'transparent',
                border: 'none',
              }}
            >
              <Edit size={14} /> Edit
            </button>
            <button
              className="btn-secondary"
              onClick={async () => {
                if (!window.api || !firearm) return;
                try {
                  const QRCode = (await import('qrcode')).default;
                  const qrDataUrl = await QRCode.toDataURL(`armoryvault://firearm/${firearm.id}`, {
                    width: 300,
                    margin: 1,
                  });
                  await window.api.printQRLabel({
                    itemName: `${firearm.make} ${firearm.model}`,
                    itemDetails: `Caliber: ${firearm.caliber || 'N/A'}\nS/N: ${firearm.serial_number || 'N/A'}`,
                    qrDataUrl,
                  });
                } catch (err) {
                  console.error('Failed to print QR label', err);
                  alert('Failed to print QR label.');
                }
              }}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                background: 'transparent',
                border: 'none',
                color: '#60a5fa',
              }}
            >
              <Printer size={14} /> Print QR
            </button>
            <button
              className="btn-secondary"
              onClick={async () => {
                if (!window.api || !firearm) return;
                try {
                  const QRCode = (await import('qrcode')).default;
                  const qrDataUrl = await QRCode.toDataURL(`armoryvault://firearm/${firearm.id}`, {
                    width: 300,
                    margin: 1,
                  });
                  await window.api.saveQRImage({
                    itemName: `${firearm.make} ${firearm.model}`,
                    qrDataUrl,
                  });
                } catch (err) {
                  console.error('Failed to save QR label', err);
                  alert('Failed to save QR label.');
                }
              }}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                background: 'transparent',
                border: 'none',
                color: '#60a5fa',
              }}
            >
              <Upload size={14} /> Save QR
            </button>
            <button
              className="btn-secondary"
              onClick={() => setIsDossierOpen(true)}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
              title="Generate full printable gunsmith service dossier & logbook"
            >
              <FileText size={14} /> Service Dossier
            </button>
            <div
              style={{ width: '1px', background: 'var(--border-light)', margin: '0 0.2rem' }}
            ></div>
            <button
              className="btn-danger"
              onClick={handleDelete}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                background: 'transparent',
                border: 'none',
                color: '#f87171',
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        <div className="details-content">
          <div className="details-card main-info">
            {firearm.photos && firearm.photos.length > 0 ? (
              <div className="details-image-wrapper">
                <img
                  src={`local-file://${firearm.photos[0]}`}
                  alt="Firearm"
                  className="details-image"
                  onClick={() => {
                    setLightboxImages(firearm.photos!);
                    setLightboxIndex(0);
                  }}
                  title="Click to view full photo in lightbox"
                />
                {firearm.photos.length > 1 && (
                  <div className="details-image-count">1 / {firearm.photos.length} Photos</div>
                )}
              </div>
            ) : firearm.image_path ? (
              <div className="details-image-wrapper">
                <img
                  src={`local-file://${firearm.image_path}`}
                  alt="Firearm"
                  className="details-image"
                  onClick={() => {
                    setLightboxImages([firearm.image_path]);
                    setLightboxIndex(0);
                  }}
                  title="Click to view full photo in lightbox"
                />
              </div>
            ) : (
              <div className="no-image">No Photo Available</div>
            )}
            <div className="info-grid">
              <div className="info-item">
                <span>Make</span>
                <p>{firearm.make}</p>
              </div>
              <div className="info-item">
                <span>Model</span>
                <p>{firearm.model}</p>
              </div>
              <div className="info-item">
                <span>Caliber</span>
                <p>{firearm.caliber || '-'}</p>
              </div>
              <div className="info-item">
                <span>Type</span>
                <p>{firearm.firearm_type || '-'}</p>
              </div>
              <div className="info-item">
                <span>Serial</span>
                <p>{firearm.serial_number || '-'}</p>
              </div>
              <div className="info-item">
                <span>Action</span>
                <p>{firearm.action_type || '-'}</p>
              </div>
              <div className="info-item">
                <span>Finish</span>
                <p>{firearm.finish || '-'}</p>
              </div>
              <div className="info-item">
                <span>Barrel Length</span>
                <p>{firearm.barrel_length || '-'}</p>
              </div>
            </div>
          </div>

          <div className="details-card side-info">
            <h3>Purchase History</h3>
            <div className="info-item">
              <span>Date</span>
              <p>{firearm.purchase_date || '-'}</p>
            </div>
            <div className="info-item">
              <span>Price</span>
              <p>{firearm.purchase_price ? `$${firearm.purchase_price}` : '-'}</p>
            </div>
            <div className="info-item">
              <span>From</span>
              <p>{firearm.purchased_from || '-'}</p>
            </div>
            <div className="info-item">
              <span>Condition</span>
              <p>{firearm.condition || '-'}</p>
            </div>

            <div className="info-item full">
              <span>Notes / Accessories</span>
              <p className="notes-text">{firearm.notes || 'None'}</p>
            </div>
          </div>

          {firearm.is_nfa && (
            <div
              className="details-card side-info"
              style={{
                marginTop: '1.5rem',
                background: 'rgba(234, 179, 8, 0.05)',
                border: '1px solid rgba(234, 179, 8, 0.2)',
              }}
            >
              <h3
                style={{
                  color: '#eab308',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: '0 0 1rem 0',
                }}
              >
                NFA Information
              </h3>
              <div className="info-item">
                <span>Type</span>
                <p>{firearm.nfa_type || '-'}</p>
              </div>
              <div className="info-item">
                <span>Registration</span>
                <p>{firearm.registration_type || '-'}</p>
              </div>
              <div className="info-item">
                <span>Status</span>
                <p
                  style={{
                    fontWeight: 'bold',
                    color:
                      firearm.stamp_status === 'Approved' ? 'var(--success)' : 'var(--warning)',
                  }}
                >
                  {firearm.stamp_status || 'Unknown'}
                </p>
              </div>
              {firearm.stamp_submitted_date && (
                <div className="info-item">
                  <span>Submitted</span>
                  <p>{firearm.stamp_submitted_date}</p>
                </div>
              )}
              {firearm.stamp_approved_date && (
                <div className="info-item">
                  <span>Approved</span>
                  <p>{firearm.stamp_approved_date}</p>
                </div>
              )}
              {firearm.stamp_status === 'Pending' && firearm.stamp_submitted_date && (
                <div className="info-item">
                  <span>Wait Time</span>
                  <p>
                    {Math.floor(
                      (new Date().getTime() - new Date(firearm.stamp_submitted_date).getTime()) /
                        (1000 * 3600 * 24)
                    )}{' '}
                    days
                  </p>
                </div>
              )}
            </div>
          )}

          {firearm.is_sold && (
            <div className="details-card sold-info">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h3 style={{ margin: 0 }}>Sale Details</h3>
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    if (
                      confirm(
                        'Are you sure you want to unmark this firearm as sold? This will remove the sale details from this inspection card.'
                      )
                    ) {
                      const updated = {
                        ...firearm,
                        is_sold: false,
                        sold_to_name: undefined,
                        sold_date: undefined,
                        sold_price: undefined,
                        sale_notes: undefined,
                      };
                      await window.api.updateFirearm(firearm.id!, updated);
                      setFirearm(updated);
                    }
                  }}
                >
                  Unmark as Sold
                </button>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <span>Sold To</span>
                  <p>{firearm.sold_to_name}</p>
                </div>
                <div className="info-item">
                  <span>Sale Date</span>
                  <p>{firearm.sold_date}</p>
                </div>
                <div className="info-item">
                  <span>Sale Price</span>
                  <p>${firearm.sold_price}</p>
                </div>
              </div>
              <div className="info-item full">
                <span>Sale Notes</span>
                <p className="notes-text">{firearm.sale_notes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="details-card accessories-card" style={{ marginTop: '2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '1rem',
            }}
          >
            <div>
              <h3 style={{ margin: 0, border: 'none', padding: 0 }}>
                Attached Accessories & Optics
              </h3>
              <p
                style={{
                  margin: '0.2rem 0 0',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                }}
              >
                Mounted scopes, suppressors, lights, and weapon attachments with interactive detail
                cards.
              </p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => {
                setEditingAccessoryId(null);
                setAccessoryFormData({ mounts: [{ firearmId: Number(id), quantity: 1 }] });
                setIsAccessoryModalOpen(true);
              }}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              <PlusCircle size={16} /> Add Accessory
            </button>
          </div>
          {attachedAccessories.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {attachedAccessories.map((acc) => {
                const typeColor = getAccessoryTypeColor(acc.type);
                const allocatedQty =
                  acc.mounts?.find((m) => m.firearmId === Number(id))?.quantity || 1;
                const allocatedValue = (acc.value || 0) * allocatedQty;

                return (
                  <div
                    key={acc.id}
                    className="tactical-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'rgba(0,0,0,0.25)',
                      padding: '1.15rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      transition:
                        'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                    }}
                    onClick={() => setSelectedAccessoryForDetail(acc)}
                  >
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                      <div
                        style={{
                          width: '65px',
                          height: '65px',
                          borderRadius: '8px',
                          background: 'rgba(0,0,0,0.4)',
                          flexShrink: 0,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {acc.photo ? (
                          <img
                            src={
                              acc.photo.startsWith('local-file://')
                                ? acc.photo
                                : `local-file://${acc.photo}`
                            }
                            alt={acc.model}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Crosshair
                            size={24}
                            color="var(--text-secondary)"
                            style={{ opacity: 0.6 }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            marginBottom: '0.25rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            style={{
                              background: typeColor.bg,
                              color: typeColor.text,
                              border: `1px solid ${typeColor.border}`,
                              padding: '0.1rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {acc.type}
                          </span>
                          {acc.round_count !== undefined && acc.round_count > 0 && (
                            <span
                              style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                border: '1px solid rgba(56, 189, 248, 0.35)',
                                padding: '0.08rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <Target size={10} color="#38bdf8" />
                              <span>{acc.round_count.toLocaleString()} rds</span>
                            </span>
                          )}
                          {acc.is_nfa && (
                            <span
                              style={{
                                background:
                                  acc.stamp_status === 'Approved'
                                    ? 'rgba(34, 197, 94, 0.15)'
                                    : 'rgba(234, 179, 8, 0.2)',
                                color: acc.stamp_status === 'Approved' ? '#4ade80' : '#eab308',
                                border: `1px solid ${acc.stamp_status === 'Approved' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(234, 179, 8, 0.5)'}`,
                                padding: '0.08rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                              }}
                            >
                              NFA
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {allocatedQty > 1 ? `${allocatedQty}x ` : ''}
                          {acc.manufacturer} {acc.model}
                        </div>

                        <div
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'var(--success)',
                            marginTop: '0.15rem',
                          }}
                        >
                          $
                          {allocatedValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          {allocatedQty > 1 && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-secondary)',
                                fontWeight: 400,
                              }}
                            >
                              {' '}
                              (${(acc.value || 0).toLocaleString()} ea)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Spec Chips */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.35rem',
                        flexWrap: 'wrap',
                        marginBottom: '0.75rem',
                      }}
                    >
                      {acc.magnification && (
                        <span
                          style={{
                            background: 'rgba(56, 189, 248, 0.1)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <ScopeIcon size={11} color="#38bdf8" />
                          <span>{acc.magnification}</span>
                        </span>
                      )}
                      {acc.lumens && (
                        <span
                          style={{
                            background: 'rgba(251, 191, 36, 0.1)',
                            color: '#fbbf24',
                            border: '1px solid rgba(251, 191, 36, 0.25)',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Flashlight size={11} color="#fbbf24" />
                          <span>{acc.lumens.toLocaleString()} lm</span>
                        </span>
                      )}
                      {acc.ratedCalibers && (
                        <span
                          style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Shield size={11} color="#f59e0b" />
                          <span>{acc.ratedCalibers}</span>
                        </span>
                      )}
                      {acc.capacity && (
                        <span
                          style={{
                            background: 'rgba(192, 132, 252, 0.1)',
                            color: '#c084fc',
                            border: '1px solid rgba(192, 132, 252, 0.25)',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                          }}
                        >
                          🟣 {acc.caliber ? `${acc.caliber} • ` : ''}
                          {acc.capacity}rd
                        </span>
                      )}
                      {acc.supportedModels && (
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-secondary)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Fits: {acc.supportedModels}
                        </span>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div
                      style={{
                        marginTop: 'auto',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAccessoryForDetail(acc);
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.3rem 0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <Eye size={13} /> View Specs
                      </button>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAccessoryFormData(acc);
                            setEditingAccessoryId(acc.id || null);
                            setIsAccessoryModalOpen(true);
                          }}
                          style={{ padding: '0.35rem', borderRadius: '4px' }}
                          title="Edit Accessory Configuration"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                border: '1px dashed var(--border-light)',
              }}
            >
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                No accessories or optics mounted to this firearm.
              </p>
            </div>
          )}
        </div>

        {/* Proactive Maintenance Schedules Card */}
        <div className="details-card" style={{ marginTop: '2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  border: 'none',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Wrench size={20} style={{ color: 'var(--accent)' }} /> Proactive Maintenance &
                Service Schedules
              </h3>
              <p
                style={{
                  margin: '0.25rem 0 0',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                }}
              >
                Track part replacements and service intervals based on actual rounds fired and
                elapsed calendar days.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                onClick={handleQuickClean}
                title="Log a quick field strip & cleaning"
              >
                <Sparkles size={16} style={{ color: '#38bdf8' }} /> Quick Clean
              </button>
              {firearm.maintenance_schedules && firearm.maintenance_schedules.length > 0 && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setCustomPresetForm({
                      name: `${firearm.make} ${firearm.model} Schedule`,
                      description: `${firearm.action_type || ''} custom maintenance schedule`,
                    });
                    setIsSavePresetModalOpen(true);
                  }}
                  title="Save this firearm's schedules as a reusable template"
                >
                  <Bookmark size={16} style={{ color: '#fbbf24' }} /> Save as Template
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelectedPresetId(detectFirearmScheduleProfile(firearm).id);
                  setIsPresetModalOpen(true);
                }}
                title="Browse standard action profiles and custom templates"
              >
                <Sliders size={16} style={{ color: '#c084fc' }} /> Load Preset...
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingScheduleId(null);
                  setScheduleForm({
                    task_name: '',
                    interval_rounds: 3000,
                    enableDays: false,
                    interval_days: 90,
                    notes: '',
                  });
                  setIsScheduleModalOpen(true);
                }}
              >
                <PlusCircle size={16} /> Add Scheduled Task
              </button>
            </div>
          </div>

          {!firearm.maintenance_schedules || firearm.maintenance_schedules.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1.5rem',
                background: 'rgba(0,0,0,0.15)',
                borderRadius: '12px',
                border: '1px dashed var(--border-light)',
              }}
            >
              <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                <Wrench
                  size={36}
                  style={{ color: 'var(--accent)', opacity: 0.8, marginBottom: '0.75rem' }}
                />
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
                  No Maintenance Schedules Configured
                </h4>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    marginBottom: '1.25rem',
                    lineHeight: 1.5,
                  }}
                >
                  Proactive schedules track cleaning, wear part replacements, and springs
                  automatically based on rounds fired or calendar days elapsed.
                </p>

                {/* Detected Profile Recommendation Card */}
                {(() => {
                  const detected = detectFirearmScheduleProfile(firearm);
                  return (
                    <div
                      style={{
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: '10px',
                        padding: '1rem 1.25rem',
                        marginBottom: '1.25rem',
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem',
                          flexWrap: 'wrap',
                          gap: '0.4rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              background: '#38bdf8',
                              color: '#0f172a',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Recommended Preset
                          </span>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {detected.name}
                          </strong>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Tailored for:{' '}
                          {firearm.action_type
                            ? `Action: "${firearm.action_type}"`
                            : `${firearm.make} ${firearm.model} (${firearm.caliber})`}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          margin: '0 0 0.75rem',
                        }}
                      >
                        {detected.description}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {detected.tasks.map((t, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {t.task_name}{' '}
                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                              ({t.interval_rounds.toLocaleString()} rds
                              {t.interval_days ? ` / ${t.interval_days}d` : ''})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    className="btn-primary"
                    onClick={() =>
                      handleLoadPreset(detectFirearmScheduleProfile(firearm).id, 'replace')
                    }
                  >
                    <Sparkles size={16} /> Load Standard Schedule (
                    {detectFirearmScheduleProfile(firearm).name})
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedPresetId(detectFirearmScheduleProfile(firearm).id);
                      setIsPresetModalOpen(true);
                    }}
                  >
                    <Sliders size={16} /> Browse Presets & Templates (
                    {Object.keys(MAINTENANCE_PROFILES).length + customPresets.length})...
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1rem',
              }}
            >
              {firearm.maintenance_schedules.map((schedule) => {
                const totalLifetimeRounds =
                  firearm.logs
                    ?.filter((l) => l.type === 'Range')
                    .reduce((sum, l) => sum + (Number(l.rounds_fired) || 0), 0) || 0;
                const roundsSinceLast = Math.max(
                  0,
                  totalLifetimeRounds - (schedule.last_performed_rounds || 0)
                );
                const pctRounds = Math.min(
                  100,
                  Math.round((roundsSinceLast / (schedule.interval_rounds || 1)) * 100)
                );

                let daysSinceLast: number | null = null;
                let pctDays: number | null = null;
                if (schedule.interval_days && schedule.last_performed_date) {
                  const lastDate = new Date(schedule.last_performed_date).getTime();
                  const diffMs = Math.max(0, Date.now() - lastDate);
                  daysSinceLast = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  pctDays = Math.min(
                    100,
                    Math.round((daysSinceLast / schedule.interval_days) * 100)
                  );
                }

                const isDueByRounds = roundsSinceLast >= schedule.interval_rounds;
                const isDueByDays =
                  schedule.interval_days &&
                  daysSinceLast !== null &&
                  daysSinceLast >= schedule.interval_days;
                const isDue = isDueByRounds || isDueByDays;

                const maxPct = Math.max(pctRounds, pctDays || 0);
                let barColor = 'var(--accent)';
                if (maxPct >= 100) barColor = '#ef4444';
                else if (maxPct >= 80) barColor = '#f59e0b';

                return (
                  <div
                    key={schedule.id}
                    style={{
                      background: isDue ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0,0,0,0.2)',
                      border: isDue
                        ? '1px solid rgba(239, 68, 68, 0.4)'
                        : '1px solid var(--border-light)',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '1.05rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {schedule.task_name}
                          {isDue && (
                            <span
                              style={{
                                background: '#ef4444',
                                color: '#fff',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              SERVICE DUE
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.2rem',
                          }}
                        >
                          Every {schedule.interval_rounds.toLocaleString()} rds
                          {schedule.interval_days ? ` or ${schedule.interval_days} days` : ''}{' '}
                          &bull; Last: {schedule.last_performed_rounds.toLocaleString()} rds (
                          {schedule.last_performed_date || 'N/A'})
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          className="btn-icon"
                          onClick={() => {
                            setEditingScheduleId(schedule.id);
                            setScheduleForm({
                              task_name: schedule.task_name,
                              interval_rounds: schedule.interval_rounds,
                              enableDays: !!schedule.interval_days,
                              interval_days: schedule.interval_days || 90,
                              notes: schedule.notes || '',
                            });
                            setIsScheduleModalOpen(true);
                          }}
                          style={{ padding: '0.3rem' }}
                          title="Edit Task"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          style={{ padding: '0.3rem', color: 'var(--danger)' }}
                          title="Delete Task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Indicators */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            marginBottom: '0.2rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <span>Round Trigger</span>
                          <span
                            style={{
                              fontWeight: 600,
                              color: pctRounds >= 100 ? '#ef4444' : 'var(--text-primary)',
                            }}
                          >
                            {roundsSinceLast.toLocaleString()} /{' '}
                            {schedule.interval_rounds.toLocaleString()} rds ({pctRounds}%)
                          </span>
                        </div>
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.08)',
                            borderRadius: '6px',
                            height: '6px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pctRounds}%`,
                              background: pctRounds >= 100 ? '#ef4444' : 'var(--accent)',
                              height: '100%',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>

                      {schedule.interval_days && daysSinceLast !== null && (
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              marginBottom: '0.2rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <span>Time Trigger</span>
                            <span
                              style={{
                                fontWeight: 600,
                                color: (pctDays || 0) >= 100 ? '#ef4444' : 'var(--text-primary)',
                              }}
                            >
                              {daysSinceLast} / {schedule.interval_days} days ({pctDays}%)
                            </span>
                          </div>
                          <div
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              height: '6px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${pctDays}%`,
                                background: (pctDays || 0) >= 100 ? '#ef4444' : '#38bdf8',
                                height: '100%',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '0.5rem',
                        display: 'flex',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        className="btn-success"
                        onClick={() => openCompleteTaskModal(schedule)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          width: '100%',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckCircle size={15} /> Complete Task & Record Part
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="details-card logs-card" style={{ marginTop: '2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '1rem',
            }}
          >
            <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Maintenance & Range Logs</h3>
            <button className="btn-secondary" onClick={() => setIsLogging(true)}>
              <ClipboardList size={18} /> Add Log Entry
            </button>
          </div>
          <div style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div
              style={{
                color: 'var(--text-primary)',
                fontSize: '1.1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '1rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <strong>Total Lifetime Rounds Fired:</strong>{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 700, marginLeft: '0.5rem' }}>
                {firearm.logs?.reduce((acc, log) => acc + (Number(log.rounds_fired) || 0), 0) || 0}
              </span>
            </div>
            <div
              style={{
                color: 'var(--text-primary)',
                fontSize: '1.1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '1rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <strong>Total Money Spent:</strong>{' '}
              <span style={{ color: 'var(--danger)', fontWeight: 700, marginLeft: '0.5rem' }}>
                $
                {firearm.logs?.reduce((acc, log) => acc + (Number(log.cost) || 0), 0).toFixed(2) ||
                  '0.00'}
              </span>
            </div>
            {(() => {
              const rangeLogs = firearm.logs?.filter((l) => l.type === 'Range') || [];
              const totalRounds = rangeLogs.reduce(
                (sum, l) => sum + (Number(l.rounds_fired) || 0),
                0
              );
              const totalMalf = rangeLogs.reduce(
                (sum, l) => sum + (Number(l.malfunctions) || 0),
                0
              );
              if (totalRounds > 0) {
                const rel = ((totalRounds - totalMalf) / totalRounds) * 100;
                return (
                  <div
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: '1.1rem',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '1rem 1.5rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    <strong>Reliability:</strong>{' '}
                    <span
                      style={{ color: 'var(--success)', fontWeight: 700, marginLeft: '0.5rem' }}
                    >
                      {rel.toFixed(2)}%
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div
            className="logs-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {firearm.logs
              ?.slice()
              .reverse()
              .map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-light)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      paddingBottom: '0.5rem',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          color: 'var(--accent)',
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          display: 'block',
                        }}
                      >
                        {log.type}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {log.date}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleEditLog(log)}
                        style={{ padding: '0.2rem' }}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDeleteLog(log.id)}
                        style={{ padding: '0.2rem', color: 'var(--danger)' }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {log.type === 'Range' && (
                    <div
                      style={{
                        fontSize: '1rem',
                        marginBottom: '0.8rem',
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <span>
                          Rounds Fired:{' '}
                          <span style={{ color: 'var(--success)' }}>{log.rounds_fired}</span>
                        </span>
                        {log.malfunctions !== undefined && log.malfunctions > 0 && (
                          <span>
                            Malfunctions:{' '}
                            <span style={{ color: 'var(--danger)' }}>{log.malfunctions}</span>
                          </span>
                        )}
                      </div>
                      {log.ammo_used && (
                        <div
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.2rem',
                          }}
                        >
                          Ammo: {log.ammo_used}
                        </div>
                      )}
                    </div>
                  )}
                  {log.type === 'Repair' && log.repaired_part && (
                    <div
                      style={{
                        fontSize: '1rem',
                        marginBottom: '0.8rem',
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      Part Repaired:{' '}
                      <span style={{ color: 'var(--accent)' }}>{log.repaired_part}</span>
                    </div>
                  )}
                  {log.installed_part_details && (
                    <div
                      style={{
                        fontSize: '0.95rem',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Installed:{' '}
                      <span style={{ color: 'var(--success)' }}>
                        {log.part_manufacturer ? `${log.part_manufacturer} ` : ''}
                        {log.installed_part_details}
                      </span>
                    </div>
                  )}
                  {(log.type === 'Modification' || log.type === 'Repair' || log.type === 'Other') &&
                    log.cost !== undefined &&
                    log.cost > 0 && (
                      <div
                        style={{
                          fontSize: '1rem',
                          marginBottom: '0.8rem',
                          color: 'var(--text-primary)',
                          fontWeight: 500,
                        }}
                      >
                        Cost:{' '}
                        <span style={{ color: 'var(--warning)' }}>
                          $
                          {log.cost.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                  <div
                    style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}
                  >
                    {log.notes}
                  </div>
                  {log.image_path && (
                    <div style={{ marginTop: '1rem' }}>
                      <img
                        src={`local-file://${log.image_path}`}
                        alt="Log Attachment"
                        style={{
                          width: '100%',
                          borderRadius: '8px',
                          border: '1px solid var(--border-light)',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setLightboxImages([log.image_path!]);
                          setLightboxIndex(0);
                        }}
                        title="Click to view"
                      />
                    </div>
                  )}
                </div>
              ))}
            {(!firearm.logs || firearm.logs.length === 0) && (
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  textAlign: 'center',
                  padding: '3rem',
                  gridColumn: '1 / -1',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-light)',
                }}
              >
                No maintenance or range activity recorded yet.
              </div>
            )}
          </div>
        </div>

        <div className="details-card documents-card" style={{ marginTop: '2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '1rem',
            }}
          >
            <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Documents & Receipts</h3>
            <button className="btn-secondary" onClick={handleDocumentSelect}>
              <Upload size={18} /> Attach File
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {firearm.documents?.map((doc, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <FileText size={24} style={{ color: 'var(--accent)' }} />
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{doc.name}</h4>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                        onClick={() => window.api?.openExternalFile(doc.path)}
                      >
                        Open Externally
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  className="btn-icon"
                  onClick={async () => {
                    if (confirm('Are you sure you want to remove this document?')) {
                      const updatedDocs = [...(firearm.documents || [])];
                      updatedDocs.splice(idx, 1);
                      const updated = { ...firearm, documents: updatedDocs };
                      await window.api.updateFirearm(firearm.id!, updated);
                      setFirearm(updated);
                    }
                  }}
                  style={{
                    color: 'var(--danger)',
                    fontSize: '0.9rem',
                    width: 'auto',
                    padding: '0.5rem',
                  }}
                  title="Remove Document"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {(!firearm.documents || firearm.documents.length === 0) && (
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  textAlign: 'center',
                  padding: '2rem',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-light)',
                }}
              >
                No documents attached. You can attach PDFs of NFA Tax Stamps, Bills of Sale, or
                Appraisal Certificates here.
              </div>
            )}
          </div>
        </div>
      </div>{' '}
      {isSelling &&
        createPortal(
          <div className="modal-overlay" onClick={() => setIsSelling(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Mark Firearm as Sold</h2>
              <form onSubmit={handleSell}>
                <div className="form-group">
                  <label>Your Name (Seller)</label>
                  <input
                    required
                    type="text"
                    className="form-input"
                    value={sellForm.seller_name}
                    onChange={(e) => setSellForm({ ...sellForm, seller_name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="form-group">
                  <label>Buyer Name</label>
                  <input
                    required
                    type="text"
                    className="form-input"
                    value={sellForm.sold_to_name}
                    onChange={(e) => setSellForm({ ...sellForm, sold_to_name: e.target.value })}
                    placeholder="e.g. Jane Smith"
                  />
                </div>
                <div className="form-group">
                  <label>Sale Date</label>
                  <input
                    required
                    type="date"
                    value={sellForm.sold_date}
                    onChange={(e) => setSellForm({ ...sellForm, sold_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Sale Price ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={sellForm.sold_price}
                    onChange={(e) => setSellForm({ ...sellForm, sold_price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Sale Notes (Optional Secondary Info)</label>
                  <textarea
                    rows={3}
                    value={sellForm.sale_notes}
                    onChange={(e) => setSellForm({ ...sellForm, sale_notes: e.target.value })}
                  ></textarea>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsSelling(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Confirm Sale
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      {isLogging &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => {
              setIsLogging(false);
              setEditingLogId(null);
            }}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Add Log Entry</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  let updatedLogs = [];
                  if (editingLogId) {
                    updatedLogs =
                      firearm.logs?.map((l) =>
                        l.id === editingLogId
                          ? ({ ...logForm, id: editingLogId } as MaintenanceLog)
                          : l
                      ) || [];
                  } else {
                    const newLog = { ...logForm, id: Date.now() } as MaintenanceLog;
                    updatedLogs = [...(firearm.logs || []), newLog];
                  }
                  const updated = { ...firearm, logs: updatedLogs };
                  await window.api.updateFirearm(firearm.id!, updated);

                  if (
                    !editingLogId &&
                    logForm.type === 'Range' &&
                    logForm.rounds_fired &&
                    logForm.rounds_fired > 0 &&
                    logForm.ammo_used
                  ) {
                    const allAmmo = await window.api.getAmmo();
                    const matched = allAmmo.find((a) => getAmmoString(a) === logForm.ammo_used);

                    if (matched) {
                      if (matched.count >= logForm.rounds_fired) {
                        matched.count -= logForm.rounds_fired;
                        await window.api.updateAmmo(matched.id!, matched);
                        alert(
                          `Smart Ammo Tracker: Deducted ${logForm.rounds_fired} rounds from your inventory.`
                        );
                      } else {
                        alert(
                          `Smart Ammo Tracker: Not enough inventory to deduct ${logForm.rounds_fired} rounds! Log saved without deducting.`
                        );
                      }
                    }
                  }

                  setFirearm(updated);
                  setIsLogging(false);
                  setEditingLogId(null);
                  setLogForm({
                    date: new Date().toISOString().split('T')[0],
                    type: 'Range',
                    notes: '',
                    rounds_fired: '' as any,
                    ammo_used: '',
                    malfunctions: '' as any,
                    repaired_part: '',
                    part_manufacturer: '',
                    installed_part_details: '',
                    cost: '' as any,
                    image_path: '',
                  });
                }}
              >
                <div className="form-group">
                  <label>Date</label>
                  <input
                    required
                    type="date"
                    value={logForm.date}
                    onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <AutocompleteInput
                    mode="select"
                    name="logType"
                    value={logForm.type || 'Range'}
                    onChange={(e) => setLogForm({ ...logForm, type: e.target.value as any })}
                    options={['Range', 'Cleaning', 'Modification', 'Repair', 'Other']}
                  />
                </div>
                {logForm.type === 'Range' && (
                  <>
                    <div className="form-group">
                      <label>Rounds Fired</label>
                      <input
                        type="number"
                        min="0"
                        value={logForm.rounds_fired === undefined ? '' : logForm.rounds_fired}
                        onChange={(e) =>
                          setLogForm({
                            ...logForm,
                            rounds_fired:
                              e.target.value === '' ? ('' as any) : parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Malfunctions (FTF/FTE)</label>
                      <input
                        type="number"
                        min="0"
                        value={logForm.malfunctions === undefined ? '' : logForm.malfunctions}
                        onChange={(e) =>
                          setLogForm({
                            ...logForm,
                            malfunctions:
                              e.target.value === '' ? ('' as any) : parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Ammo Used</label>
                      <AutocompleteInput
                        name="ammo_used"
                        value={logForm.ammo_used || ''}
                        onChange={(e) => setLogForm({ ...logForm, ammo_used: e.target.value })}
                        options={inventoryAmmo
                          .filter((ammo) => {
                            if (!firearm?.caliber || !ammo.caliber) return true;
                            const gunCal = firearm.caliber.toLowerCase().replace(/[^a-z0-9]/g, '');
                            const ammoCal = ammo.caliber.toLowerCase().replace(/[^a-z0-9]/g, '');
                            return gunCal.includes(ammoCal) || ammoCal.includes(gunCal);
                          })
                          .map((ammo) => getAmmoString(ammo))}
                        placeholder="Select from inventory or type manually"
                      />
                    </div>
                  </>
                )}
                {(logForm.type === 'Repair' || logForm.type === 'Modification') && (
                  <>
                    {logForm.type === 'Repair' && (
                      <div className="form-group">
                        <label>Part Changed / Repaired</label>
                        <AutocompleteInput
                          name="repaired_part"
                          value={logForm.repaired_part || ''}
                          onChange={(e) =>
                            setLogForm({ ...logForm, repaired_part: e.target.value })
                          }
                          options={[
                            'Springs',
                            'Firing Pin / Striker',
                            'Extractor',
                            'Ejector',
                            'Barrel',
                            'Trigger Group',
                            'Sights',
                            'Gas System',
                            'Magazine',
                            'Stock / Furniture',
                            'Bolt / Carrier',
                            'Other',
                          ]}
                          placeholder="Select common part or type custom"
                        />
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Part Manufacturer</label>
                        <input
                          type="text"
                          className="form-input"
                          value={logForm.part_manufacturer || ''}
                          onChange={(e) =>
                            setLogForm({ ...logForm, part_manufacturer: e.target.value })
                          }
                          placeholder="e.g. Apex Tactical"
                        />
                      </div>
                      <div className="form-group">
                        <label>Installed Part Details</label>
                        <input
                          type="text"
                          className="form-input"
                          value={logForm.installed_part_details || ''}
                          onChange={(e) =>
                            setLogForm({ ...logForm, installed_part_details: e.target.value })
                          }
                          placeholder="e.g. Heavy Duty Extractor"
                        />
                      </div>
                    </div>
                  </>
                )}
                {(logForm.type === 'Modification' ||
                  logForm.type === 'Repair' ||
                  logForm.type === 'Other') && (
                  <div className="form-group">
                    <label>Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={logForm.cost === undefined ? '' : logForm.cost}
                      onChange={(e) =>
                        setLogForm({
                          ...logForm,
                          cost: e.target.value === '' ? ('' as any) : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    rows={3}
                    value={logForm.notes}
                    onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Photo Attachment</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button type="button" className="btn-secondary" onClick={handleLogImage}>
                      Select Photo
                    </button>
                    {logForm.image_path && (
                      <span style={{ color: 'var(--success)', fontSize: '0.9rem' }}>
                        Photo selected
                      </span>
                    )}
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setIsLogging(false);
                      setEditingLogId(null);
                      setLogForm({
                        date: new Date().toISOString().split('T')[0],
                        type: 'Range',
                        notes: '',
                        rounds_fired: '' as any,
                        ammo_used: '',
                        malfunctions: '' as any,
                        repaired_part: '',
                        part_manufacturer: '',
                        installed_part_details: '',
                        cost: '' as any,
                        image_path: '',
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingLogId ? 'Save Changes' : 'Save Log'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      {/* Add / Edit Maintenance Schedule Modal */}
      {isScheduleModalOpen &&
        createPortal(
          <div className="modal-overlay" onClick={() => setIsScheduleModalOpen(false)}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '500px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wrench size={20} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ margin: 0 }}>
                    {editingScheduleId ? 'Edit Maintenance Schedule' : 'New Maintenance Schedule'}
                  </h3>
                </div>
                <button className="btn-icon" onClick={() => setIsScheduleModalOpen(false)}>
                  ×
                </button>
              </div>
              <form
                onSubmit={handleSaveSchedule}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.4rem',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Task Name / Action *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Replace Extractor & Spring, Detail Clean, Recoil Spring"
                    value={scheduleForm.task_name}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, task_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.4rem',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Service Interval (Rounds) *
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    className="form-input"
                    placeholder="e.g. 3000"
                    value={scheduleForm.interval_rounds}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        interval_rounds: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.3rem',
                    }}
                  >
                    Alerts will trigger every {scheduleForm.interval_rounds || 0} rounds fired
                    through this firearm.
                  </div>
                </div>

                {/* Time Interval Option */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={scheduleForm.enableDays || false}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, enableDays: e.target.checked })
                      }
                    />
                    Also trigger on elapsed time (Days)
                  </label>
                  {scheduleForm.enableDays && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '0.4rem',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                      >
                        Service Interval (Days) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="form-input"
                        placeholder="e.g. 90, 180, 365"
                        value={scheduleForm.interval_days || ''}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            interval_days: parseInt(e.target.value) || 0,
                          })
                        }
                        required={scheduleForm.enableDays}
                      />
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.3rem',
                        }}
                      >
                        Task will alert when <strong>either</strong>{' '}
                        {scheduleForm.interval_rounds || 0} rounds OR{' '}
                        {scheduleForm.interval_days || 0} days have elapsed.
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.4rem',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Notes / Part Recommendations (Optional)
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="e.g. Apex Tactical HD extractor or OEM factory replacement"
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  />
                </div>

                <div
                  className="modal-actions"
                  style={{
                    marginTop: '0.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsScheduleModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingScheduleId ? 'Update Schedule' : 'Save Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      {/* Task Completion & Part Replacement Modal */}
      {isTaskCompletionModalOpen &&
        completingTask &&
        createPortal(
          <div className="modal-overlay" onClick={() => setIsTaskCompletionModalOpen(false)}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '580px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={22} style={{ color: 'var(--success)' }} />
                  <div>
                    <h3 style={{ margin: 0 }}>Complete Maintenance: {completingTask.task_name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Log replacement parts, cost, and reset interval counter.
                    </div>
                  </div>
                </div>
                <button className="btn-icon" onClick={() => setIsTaskCompletionModalOpen(false)}>
                  ×
                </button>
              </div>
              <form
                onSubmit={handleSaveTaskCompletion}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.4rem',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Action Performed
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={completionForm.action_performed}
                    onChange={(e) =>
                      setCompletionForm({ ...completionForm, action_performed: e.target.value })
                    }
                    placeholder="e.g. Replaced Extractor & Spring"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.4rem',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      Part Manufacturer / Brand
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Apex Tactical / OEM Factory"
                      value={completionForm.part_manufacturer}
                      onChange={(e) =>
                        setCompletionForm({ ...completionForm, part_manufacturer: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.4rem',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      Specific Part Model / Details
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Heavy Duty Extractor (Non-LCI)"
                      value={completionForm.part_details}
                      onChange={(e) =>
                        setCompletionForm({ ...completionForm, part_details: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.4rem',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      Part Cost ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      value={completionForm.cost}
                      onChange={(e) =>
                        setCompletionForm({ ...completionForm, cost: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.4rem',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      Date Completed
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={completionForm.date}
                      onChange={(e) =>
                        setCompletionForm({ ...completionForm, date: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.4rem',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Service Notes / Condition Observed
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="e.g. Factory extractor claw was chipped; installed Apex extractor with heavy plunger spring. Function tested 100%."
                    value={completionForm.notes}
                    onChange={(e) =>
                      setCompletionForm({ ...completionForm, notes: e.target.value })
                    }
                  />
                </div>

                <div
                  className="modal-actions"
                  style={{
                    marginTop: '0.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsTaskCompletionModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-success"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <CheckCircle size={16} /> Save & Complete Task
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      {/* Maintenance Preset Picker Modal */}
      {isPresetModalOpen &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setIsPresetModalOpen(false)}
            style={{ zIndex: 100100 }}
          >
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '920px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={22} style={{ color: 'var(--accent)' }} />
                  <div>
                    <h3 style={{ margin: 0 }}>Maintenance Schedule Presets</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Choose a maintenance profile or load one of your saved custom templates.
                    </div>
                  </div>
                </div>
                <button className="btn-icon" onClick={() => setIsPresetModalOpen(false)}>
                  ×
                </button>
              </div>

              {/* Category Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '0.5rem',
                }}
              >
                <button
                  type="button"
                  className={presetTab === 'profiles' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setPresetTab('profiles')}
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                >
                  Standard Action Profiles ({Object.keys(MAINTENANCE_PROFILES).length})
                </button>
                <button
                  type="button"
                  className={presetTab === 'custom' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setPresetTab('custom')}
                  style={{
                    padding: '0.4rem 0.9rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Bookmark size={14} style={{ color: '#fbbf24' }} /> My Custom Templates (
                  {customPresets.length})
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.3fr',
                  gap: '1.5rem',
                  overflowY: 'auto',
                  paddingRight: '0.5rem',
                  flex: 1,
                  minHeight: '340px',
                }}
              >
                {/* Profile Selector List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.2rem',
                    }}
                  >
                    {presetTab === 'profiles'
                      ? 'Available Action Profiles'
                      : 'Your Custom Templates'}
                  </div>

                  {presetTab === 'profiles' ? (
                    Object.values(MAINTENANCE_PROFILES).map((profile) => {
                      const isDetected = profile.id === detectFirearmScheduleProfile(firearm).id;
                      const isSelected = profile.id === selectedPresetId;

                      return (
                        <div
                          key={profile.id}
                          onClick={() => setSelectedPresetId(profile.id)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: isSelected
                              ? 'rgba(56, 189, 248, 0.15)'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected
                              ? '1px solid var(--accent)'
                              : '1px solid var(--border-light)',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <strong
                              style={{
                                fontSize: '0.95rem',
                                color: isSelected ? '#fff' : 'var(--text-primary)',
                              }}
                            >
                              {profile.name}
                            </strong>
                            {isDetected && (
                              <span
                                style={{
                                  background: '#38bdf8',
                                  color: '#0f172a',
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Recommended
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.3,
                            }}
                          >
                            {profile.description}
                          </div>
                        </div>
                      );
                    })
                  ) : customPresets.length === 0 ? (
                    <div
                      style={{
                        padding: '2rem 1rem',
                        textAlign: 'center',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        border: '1px dashed var(--border-light)',
                      }}
                    >
                      <Bookmark
                        size={24}
                        style={{ color: '#fbbf24', opacity: 0.7, marginBottom: '0.5rem' }}
                      />
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        No custom templates saved yet.
                      </p>
                      <p
                        style={{
                          margin: '0.3rem 0 0',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Click "Save as Template" on any configured firearm to create one.
                      </p>
                    </div>
                  ) : (
                    customPresets.map((preset) => {
                      const isSelected = preset.id === selectedPresetId;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => setSelectedPresetId(preset.id)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: isSelected
                              ? 'rgba(251, 191, 36, 0.15)'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected
                              ? '1px solid #fbbf24'
                              : '1px solid var(--border-light)',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <strong
                              style={{
                                fontSize: '0.95rem',
                                color: isSelected ? '#fbbf24' : 'var(--text-primary)',
                              }}
                            >
                              {preset.name}
                            </strong>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={(e) => handleDeleteCustomPreset(preset.id, e)}
                              style={{ padding: '0.2rem', color: 'var(--danger)' }}
                              title="Delete template"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.3,
                            }}
                          >
                            {preset.description || `${preset.tasks.length} tasks`}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Profile Details & Task Preview */}
                {(() => {
                  let name = '';
                  let desc = '';
                  let tasks: any[] = [];
                  let isDetected = false;

                  if (presetTab === 'custom') {
                    const custom =
                      customPresets.find((p) => p.id === selectedPresetId) || customPresets[0];
                    if (custom) {
                      name = custom.name;
                      desc = custom.description || 'Custom user maintenance template';
                      tasks = custom.tasks;
                    }
                  } else {
                    const profile =
                      MAINTENANCE_PROFILES[selectedPresetId] || MAINTENANCE_PROFILES.semi_pistol;
                    name = profile.name;
                    desc = profile.description;
                    tasks = profile.tasks;
                    isDetected = profile.id === detectFirearmScheduleProfile(firearm).id;
                  }

                  if (!name && tasks.length === 0) {
                    return (
                      <div
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          padding: '2rem',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                        }}
                      >
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                          Select a profile or template to preview tasks.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        padding: '1.25rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          marginBottom: '1rem',
                          borderBottom: '1px solid var(--border-light)',
                          paddingBottom: '0.75rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <h4
                            style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}
                          >
                            {name}
                          </h4>
                          {isDetected && (
                            <span
                              style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                              }}
                            >
                              Matches This Firearm
                            </span>
                          )}
                        </div>
                        <p
                          style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}
                        >
                          {desc}
                        </p>
                      </div>

                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Included Schedule Tasks ({tasks.length})
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                          overflowY: 'auto',
                          flex: 1,
                        }}
                      >
                        {tasks.map((task, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              padding: '0.65rem 0.85rem',
                              borderRadius: '6px',
                              border: '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.2rem',
                              }}
                            >
                              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                {task.task_name}
                              </strong>
                              <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <span
                                  style={{
                                    background: 'rgba(56, 189, 248, 0.15)',
                                    color: '#38bdf8',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  Every {task.interval_rounds.toLocaleString()} rds
                                </span>
                                {task.interval_days && (
                                  <span
                                    style={{
                                      background: 'rgba(251, 191, 36, 0.15)',
                                      color: '#fbbf24',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {task.interval_days}d
                                  </span>
                                )}
                              </div>
                            </div>
                            {task.notes && (
                              <div
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary)',
                                  lineHeight: 1.3,
                                }}
                              >
                                {task.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div
                className="modal-actions"
                style={{
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsPresetModalOpen(false)}
                >
                  Cancel
                </button>
                {firearm.maintenance_schedules && firearm.maintenance_schedules.length > 0 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      handleLoadPreset(selectedPresetId, 'append', presetTab === 'custom')
                    }
                  >
                    Append to Existing Tasks
                  </button>
                )}
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() =>
                    handleLoadPreset(selectedPresetId, 'replace', presetTab === 'custom')
                  }
                >
                  <Sparkles size={16} /> Apply Preset
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      {/* Save Current Schedule as Template Modal */}
      {isSavePresetModalOpen &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setIsSavePresetModalOpen(false)}
            style={{ zIndex: 100200 }}
          >
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '480px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bookmark size={20} style={{ color: '#fbbf24' }} />
                  <h3 style={{ margin: 0 }}>Save as Custom Template</h3>
                </div>
                <button className="btn-icon" onClick={() => setIsSavePresetModalOpen(false)}>
                  ×
                </button>
              </div>

              <form
                onSubmit={handleSaveAsTemplate}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.4rem',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Template Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Daniel's 3-Gun Shotgun Schedule"
                    value={customPresetForm.name}
                    onChange={(e) =>
                      setCustomPresetForm({ ...customPresetForm, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.4rem',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Tuned recoil spring, extractor, and barrel maintenance"
                    value={customPresetForm.description}
                    onChange={(e) =>
                      setCustomPresetForm({ ...customPresetForm, description: e.target.value })
                    }
                  />
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  This template will capture all{' '}
                  <strong>
                    {firearm.maintenance_schedules?.length || 0} active schedule tasks
                  </strong>{' '}
                  from this firearm so you can apply them to any other firearm with 1-click.
                </div>

                <div
                  className="modal-actions"
                  style={{
                    marginTop: '0.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsSavePresetModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Bookmark size={15} /> Save Template
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      {/* Gunsmith & Maintenance Dossier Modal */}
      {isDossierOpen &&
        firearm &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setIsDossierOpen(false)}
            style={{ zIndex: 100100 }}
          >
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '980px',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                background: '#0f172a',
                color: '#f8fafc',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={22} style={{ color: '#38bdf8' }} />
                  <div>
                    <h3 style={{ margin: 0 }}>Gunsmith Service Record & Dossier</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Complete provenance, round telemetry, service ledger, and mounted equipment.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => window.print()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Printer size={16} /> Print / Save PDF
                  </button>
                  <button className="btn-icon" onClick={() => setIsDossierOpen(false)}>
                    ×
                  </button>
                </div>
              </div>

              {/* Printable Document Body */}
              <div
                id="printable-firearm-dossier"
                style={{
                  overflowY: 'auto',
                  flex: 1,
                  padding: '1rem',
                  background: '#ffffff',
                  color: '#0f172a',
                  borderRadius: '8px',
                }}
              >
                <style>{`
                @media print {
                  body * { visibility: hidden; }
                  #printable-firearm-dossier, #printable-firearm-dossier * { visibility: visible; }
                  #printable-firearm-dossier { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; background: #ffffff !important; color: #000000 !important; }
                }
              `}</style>

                {/* Dossier Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '2px solid #0f172a',
                    paddingBottom: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a' }}>
                      {firearm.make} {firearm.model}
                    </h2>
                    <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: '0.2rem' }}>
                      Serial #: <strong>{firearm.serial_number || 'N/A'}</strong> &bull; Caliber:{' '}
                      <strong>{firearm.caliber || 'N/A'}</strong> &bull; Action:{' '}
                      <strong>{firearm.action_type || 'N/A'}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0284c7' }}>
                      ARMORYVAULT DOSSIER
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Generated {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Telemetry Summary Cards */}
                {(() => {
                  const totalRounds =
                    firearm.logs
                      ?.filter((l) => l.type === 'Range')
                      .reduce((sum, l) => sum + (Number(l.rounds_fired) || 0), 0) || 0;
                  const totalMaintCost = (firearm.logs || []).reduce(
                    (sum, l) => sum + (Number(l.cost) || 0),
                    0
                  );
                  const totalCleanings = (firearm.logs || []).filter(
                    (l) => l.type === 'Cleaning'
                  ).length;
                  const totalMalfunctions = (firearm.logs || []).reduce(
                    (sum, l) => sum + (Number(l.malfunctions) || 0),
                    0
                  );
                  const reliability =
                    totalRounds > 0
                      ? (((totalRounds - totalMalfunctions) / totalRounds) * 100).toFixed(1)
                      : '100.0';

                  return (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '0.75rem',
                        marginBottom: '1.5rem',
                      }}
                    >
                      <div
                        style={{
                          background: '#f1f5f9',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          Lifetime Rounds
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                          {totalRounds.toLocaleString()}
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#f1f5f9',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          Service Spend
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                          ${totalMaintCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#f1f5f9',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          Cleanings Logged
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                          {totalCleanings}
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#f1f5f9',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          Reliability Rating
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>
                          {reliability}%
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Specifications Table */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4
                    style={{
                      margin: '0 0 0.5rem',
                      color: '#0f172a',
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: '0.3rem',
                      fontSize: '1rem',
                    }}
                  >
                    Firearm Specifications
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <strong>Barrel Length:</strong> {firearm.barrel_length || 'N/A'}
                    </div>
                    <div>
                      <strong>Finish:</strong> {firearm.finish || 'N/A'}
                    </div>
                    <div>
                      <strong>Condition:</strong> {firearm.condition || 'N/A'}
                    </div>
                    <div>
                      <strong>Acquired:</strong> {firearm.purchase_date || 'N/A'}
                    </div>
                    <div>
                      <strong>Purchase Price:</strong>{' '}
                      {firearm.purchase_price
                        ? `$${firearm.purchase_price.toLocaleString()}`
                        : 'N/A'}
                    </div>
                    {firearm.is_nfa && (
                      <div>
                        <strong>NFA Type:</strong> {firearm.nfa_type || 'Yes'} (Stamp:{' '}
                        {firearm.stamp_status || 'Approved'})
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Maintenance Schedules */}
                {firearm.maintenance_schedules && firearm.maintenance_schedules.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4
                      style={{
                        margin: '0 0 0.5rem',
                        color: '#0f172a',
                        borderBottom: '1px solid #e2e8f0',
                        paddingBottom: '0.3rem',
                        fontSize: '1rem',
                      }}
                    >
                      Active Service & Wear Schedules
                    </h4>
                    <table
                      style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: '#f1f5f9',
                            borderBottom: '1px solid #cbd5e1',
                            textAlign: 'left',
                          }}
                        >
                          <th style={{ padding: '0.4rem' }}>Task</th>
                          <th style={{ padding: '0.4rem' }}>Interval (Rds / Days)</th>
                          <th style={{ padding: '0.4rem' }}>Last Performed</th>
                          <th style={{ padding: '0.4rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {firearm.maintenance_schedules.map((s, idx) => {
                          const totalRounds =
                            firearm.logs
                              ?.filter((l) => l.type === 'Range')
                              .reduce((sum, l) => sum + (Number(l.rounds_fired) || 0), 0) || 0;
                          const roundsSinceLast = Math.max(
                            0,
                            totalRounds - (s.last_performed_rounds || 0)
                          );
                          const isDue = roundsSinceLast >= s.interval_rounds;
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '0.4rem' }}>
                                <strong>{s.task_name}</strong>
                              </td>
                              <td style={{ padding: '0.4rem' }}>
                                {s.interval_rounds.toLocaleString()} rds
                                {s.interval_days ? ` / ${s.interval_days}d` : ''}
                              </td>
                              <td style={{ padding: '0.4rem' }}>
                                {s.last_performed_rounds.toLocaleString()} rds (
                                {s.last_performed_date || 'N/A'})
                              </td>
                              <td
                                style={{
                                  padding: '0.4rem',
                                  color: isDue ? '#dc2626' : '#059669',
                                  fontWeight: 600,
                                }}
                              >
                                {isDue ? 'SERVICE DUE' : 'GOOD'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Complete Service & Range Ledger */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4
                    style={{
                      margin: '0 0 0.5rem',
                      color: '#0f172a',
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: '0.3rem',
                      fontSize: '1rem',
                    }}
                  >
                    Complete Service & Range Ledger
                  </h4>
                  {!firearm.logs || firearm.logs.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                      No service or range events recorded yet.
                    </p>
                  ) : (
                    <table
                      style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: '#f1f5f9',
                            borderBottom: '1px solid #cbd5e1',
                            textAlign: 'left',
                          }}
                        >
                          <th style={{ padding: '0.4rem' }}>Date</th>
                          <th style={{ padding: '0.4rem' }}>Event</th>
                          <th style={{ padding: '0.4rem' }}>Rounds</th>
                          <th style={{ padding: '0.4rem' }}>Part / Modification</th>
                          <th style={{ padding: '0.4rem' }}>Cost</th>
                          <th style={{ padding: '0.4rem' }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {firearm.logs.map((log, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '0.4rem', whiteSpace: 'nowrap' }}>{log.date}</td>
                            <td style={{ padding: '0.4rem' }}>
                              <strong>{log.type}</strong>
                            </td>
                            <td style={{ padding: '0.4rem' }}>
                              {log.rounds_fired ? `${log.rounds_fired} rds` : '—'}
                            </td>
                            <td style={{ padding: '0.4rem' }}>
                              {log.installed_part_details || log.repaired_part || '—'}
                            </td>
                            <td style={{ padding: '0.4rem' }}>
                              {log.cost ? `$${Number(log.cost).toFixed(2)}` : '—'}
                            </td>
                            <td style={{ padding: '0.4rem', color: '#475569' }}>
                              {log.notes || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Mounted Accessories & Optics */}
                {attachedAccessories.length > 0 && (
                  <div>
                    <h4
                      style={{
                        margin: '0 0 0.5rem',
                        color: '#0f172a',
                        borderBottom: '1px solid #e2e8f0',
                        paddingBottom: '0.3rem',
                        fontSize: '1rem',
                      }}
                    >
                      Mounted Accessories, Optics & Suppressors
                    </h4>
                    <table
                      style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: '#f1f5f9',
                            borderBottom: '1px solid #cbd5e1',
                            textAlign: 'left',
                          }}
                        >
                          <th style={{ padding: '0.4rem' }}>Type</th>
                          <th style={{ padding: '0.4rem' }}>Manufacturer / Model</th>
                          <th style={{ padding: '0.4rem' }}>Serial #</th>
                          <th style={{ padding: '0.4rem' }}>Rounds on Gear</th>
                          <th style={{ padding: '0.4rem' }}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attachedAccessories.map((acc, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '0.4rem' }}>{acc.type}</td>
                            <td style={{ padding: '0.4rem' }}>
                              <strong>
                                {acc.manufacturer} {acc.model}
                              </strong>
                            </td>
                            <td style={{ padding: '0.4rem' }}>{acc.serialNumber || 'N/A'}</td>
                            <td style={{ padding: '0.4rem' }}>
                              {acc.round_count
                                ? `${acc.round_count.toLocaleString()} rds`
                                : '0 rds'}
                            </td>
                            <td style={{ padding: '0.4rem' }}>
                              {acc.value ? `$${acc.value.toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      {firearm && (
        <AccessoryModal
          isOpen={isAccessoryModalOpen}
          onClose={() => {
            setIsAccessoryModalOpen(false);
            setEditingAccessoryId(null);
            setAccessoryFormData({});
          }}
          onSave={() => loadFirearm()}
          editingId={editingAccessoryId}
          initialData={accessoryFormData}
          firearms={allFirearms.length > 0 ? allFirearms : [firearm]}
        />
      )}
      {/* Interactive Tactical Detail Card / Modal */}
      <AccessoryDetailModal
        isOpen={!!selectedAccessoryForDetail}
        accessory={selectedAccessoryForDetail}
        firearms={allFirearms.length > 0 ? allFirearms : firearm ? [firearm] : []}
        onClose={() => setSelectedAccessoryForDetail(null)}
        onEdit={(acc) => {
          setAccessoryFormData(acc);
          setEditingAccessoryId(acc.id || null);
          setIsAccessoryModalOpen(true);
        }}
        onDelete={async (accId) => {
          if (window.api && window.api.deleteAccessory) {
            await window.api.deleteAccessory(accId);
            loadFirearm();
          }
        }}
      />
      {lightboxImages.length > 0 && (
        <Lightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages([])}
        />
      )}
    </>
  );
};
