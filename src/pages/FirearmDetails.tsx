import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Firearm, MaintenanceLog } from '../types';
import { ArrowLeft, Edit, Trash2, DollarSign, ClipboardList } from 'lucide-react';

export const FirearmDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [firearm, setFirearm] = useState<Firearm | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [sellForm, setSellForm] = useState({ sold_to_name: '', sold_date: '', sold_price: '', sale_notes: '' });
  const [logForm, setLogForm] = useState<Partial<MaintenanceLog>>({ date: new Date().toISOString().split('T')[0], type: 'Range', notes: '', rounds_fired: 0 });

  useEffect(() => {
    loadFirearm();
  }, [id]);

  const loadFirearm = async () => {
    if (window.api && id) {
      const all = await window.api.getFirearms();
      const found = all.find(f => f.id === Number(id));
      setFirearm(found || null);
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
    const updated = {
      ...firearm,
      is_sold: true,
      sold_to_name: sellForm.sold_to_name,
      sold_date: sellForm.sold_date,
      sold_price: Number(sellForm.sold_price),
      sale_notes: sellForm.sale_notes,
    };
    await window.api.updateFirearm(firearm.id!, updated);
    setFirearm(updated);
    setIsSelling(false);
  };

  if (!firearm) return <div className="loading">Loading...</div>;

  return (
    <div className="details-page">
      <div className="page-header">
        <button className="btn-icon" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <h1>{firearm.make} {firearm.model}</h1>
        <div className="header-actions">
          {!firearm.is_sold && (
            <button className="btn-success" onClick={() => setIsSelling(true)}>
              <DollarSign size={18} /> Mark as Sold
            </button>
          )}
          <button className="btn-danger" onClick={handleDelete}>
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      <div className="details-content">
        <div className="details-card main-info">
          {firearm.image_path ? (
            <img src={`file://${firearm.image_path}`} alt="Firearm" className="details-image" />
          ) : (
            <div className="no-image">No Photo Available</div>
          )}
          <div className="info-grid">
            <div className="info-item"><span>Make</span><p>{firearm.make}</p></div>
            <div className="info-item"><span>Model</span><p>{firearm.model}</p></div>
            <div className="info-item"><span>Caliber</span><p>{firearm.caliber || '-'}</p></div>
            <div className="info-item"><span>Serial</span><p>{firearm.serial_number || '-'}</p></div>
            <div className="info-item"><span>Action</span><p>{firearm.action_type || '-'}</p></div>
            <div className="info-item"><span>Barrel Length</span><p>{firearm.barrel_length || '-'}</p></div>
          </div>
        </div>

        <div className="details-card side-info">
          <h3>Purchase History</h3>
          <div className="info-item"><span>Date</span><p>{firearm.purchase_date || '-'}</p></div>
          <div className="info-item"><span>Price</span><p>{firearm.purchase_price ? `$${firearm.purchase_price}` : '-'}</p></div>
          <div className="info-item"><span>Condition</span><p>{firearm.condition || '-'}</p></div>
          
          <div className="info-item full">
            <span>Notes / Accessories</span>
            <p className="notes-text">{firearm.notes || 'None'}</p>
          </div>
        </div>

        {firearm.is_sold && (
          <div className="details-card sold-info">
            <h3>Sale Details</h3>
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

      <div className="details-card logs-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Maintenance & Range Logs</h3>
          <button className="btn-secondary" onClick={() => setIsLogging(true)}>
            <ClipboardList size={18} /> Add Log Entry
          </button>
        </div>
        <div style={{ marginBottom: '2rem', color: 'var(--text-primary)', fontSize: '1.1rem', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'inline-block' }}>
           <strong>Total Lifetime Rounds Fired:</strong> <span style={{ color: 'var(--accent)', fontWeight: 700, marginLeft: '0.5rem' }}>{firearm.logs?.reduce((acc, log) => acc + (Number(log.rounds_fired) || 0), 0) || 0}</span>
        </div>
        
        <div className="logs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {firearm.logs?.slice().reverse().map(log => (
            <div key={log.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '1.1rem' }}>{log.type}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{log.date}</span>
              </div>
              {log.type === 'Range' && <div style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>Rounds Fired: <span style={{ color: 'var(--success)' }}>{log.rounds_fired}</span></div>}
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{log.notes}</div>
            </div>
          ))}
          {(!firearm.logs || firearm.logs.length === 0) && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', textAlign: 'center', padding: '3rem', gridColumn: '1 / -1', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
              No maintenance or range activity recorded yet.
            </div>
          )}
        </div>
      </div>

      {isSelling && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Mark Firearm as Sold</h2>
            <form onSubmit={handleSell}>
              <div className="form-group">
                <label>Buyer Name</label>
                <input required type="text" value={sellForm.sold_to_name} onChange={e => setSellForm({...sellForm, sold_to_name: e.target.value})} />
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
              const newLog = { ...logForm, id: Date.now() } as MaintenanceLog;
              const updatedLogs = [...(firearm.logs || []), newLog];
              const updated = { ...firearm, logs: updatedLogs };
              await window.api.updateFirearm(firearm.id!, updated);
              setFirearm(updated);
              setIsLogging(false);
              setLogForm({ date: new Date().toISOString().split('T')[0], type: 'Range', notes: '', rounds_fired: 0 });
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
                  <option value="Other">Other</option>
                </select>
              </div>
              {logForm.type === 'Range' && (
                <div className="form-group">
                  <label>Rounds Fired</label>
                  <input type="number" min="0" value={logForm.rounds_fired} onChange={e => setLogForm({...logForm, rounds_fired: Number(e.target.value)})} />
                </div>
              )}
              <div className="form-group">
                <label>Notes</label>
                <textarea required rows={3} value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})}></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsLogging(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
