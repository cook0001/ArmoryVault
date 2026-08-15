import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Firearm, MaintenanceLog, Ammo, Accessory } from '../types';
import { ArrowLeft, Edit, Trash2, DollarSign, ClipboardList, FileText, Upload, Crosshair, PlusCircle, Printer } from 'lucide-react';
import { AccessoryModal } from '../components/AccessoryModal';
import { Lightbox } from '../components/Lightbox';
import { DocumentViewer } from '../components/DocumentViewer';

export const FirearmDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [firearm, setFirearm] = useState<Firearm | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>('');
  const [sellForm, setSellForm] = useState({ seller_name: '', sold_to_name: '', sold_date: '', sold_price: '', sale_notes: '' });
  const [logForm, setLogForm] = useState<Partial<MaintenanceLog>>({ date: new Date().toISOString().split('T')[0], type: 'Range', notes: '', rounds_fired: '' as any, ammo_used: '', malfunctions: '' as any, repaired_part: '', part_manufacturer: '', installed_part_details: '', cost: '' as any, image_path: '' });
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [inventoryAmmo, setInventoryAmmo] = useState<Ammo[]>([]);
  const [attachedAccessories, setAttachedAccessories] = useState<Accessory[]>([]);
  const [showTotalSetupValue, setShowTotalSetupValue] = useState(false);
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAmmoString = (a: Ammo) => {
    const isShotgun = a.caliber?.toLowerCase().includes('gauge') || a.caliber?.toLowerCase().includes('ga') || a.caliber?.includes('.410');
    const payloadStr = a.oz_payload ? ` (${a.oz_payload.toLowerCase().includes('oz') ? a.oz_payload : a.oz_payload + ' oz'})` : (a.pellet_count ? ` (${a.pellet_count} pellets)` : '');
    const shellStr = a.shell_length ? `${a.shell_length.includes('"') || a.shell_length.toLowerCase().includes('in') ? a.shell_length : a.shell_length + '"'} ` : '';
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
      const found = all.find(f => f.id === Number(id));
      setFirearm(found || null);
      
      const ammo = await window.api.getAmmo();
      setInventoryAmmo(ammo);

      if (window.api.getAccessories) {
        const allAcc = await window.api.getAccessories();
        setAttachedAccessories(allAcc.filter(a => a.mounts?.some(m => m.firearmId === Number(id))));
      }

      if (window.api.getConfig) {
        const showSetup = await window.api.getConfig('showTotalSetupValue');
        setShowTotalSetupValue(!!showSetup);
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
    if (!firearm) return;
    const pdfPath = await window.api.generateBillOfSale({
      ...firearm,
      seller_name: sellForm.seller_name,
      sold_to_name: sellForm.sold_to_name,
      sold_date: sellForm.sold_date,
      sold_price: sellForm.sold_price,
      sale_notes: sellForm.sale_notes
    });

    const updatedDocs = [...(firearm.documents || [])];
    if (pdfPath) {
      updatedDocs.push({
        name: `Bill of Sale - ${sellForm.sold_to_name}`,
        path: pdfPath,
        date_added: new Date().toISOString()
      });
    }

    const updated = {
      ...firearm,
      is_sold: true,
      sold_to_name: sellForm.sold_to_name,
      sold_date: sellForm.sold_date,
      sold_price: Number(sellForm.sold_price),
      sale_notes: sellForm.sale_notes,
      documents: updatedDocs
    };
    await window.api.updateFirearm(firearm.id!, updated);
    setFirearm(updated);
    setIsSelling(false);
  };

  const handleDocumentSelect = async () => {
    if (window.api && window.api.selectAndSaveDocument && firearm) {
      const doc = await window.api.selectAndSaveDocument();
      if (doc) {
        const updatedDocs = [...(firearm.documents || []), doc];
        const updated = { ...firearm, documents: updatedDocs };
        await window.api.updateFirearm(firearm.id!, updated);
        setFirearm(updated);
      }
    }
  };

  const handleDeleteLog = async (logId: number) => {
    if (!firearm || !window.confirm('Are you sure you want to delete this log entry?')) return;
    const updatedLogs = firearm.logs?.filter(l => l.id !== logId) || [];
    const updated = { ...firearm, logs: updatedLogs };
    await window.api.updateFirearm(firearm.id!, updated);
    setFirearm(updated);
  };

  const openEditLog = (log: MaintenanceLog) => {
    setEditingLogId(log.id);
    setLogForm(log);
    setIsLogging(true);
  };
  
  const handleLogImage = async () => {
    if (window.api && window.api.selectAndSavePhoto) {
      const path = await window.api.selectAndSavePhoto();
      if (path) {
        setLogForm(prev => ({ ...prev, image_path: path }));
      }
    }
  };

  if (!firearm) return <div className="loading">Loading...</div>;

  return (
    <>
      <div className="details-page">
      <div className="page-header">
        <button className="btn-icon" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ margin: 0 }}>{firearm.make} {firearm.model}</h1>
            {showTotalSetupValue && (
              <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>
                Setup Value: ${((firearm.purchase_price || 0) + attachedAccessories.reduce((sum, a) => {
                  const allocatedQty = a.mounts?.find(m => m.firearmId === Number(id))?.quantity || 1;
                  return sum + ((a.value || 0) * allocatedQty);
                }, 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
        </div>
        <div className="header-actions" style={{ gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          {!firearm.is_sold && (
            <button className="btn-success" onClick={() => setIsSelling(true)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'transparent', border: 'none', color: '#4ade80' }}>
              <DollarSign size={14} /> Mark Sold
            </button>
          )}
          <button className="btn-secondary" onClick={() => navigate(`/edit/${firearm.id}`)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'transparent', border: 'none' }}>
            <Edit size={14} /> Edit
          </button>
          <button className="btn-secondary" onClick={async () => {
            if (!window.api || !firearm) return;
            try {
              const QRCode = (await import('qrcode')).default;
              const qrDataUrl = await QRCode.toDataURL(`armoryvault://firearm/${firearm.id}`, { width: 300, margin: 1 });
              await window.api.printQRLabel({
                itemName: `${firearm.make} ${firearm.model}`,
                itemDetails: `Caliber: ${firearm.caliber || 'N/A'}\nS/N: ${firearm.serial_number || 'N/A'}`,
                qrDataUrl
              });
            } catch (err) {
              console.error('Failed to print QR label', err);
              alert('Failed to print QR label.');
            }
          }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'transparent', border: 'none', color: '#60a5fa' }}>
            <Printer size={14} /> QR Label
          </button>
          <div style={{ width: '1px', background: 'var(--border-light)', margin: '0 0.2rem' }}></div>
          <button className="btn-danger" onClick={handleDelete} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'transparent', border: 'none', color: '#f87171' }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="details-content">
        <div className="details-card main-info">
          {(firearm.photos && firearm.photos.length > 0) ? (
            <div style={{ position: 'relative' }}>
              <img 
                src={`file://${firearm.photos[0]}`} 
                alt="Firearm" 
                className="details-image" 
                style={{ cursor: 'pointer' }}
                onClick={() => { setLightboxImages(firearm.photos!); setLightboxIndex(0); }}
              />
              {firearm.photos.length > 1 && (
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', pointerEvents: 'none' }}>
                  1 / {firearm.photos.length}
                </div>
              )}
            </div>
          ) : firearm.image_path ? (
            <img 
              src={`file://${firearm.image_path}`} 
              alt="Firearm" 
              className="details-image" 
              style={{ cursor: 'pointer' }}
              onClick={() => { setLightboxImages([firearm.image_path]); setLightboxIndex(0); }}
            />
          ) : (
            <div className="no-image">No Photo Available</div>
          )}
          <div className="info-grid">
            <div className="info-item"><span>Make</span><p>{firearm.make}</p></div>
            <div className="info-item"><span>Model</span><p>{firearm.model}</p></div>
            <div className="info-item"><span>Caliber</span><p>{firearm.caliber || '-'}</p></div>
            <div className="info-item"><span>Type</span><p>{firearm.firearm_type || '-'}</p></div>
            <div className="info-item"><span>Serial</span><p>{firearm.serial_number || '-'}</p></div>
            <div className="info-item"><span>Action</span><p>{firearm.action_type || '-'}</p></div>
            <div className="info-item"><span>Finish</span><p>{firearm.finish || '-'}</p></div>
            <div className="info-item"><span>Barrel Length</span><p>{firearm.barrel_length || '-'}</p></div>
          </div>
        </div>

        <div className="details-card side-info">
          <h3>Purchase History</h3>
          <div className="info-item"><span>Date</span><p>{firearm.purchase_date || '-'}</p></div>
          <div className="info-item"><span>Price</span><p>{firearm.purchase_price ? `$${firearm.purchase_price}` : '-'}</p></div>
          <div className="info-item"><span>From</span><p>{firearm.purchased_from || '-'}</p></div>
          <div className="info-item"><span>Condition</span><p>{firearm.condition || '-'}</p></div>
          
          <div className="info-item full">
            <span>Notes / Accessories</span>
            <p className="notes-text">{firearm.notes || 'None'}</p>
          </div>
        </div>

        {firearm.is_nfa && (
          <div className="details-card side-info" style={{ marginTop: '1.5rem', background: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            <h3 style={{ color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>NFA Information</h3>
            <div className="info-item"><span>Type</span><p>{firearm.nfa_type || '-'}</p></div>
            <div className="info-item"><span>Registration</span><p>{firearm.registration_type || '-'}</p></div>
            <div className="info-item">
              <span>Status</span>
              <p style={{ fontWeight: 'bold', color: firearm.stamp_status === 'Approved' ? 'var(--success)' : 'var(--warning)' }}>
                {firearm.stamp_status || 'Unknown'}
              </p>
            </div>
            {firearm.stamp_submitted_date && (
              <div className="info-item"><span>Submitted</span><p>{firearm.stamp_submitted_date}</p></div>
            )}
            {firearm.stamp_approved_date && (
              <div className="info-item"><span>Approved</span><p>{firearm.stamp_approved_date}</p></div>
            )}
            {firearm.stamp_status === 'Pending' && firearm.stamp_submitted_date && (
              <div className="info-item">
                <span>Wait Time</span>
                <p>{Math.floor((new Date().getTime() - new Date(firearm.stamp_submitted_date).getTime()) / (1000 * 3600 * 24))} days</p>
              </div>
            )}
          </div>
        )}

        {firearm.is_sold && (
          <div className="details-card sold-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Sale Details</h3>
              <button 
                className="btn-secondary" 
                onClick={async () => {
                  if (confirm('Are you sure you want to unmark this firearm as sold? This will remove the sale details from this inspection card.')) {
                    const updated = {
                      ...firearm,
                      is_sold: false,
                      sold_to_name: undefined,
                      sold_date: undefined,
                      sold_price: undefined,
                      sale_notes: undefined
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
              <div className="info-item"><span>Sold To</span><p>{firearm.sold_to_name}</p></div>
              <div className="info-item"><span>Sale Date</span><p>{firearm.sold_date}</p></div>
              <div className="info-item"><span>Sale Price</span><p>${firearm.sold_price}</p></div>
            </div>
            <div className="info-item full">
              <span>Sale Notes</span>
              <p className="notes-text">{firearm.sale_notes}</p>
            </div>
          </div>
        )}
      </div>

      <div className="details-card accessories-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Attached Accessories & Optics</h3>
          <button className="btn-secondary" onClick={() => setIsAccessoryModalOpen(true)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            <PlusCircle size={16} /> Add Accessory
          </button>
        </div>
        {attachedAccessories.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {attachedAccessories.map(acc => (
              <div key={acc.id} style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                  {acc.photo ? (
                    <img src={acc.photo} alt={acc.model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Crosshair size={20} color="var(--text-secondary)" style={{ margin: 'auto' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{acc.type}</div>
                  <div style={{ fontWeight: 500 }}>
                    {(() => {
                      const allocatedQty = acc.mounts?.find(m => m.firearmId === Number(id))?.quantity || 1;
                      return (allocatedQty > 1) ? `${allocatedQty}x ` : '';
                    })()}{acc.manufacturer} {acc.model} 
                    {acc.magnification && <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)', fontWeight: 'normal' }}> ({acc.magnification})</span>}
                    {acc.ratedCalibers && <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)', fontWeight: 'normal' }}> ({acc.ratedCalibers})</span>}
                    {acc.lumens && <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)', fontWeight: 'normal' }}> ({acc.lumens} lm)</span>}
                    {acc.supportedModels && <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)', fontWeight: 'normal' }}> (Fits: {acc.supportedModels})</span>}
                    {(acc.caliber || acc.capacity) && <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)', fontWeight: 'normal' }}> ({[acc.caliber, acc.capacity ? `${acc.capacity}rd` : ''].filter(Boolean).join(' - ')})</span>}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--success)' }}>
                    {(() => {
                      const allocatedQty = acc.mounts?.find(m => m.firearmId === Number(id))?.quantity || 1;
                      return `$${((acc.value || 0) * allocatedQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed var(--border-light)' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No accessories or optics mounted to this firearm.</p>
          </div>
        )}
      </div>

      <div className="details-card logs-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Maintenance & Range Logs</h3>
          <button className="btn-secondary" onClick={() => setIsLogging(true)}>
            <ClipboardList size={18} /> Add Log Entry
          </button>
        </div>
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
             <strong>Total Lifetime Rounds Fired:</strong> <span style={{ color: 'var(--accent)', fontWeight: 700, marginLeft: '0.5rem' }}>{firearm.logs?.reduce((acc, log) => acc + (Number(log.rounds_fired) || 0), 0) || 0}</span>
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
             <strong>Total Money Spent:</strong> <span style={{ color: 'var(--danger)', fontWeight: 700, marginLeft: '0.5rem' }}>${firearm.logs?.reduce((acc, log) => acc + (Number(log.cost) || 0), 0).toFixed(2) || '0.00'}</span>
          </div>
          {(() => {
            const rangeLogs = firearm.logs?.filter(l => l.type === 'Range') || [];
            const totalRounds = rangeLogs.reduce((sum, l) => sum + (Number(l.rounds_fired) || 0), 0);
            const totalMalf = rangeLogs.reduce((sum, l) => sum + (Number(l.malfunctions) || 0), 0);
            if (totalRounds > 0) {
              const rel = ((totalRounds - totalMalf) / totalRounds) * 100;
              return (
                <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <strong>Reliability:</strong> <span style={{ color: 'var(--success)', fontWeight: 700, marginLeft: '0.5rem' }}>{rel.toFixed(2)}%</span>
                </div>
              );
            }
            return null;
          })()}
        </div>
        
        <div className="logs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {firearm.logs?.slice().reverse().map(log => (
            <div key={log.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <div>
                  <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '1.1rem', display: 'block' }}>{log.type}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{log.date}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-icon" onClick={() => openEditLog(log)} style={{ padding: '0.2rem' }} title="Edit"><Edit size={16} /></button>
                  <button className="btn-icon" onClick={() => handleDeleteLog(log.id)} style={{ padding: '0.2rem', color: 'var(--danger)' }} title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              {log.type === 'Range' && (
                <div style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span>Rounds Fired: <span style={{ color: 'var(--success)' }}>{log.rounds_fired}</span></span>
                    {log.malfunctions !== undefined && log.malfunctions > 0 && (
                      <span>Malfunctions: <span style={{ color: 'var(--danger)' }}>{log.malfunctions}</span></span>
                    )}
                  </div>
                  {log.ammo_used && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Ammo: {log.ammo_used}</div>}
                </div>
              )}
              {log.type === 'Repair' && log.repaired_part && (
                <div style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  Part Repaired: <span style={{ color: 'var(--accent)' }}>{log.repaired_part}</span>
                </div>
              )}
              {log.installed_part_details && (
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Installed: <span style={{ color: 'var(--success)' }}>{log.part_manufacturer ? `${log.part_manufacturer} ` : ''}{log.installed_part_details}</span>
                </div>
              )}
              {(log.type === 'Modification' || log.type === 'Repair' || log.type === 'Other') && log.cost !== undefined && log.cost > 0 && (
                <div style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  Cost: <span style={{ color: 'var(--warning)' }}>${log.cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              )}
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{log.notes}</div>
              {log.image_path && (
                <div style={{ marginTop: '1rem' }}>
                  <img src={`file://${log.image_path}`} alt="Log Attachment" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-light)', cursor: 'pointer' }} onClick={() => { setViewerUrl(log.image_path!); setViewerTitle('Attachment'); }} title="Click to open" />
                </div>
              )}
            </div>
          ))}
          {(!firearm.logs || firearm.logs.length === 0) && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', textAlign: 'center', padding: '3rem', gridColumn: '1 / -1', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
              No maintenance or range activity recorded yet.
            </div>
          )}
        </div>
      </div>

      <div className="details-card documents-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Documents & Receipts</h3>
          <button className="btn-secondary" onClick={handleDocumentSelect}>
            <Upload size={18} /> Attach File
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {firearm.documents?.map((doc, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-primary)' }}>
                <FileText size={24} style={{ color: 'var(--accent)' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{doc.name}</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => { setViewerUrl(doc.path); setViewerTitle(doc.name); }}>
                      View
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => window.api?.openExternalFile(doc.path)}>
                      Open External
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
                style={{ color: 'var(--danger)', fontSize: '0.9rem', width: 'auto', padding: '0.5rem' }}
                title="Remove Document"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {(!firearm.documents || firearm.documents.length === 0) && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
              No documents attached. You can attach PDFs of NFA Tax Stamps, Bills of Sale, or Appraisal Certificates here.
            </div>
          )}
        </div>
      </div>
    </div>

      {isSelling && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Mark Firearm as Sold</h2>
            <form onSubmit={handleSell}>
              <div className="form-group">
                <label>Your Name (Seller)</label>
                <input required type="text" className="form-input" value={sellForm.seller_name} onChange={e => setSellForm({...sellForm, seller_name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div className="form-group">
                <label>Buyer Name</label>
                <input required type="text" className="form-input" value={sellForm.sold_to_name} onChange={e => setSellForm({...sellForm, sold_to_name: e.target.value})} placeholder="e.g. Jane Smith" />
              </div>
              <div className="form-group">
                <label>Sale Date</label>
                <input required type="date" value={sellForm.sold_date} onChange={e => setSellForm({...sellForm, sold_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Sale Price ($)</label>
                <input required type="number" step="0.01" value={sellForm.sold_price} onChange={e => setSellForm({...sellForm, sold_price: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Sale Notes (Optional Secondary Info)</label>
                <textarea rows={3} value={sellForm.sale_notes} onChange={e => setSellForm({...sellForm, sale_notes: e.target.value})}></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsSelling(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Confirm Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLogging && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Log Entry</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              let updatedLogs = [];
              if (editingLogId) {
                updatedLogs = firearm.logs?.map(l => l.id === editingLogId ? { ...logForm, id: editingLogId } as MaintenanceLog : l) || [];
              } else {
                const newLog = { ...logForm, id: Date.now() } as MaintenanceLog;
                updatedLogs = [...(firearm.logs || []), newLog];
              }
              const updated = { ...firearm, logs: updatedLogs };
              await window.api.updateFirearm(firearm.id!, updated);
              
              if (!editingLogId && logForm.type === 'Range' && logForm.rounds_fired && logForm.rounds_fired > 0 && logForm.ammo_used) {
                const allAmmo = await window.api.getAmmo();
                const matched = allAmmo.find(a => getAmmoString(a) === logForm.ammo_used);
                
                if (matched) {
                  if (matched.count >= logForm.rounds_fired) {
                    matched.count -= logForm.rounds_fired;
                    await window.api.updateAmmo(matched.id!, matched);
                    alert(`Smart Ammo Tracker: Deducted ${logForm.rounds_fired} rounds from your inventory.`);
                  } else {
                    alert(`Smart Ammo Tracker: Not enough inventory to deduct ${logForm.rounds_fired} rounds! Log saved without deducting.`);
                  }
                }
              }

              setFirearm(updated);
              setIsLogging(false);
              setEditingLogId(null);
              setLogForm({ date: new Date().toISOString().split('T')[0], type: 'Range', notes: '', rounds_fired: '' as any, ammo_used: '', malfunctions: '' as any, repaired_part: '', part_manufacturer: '', installed_part_details: '', cost: '' as any, image_path: '' });
            }}>
              <div className="form-group">
                <label>Date</label>
                <input required type="date" value={logForm.date} onChange={e => setLogForm({...logForm, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={logForm.type} onChange={e => setLogForm({...logForm, type: e.target.value as any})}>
                  <option value="Range">Range</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Modification">Modification</option>
                  <option value="Repair">Repair</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {logForm.type === 'Range' && (
                <>
                  <div className="form-group">
                    <label>Rounds Fired</label>
                    <input type="number" min="0" value={logForm.rounds_fired === undefined ? '' : logForm.rounds_fired} onChange={e => setLogForm({...logForm, rounds_fired: e.target.value === '' ? ('' as any) : parseInt(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>Malfunctions (FTF/FTE)</label>
                    <input type="number" min="0" value={logForm.malfunctions === undefined ? '' : logForm.malfunctions} onChange={e => setLogForm({...logForm, malfunctions: e.target.value === '' ? ('' as any) : parseInt(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>Ammo Used</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                      <select 
                        className="form-input" 
                        onChange={e => {
                          if (e.target.value) setLogForm({...logForm, ammo_used: e.target.value});
                        }}
                        value=""
                      >
                        <option value="">-- Click to select from inventory --</option>
                        {inventoryAmmo
                          .filter(ammo => {
                            if (!firearm?.caliber || !ammo.caliber) return true;
                            const gunCal = firearm.caliber.toLowerCase().replace(/[^a-z0-9]/g, '');
                            const ammoCal = ammo.caliber.toLowerCase().replace(/[^a-z0-9]/g, '');
                            return gunCal.includes(ammoCal) || ammoCal.includes(gunCal);
                          })
                          .map((ammo, idx) => (
                            <option key={idx} value={getAmmoString(ammo)}>{getAmmoString(ammo)}</option>
                          ))
                        }
                      </select>
                      <input type="text" className="form-input" value={logForm.ammo_used || ''} onChange={e => setLogForm({...logForm, ammo_used: e.target.value})} placeholder="Or type manually (e.g. Winchester 9mm FMJ)" />
                    </div>
                  </div>
                </>
              )}
              {(logForm.type === 'Repair' || logForm.type === 'Modification') && (
                <>
                  {logForm.type === 'Repair' && (
                    <div className="form-group">
                      <label>Part Changed / Repaired</label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                        <select 
                          className="form-input" 
                          onChange={e => {
                            if (e.target.value) setLogForm({...logForm, repaired_part: e.target.value});
                          }}
                          value=""
                        >
                          <option value="">-- Select common part --</option>
                          <option value="Springs">Springs</option>
                          <option value="Firing Pin / Striker">Firing Pin / Striker</option>
                          <option value="Extractor">Extractor</option>
                          <option value="Ejector">Ejector</option>
                          <option value="Barrel">Barrel</option>
                          <option value="Trigger Group">Trigger Group</option>
                          <option value="Sights">Sights</option>
                          <option value="Gas System">Gas System</option>
                          <option value="Other">Other</option>
                        </select>
                        <input type="text" className="form-input" value={logForm.repaired_part || ''} onChange={e => setLogForm({...logForm, repaired_part: e.target.value})} placeholder="Or type manually" />
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Part Manufacturer</label>
                      <input type="text" className="form-input" value={logForm.part_manufacturer || ''} onChange={e => setLogForm({...logForm, part_manufacturer: e.target.value})} placeholder="e.g. Apex Tactical" />
                    </div>
                    <div className="form-group">
                      <label>Installed Part Details</label>
                      <input type="text" className="form-input" value={logForm.installed_part_details || ''} onChange={e => setLogForm({...logForm, installed_part_details: e.target.value})} placeholder="e.g. Heavy Duty Extractor" />
                    </div>
                  </div>
                </>
              )}
              {(logForm.type === 'Modification' || logForm.type === 'Repair' || logForm.type === 'Other') && (
                <div className="form-group">
                  <label>Cost ($)</label>
                  <input type="number" step="0.01" min="0" value={logForm.cost === undefined ? '' : logForm.cost} onChange={e => setLogForm({...logForm, cost: e.target.value === '' ? ('' as any) : parseFloat(e.target.value)})} />
                </div>
              )}
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={3} value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})}></textarea>
              </div>
              <div className="form-group">
                <label>Photo Attachment</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button type="button" className="btn-secondary" onClick={handleLogImage}>Select Photo</button>
                  {logForm.image_path && <span style={{ color: 'var(--success)', fontSize: '0.9rem' }}>Photo selected</span>}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setIsLogging(false); setEditingLogId(null); setLogForm({ date: new Date().toISOString().split('T')[0], type: 'Range', notes: '', rounds_fired: '' as any, ammo_used: '', malfunctions: '' as any, repaired_part: '', part_manufacturer: '', installed_part_details: '', cost: '' as any, image_path: '' }); }}>Cancel</button>
                <button type="submit" className="btn-primary">{editingLogId ? 'Save Changes' : 'Save Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {firearm && (
        <AccessoryModal 
          isOpen={isAccessoryModalOpen}
          onClose={() => setIsAccessoryModalOpen(false)}
          onSave={() => loadFirearm()}
          editingId={null}
          initialData={{ mountedOnFirearmId: Number(id) }}
          firearms={[firearm]}
        />
      )}

      {lightboxImages.length > 0 && (
        <Lightbox 
          images={lightboxImages} 
          initialIndex={lightboxIndex} 
          onClose={() => setLightboxImages([])} 
        />
      )}

      {viewerUrl && (
        <DocumentViewer 
          url={viewerUrl} 
          title={viewerTitle} 
          onClose={() => setViewerUrl(null)} 
        />
      )}
    </>
  );
};
