import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  ClipboardList,
  Clock,
  Crosshair,
  Disc,
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
  Unlink,
  Upload,
  Wrench,
  ZoomIn,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { AutocompleteInput } from '../components/AutocompleteInput';
import { ChassisIcon, GunBeltIcon, ScopeIcon, StockIcon } from '../components/CustomIcons';
import {
  FirearmLogModal,
  GunsmithDossierModal,
  MaintenancePresetPickerModal,
  MaintenanceScheduleModal,
  MarkAsSoldModal,
  SaveScheduleTemplateModal,
  TaskCompletionModal,
} from '../components/firearm-details/modals';
import { Lightbox } from '../components/Lightbox';
import {
  AccessoryDetailModal,
  getAccessoryTypeColor,
} from '../components/modals/AccessoryDetailModal';
import { AccessoryModal } from '../components/modals/AccessoryModal';
import { MountAccessoryModal } from '../components/modals/MountAccessoryModal';
import { StorageBadge } from '../components/StorageBadge';
import { useUndoToast } from '../components/UndoToast';
import {
  Accessory,
  Ammo,
  CustomSchedulePreset,
  Firearm,
  MaintenanceLog,
  MaintenanceScheduleItem,
  StorageLocation,
} from '../types';
import { formatCurrency, parseCurrency } from '../utils/currency';
import { getLocalImageUrl } from '../utils/imageUrl';
import {
  createScheduleItemsFromProfile,
  detectFirearmScheduleProfile,
  MAINTENANCE_PROFILES,
  MaintenanceProfile,
} from '../utils/maintenancePresets';
import {
  assignItemToStorage,
  getItemStorageLocation,
  removeItemFromAllStorage,
  saveStorageLocations,
} from '../utils/StorageSync';

export const FirearmDetails = () => {
  const { showUndo } = useUndoToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [firearm, setFirearm] = useState<Firearm | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isGeneratingBOS, setIsGeneratingBOS] = useState(false);
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
  const [allAccessories, setAllAccessories] = useState<Accessory[]>([]);
  const [showTotalSetupValue, setShowTotalSetupValue] = useState(false);
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState(false);
  const [isMountAccessoryModalOpen, setIsMountAccessoryModalOpen] = useState(false);
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
  const [customPresets, setCustomPresets] = useState<CustomSchedulePreset[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);

  // Dossier State
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Task Completion & Part Replacement Modal State
  const [isTaskCompletionModalOpen, setIsTaskCompletionModalOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<any>(null);

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
      const [all, ammo, allAcc, showSetup, presets, locs] = await Promise.all([
        window.api.getFirearms(),
        window.api.getAmmo ? window.api.getAmmo() : Promise.resolve([]),
        window.api.getAccessories ? window.api.getAccessories() : Promise.resolve([]),
        window.api.getConfig ? window.api.getConfig('showTotalSetupValue') : Promise.resolve(false),
        window.api.getCustomSchedulePresets
          ? window.api.getCustomSchedulePresets()
          : Promise.resolve([]),
        window.api.getStorageLocations ? window.api.getStorageLocations() : Promise.resolve([]),
      ]);

      setAllFirearms(all || []);
      const found = (all || []).find((f) => f.id === Number(id));
      setFirearm(found || null);

      setInventoryAmmo(ammo || []);

      if (allAcc) {
        setAllAccessories(allAcc);
        const attached = allAcc.filter((a) => a.mounts?.some((m) => m.firearmId === Number(id)));
        setAttachedAccessories(attached);

        if (selectedAccessoryForDetail) {
          const refreshed = allAcc.find((a) => a.id === selectedAccessoryForDetail.id);
          setSelectedAccessoryForDetail(refreshed || null);
        }
      }

      setShowTotalSetupValue(!!showSetup);
      setCustomPresets(presets || []);
      setStorageLocations(locs || []);
    }
  };

  const handleDelete = async () => {
    if (!firearm) return;
    const targetFirearm = { ...firearm };
    if (storageLocations.length > 0) {
      const updatedLocs = removeItemFromAllStorage('firearm', Number(id), storageLocations);
      await saveStorageLocations(updatedLocs);
    }
    await window.api.deleteFirearm(Number(id));
    navigate('/');
    showUndo(`Deleted "${targetFirearm.make} ${targetFirearm.model}"`, async () => {
      if (window.api?.addFirearm) {
        const { id: _oldId, ...rest } = targetFirearm;
        const newId = await window.api.addFirearm(rest as Firearm);
        if (newId) {
          navigate(`/firearms/${newId}`);
        }
      }
    });
  };

  const handleUnmountAccessory = async (acc: Accessory) => {
    if (!id || !window.api?.updateAccessory) return;
    if (
      window.confirm(
        `Are you sure you want to unmount "${acc.manufacturer} ${acc.model}" from this firearm? It will remain saved in your Accessories catalog.`
      )
    ) {
      const currentMounts = acc.mounts || [];
      const updatedMounts = currentMounts.filter((m) => m.firearmId !== Number(id));
      const updatedAcc = { ...acc, mounts: updatedMounts };
      await window.api.updateAccessory(acc.id!, updatedAcc);
      await loadFirearm();
    }
  };

  const handleSell = async (formData: any) => {
    if (firearm) {
      const updated = {
        ...firearm,
        is_sold: true,
        ...formData,
        sold_price: parseFloat(formData.sold_price) || 0,
      };
      await window.api.updateFirearm(firearm.id!, updated);
      setFirearm(updated);
      setIsSelling(false);
    }
  };

  const handleGenerateBillOfSale = async () => {
    if (!firearm) return;
    try {
      setIsGeneratingBOS(true);
      const res = await window.api.generateBillOfSale({
        make: firearm.make,
        model: firearm.model,
        serial_number: firearm.serial_number,
        caliber: firearm.caliber,
        firearm_type: firearm.firearm_type || (firearm as any).type || 'N/A',
        sold_date: firearm.sold_date || new Date().toISOString().split('T')[0],
        sold_price: firearm.sold_price || 0,
        sale_notes: firearm.sale_notes || '',
        sold_to_name: firearm.sold_to_name || '',
      });
      if (res) {
        alert(
          'Bill of Sale PDF successfully compiled via Typst and saved to your Vault documents directory!'
        );
      }
    } catch (err: any) {
      console.error('Failed to generate Bill of Sale:', err);
      alert('Error generating Bill of Sale: ' + err.message);
    } finally {
      setIsGeneratingBOS(false);
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
    if (!firearm) return;
    const targetLog = (firearm.logs || []).find((l) => l.id === logId);
    if (!targetLog) return;
    const updatedLogs = (firearm.logs || []).filter((l) => l.id !== logId);
    const updated = { ...firearm, logs: updatedLogs };
    await window.api.updateFirearm(firearm.id!, updated);
    setFirearm(updated);
    showUndo(`Deleted ${targetLog.type} log entry`, async () => {
      if (window.api?.updateFirearm && firearm.id) {
        const restored = { ...firearm, logs: [...(updated.logs || []), targetLog] };
        await window.api.updateFirearm(firearm.id, restored);
        setFirearm(restored);
      }
    });
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
    if (!firearm) return;
    const targetSchedule = (firearm.maintenance_schedules || []).find((s) => s.id === taskId);
    if (!targetSchedule) return;
    const updatedSchedules = (firearm.maintenance_schedules || []).filter((s) => s.id !== taskId);
    const updated = { ...firearm, maintenance_schedules: updatedSchedules };
    await window.api.updateFirearm(firearm.id!, updated);
    setFirearm(updated);
    showUndo(`Deleted "${targetSchedule.task_name}" task`, async () => {
      if (window.api?.updateFirearm && firearm.id) {
        const restored = {
          ...firearm,
          maintenance_schedules: [...(updated.maintenance_schedules || []), targetSchedule],
        };
        await window.api.updateFirearm(firearm.id, restored);
        setFirearm(restored);
      }
    });
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

  const handleSaveAsTemplate = async (name: string, description: string) => {
    if (!firearm || !name.trim()) return;
    const currentSchedules = firearm.maintenance_schedules || [];
    if (currentSchedules.length === 0) {
      alert('Add at least one scheduled maintenance task before saving as a template.');
      return;
    }
    const newPreset: CustomSchedulePreset = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || `${firearm.make} ${firearm.model} custom schedule`,
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
    setIsTaskCompletionModalOpen(true);
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
                  <StorageBadge
                    location={getItemStorageLocation('firearm', firearm.id, storageLocations)}
                    onClick={() => navigate('/storage')}
                    size="md"
                  />
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
                    {formatCurrency(
                      parseCurrency(firearm.purchase_price) +
                        attachedAccessories.reduce((sum, a) => {
                          const allocatedQty =
                            a.mounts?.find((m) => m.firearmId === Number(id))?.quantity || 1;
                          return sum + parseCurrency(a.value) * allocatedQty;
                        }, 0)
                    )}
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
              <div className="details-image-wrapper" style={{ position: 'relative' }}>
                <img
                  src={`local-file://${firearm.photos[selectedPhotoIndex] || firearm.photos[0]}`}
                  alt="Firearm"
                  className="details-image"
                  onClick={() => {
                    setLightboxImages(firearm.photos!);
                    setLightboxIndex(selectedPhotoIndex);
                  }}
                  title="Click to launch high-resolution inspection loupe"
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImages(firearm.photos!);
                      setLightboxIndex(selectedPhotoIndex);
                    }}
                    style={{
                      background: 'rgba(15, 23, 42, 0.88)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <ZoomIn size={13} /> Inspect Loupe ({selectedPhotoIndex + 1}/
                    {firearm.photos.length})
                  </button>
                </div>
                {firearm.photos.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '10px',
                      overflowX: 'auto',
                      paddingBottom: '4px',
                    }}
                  >
                    {firearm.photos.map((p, idx) => {
                      const slotName =
                        idx === 0
                          ? 'Left Profile'
                          : idx === 1
                            ? 'Right Profile'
                            : idx === 2
                              ? 'Rollmark / Serial'
                              : idx === 3
                                ? 'Proofs / Bore'
                                : `Angle ${idx + 1}`;
                      const isSel = idx === selectedPhotoIndex;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedPhotoIndex(idx)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '3px',
                            cursor: 'pointer',
                            opacity: isSel ? 1 : 0.6,
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={getLocalImageUrl(p, true)}
                            alt={slotName}
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: '54px',
                              height: '38px',
                              borderRadius: '4px',
                              objectFit: 'cover',
                              border: isSel ? '2px solid #38bdf8' : '1px solid #334155',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.65rem',
                              color: isSel ? '#38bdf8' : '#94a3b8',
                              fontWeight: isSel ? 700 : 500,
                              maxWidth: '65px',
                              textAlign: 'center',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {slotName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : firearm.image_path ? (
              <div className="details-image-wrapper" style={{ position: 'relative' }}>
                <img
                  src={`local-file://${firearm.image_path}`}
                  alt="Firearm"
                  className="details-image"
                  onClick={() => {
                    setLightboxImages([firearm.image_path]);
                    setLightboxIndex(0);
                  }}
                  title="Click to launch high-resolution inspection loupe"
                />
                <div style={{ position: 'absolute', bottom: '8px', right: '8px' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImages([firearm.image_path]);
                      setLightboxIndex(0);
                    }}
                    style={{
                      background: 'rgba(15, 23, 42, 0.88)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <ZoomIn size={13} /> Inspect Loupe
                  </button>
                </div>
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
              <p>{firearm.purchase_price != null ? formatCurrency(firearm.purchase_price) : '-'}</p>
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
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isGeneratingBOS}
                  onClick={handleGenerateBillOfSale}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}
                  title="Generate official Typst Firearm Bill of Sale & Transfer Record PDF"
                >
                  <FileText size={14} />{' '}
                  {isGeneratingBOS ? 'Compiling PDF...' : 'Bill of Sale (PDF)'}
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
                  <p>{formatCurrency(firearm.sold_price)}</p>
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
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsMountAccessoryModalOpen(true)}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Bookmark size={15} /> Mount Existing Accessory
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingAccessoryId(null);
                  setAccessoryFormData({ mounts: [{ firearmId: Number(id), quantity: 1 }] });
                  setIsAccessoryModalOpen(true);
                }}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <PlusCircle size={15} /> + New Accessory
              </button>
            </div>
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
                const allocatedValue = parseCurrency(acc.value) * allocatedQty;

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
                            src={getLocalImageUrl(acc.photo, true)}
                            alt={acc.model}
                            loading="lazy"
                            decoding="async"
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
                          {formatCurrency(parseCurrency(acc.value) * allocatedQty)}
                          {allocatedQty > 1 && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-secondary)',
                                fontWeight: 400,
                              }}
                            >
                              {' '}
                              ({formatCurrency(acc.value)} ea)
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
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Disc size={11} style={{ color: '#c084fc', flexShrink: 0 }} />
                          <span>
                            {acc.caliber ? `${acc.caliber} • ` : ''}
                            {acc.capacity}rd
                          </span>
                        </span>
                      )}
                      {acc.actionInlet && (
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
                          <Target size={11} color="#38bdf8" />
                          <span>{acc.actionInlet}</span>
                        </span>
                      )}
                      {acc.stockType && (
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          {acc.type === 'Chassis' ? (
                            <ChassisIcon size={11} color="#10b981" />
                          ) : (
                            <StockIcon size={11} color="#10b981" />
                          )}
                          <span>{acc.stockType}</span>
                        </span>
                      )}
                      {acc.lengthOfPull && (
                        <span
                          style={{
                            background: 'rgba(52, 211, 153, 0.1)',
                            color: '#34d399',
                            border: '1px solid rgba(52, 211, 153, 0.25)',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                          }}
                        >
                          LOP: {acc.lengthOfPull}
                        </span>
                      )}
                      {acc.supportedModels && !acc.actionInlet && (
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
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnmountAccessory(acc);
                          }}
                          style={{
                            padding: '0.35rem',
                            borderRadius: '4px',
                            color: '#f87171',
                          }}
                          title="Unmount / Detach from this Firearm"
                        >
                          <Unlink size={14} />
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
                padding: '2.5rem 1.5rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '12px',
                border: '1px dashed var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                No accessories or optics currently mounted to this firearm.
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  marginTop: '0.25rem',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setIsMountAccessoryModalOpen(true)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Bookmark size={15} /> Select &amp; Mount Existing Accessory
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingAccessoryId(null);
                    setAccessoryFormData({ mounts: [{ firearmId: Number(id), quantity: 1 }] });
                    setIsAccessoryModalOpen(true);
                  }}
                  style={{
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <PlusCircle size={15} /> + Create New Accessory
                </button>
              </div>
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
                  onClick={() => setIsSavePresetModalOpen(true)}
                  title="Save this firearm's schedules as a reusable template"
                >
                  <Bookmark size={16} style={{ color: '#fbbf24' }} /> Save as Template
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => setIsPresetModalOpen(true)}
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
                  <button className="btn-secondary" onClick={() => setIsPresetModalOpen(true)}>
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
                {formatCurrency(
                  firearm.logs?.reduce((acc, log) => acc + parseCurrency(log.cost), 0) || 0
                )}
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
                        <span style={{ color: 'var(--warning)' }}>{formatCurrency(log.cost)}</span>
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
                        src={getLocalImageUrl(log.image_path, true)}
                        alt="Log Attachment"
                        loading="lazy"
                        decoding="async"
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
      <MarkAsSoldModal
        isOpen={isSelling}
        onClose={() => setIsSelling(false)}
        onConfirmSale={handleSell}
        initialData={sellForm}
      />
      {firearm && (
        <FirearmLogModal
          isOpen={isLogging}
          onClose={() => {
            setIsLogging(false);
            setEditingLogId(null);
          }}
          firearm={firearm}
          inventoryAmmo={inventoryAmmo}
          editingLogId={editingLogId}
          initialLogForm={logForm}
          onLogSaved={(updated) => {
            setFirearm(updated);
            setIsLogging(false);
            setEditingLogId(null);
          }}
        />
      )}
      {firearm && (
        <MaintenanceScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setEditingScheduleId(null);
          }}
          firearm={firearm}
          editingScheduleId={editingScheduleId}
          initialForm={scheduleForm}
          onScheduleSaved={(updated) => {
            setFirearm(updated);
            setIsScheduleModalOpen(false);
            setEditingScheduleId(null);
          }}
        />
      )}
      {firearm && (
        <TaskCompletionModal
          isOpen={isTaskCompletionModalOpen}
          onClose={() => {
            setIsTaskCompletionModalOpen(false);
            setCompletingTask(null);
          }}
          firearm={firearm}
          task={completingTask}
          onCompleted={async () => {
            await loadFirearm();
            setIsTaskCompletionModalOpen(false);
            setCompletingTask(null);
          }}
        />
      )}
      {firearm && (
        <MaintenancePresetPickerModal
          isOpen={isPresetModalOpen}
          onClose={() => setIsPresetModalOpen(false)}
          firearm={firearm}
          customPresets={customPresets}
          onLoadPreset={handleLoadPreset}
          onDeleteCustomPreset={handleDeleteCustomPreset}
        />
      )}
      {firearm && (
        <SaveScheduleTemplateModal
          isOpen={isSavePresetModalOpen}
          onClose={() => setIsSavePresetModalOpen(false)}
          firearm={firearm}
          onSave={handleSaveAsTemplate}
        />
      )}
      {firearm && (
        <GunsmithDossierModal
          isOpen={isDossierOpen}
          onClose={() => setIsDossierOpen(false)}
          firearm={firearm}
          attachedAccessories={attachedAccessories}
        />
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
      {/* Mount Existing Accessory Modal */}
      {firearm && (
        <MountAccessoryModal
          isOpen={isMountAccessoryModalOpen}
          onClose={() => setIsMountAccessoryModalOpen(false)}
          targetFirearm={firearm}
          allAccessories={allAccessories}
          allFirearms={allFirearms.length > 0 ? allFirearms : [firearm]}
          onMountChanged={() => loadFirearm()}
          onOpenCreateNew={() => {
            setEditingAccessoryId(null);
            setAccessoryFormData({ mounts: [{ firearmId: Number(id), quantity: 1 }] });
            setIsAccessoryModalOpen(true);
          }}
        />
      )}
    </>
  );
};
