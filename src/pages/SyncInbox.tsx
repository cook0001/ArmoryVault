import React, { useState, useEffect } from 'react';
import { SyncItem, Ammo, Firearm, ReloadingComponent } from '../types';
import { Smartphone, CheckCircle, AlertTriangle, Trash2, PlusCircle, Server, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseBarcodeData } from '../utils/BarcodeEngine';

export const SyncInbox = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'pair'>('inbox');
  const [queue, setQueue] = useState<SyncItem[]>([]);
  const [syncQrUrl, setSyncQrUrl] = useState('');
  const [ammoList, setAmmoList] = useState<Ammo[]>([]);
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [componentsList, setComponentsList] = useState<ReloadingComponent[]>([]);
  const [accessoriesList, setAccessoriesList] = useState<any[]>([]);
  const [skus, setSkus] = useState<Record<string, any>>({});
  const [pendingBoxSizePrompt, setPendingBoxSizePrompt] = useState<{item: SyncItem, target: any} | null>(null);
  const [customBoxSize, setCustomBoxSize] = useState('50');
  const navigate = useNavigate();
  const [isResolving, setIsResolving] = useState<number | null>(null);
  const [unknownRouteItem, setUnknownRouteItem] = useState<{item: SyncItem, upc: string} | null>(null);

  useEffect(() => {
    loadData();
    generateQr();

    let unsubscribe: (() => void) | undefined;
    if (window.api && window.api.onSyncReceived) {
      unsubscribe = window.api.onSyncReceived(() => {
        loadData();
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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
          if (acc.some((a: any) => String(a.id) === upcOrId || a.serialNumber === upcOrId || (a.notes && a.notes.includes(upcOrId)))) {
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
      const qrData = `armoryvault://sync?ip=${ip}&port=3456`;
      const QRCode = (await import('qrcode')).default;
      const url = await QRCode.toDataURL(qrData, { width: 300, margin: 1 });
      setSyncQrUrl(url);
    }
  };

  
  const handleResolveUniversal = async (item: SyncItem) => {
    setIsResolving(item.id!);
    try {
      const upcOrId = String(item.upcOrId);

      // 1. Check Custom SKU Dictionary first
      if (skus) {
        const matchedSkuKey = Object.keys(skus).find(k => k.trim().toUpperCase() === upcOrId.trim().toUpperCase());
        if (matchedSkuKey) {
          const skuData = skus[matchedSkuKey];
          const cat = skuData.category || (skuData.accessoryType ? 'accessory' : skuData.componentType ? 'component' : 'ammo');
          
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
                  notes: skuData.notes
                },
                syncItemId: item.id
              }
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
                  weightUnit: skuData.weightUnit
                },
                syncItemId: item.id
              }
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
                  costPerRound: skuData.costPerRound
                },
                syncItemId: item.id
              }
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
        navigate('/ammo', { state: { openAddModal: true, upc: upcOrId, parsedData: parsedData.parsedAmmo, syncItemId: item.id } });
      } else if (parsedData.category === 'component') {
        await window.api.removeSyncItem(item.id!);
        navigate('/components', { state: { openAddModal: true, upc: upcOrId, parsedData: parsedData.parsedComponent, syncItemId: item.id } });
      } else if (parsedData.category === 'accessory') {
        await window.api.removeSyncItem(item.id!);
        navigate('/accessories', { state: { openAddModal: true, upc: upcOrId, parsedData: parsedData.parsedAccessory, syncItemId: item.id } });
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
      const currentDbSkus = (window.api && window.api.getSkus) ? await window.api.getSkus() : skus;
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
      const ammo = ammoList.find(a => String(a.id) === upcOrId || a.upc_code === upcOrId);
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
                     const currentDbSkus = (window.api && window.api.getSkus) ? await window.api.getSkus() : skus;
                     const newSkus = { ...currentDbSkus, [ammo.upc_code]: { ...(currentDbSkus[ammo.upc_code] || {}), count: boxSize } };
                     await window.api.saveSkus(newSkus);
                     setSkus(newSkus);
                   }
                }
             }
           } catch (e) { }
        }
        
        if (boxSize === 0) {
           setPendingBoxSizePrompt({ item, target: ammo });
           return;
        }
        
        return finalizeApprove(item, ammo, boxSize);
      }
    } else if (item.type === 'component_adjustment') {
      const upcOrId = String(item.upcOrId);
      const component = componentsList.find(c => String(c.id) === upcOrId || c.upc_code === upcOrId);
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
                     const currentDbSkus = (window.api && window.api.getSkus) ? await window.api.getSkus() : skus;
                     const newSkus = { ...currentDbSkus, [component.upc_code]: { ...(currentDbSkus[component.upc_code] || {}), count: unitSize } };
                     await window.api.saveSkus(newSkus);
                     setSkus(newSkus);
                   }
                }
             }
           } catch (e) { }
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
      const acc = accessoriesList.find((a: any) => String(a.id) === upcOrId || a.serialNumber === upcOrId || (a.notes && a.notes.includes(upcOrId)));
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
      const firearm = firearms.find(f => f.id === fId);
      if (firearm) {
        let image_path = '';
        if ((item as any).photoBase64) {
          const ext = (item as any).photoBase64.split(';')[0].split('/')[1] || 'jpg';
          const filename = `photo_${Date.now()}_log.${ext}`;
          image_path = await window.api.saveBase64Photo((item as any).photoBase64, filename) || '';
        }

        const newLog: any = {
          id: Date.now(),
          date: new Date(item.timestamp).toISOString().split('T')[0],
          type: (item as any).logType === 'maintenance' ? 'Cleaning' : 'Range',
          notes: (item as any).notes || '',
          rounds_fired: parseInt((item as any).roundCount) || 0,
          image_path: image_path || undefined
        };

        const updatedLogs = [...(firearm.logs || []), newLog];
        await window.api.updateFirearm(fId, { ...firearm, logs: updatedLogs });
        await window.api.removeSyncItem(item.id!);
        loadData();
      }
    } else if (item.type === 'firearm_photo') {
      const fId = Number((item as any).firearmId);
      const firearm = firearms.find(f => f.id === fId);
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
          cost: item.cost || 0
        });
        await window.api.removeSyncItem(item.id!);
        loadData();
      }
    }
  };

  const handleApproveAll = async () => {
    if (!window.api || !confirm('Automatically approve all recognized sync items? (Unknown items will be skipped)')) return;
    
    let currentAmmo = await window.api.getAmmo();
    let currentFirearms = await window.api.getFirearms();
    let currentComponents = window.api.getComponents ? await window.api.getComponents() : [];
    let processedAny = false;

    for (const item of queue) {
      if (item.type === 'ammo_adjustment') {
        const upcOrId = String(item.upcOrId);
        const ammoIndex = currentAmmo.findIndex(a => String(a.id) === upcOrId || a.upc_code === upcOrId);
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
        const compIndex = currentComponents.findIndex(c => String(c.id) === upcOrId || c.upc_code === upcOrId);
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
        const accIndex = currentAcc.findIndex((a: any) => String(a.id) === upcOrId || a.serialNumber === upcOrId || (a.notes && a.notes.includes(upcOrId)));
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
        const firearmIndex = currentFirearms.findIndex(f => f.id === fId);
        if (firearmIndex >= 0) {
          const firearm = currentFirearms[firearmIndex];
          let image_path = '';
          if ((item as any).photoBase64) {
            const ext = (item as any).photoBase64.split(';')[0].split('/')[1] || 'jpg';
            const filename = `photo_${Date.now()}_log.${ext}`;
            image_path = await window.api.saveBase64Photo((item as any).photoBase64, filename) || '';
          }

          const newLog: any = {
            id: Date.now() + Math.random(),
            date: new Date(item.timestamp).toISOString().split('T')[0],
            type: (item as any).logType === 'maintenance' ? 'Cleaning' : 'Range',
            notes: (item as any).notes || '',
            rounds_fired: parseInt((item as any).roundCount) || 0,
            image_path: image_path || undefined
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
        const firearmIndex = currentFirearms.findIndex(f => f.id === fId);
        if (firearmIndex >= 0) {
          const firearm = currentFirearms[firearmIndex];
          if ((item as any).photoBase64) {
            const ext = (item as any).photoBase64.split(';')[0].split('/')[1] || 'jpg';
            const filename = `photo_${Date.now()}_firearm.${ext}`;
            const image_path = await window.api.saveBase64Photo((item as any).photoBase64, filename);
            
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
      alert('No recognizable items to approve automatically. Unknown barcodes must be resolved manually.');
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
          <p style={{ color: 'var(--text-secondary)' }}>Pair your phone and manage incoming data.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('inbox')} 
          style={{ background: 'transparent', border: 'none', color: activeTab === 'inbox' ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '1.1rem', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: activeTab === 'inbox' ? '2px solid var(--accent)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Server size={20} /> Sync Inbox 
          {queue.length > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.1rem 0.5rem', borderRadius: '12px' }}>{queue.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('pair')} 
          style={{ background: 'transparent', border: 'none', color: activeTab === 'pair' ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '1.1rem', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: activeTab === 'pair' ? '2px solid var(--accent)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Smartphone size={20} /> Pair Device
        </button>
      </div>

      {activeTab === 'inbox' && (
        <div>
          {queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <RefreshCw size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <h2>No pending items</h2>
              <p>Scan items on your mobile app and tap "Sync" to send them here.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '0.5rem' }}>
                <button className="btn-primary" onClick={handleApproveAll}>
                  <CheckCircle size={16} /> Approve All Valid
                </button>
                <button className="btn-secondary" onClick={handleClearAll} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                  <Trash2 size={16} /> Clear All
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {queue.map(item => {
                  if (item.type === 'ammo_adjustment') {
                    const upcOrId = String(item.upcOrId);
                    const ammo = ammoList.find(a => String(a.id) === upcOrId || a.upc_code === upcOrId);
                    
                    return (
                      <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Ammo</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                          
                          {ammo ? (
                            <div>
                              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={18} color="var(--success)" />
                                {ammo.caliber} - {ammo.manufacturer}
                              </h3>
                              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Action: <strong style={{ color: item.action === 'add' ? 'var(--success)' : 'var(--danger)' }}>
                                  {item.action === 'add' ? 'ADD' : 'REMOVE'} {item.count} {item.measurement || ''} rds
                                </strong> 
                                <span style={{ opacity: 0.5, marginLeft: '0.5rem' }}>(Current stock: {ammo.count})</span>
                              </p>
                            </div>
                          ) : (
                            <div>
                              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
                                <AlertTriangle size={18} />
                                Unknown Barcode: {upcOrId}
                              </h3>
                              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Action: <strong style={{ color: item.action === 'add' ? 'var(--success)' : 'var(--danger)' }}>
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
                            <button className="btn-primary" onClick={() => navigate('/ammo', { state: { openAddModal: true, upc: upcOrId, count: item.count, syncItemId: item.id } })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <PlusCircle size={16} /> Resolve & Add
                            </button>
                          )}
                          <button className="btn-icon" onClick={() => handleDelete(item.id!)} style={{ color: 'var(--danger)' }} title="Delete">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'component_adjustment') {
                    const upcOrId = String(item.upcOrId);
                    const component = componentsList.find(c => String(c.id) === upcOrId || c.upc_code === upcOrId);
                    
                    return (
                      <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Component</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                          
                          {component ? (
                            <div>
                              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={18} color="var(--success)" />
                                {component.name} - {component.manufacturer}
                              </h3>
                              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Action: <strong style={{ color: item.action === 'add' ? 'var(--success)' : 'var(--danger)' }}>
                                  {item.action === 'add' ? 'ADD' : 'REMOVE'} {item.count}
                                </strong> 
                                <span style={{ opacity: 0.5, marginLeft: '0.5rem' }}>(Current stock: {component.quantity})</span>
                              </p>
                            </div>
                          ) : (
                            <div>
                              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
                                <AlertTriangle size={18} />
                                Unknown Barcode: {upcOrId}
                              </h3>
                              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Action: <strong style={{ color: item.action === 'add' ? 'var(--success)' : 'var(--danger)' }}>
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
                            <button className="btn-primary" onClick={() => navigate('/components', { state: { openAddModal: true, upc: upcOrId, count: item.count, syncItemId: item.id } })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <PlusCircle size={16} /> Resolve & Add
                            </button>
                          )}
                          <button className="btn-icon" onClick={() => handleDelete(item.id!)} style={{ color: 'var(--danger)' }} title="Delete">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (item.type === 'firearm_log') {
                    const fId = Number((item as any).firearmId);
                    const firearm = firearms.find(f => f.id === fId);
                    
                    return (
                      <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Firearm Log</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                          
                          {firearm ? (
                            <div>
                              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={18} color="var(--success)" />
                                {firearm.make} {firearm.model} {firearm.caliber ? `(${firearm.caliber})` : ''}
                              </h3>
                              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <strong>{(item as any).logType === 'range' ? 'Range Log' : 'Maintenance'}</strong> - {(item as any).roundCount > 0 ? `${(item as any).roundCount} Rounds Fired` : 'No rounds recorded'}
                              </p>
                              {(item as any).notes && (
                                <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                  "{(item as any).notes}"
                                </p>
                              )}
                              {(item as any).photoBase64 && (
                                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--accent)', fontSize: '0.8rem' }}>📎 Photo Attached</p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
                                <AlertTriangle size={18} />
                                Unknown Firearm ID: {fId}
                              </h3>
                              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
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
                          <button className="btn-icon" onClick={() => handleDelete(item.id!)} style={{ color: 'var(--danger)' }} title="Delete">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (item.type === 'universal_scan') {
                    const upcOrId = String(item.upcOrId);
                    return (
                      <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Universal Scan</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                          <div>
                            <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                              <AlertTriangle size={18} />
                              Uncategorized Barcode: {upcOrId}
                            </h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                              Sent from mobile scanner. Click Resolve to look it up.
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-primary" onClick={() => handleResolveUniversal(item)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={isResolving === item.id}>
                            {isResolving === item.id ? <RefreshCw size={16} className="spin" /> : <PlusCircle size={16} />} 
                            {isResolving === item.id ? 'Resolving...' : 'Resolve & Add'}
                          </button>
                          <button className="btn-icon" onClick={() => handleDelete(item.id!)} style={{ color: 'var(--danger)' }} title="Delete">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );

                  } else if (item.type === 'firearm_photo') {
                    const fId = Number((item as any).firearmId);
                    const firearm = firearms.find(f => f.id === fId);
                    
                    return (
                      <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Firearm Photo</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                          
                          {firearm ? (
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              {(item as any).photoBase64 && (
                                <img src={(item as any).photoBase64} alt="Preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-light)' }} />
                              )}
                              <div>
                                <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <CheckCircle size={18} color="var(--success)" />
                                  {firearm.make} {firearm.model} {firearm.caliber ? `(${firearm.caliber})` : ''}
                                </h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                  New photo for inspection gallery
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
                                <AlertTriangle size={18} />
                                Unknown Firearm ID: {fId}
                              </h3>
                              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
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
                          <button className="btn-icon" onClick={() => handleDelete(item.id!)} style={{ color: 'var(--danger)' }} title="Delete">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'range_session') {
                    const fId = Number(item.firearm_id);
                    const firearm = firearms.find(f => f.id === fId);
                    const ammo = item.ammo_id ? ammoList.find(a => a.id === Number(item.ammo_id)) : null;
                    const rounds = item.rounds_fired || item.count || 0;

                    return (
                      <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Range Trip Session</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.date || new Date(item.timestamp).toLocaleDateString()}</span>
                          </div>

                          <div>
                            <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <CheckCircle size={18} color="var(--success)" />
                              {firearm ? `${firearm.make} ${firearm.model} (${firearm.caliber})` : `Firearm #${fId}`}
                            </h3>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                              Fired: <strong style={{ color: 'var(--accent)' }}>{rounds} rounds</strong>
                              {ammo && (
                                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                                  &bull; Ammo: {ammo.manufacturer || 'Custom'} {ammo.caliber} {ammo.grain ? `${ammo.grain}gr` : ''} (Will deduct from stock: {ammo.count} rds)
                                </span>
                              )}
                            </div>
                            {item.notes && (
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                Notes: {item.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-primary" onClick={() => handleApprove(item)} style={{ background: 'var(--success)' }}>
                            Approve
                          </button>
                          <button className="btn-icon" onClick={() => handleDelete(item.id!)} style={{ color: 'var(--danger)' }} title="Decline / Delete">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={item.id} className="card" style={{ padding: '1.5rem' }}>
                      <p>Unknown event type: {item.type}</p>
                      <button className="btn-secondary" onClick={() => handleDelete(item.id!)}>Dismiss</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pair' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2.5rem' }}>
            <h2>Mobile Pairing</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Scan this QR code with the ArmoryVault Companion App to securely pair your device over your local Wi-Fi.
            </p>
            {syncQrUrl ? (
              <img src={syncQrUrl} alt="Pairing QR Code" style={{ borderRadius: '8px', border: '4px solid white', width: '250px', height: '250px' }} />
            ) : (
              <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Generating...
              </div>
            )}
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1.5rem' }}>
              Ensure your computer and phone are connected to the same network.
            </p>
          </div>
        </div>
      )}
      {pendingBoxSizePrompt && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Unknown Box Size</h2>
              <button className="btn-icon" onClick={() => setPendingBoxSizePrompt(null)}>✕</button>
            </div>
            <div className="modal-content">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                We couldn't determine the standard box size for this item from the barcode. How many units (e.g. rounds, bullets) are in one box?
              </p>
              <div className="form-group">
                <label>Quantity per Box</label>
                <input 
                  type="number" 
                  value={customBoxSize} 
                  onChange={e => setCustomBoxSize(e.target.value)} 
                  autoFocus
                />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem', fontStyle: 'italic' }}>
                This box size will be saved to your Custom SKUs database for all future scans of this item.
              </p>
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <button className="btn-secondary" onClick={() => setPendingBoxSizePrompt(null)}>Cancel</button>
              <button className="btn-primary" onClick={saveCustomBoxSize}>Save & Approve</button>
            </div>
          </div>
        </div>
      )}

      {unknownRouteItem && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Item Not Found</h2>
              <button className="btn-icon" onClick={() => setUnknownRouteItem(null)}>✕</button>
            </div>
            <div className="modal-content">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Barcode <strong>{unknownRouteItem.upc}</strong> wasn't found in the global database. What kind of item is this?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button className="btn-primary" onClick={async () => {
                  await window.api.removeSyncItem(unknownRouteItem.item.id!);
                  navigate('/ammo', { state: { openAddModal: true, upc: unknownRouteItem.upc } });
                }}>
                  Add as Ammo
                </button>
                <button className="btn-primary" onClick={async () => {
                  await window.api.removeSyncItem(unknownRouteItem.item.id!);
                  navigate('/components', { state: { openAddModal: true, upc: unknownRouteItem.upc } });
                }}>
                  Add as Component
                </button>
                <button className="btn-primary" onClick={async () => {
                  await window.api.removeSyncItem(unknownRouteItem.item.id!);
                  navigate('/accessories', { state: { openAddModal: true, upc: unknownRouteItem.upc } });
                }}>
                  Add as Accessory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
