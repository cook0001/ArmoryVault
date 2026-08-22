import {
  AlertTriangle,
  Camera,
  CheckCircle,
  CheckCircle2,
  Edit3,
  Info,
  Paperclip,
  PlusCircle,
  Radio,
  RefreshCw,
  Server,
  Shield,
  Smartphone,
  Sparkles,
  Target,
  Trash2,
  Wifi,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScopeIcon } from '../components/CustomIcons';
import { Ammo, Firearm, ReloadingComponent, SyncItem } from '../types';
import { parseBarcodeData } from '../utils/BarcodeEngine';
import { assignItemToStorage, saveStorageLocations } from '../utils/StorageSync';

export const SyncInbox = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'pair'>('inbox');
  const [queue, setQueue] = useState<SyncItem[]>([]);
  const [syncQrUrl, setSyncQrUrl] = useState('');
  const [localIp, setLocalIp] = useState('');
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [pairSuccess, setPairSuccess] = useState<{ deviceName: string; timestamp: number } | null>(
    null
  );
  const pairTimerRef = useRef<number | null>(null);

  const [ammoList, setAmmoList] = useState<Ammo[]>([]);
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [componentsList, setComponentsList] = useState<ReloadingComponent[]>([]);
  const [accessoriesList, setAccessoriesList] = useState<any[]>([]);
  const [skus, setSkus] = useState<Record<string, any>>({});
  const [pendingBoxSizePrompt, setPendingBoxSizePrompt] = useState<{
    item: SyncItem;
    target: any;
  } | null>(null);
  const [customBoxSize, setCustomBoxSize] = useState('50');
  const navigate = useNavigate();
  const location = useLocation();
  const [isResolving, setIsResolving] = useState<number | null>(null);
  const [unknownRouteItem, setUnknownRouteItem] = useState<{ item: SyncItem; upc: string } | null>(
    null
  );

  const isPairModalOpenRef = useRef(isPairModalOpen);
  isPairModalOpenRef.current = isPairModalOpen;

  const handlePairSuccess = (deviceName = 'Mobile Companion App') => {
    setIsPairModalOpen(false);
    setActiveTab('inbox');
    setPairSuccess({ deviceName, timestamp: Date.now() });

    if (pairTimerRef.current) {
      clearTimeout(pairTimerRef.current);
    }
    pairTimerRef.current = window.setTimeout(() => {
      setPairSuccess(null);
      pairTimerRef.current = null;
    }, 3800);
  };

  useEffect(() => {
    loadData();
    generateQr();

    if (location.state && (location.state as any).openPairModal) {
      setIsPairModalOpen(true);
    }

    let unsubscribeSync: (() => void) | undefined;
    let unsubscribePair: (() => void) | undefined;

    if (window.api && window.api.onSyncReceived) {
      unsubscribeSync = window.api.onSyncReceived(() => {
        loadData();
        if (isPairModalOpenRef.current) {
          handlePairSuccess('Mobile Device');
        }
      });
    }

    if (window.api && window.api.onDevicePaired) {
      unsubscribePair = window.api.onDevicePaired((data) => {
        handlePairSuccess(data?.deviceName || 'Mobile Companion App');
      });
    }

    return () => {
      if (unsubscribeSync) unsubscribeSync();
      if (unsubscribePair) unsubscribePair();
      if (pairTimerRef.current) clearTimeout(pairTimerRef.current);
    };
  }, [location.state]);

  const loadData = async () => {
    if (window.api) {
      const ammo = await window.api.getAmmo();
      setAmmoList(ammo);
      const f = await window.api.getFirearms();
      setFirearms(f);
      let c: any[] = [];
      if (window.api.getComponents) {
        c = await window.api.getComponents();
        setComponentsList(c);
      }
      let acc: any[] = [];
      if (window.api.getAccessories) {
        acc = await window.api.getAccessories();
        setAccessoriesList(acc);
      }
      if (window.api.getSkus) {
        const s = await window.api.getSkus();
        setSkus(s || {});
      }

      const q = await window.api.getSyncQueue();
      // Pre-categorize universal scans if they already exist in inventory
      const processedQueue = q.map((item: any) => {
        if (item.type === 'universal_scan') {
          const upcOrId = String(item.upcOrId);
          if (upcOrId.startsWith('AV-AMMO-')) {
            const ammoId = parseInt(upcOrId.replace('AV-AMMO-', ''));
            if (ammo.some((a: any) => a.id === ammoId)) {
              return { ...item, type: 'ammo_adjustment', upcOrId: String(ammoId) };
            }
          }
          if (ammo.some((a: any) => String(a.id) === upcOrId || a.upc_code === upcOrId)) {
            return { ...item, type: 'ammo_adjustment' };
          }
          if (c.some((comp: any) => String(comp.id) === upcOrId || comp.upc_code === upcOrId)) {
            return { ...item, type: 'component_adjustment' };
          }
          if (
            acc.some(
              (a: any) =>
                String(a.id) === upcOrId ||
                a.serialNumber === upcOrId ||
                (a.notes && a.notes.includes(upcOrId))
            )
          ) {
            return { ...item, type: 'accessory_adjustment' };
          }
        }
        return item;
      });
      setQueue(processedQueue);
    }
  };

  const generateQr = async () => {
    if (window.api) {
      const ip = await window.api.getLocalIp();
      let token = '';
      if (window.api.getPairingToken) {
        token = (await window.api.getPairingToken()) || '';
      }
      setLocalIp(ip || '127.0.0.1');
      const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
      const qrData = `armoryvault://sync?ip=${ip}&port=3456${tokenParam}`;
      const QRCode = (await import('qrcode')).default;
      const url = await QRCode.toDataURL(qrData, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setSyncQrUrl(url);
    }
  };

  const handleResolveUniversal = async (item: SyncItem) => {
    setIsResolving(item.id!);
    try {
      const upcOrId = String(item.upcOrId);

      // 1. Check Custom SKU Dictionary first
      if (skus) {
        const matchedSkuKey = Object.keys(skus).find(
          (k) => k.trim().toUpperCase() === upcOrId.trim().toUpperCase()
        );
        if (matchedSkuKey) {
          const skuData = skus[matchedSkuKey];
          const cat =
            skuData.category ||
            (skuData.accessoryType ? 'accessory' : skuData.componentType ? 'component' : 'ammo');

          if (cat === 'accessory') {
            await window.api.removeSyncItem(item.id!);
            navigate('/accessories', {
              state: {
                openAddModal: true,
                upc: matchedSkuKey,
                initialData: {
                  type: skuData.accessoryType || 'Optic',
                  manufacturer: skuData.manufacturer || '',
                  model: skuData.model || '',
                  caliber: skuData.caliber || skuData.supportedModels || '',
                  supportedModels: skuData.supportedModels || '',
                  value: skuData.value,
                  notes: skuData.notes,
                },
                syncItemId: item.id,
              },
            });
            return;
          } else if (cat === 'component') {
            await window.api.removeSyncItem(item.id!);
            navigate('/components', {
              state: {
                openAddModal: true,
                upc: matchedSkuKey,
                parsedData: {
                  type: skuData.componentType || 'Powder',
                  manufacturer: skuData.manufacturer || '',
                  name: skuData.name || '',
                  caliber: skuData.caliber || '',
                  quantity: skuData.quantity || 0,
                  cost: skuData.cost,
                  weightUnit: skuData.weightUnit,
                },
                syncItemId: item.id,
              },
            });
            return;
          } else if (cat === 'ammo') {
            await window.api.removeSyncItem(item.id!);
            navigate('/ammo', {
              state: {
                openAddModal: true,
                upc: matchedSkuKey,
                parsedData: {
                  manufacturer: skuData.manufacturer || '',
                  caliber: skuData.caliber || '',
                  grain: skuData.grain,
                  projectile: skuData.projectile || '',
                  isPlusP: skuData.isPlusP,
                  count: skuData.count,
                  boxPrice: skuData.boxPrice,
                  costPerRound: skuData.costPerRound,
                },
                syncItemId: item.id,
              },
            });
            return;
          }
        }
      }

      // 2. Fallback to online lookup
      const data = await window.api.lookupUPC(upcOrId);

      let parsedData: any = { category: 'unknown', upcOrId };

      if (data && data.items && data.items.length > 0) {
        parsedData = parseBarcodeData(data.items[0], ammoList);
        parsedData.upcOrId = upcOrId;
      }

      if (parsedData.category === 'ammo') {
        await window.api.removeSyncItem(item.id!);
        navigate('/ammo', {
          state: {
            openAddModal: true,
            upc: upcOrId,
            parsedData: parsedData.parsedAmmo,
            syncItemId: item.id,
          },
        });
      } else if (parsedData.category === 'component') {
        await window.api.removeSyncItem(item.id!);
        navigate('/components', {
          state: {
            openAddModal: true,
            upc: upcOrId,
            parsedData: parsedData.parsedComponent,
            syncItemId: item.id,
          },
        });
      } else if (parsedData.category === 'accessory') {
        await window.api.removeSyncItem(item.id!);
        navigate('/accessories', {
          state: {
            openAddModal: true,
            upc: upcOrId,
            parsedData: parsedData.parsedAccessory,
            syncItemId: item.id,
          },
        });
      } else {
        setUnknownRouteItem({ item, upc: upcOrId });
        setIsResolving(null);
      }
    } catch (e: any) {
      console.error(e);
      setUnknownRouteItem({ item, upc: String(item.upcOrId) });
      setIsResolving(null);
    }
  };

  const finalizeApprove = async (item: SyncItem, target: any, multiplier: number) => {
    if (item.type === 'ammo_adjustment') {
      const currentCount = parseInt(target.count as any) || 0;
      const adjustment = (parseInt(item.count as any) || 0) * multiplier;
      if (item.action === 'add') target.count = currentCount + adjustment;
      else if (item.action === 'remove') target.count = Math.max(0, currentCount - adjustment);
      await window.api.updateAmmo(target.id!, target);
    } else if (item.type === 'component_adjustment') {
      const currentCount = parseInt(target.quantity as any) || 0;
      const adjustment = (parseInt(item.count as any) || 0) * multiplier;
      if (item.action === 'add') target.quantity = currentCount + adjustment;
      else if (item.action === 'remove') target.quantity = Math.max(0, currentCount - adjustment);
      await window.api.updateComponent(target.id!, target);
    }
    await window.api.removeSyncItem(item.id!);
    loadData();
  };

  const saveCustomBoxSize = async () => {
    if (!pendingBoxSizePrompt) return;
    const { item, target } = pendingBoxSizePrompt;
    const size = parseInt(customBoxSize) || 1;

    // Save to skus DB for future
    const upc = target.upc_code || String(item.upcOrId);
    if (upc) {
      const currentDbSkus = window.api && window.api.getSkus ? await window.api.getSkus() : skus;
      const newSkus = { ...currentDbSkus, [upc]: { ...(currentDbSkus[upc] || {}), count: size } };
      await window.api.saveSkus(newSkus);
      setSkus(newSkus);
    }

    setPendingBoxSizePrompt(null);
    await finalizeApprove(item, target, size);
  };

  const handleApprove = async (item: SyncItem) => {
    if (!window.api) return;

    if (item.type === 'ammo_adjustment') {
      const upcOrId = String(item.upcOrId);
      const ammo = ammoList.find((a) => String(a.id) === upcOrId || a.upc_code === upcOrId);
      if (ammo) {
        if (item.measurement === 'rds' || item.measurement === 'lbs') {
          return finalizeApprove(item, ammo, 1);
        }

        let boxSize = 0;
        if (ammo.upc_code && skus[ammo.upc_code] && skus[ammo.upc_code].count) {
          boxSize = skus[ammo.upc_code].count;
        }

        if (boxSize === 0) {
          try {
            const data = await window.api.lookupUPC(upcOrId);
            if (data && data.items && data.items.length > 0) {
              const parsed = parseBarcodeData(data.items[0], ammoList);
              if (parsed.parsedAmmo && parsed.parsedAmmo.count) {
                boxSize = parsed.parsedAmmo.count;
                if (ammo.upc_code) {
                  const currentDbSkus =
                    window.api && window.api.getSkus ? await window.api.getSkus() : skus;
                  const newSkus = {
                    ...currentDbSkus,
                    [ammo.upc_code]: { ...(currentDbSkus[ammo.upc_code] || {}), count: boxSize },
                  };
                  await window.api.saveSkus(newSkus);
                  setSkus(newSkus);
                }
              }
            }
          } catch (e) {}
        }

        if (boxSize === 0) {
          setPendingBoxSizePrompt({ item, target: ammo });
          return;
        }

        return finalizeApprove(item, ammo, boxSize);
      }
    } else if (item.type === 'component_adjustment') {
      const upcOrId = String(item.upcOrId);
      const component = componentsList.find(
        (c) => String(c.id) === upcOrId || c.upc_code === upcOrId
      );
      if (component) {
        if (item.measurement === 'rds' || item.measurement === 'lbs') {
          return finalizeApprove(item, component, 1);
        } else if (item.measurement === 'brick' || component.type === 'Primer') {
          return finalizeApprove(item, component, 1000);
        }

        let unitSize = 0;
        if (component.upc_code && skus[component.upc_code] && skus[component.upc_code].count) {
          unitSize = skus[component.upc_code].count;
        }

        if (unitSize === 0) {
          try {
            const data = await window.api.lookupUPC(upcOrId);
            if (data && data.items && data.items.length > 0) {
              const parsed = parseBarcodeData(data.items[0], ammoList);
              if (parsed.parsedComponent && parsed.parsedComponent.quantity) {
                unitSize = parsed.parsedComponent.quantity;
                if (component.upc_code) {
                  const currentDbSkus =
                    window.api && window.api.getSkus ? await window.api.getSkus() : skus;
                  const newSkus = {
                    ...currentDbSkus,
                    [component.upc_code]: {
                      ...(currentDbSkus[component.upc_code] || {}),
                      count: unitSize,
                    },
                  };
                  await window.api.saveSkus(newSkus);
                  setSkus(newSkus);
                }
              }
            }
          } catch (e) {}
        }

        if (unitSize === 0) {
          if (component.type === 'Bullet' || component.type === 'Brass') {
            setPendingBoxSizePrompt({ item, target: component });
            return;
          } else {
            unitSize = 1;
          }
        }

        return finalizeApprove(item, component, unitSize);
      }
    } else if (item.type === 'accessory_adjustment') {
      const upcOrId = String(item.upcOrId);
      const acc = accessoriesList.find(
        (a: any) =>
          String(a.id) === upcOrId ||
          a.serialNumber === upcOrId ||
          (a.notes && a.notes.includes(upcOrId))
      );
      if (acc) {
        const currentCount = parseInt(acc.quantity as any) || 0;
        const adjustment = parseInt(item.count as any) || 0;
        if (item.action === 'add') {
          acc.quantity = currentCount + adjustment;
        } else if (item.action === 'remove') {
          acc.quantity = Math.max(0, currentCount - adjustment);
        }
        await window.api.updateAccessory(acc.id!, acc);
        await window.api.removeSyncItem(item.id!);
        loadData();
      }
    } else if (item.type === 'firearm_log') {
      const fId = Number((item as any).firearmId);
      const firearm = firearms.find((f) => f.id === fId);
      if (firearm) {
        let image_path = '';
        if ((item as any).photoBase64) {
          const ext = (item as any).photoBase64.split(';')[0].split('/')[1] || 'jpg';
          const filename = `photo_${Date.now()}_log.${ext}`;
          image_path =
            (await window.api.saveBase64Photo((item as any).photoBase64, filename)) || '';
        }

        const newLog: any = {
          id: Date.now(),
          date: new Date(item.timestamp).toISOString().split('T')[0],
          type: (item as any).logType === 'maintenance' ? 'Cleaning' : 'Range',
          notes: (item as any).notes || '',
          rounds_fired: parseInt((item as any).roundCount) || 0,
          image_path: image_path || undefined,
        };

        const updatedLogs = [...(firearm.logs || []), newLog];
        await window.api.updateFirearm(fId, { ...firearm, logs: updatedLogs });
        await window.api.removeSyncItem(item.id!);
        loadData();
      }
    } else if (item.type === 'firearm_photo') {
      const fId = Number((item as any).firearmId);
      const firearm = firearms.find((f) => f.id === fId);
      if (firearm && (item as any).photoBase64) {
        const ext = (item as any).photoBase64.split(';')[0].split('/')[1] || 'jpg';
        const filename = `photo_${Date.now()}_firearm.${ext}`;
        const image_path = await window.api.saveBase64Photo((item as any).photoBase64, filename);

        if (image_path) {
          const updatedPhotos = [...(firearm.photos || []), image_path];
          await window.api.updateFirearm(fId, { ...firearm, photos: updatedPhotos });
        }
        await window.api.removeSyncItem(item.id!);
        loadData();
      }
    } else if (item.type === 'range_session') {
      const fId = Number(item.firearm_id);
      const aId = item.ammo_id ? Number(item.ammo_id) : undefined;
      const rounds = Number(item.rounds_fired || item.count) || 0;

      if (window.api && window.api.logRangeSession) {
        await window.api.logRangeSession({
          firearm_id: fId,
          ammo_id: aId,
          rounds_fired: rounds,
          date: item.date || new Date(item.timestamp).toISOString().split('T')[0],
          notes: item.notes || '',
          cost: item.cost || 0,
        });
        await window.api.removeSyncItem(item.id!);
        loadData();
      }
    } else if (item.type === 'firearm_maintenance') {
      const fId = Number(item.firearm_id);
      const firearm = firearms.find((f) => f.id === fId);
      if (firearm && window.api && window.api.updateFirearm) {
        const logNote = `[Maintenance] ${item.notes || (item as any).service_type || 'Service performed'} on ${item.date || new Date().toLocaleDateString()}`;
        const updatedNotes = firearm.notes ? `${firearm.notes}\n${logNote}` : logNote;
        await window.api.updateFirearm(fId, { ...firearm, notes: updatedNotes });
      }
      await window.api.removeSyncItem(item.id!);
      loadData();
    } else if (item.type === 'bill_of_sale_transfer') {
      const fId = Number(item.firearm_id);
      const firearm = firearms.find((f) => f.id === fId);
      if (firearm && window.api && window.api.updateFirearm) {
        const transferNote = `[SOLD / TRANSFERRED] Transferred to ${item.buyer_name || 'Buyer'} (DL: ${item.buyer_dl || 'On File'}) for $${item.sale_price || 0} on ${item.date || new Date().toLocaleDateString()}. Bill of Sale ID: ${item.transfer_id || 'N/A'}`;
        const updatedNotes = firearm.notes ? `${firearm.notes}\n${transferNote}` : transferNote;

        await window.api.updateFirearm(fId, {
          ...firearm,
          condition: 'Sold / Transferred',
          notes: updatedNotes,
        });
      }
      await window.api.removeSyncItem(item.id!);
      loadData();
    } else if (item.type === 'new_firearm') {
      const data: any = item.data || item;
      const make = data.make || '';
      const model = data.model || '';
      const caliber = data.caliber || '';
      const serial_number = data.serial_number || '';

      // Check if duplicate serial already exists
      const existing = firearms.find(
        (f) =>
          serial_number &&
          f.serial_number &&
          f.serial_number.trim().toLowerCase() === serial_number.trim().toLowerCase()
      );

      const savedPhotos: string[] = [];
      if (data.photosBase64 && Array.isArray(data.photosBase64)) {
        for (let i = 0; i < data.photosBase64.length; i++) {
          const b64 = data.photosBase64[i];
          const ext = b64.split(';')[0].split('/')[1] || 'jpg';
          const filename = `firearm_${Date.now()}_${i}.${ext}`;
          const savedPath = await window.api.saveBase64Photo(b64, filename);
          if (savedPath) savedPhotos.push(savedPath);
        }
      } else if (data.photoBase64) {
        const ext = data.photoBase64.split(';')[0].split('/')[1] || 'jpg';
        const filename = `firearm_${Date.now()}.${ext}`;
        const savedPath = await window.api.saveBase64Photo(data.photoBase64, filename);
        if (savedPath) savedPhotos.push(savedPath);
      }

      if (existing && existing.id !== undefined) {
        const updated = {
          ...existing,
          ...data,
          photos: [...(existing.photos || []), ...savedPhotos],
          image_path: existing.image_path || (savedPhotos.length > 0 ? savedPhotos[0] : ''),
        };
        await window.api.updateFirearm(existing.id, updated);
      } else {
        const newFirearm: any = {
          make,
          model,
          serial_number,
          caliber,
          action_type: data.action_type || '',
          firearm_type: data.firearm_type || '',
          barrel_length: data.barrel_length || '',
          finish: data.finish || '',
          condition: data.condition || 'Excellent',
          purchase_price: data.purchase_price !== undefined ? data.purchase_price : null,
          purchase_date: data.purchase_date || '',
          purchased_from: data.purchased_from || '',
          notes: data.notes || '',
          is_nfa: !!data.is_nfa,
          nfa_type: data.nfa_type || '',
          image_path: savedPhotos.length > 0 ? savedPhotos[0] : '',
          photos: savedPhotos,
          is_sold: false,
        };
        const newId = await window.api.addFirearm(newFirearm);

        if (data.storageLocationId && window.api.getStorageLocations) {
          const locs = await window.api.getStorageLocations();
          const updatedLocs = assignItemToStorage(
            'firearm',
            newId,
            Number(data.storageLocationId),
            locs || []
          );
          await saveStorageLocations(updatedLocs);
        }
      }

      await window.api.removeSyncItem(item.id!);
      loadData();
    } else if (item.type === 'firearm_update') {
      const data: any = item.data || item;
      const fId = Number(data.firearmId || (item as any).firearmId);
      const serial_number = data.serial_number || '';

      const firearm = firearms.find(
        (f) =>
          (fId && f.id === fId) ||
          (serial_number &&
            f.serial_number &&
            f.serial_number.trim().toLowerCase() === serial_number.trim().toLowerCase())
      );

      if (firearm && firearm.id !== undefined) {
        const savedPhotos: string[] = [];
        if (data.photosBase64 && Array.isArray(data.photosBase64)) {
          for (let i = 0; i < data.photosBase64.length; i++) {
            const b64 = data.photosBase64[i];
            const ext = b64.split(';')[0].split('/')[1] || 'jpg';
            const filename = `firearm_${Date.now()}_${i}.${ext}`;
            const savedPath = await window.api.saveBase64Photo(b64, filename);
            if (savedPath) savedPhotos.push(savedPath);
          }
        } else if (data.photoBase64) {
          const ext = data.photoBase64.split(';')[0].split('/')[1] || 'jpg';
          const filename = `firearm_${Date.now()}.${ext}`;
          const savedPath = await window.api.saveBase64Photo(data.photoBase64, filename);
          if (savedPath) savedPhotos.push(savedPath);
        }

        const updated = {
          ...firearm,
          ...data,
          photos: [...(firearm.photos || []), ...savedPhotos],
          image_path: firearm.image_path || (savedPhotos.length > 0 ? savedPhotos[0] : ''),
        };

        await window.api.updateFirearm(firearm.id, updated);

        if (data.storageLocationId && window.api.getStorageLocations) {
          const locs = await window.api.getStorageLocations();
          const updatedLocs = assignItemToStorage(
            'firearm',
            firearm.id,
            Number(data.storageLocationId),
            locs || []
          );
          await saveStorageLocations(updatedLocs);
        }
      }

      await window.api.removeSyncItem(item.id!);
      loadData();
    }
  };

  const handleApproveAll = async () => {
    if (
      !window.api ||
      !confirm('Automatically approve all recognized sync items? (Unknown items will be skipped)')
    )
      return;

    const currentAmmo = await window.api.getAmmo();
    const currentFirearms = await window.api.getFirearms();
    const currentComponents = window.api.getComponents ? await window.api.getComponents() : [];
    let processedAny = false;

    for (const item of queue) {
      if (item.type === 'ammo_adjustment') {
        const upcOrId = String(item.upcOrId);
        const ammoIndex = currentAmmo.findIndex(
          (a) => String(a.id) === upcOrId || a.upc_code === upcOrId
        );
        if (ammoIndex >= 0) {
          const ammo = currentAmmo[ammoIndex];
          const currentCount = parseInt(ammo.count as any) || 0;
          const adjustment = parseInt(item.count as any) || 0;
          if (item.action === 'add') {
            ammo.count = currentCount + adjustment;
          } else if (item.action === 'remove') {
            ammo.count = Math.max(0, currentCount - adjustment);
          }
          await window.api.updateAmmo(ammo.id!, ammo);
          await window.api.removeSyncItem(item.id!);
          currentAmmo[ammoIndex] = ammo;
          processedAny = true;
        }
      } else if (item.type === 'component_adjustment') {
        const upcOrId = String(item.upcOrId);
        const compIndex = currentComponents.findIndex(
          (c) => String(c.id) === upcOrId || c.upc_code === upcOrId
        );
        if (compIndex >= 0) {
          const component = currentComponents[compIndex];
          const currentCount = parseInt(component.quantity as any) || 0;
          const adjustment = parseInt(item.count as any) || 0;
          if (item.action === 'add') {
            component.quantity = currentCount + adjustment;
          } else if (item.action === 'remove') {
            component.quantity = Math.max(0, currentCount - adjustment);
          }
          await window.api.updateComponent(component.id!, component);
          await window.api.removeSyncItem(item.id!);
          currentComponents[compIndex] = component;
          processedAny = true;
        }
      } else if (item.type === 'accessory_adjustment') {
        const upcOrId = String(item.upcOrId);
        const currentAcc = window.api.getAccessories ? await window.api.getAccessories() : [];
        const accIndex = currentAcc.findIndex(
          (a: any) =>
            String(a.id) === upcOrId ||
            a.serialNumber === upcOrId ||
            (a.notes && a.notes.includes(upcOrId))
        );
        if (accIndex >= 0) {
          const acc = currentAcc[accIndex];
          const currentCount = parseInt(acc.quantity as any) || 0;
          const adjustment = parseInt(item.count as any) || 0;
          if (item.action === 'add') {
            acc.quantity = currentCount + adjustment;
          } else if (item.action === 'remove') {
            acc.quantity = Math.max(0, currentCount - adjustment);
          }
          await window.api.updateAccessory(acc.id!, acc);
          await window.api.removeSyncItem(item.id!);
          processedAny = true;
        }
      } else if (item.type === 'firearm_log') {
        const fId = Number((item as any).firearmId);
        const firearmIndex = currentFirearms.findIndex((f) => f.id === fId);
        if (firearmIndex >= 0) {
          const firearm = currentFirearms[firearmIndex];
          let image_path = '';
          if ((item as any).photoBase64) {
            const ext = (item as any).photoBase64.split(';')[0].split('/')[1] || 'jpg';
            const filename = `photo_${Date.now()}_log.${ext}`;
            image_path =
              (await window.api.saveBase64Photo((item as any).photoBase64, filename)) || '';
          }

          const newLog: any = {
            id: Date.now() + Math.random(),
            date: new Date(item.timestamp).toISOString().split('T')[0],
            type: (item as any).logType === 'maintenance' ? 'Cleaning' : 'Range',
            notes: (item as any).notes || '',
            rounds_fired: parseInt((item as any).roundCount) || 0,
            image_path: image_path || undefined,
          };

          const updatedLogs = [...(firearm.logs || []), newLog];
          const updatedFirearm = { ...firearm, logs: updatedLogs };
          await window.api.updateFirearm(fId, updatedFirearm);
          await window.api.removeSyncItem(item.id!);
          currentFirearms[firearmIndex] = updatedFirearm;
          processedAny = true;
        }
      } else if (item.type === 'firearm_photo') {
        const fId = Number((item as any).firearmId);
        const firearmIndex = currentFirearms.findIndex((f) => f.id === fId);
        if (firearmIndex >= 0) {
          const firearm = currentFirearms[firearmIndex];
          if ((item as any).photoBase64) {
            const ext = (item as any).photoBase64.split(';')[0].split('/')[1] || 'jpg';
            const filename = `photo_${Date.now()}_firearm.${ext}`;
            const image_path = await window.api.saveBase64Photo(
              (item as any).photoBase64,
              filename
            );

            if (image_path) {
              const updatedPhotos = [...(firearm.photos || []), image_path];
              const updatedFirearm = { ...firearm, photos: updatedPhotos };
              await window.api.updateFirearm(fId, updatedFirearm);
              currentFirearms[firearmIndex] = updatedFirearm;
            }
          }
          await window.api.removeSyncItem(item.id!);
          processedAny = true;
        }
      }
    }

    if (processedAny) {
      loadData();
    } else {
      alert(
        'No recognizable items to approve automatically. Unknown barcodes must be resolved manually.'
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (window.api) {
      await window.api.removeSyncItem(id);
      loadData();
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete all pending sync items?')) {
      if (window.api) {
        await window.api.clearSyncQueue();
        loadData();
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mobile Sync</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Pair your phone and manage incoming data.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '1rem',
        }}
      >
        <button
          onClick={() => setActiveTab('inbox')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'inbox' ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: '1.1rem',
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            borderBottom: activeTab === 'inbox' ? '2px solid var(--accent)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Server size={20} /> Sync Inbox
          {queue.length > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                padding: '0.1rem 0.5rem',
                borderRadius: '12px',
              }}
            >
              {queue.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            generateQr();
            setIsPairModalOpen(true);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: isPairModalOpen ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: '1.1rem',
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            borderBottom: isPairModalOpen ? '2px solid var(--accent)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Smartphone size={20} /> Pair Device
        </button>
      </div>

      {/* Auto-Disappearing Pair Success Toast Notification */}
      {pairSuccess &&
        createPortal(
          <div className="toast-floating-container">
            <div className="toast-success-card">
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={28} style={{ color: '#10b981' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  Device Paired Successfully!
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.15rem',
                  }}
                >
                  <strong>{pairSuccess.deviceName}</strong> is now securely linked to ArmoryVault.
                </div>
              </div>
              <button
                onClick={() => setPairSuccess(null)}
                className="btn-icon"
                style={{ padding: '0.25rem', color: 'var(--text-secondary)' }}
                title="Dismiss"
              >
                <X size={16} />
              </button>
              <div className="toast-progress-bar" />
            </div>
          </div>,
          document.body
        )}

      {/* Dedicated QR Code Pairing Modal */}
      {isPairModalOpen &&
        createPortal(
          <div className="modal-overlay" onClick={() => setIsPairModalOpen(false)}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '480px', textAlign: 'center' }}
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    textAlign: 'left',
                  }}
                >
                  <Smartphone size={22} style={{ color: 'var(--accent)' }} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Pair Mobile Companion</h2>
                    <p
                      style={{
                        margin: '0.15rem 0 0',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                      }}
                    >
                      Connect phone over Wi-Fi to sync barcode scans & logs.
                    </p>
                  </div>
                </div>
                <button
                  className="btn-icon"
                  onClick={() => setIsPairModalOpen(false)}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.25rem',
                }}
              >
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  Open the <strong>ArmoryVault Companion App</strong> on your phone and point your
                  camera at this QR code.
                </p>

                <div
                  style={{
                    background: '#ffffff',
                    padding: '1rem',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {syncQrUrl ? (
                    <img
                      src={syncQrUrl}
                      alt="Pairing QR Code"
                      style={{
                        width: '220px',
                        height: '220px',
                        display: 'block',
                        borderRadius: '8px',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '220px',
                        height: '220px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                      }}
                    >
                      <RefreshCw size={24} className="spin" />
                    </div>
                  )}
                </div>

                {/* Real-time Listening Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '20px',
                    padding: '0.4rem 1rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span className="pulse-dot" />
                  <span>
                    Listening on Wi-Fi: <strong>{localIp || 'Local Network'}:3456</strong>
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Info size={15} color="#38bdf8" style={{ flexShrink: 0 }} />
                  <span>
                    Once scanned, this window will automatically close and show your paired
                    confirmation.
                  </span>
                </div>
              </div>

              <div
                className="modal-actions"
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handlePairSuccess('Companion App (Simulated)')}
                  style={{ fontSize: '0.8rem', opacity: 0.7 }}
                  title="Test pair event locally"
                >
                  <Sparkles size={14} /> Test Pair
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsPairModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {activeTab === 'inbox' && (
        <div>
          {queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <RefreshCw size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <h2>No pending items</h2>
              <p>Scan items on your mobile app and tap "Sync" to send them here.</p>
              <div style={{ marginTop: '1.5rem' }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    generateQr();
                    setIsPairModalOpen(true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Smartphone size={18} /> Pair Mobile Device
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: '1rem',
                  gap: '0.5rem',
                }}
              >
                <button className="btn-primary" onClick={handleApproveAll}>
                  <CheckCircle size={16} /> Approve All Valid
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleClearAll}
                  style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <Trash2 size={16} /> Clear All
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {queue.map((item) => {
                  if (item.type === 'ammo_adjustment') {
                    const upcOrId = String(item.upcOrId);
                    const ammo = ammoList.find(
                      (a) => String(a.id) === upcOrId || a.upc_code === upcOrId
                    );

                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1.5rem',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                background: 'rgba(56, 189, 248, 0.1)',
                                color: '#38bdf8',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                              }}
                            >
                              Ammo
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>

                          {ammo ? (
                            <div>
                              <h3
                                style={{
                                  fontSize: '1.1rem',
                                  margin: '0 0 0.25rem 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                }}
                              >
                                <CheckCircle size={18} color="var(--success)" />
                                {ammo.caliber} - {ammo.manufacturer}
                              </h3>
                              <p
                                style={{
                                  margin: 0,
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.9rem',
                                }}
                              >
                                Action:{' '}
                                <strong
                                  style={{
                                    color:
                                      item.action === 'add' ? 'var(--success)' : 'var(--danger)',
                                  }}
                                >
                                  {item.action === 'add' ? 'ADD' : 'REMOVE'} {item.count}{' '}
                                  {item.measurement || ''} rds
                                </strong>
                                <span style={{ opacity: 0.5, marginLeft: '0.5rem' }}>
                                  (Current stock: {ammo.count})
                                </span>
                              </p>
                            </div>
                          ) : (
                            <div>
                              <h3
                                style={{
                                  fontSize: '1.1rem',
                                  margin: '0 0 0.25rem 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  color: 'var(--warning)',
                                }}
                              >
                                <AlertTriangle size={18} />
                                Unknown Barcode: {upcOrId}
                              </h3>
                              <p
                                style={{
                                  margin: 0,
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.9rem',
                                }}
                              >
                                Action:{' '}
                                <strong
                                  style={{
                                    color:
                                      item.action === 'add' ? 'var(--success)' : 'var(--danger)',
                                  }}
                                >
                                  {item.action === 'add' ? 'ADD' : 'REMOVE'} {item.count} rds
                                </strong>
                              </p>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {ammo ? (
                            <button className="btn-primary" onClick={() => handleApprove(item)}>
                              Approve
                            </button>
                          ) : (
                            <button
                              className="btn-primary"
                              onClick={() =>
                                navigate('/ammo', {
                                  state: {
                                    openAddModal: true,
                                    upc: upcOrId,
                                    count: item.count,
                                    syncItemId: item.id,
                                  },
                                })
                              }
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                              <PlusCircle size={16} /> Resolve & Add
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(item.id!)}
                            style={{ color: 'var(--danger)' }}
                            title="Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'component_adjustment') {
                    const upcOrId = String(item.upcOrId);
                    const component = componentsList.find(
                      (c) => String(c.id) === upcOrId || c.upc_code === upcOrId
                    );

                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1.5rem',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                background: 'rgba(139, 92, 246, 0.1)',
                                color: '#8b5cf6',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                              }}
                            >
                              Component
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>

                          {component ? (
                            <div>
                              <h3
                                style={{
                                  fontSize: '1.1rem',
                                  margin: '0 0 0.25rem 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                }}
                              >
                                <CheckCircle size={18} color="var(--success)" />
                                {component.name} - {component.manufacturer}
                              </h3>
                              <p
                                style={{
                                  margin: 0,
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.9rem',
                                }}
                              >
                                Action:{' '}
                                <strong
                                  style={{
                                    color:
                                      item.action === 'add' ? 'var(--success)' : 'var(--danger)',
                                  }}
                                >
                                  {item.action === 'add' ? 'ADD' : 'REMOVE'} {item.count}
                                </strong>
                                <span style={{ opacity: 0.5, marginLeft: '0.5rem' }}>
                                  (Current stock: {component.quantity})
                                </span>
                              </p>
                            </div>
                          ) : (
                            <div>
                              <h3
                                style={{
                                  fontSize: '1.1rem',
                                  margin: '0 0 0.25rem 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  color: 'var(--warning)',
                                }}
                              >
                                <AlertTriangle size={18} />
                                Unknown Barcode: {upcOrId}
                              </h3>
                              <p
                                style={{
                                  margin: 0,
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.9rem',
                                }}
                              >
                                Action:{' '}
                                <strong
                                  style={{
                                    color:
                                      item.action === 'add' ? 'var(--success)' : 'var(--danger)',
                                  }}
                                >
                                  {item.action === 'add' ? 'ADD' : 'REMOVE'} {item.count}
                                </strong>
                              </p>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {component ? (
                            <button className="btn-primary" onClick={() => handleApprove(item)}>
                              Approve
                            </button>
                          ) : (
                            <button
                              className="btn-primary"
                              onClick={() =>
                                navigate('/components', {
                                  state: {
                                    openAddModal: true,
                                    upc: upcOrId,
                                    count: item.count,
                                    syncItemId: item.id,
                                  },
                                })
                              }
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                              <PlusCircle size={16} /> Resolve & Add
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(item.id!)}
                            style={{ color: 'var(--danger)' }}
                            title="Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (item.type === 'new_firearm') {
                    const data: any = item.data || item;
                    const make = data.make || 'Unknown Make';
                    const model = data.model || 'Unknown Model';
                    const caliber = data.caliber || '';
                    const serial = data.serial_number || '';
                    const hasPhoto =
                      data.photoBase64 || (data.photosBase64 && data.photosBase64.length > 0);
                    const photoSrc =
                      data.photoBase64 || (data.photosBase64 && data.photosBase64[0]);
                    const existing = firearms.find(
                      (f) =>
                        serial &&
                        f.serial_number &&
                        f.serial_number.trim().toLowerCase() === serial.trim().toLowerCase()
                    );

                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1.5rem',
                          gap: '1rem',
                        }}
                      >
                        {hasPhoto && photoSrc && (
                          <img
                            src={photoSrc}
                            alt={`${make} ${model}`}
                            style={{
                              width: '72px',
                              height: '72px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1px solid var(--border)',
                              backgroundColor: 'rgba(0,0,0,0.2)',
                            }}
                          />
                        )}

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                background: existing
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(59, 130, 246, 0.15)',
                                color: existing ? '#f59e0b' : '#3b82f6',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                              }}
                            >
                              {existing ? 'Firearm (Serial Match)' : 'New Firearm'}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div>
                            <h3
                              style={{
                                fontSize: '1.15rem',
                                margin: '0 0 0.25rem 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                            >
                              <Shield size={18} color="#3b82f6" />
                              {make} {model} {caliber ? `• ${caliber}` : ''}
                            </h3>
                            <p
                              style={{
                                margin: 0,
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem',
                              }}
                            >
                              {serial ? `S/N: ${serial} ` : ''}
                              {data.action_type ? `• ${data.action_type} ` : ''}
                              {data.condition ? `• Condition: ${data.condition} ` : ''}
                              {data.purchase_price ? `• $${data.purchase_price} ` : ''}
                            </p>
                            {data.notes && (
                              <p
                                style={{
                                  margin: '0.4rem 0 0 0',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.85rem',
                                  fontStyle: 'italic',
                                }}
                              >
                                "{data.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            className="btn-primary"
                            onClick={() => handleApprove(item)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <CheckCircle size={16} />
                            {existing ? 'Update' : 'Direct Add'}
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() =>
                              navigate('/firearms/new', {
                                state: {
                                  parsedData: data,
                                  syncItemId: item.id,
                                },
                              })
                            }
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <Edit3 size={15} /> Review
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(item.id!)}
                            style={{ color: 'var(--danger)' }}
                            title="Dismiss"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (item.type === 'firearm_update') {
                    const data: any = item.data || item;
                    const fId = Number(data.firearmId || (item as any).firearmId);
                    const serial = data.serial_number || '';
                    const firearm = firearms.find(
                      (f) =>
                        (fId && f.id === fId) ||
                        (serial &&
                          f.serial_number &&
                          f.serial_number.trim().toLowerCase() === serial.trim().toLowerCase())
                    );
                    const make = data.make || firearm?.make || 'Firearm';
                    const model = data.model || firearm?.model || '';
                    const hasPhoto =
                      data.photoBase64 || (data.photosBase64 && data.photosBase64.length > 0);
                    const photoSrc =
                      data.photoBase64 || (data.photosBase64 && data.photosBase64[0]);

                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1.5rem',
                          gap: '1rem',
                        }}
                      >
                        {hasPhoto && photoSrc && (
                          <img
                            src={photoSrc}
                            alt={`${make} ${model}`}
                            style={{
                              width: '72px',
                              height: '72px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1px solid var(--border)',
                              backgroundColor: 'rgba(0,0,0,0.2)',
                            }}
                          />
                        )}

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#f59e0b',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                              }}
                            >
                              Firearm Spec Update
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div>
                            <h3
                              style={{
                                fontSize: '1.15rem',
                                margin: '0 0 0.25rem 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                            >
                              <Shield size={18} color="#f59e0b" />
                              {make} {model} {data.caliber ? `• ${data.caliber}` : ''}
                            </h3>
                            <p
                              style={{
                                margin: 0,
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem',
                              }}
                            >
                              {serial ? `S/N: ${serial} ` : ''}
                              {data.condition ? `• Condition: ${data.condition} ` : ''}
                              {hasPhoto ? '• New Photo Attached ' : ''}
                            </p>
                            {data.notes && (
                              <p
                                style={{
                                  margin: '0.4rem 0 0 0',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.85rem',
                                  fontStyle: 'italic',
                                }}
                              >
                                "{data.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            className="btn-primary"
                            onClick={() => handleApprove(item)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <CheckCircle size={16} /> Apply Update
                          </button>
                          {firearm && (
                            <button
                              className="btn-secondary"
                              onClick={() =>
                                navigate(`/details/${firearm.id}`, {
                                  state: {
                                    parsedData: data,
                                    syncItemId: item.id,
                                  },
                                })
                              }
                              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <Edit3 size={15} /> Review
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(item.id!)}
                            style={{ color: 'var(--danger)' }}
                            title="Dismiss"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (item.type === 'firearm_log') {
                    const fId = Number((item as any).firearmId);
                    const firearm = firearms.find((f) => f.id === fId);

                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1.5rem',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                              }}
                            >
                              Firearm Log
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>

                          {firearm ? (
                            <div>
                              <h3
                                style={{
                                  fontSize: '1.1rem',
                                  margin: '0 0 0.25rem 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                }}
                              >
                                <CheckCircle size={18} color="var(--success)" />
                                {firearm.make} {firearm.model}{' '}
                                {firearm.caliber ? `(${firearm.caliber})` : ''}
                              </h3>
                              <p
                                style={{
                                  margin: 0,
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.9rem',
                                }}
                              >
                                <strong>
                                  {(item as any).logType === 'range' ? 'Range Log' : 'Maintenance'}
                                </strong>{' '}
                                -{' '}
                                {(item as any).roundCount > 0
                                  ? `${(item as any).roundCount} Rounds Fired`
                                  : 'No rounds recorded'}
                              </p>
                              {(item as any).notes && (
                                <p
                                  style={{
                                    margin: '0.5rem 0 0 0',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                    fontStyle: 'italic',
                                  }}
                                >
                                  "{(item as any).notes}"
                                </p>
                              )}
                              {(item as any).photoBase64 && (
                                <p
                                  style={{
                                    margin: '0.2rem 0 0 0',
                                    color: 'var(--accent)',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                  }}
                                >
                                  <Paperclip size={13} /> Photo Attached
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <h3
                                style={{
                                  fontSize: '1.1rem',
                                  margin: '0 0 0.25rem 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  color: 'var(--warning)',
                                }}
                              >
                                <AlertTriangle size={18} />
                                Unknown Firearm ID: {fId}
                              </h3>
                              <p
                                style={{
                                  margin: 0,
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.9rem',
                                }}
                              >
                                Action: {(item as any).logType}
                              </p>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {firearm && (
                            <button className="btn-primary" onClick={() => handleApprove(item)}>
                              Approve
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(item.id!)}
                            style={{ color: 'var(--danger)' }}
                            title="Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (item.type === 'universal_scan') {
                    const upcOrId = String(item.upcOrId);
                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1.5rem',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                background: 'rgba(234, 179, 8, 0.1)',
                                color: '#eab308',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                              }}
                            >
                              Universal Scan
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <h3
                              style={{
                                fontSize: '1.1rem',
                                margin: '0 0 0.25rem 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: 'var(--accent)',
                              }}
                            >
                              <AlertTriangle size={18} />
                              Uncategorized Barcode: {upcOrId}
                            </h3>
                            <p
                              style={{
                                margin: 0,
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem',
                              }}
                            >
                              Sent from mobile scanner. Click Resolve to look it up.
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-primary"
                            onClick={() => handleResolveUniversal(item)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            disabled={isResolving === item.id}
                          >
                            {isResolving === item.id ? (
                              <RefreshCw size={16} className="spin" />
                            ) : (
                              <PlusCircle size={16} />
                            )}
                            {isResolving === item.id ? 'Resolving...' : 'Resolve & Add'}
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(item.id!)}
                            style={{ color: 'var(--danger)' }}
                            title="Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'firearm_photo') {
                    const fId = Number((item as any).firearmId);
                    const firearm = firearms.find((f) => f.id === fId);

                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1.5rem',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                background: 'rgba(168, 85, 247, 0.1)',
                                color: '#a855f7',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                              }}
                            >
                              Firearm Photo
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>

                          {firearm ? (
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              {(item as any).photoBase64 && (
                                <img
                                  src={(item as any).photoBase64}
                                  alt="Preview"
                                  style={{
                                    width: 60,
                                    height: 60,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    border: '1px solid var(--border-light)',
                                  }}
                                />
                              )}
                              <div>
                                <h3
                                  style={{
                                    fontSize: '1.1rem',
                                    margin: '0 0 0.25rem 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                  }}
                                >
                                  <CheckCircle size={18} color="var(--success)" />
                                  {firearm.make} {firearm.model}{' '}
                                  {firearm.caliber ? `(${firearm.caliber})` : ''}
                                </h3>
                                <p
                                  style={{
                                    margin: 0,
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  New photo for inspection gallery
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h3
                                style={{
                                  fontSize: '1.1rem',
                                  margin: '0 0 0.25rem 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  color: 'var(--warning)',
                                }}
                              >
                                <AlertTriangle size={18} />
                                Unknown Firearm ID: {fId}
                              </h3>
                              <p
                                style={{
                                  margin: 0,
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.9rem',
                                }}
                              >
                                Action: Add Photo
                              </p>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {firearm && (
                            <button className="btn-primary" onClick={() => handleApprove(item)}>
                              Approve
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(item.id!)}
                            style={{ color: 'var(--danger)' }}
                            title="Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'range_session') {
                    const fId = Number(item.firearm_id);
                    const firearm = firearms.find((f) => f.id === fId);
                    const ammo = item.ammo_id
                      ? ammoList.find((a) => a.id === Number(item.ammo_id))
                      : null;
                    const rounds = item.rounds_fired || item.count || 0;

                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1.5rem',
                          background: 'rgba(56, 189, 248, 0.03)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                              }}
                            >
                              Range Trip Session
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {item.date || new Date(item.timestamp).toLocaleDateString()}
                            </span>
                          </div>

                          <div>
                            <h3
                              style={{
                                fontSize: '1.15rem',
                                margin: '0 0 0.25rem 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                            >
                              <CheckCircle size={18} color="var(--success)" />
                              {firearm
                                ? `${firearm.make} ${firearm.model} (${firearm.caliber})`
                                : `Firearm #${fId}`}
                            </h3>
                            <div
                              style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-primary)',
                                marginTop: '0.25rem',
                              }}
                            >
                              Fired:{' '}
                              <strong style={{ color: 'var(--accent)' }}>{rounds} rounds</strong>
                              {ammo && (
                                <span
                                  style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}
                                >
                                  &bull; Ammo: {ammo.manufacturer || 'Custom'} {ammo.caliber}{' '}
                                  {ammo.grain ? `${ammo.grain}gr` : ''} (Will deduct from stock:{' '}
                                  {ammo.count} rds)
                                </span>
                              )}
                            </div>
                            {item.group_metrics && (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  marginTop: '0.5rem',
                                  padding: '0.4rem 0.75rem',
                                  background: 'rgba(16, 185, 129, 0.12)',
                                  border: '1px solid rgba(16, 185, 129, 0.4)',
                                  borderRadius: '6px',
                                }}
                              >
                                <span
                                  style={{
                                    color: '#34d399',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Target size={13} color="#34d399" />
                                  <span>
                                    {item.group_metrics.moa} MOA Group (
                                    {item.group_metrics.extremeSpreadInches ||
                                      item.group_metrics.extreme_spread_in}
                                    ")
                                  </span>
                                </span>
                                <span
                                  style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}
                                >
                                  {item.group_metrics.shotCount || item.group_metrics.shot_count}{' '}
                                  Shots &bull; Mean Radius:{' '}
                                  {item.group_metrics.meanRadiusInches ||
                                    item.group_metrics.mean_radius_in}
                                  "
                                </span>
                              </div>
                            )}

                            {item.group_metrics?.turretAdjustment && (
                              <div
                                style={{
                                  color: '#38bdf8',
                                  fontSize: '0.8rem',
                                  marginTop: '0.35rem',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <ScopeIcon size={13} color="#38bdf8" />
                                <span>
                                  Scope Zero: Dial{' '}
                                  {item.group_metrics.turretAdjustment.elevationDirection}{' '}
                                  {item.group_metrics.turretAdjustment.elevationClicks} clicks,{' '}
                                  {item.group_metrics.turretAdjustment.windageDirection}{' '}
                                  {item.group_metrics.turretAdjustment.windageClicks} clicks (
                                  {item.group_metrics.turretAdjustment.clickUnitLabel})
                                </span>
                              </div>
                            )}

                            {item.notes && (
                              <div
                                style={{
                                  fontSize: '0.85rem',
                                  color: 'var(--text-secondary)',
                                  marginTop: '0.35rem',
                                  fontStyle: 'italic',
                                }}
                              >
                                Notes: {item.notes}
                              </div>
                            )}

                            {item.photoBase64 && (
                              <div style={{ marginTop: '0.75rem' }}>
                                <img
                                  src={item.photoBase64}
                                  alt="Target Grouping"
                                  style={{
                                    height: '80px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    objectFit: 'cover',
                                  }}
                                  onClick={() => window.open(item.photoBase64)}
                                  title="Click to view full target"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-primary"
                            onClick={() => handleApprove(item)}
                            style={{ background: 'var(--success)' }}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(item.id!)}
                            style={{ color: 'var(--danger)' }}
                            title="Decline / Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'firearm_maintenance') {
                    const fId = Number(item.firearm_id);
                    const firearm = firearms.find((f) => f.id === fId);

                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1.5rem',
                          background: 'rgba(56, 189, 248, 0.03)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                              }}
                            >
                              Firearm Maintenance
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {item.date || new Date(item.timestamp).toLocaleDateString()}
                            </span>
                          </div>

                          <div>
                            <h3
                              style={{
                                fontSize: '1.15rem',
                                margin: '0 0 0.25rem 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                            >
                              <CheckCircle size={18} color="#38bdf8" />
                              {firearm ? `${firearm.make} ${firearm.model}` : `Firearm #${fId}`}
                            </h3>
                            <div
                              style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-primary)',
                                marginTop: '0.25rem',
                              }}
                            >
                              Service:{' '}
                              <strong style={{ color: '#38bdf8' }}>
                                {item.notes || (item as any).service_type || 'Service Performed'}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-primary"
                            onClick={() => handleApprove(item)}
                            style={{ background: 'var(--success)' }}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(item.id!)}
                            style={{ color: 'var(--danger)' }}
                            title="Decline / Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'bill_of_sale_transfer') {
                    const fId = Number(item.firearm_id);
                    const firearm = firearms.find((f) => f.id === fId);

                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1.5rem',
                          background: 'rgba(16, 185, 129, 0.03)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                              }}
                            >
                              Private Bill of Sale
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {item.date || new Date(item.timestamp).toLocaleDateString()}
                            </span>
                            {item.transfer_id && (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                ID: {item.transfer_id}
                              </span>
                            )}
                          </div>

                          <div>
                            <h3
                              style={{
                                fontSize: '1.15rem',
                                margin: '0 0 0.25rem 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                            >
                              <CheckCircle size={18} color="#10b981" />
                              {firearm ? `${firearm.make} ${firearm.model}` : `Firearm #${fId}`}
                              <span
                                style={{
                                  fontSize: '0.9rem',
                                  color: '#10b981',
                                  fontWeight: 'normal',
                                }}
                              >
                                — Sold for ${item.sale_price || 0}
                              </span>
                            </h3>
                            <div
                              style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-primary)',
                                marginTop: '0.25rem',
                              }}
                            >
                              Buyer: <strong>{item.buyer_name || 'Buyer'}</strong> (DL:{' '}
                              {item.buyer_dl || 'Verified'})
                            </div>
                            {item.pdf_base64 && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <a
                                  href={item.pdf_base64}
                                  download={`BillOfSale_${item.transfer_id || 'transfer'}.pdf`}
                                  className="btn-secondary"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.3rem 0.7rem',
                                    fontSize: '0.8rem',
                                    textDecoration: 'none',
                                  }}
                                >
                                  📄 Download Signed PDF
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-primary"
                            onClick={() => handleApprove(item)}
                            style={{ background: 'var(--success)' }}
                          >
                            Approve & Update Bound Book
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(item.id!)}
                            style={{ color: 'var(--danger)' }}
                            title="Decline / Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="card" style={{ padding: '1.5rem' }}>
                      <p>Unknown event type: {item.type}</p>
                      <button className="btn-secondary" onClick={() => handleDelete(item.id!)}>
                        Dismiss
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {pendingBoxSizePrompt &&
        createPortal(
          <div className="modal-overlay" onClick={() => setPendingBoxSizePrompt(null)}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '400px' }}
            >
              <div className="modal-header">
                <h2>Unknown Box Size</h2>
                <button className="btn-icon" onClick={() => setPendingBoxSizePrompt(null)}>
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  We couldn't determine the standard box size for this item from the barcode. How
                  many units (e.g. rounds, bullets) are in one box?
                </p>
                <div className="form-group">
                  <label>Quantity per Box</label>
                  <input
                    type="number"
                    value={customBoxSize}
                    onChange={(e) => setCustomBoxSize(e.target.value)}
                    autoFocus
                  />
                </div>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    marginTop: '1rem',
                    fontStyle: 'italic',
                  }}
                >
                  This box size will be saved to your Custom SKUs database for all future scans of
                  this item.
                </p>
              </div>
              <div
                className="modal-actions"
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-light)',
                }}
              >
                <button className="btn-secondary" onClick={() => setPendingBoxSizePrompt(null)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={saveCustomBoxSize}>
                  Save & Approve
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {unknownRouteItem &&
        createPortal(
          <div className="modal-overlay" onClick={() => setUnknownRouteItem(null)}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '400px' }}
            >
              <div className="modal-header">
                <h2>Item Not Found</h2>
                <button className="btn-icon" onClick={() => setUnknownRouteItem(null)}>
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Barcode <strong>{unknownRouteItem.upc}</strong> wasn't found in the global
                  database. What kind of item is this?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      await window.api.removeSyncItem(unknownRouteItem.item.id!);
                      navigate('/ammo', {
                        state: { openAddModal: true, upc: unknownRouteItem.upc },
                      });
                    }}
                  >
                    Add as Ammo
                  </button>
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      await window.api.removeSyncItem(unknownRouteItem.item.id!);
                      navigate('/components', {
                        state: { openAddModal: true, upc: unknownRouteItem.upc },
                      });
                    }}
                  >
                    Add as Component
                  </button>
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      await window.api.removeSyncItem(unknownRouteItem.item.id!);
                      navigate('/accessories', {
                        state: { openAddModal: true, upc: unknownRouteItem.upc },
                      });
                    }}
                  >
                    Add as Accessory
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
