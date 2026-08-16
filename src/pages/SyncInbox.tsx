import React, { useState, useEffect } from 'react';
import { SyncItem, Ammo, Firearm } from '../types';
import { Smartphone, CheckCircle, AlertTriangle, Trash2, PlusCircle, Server, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SyncInbox = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'pair'>('inbox');
  const [queue, setQueue] = useState<SyncItem[]>([]);
  const [syncQrUrl, setSyncQrUrl] = useState('');
  const [ammoList, setAmmoList] = useState<Ammo[]>([]);
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const navigate = useNavigate();

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
      const q = await window.api.getSyncQueue();
      setQueue(q);
      const ammo = await window.api.getAmmo();
      setAmmoList(ammo);
      const f = await window.api.getFirearms();
      setFirearms(f);
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

  const handleApprove = async (item: SyncItem) => {
    if (!window.api) return;

    if (item.type === 'ammo_adjustment') {
      const upcOrId = String(item.upcOrId);
      const ammo = ammoList.find(a => String(a.id) === upcOrId || a.upc_code === upcOrId);
      if (ammo) {
        const currentCount = parseInt(ammo.count as any) || 0;
        const adjustment = parseInt(item.count as any) || 0;
        if (item.action === 'add') {
          ammo.count = currentCount + adjustment;
        } else if (item.action === 'remove') {
          ammo.count = Math.max(0, currentCount - adjustment);
        }
        await window.api.updateAmmo(ammo.id!, ammo);
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
    }
  };

  const handleApproveAll = async () => {
    if (!window.api || !confirm('Automatically approve all recognized sync items? (Unknown items will be skipped)')) return;
    
    let currentAmmo = await window.api.getAmmo();
    let currentFirearms = await window.api.getFirearms();
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
                                  {item.action === 'add' ? 'ADD' : 'REMOVE'} {item.count} rds
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

                  if (item.type === 'firearm_photo') {
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
    </div>
  );
};
