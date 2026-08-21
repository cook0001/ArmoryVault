import {
  AlertCircle,
  Camera,
  Edit,
  Eye,
  Layers,
  Link as LinkIcon,
  PlusCircle,
  Search,
  Shield,
  Target,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AccessoryDetailModal, getAccessoryTypeColor } from '../components/AccessoryDetailModal';
import { AccessoryModal } from '../components/AccessoryModal';
import { Accessory, Firearm } from '../types';

export const Accessories = () => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedAccessoryForDetail, setSelectedAccessoryForDetail] = useState<Accessory | null>(
    null
  );

  const [formData, setFormData] = useState<Partial<Accessory>>({});

  const location = useLocation();
  const navigate = useNavigate();
  const locationProcessed = useRef<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (
      location.state &&
      location.state.openAddModal &&
      locationProcessed.current !== location.key
    ) {
      locationProcessed.current = location.key;
      const initialNotes = location.state.upc ? `UPC: ${location.state.upc}` : '';
      const formDataToSet: any = { notes: initialNotes };
      if (location.state.parsedData) {
        Object.assign(formDataToSet, location.state.parsedData);
      }
      if (location.state.initialData) {
        Object.assign(formDataToSet, location.state.initialData);
      }
      if (location.state.upc) {
        formDataToSet.upc_code = location.state.upc;
      }
      setFormData(formDataToSet);
      setEditingId(null);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadData = async () => {
    if (window.api && window.api.getAccessories && window.api.getFirearms) {
      const fetchedAcc = await window.api.getAccessories();
      const fetchedFirearms = await window.api.getFirearms();
      setAccessories(fetchedAcc);
      setFirearms(fetchedFirearms);

      // Keep detail modal synchronized if an item was updated
      if (selectedAccessoryForDetail) {
        const refreshed = fetchedAcc.find((a) => a.id === selectedAccessoryForDetail.id);
        setSelectedAccessoryForDetail(refreshed || null);
      }
    }
  };

  const filteredAccessories = accessories.filter((a) => {
    const term = search.toLowerCase();
    return (
      a.manufacturer.toLowerCase().includes(term) ||
      a.model.toLowerCase().includes(term) ||
      a.type.toLowerCase().includes(term) ||
      (a.upc_code && a.upc_code.toLowerCase().includes(term)) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(term)) ||
      (a.supportedModels && a.supportedModels.toLowerCase().includes(term))
    );
  });

  const handleEdit = (acc: Accessory) => {
    setFormData(acc);
    setEditingId(acc.id || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this accessory?')) {
      if (window.api && window.api.deleteAccessory) {
        await window.api.deleteAccessory(id);
        loadData();
      }
    }
  };

  const openNewModal = () => {
    setFormData({});
    setEditingId(null);
    setIsModalOpen(true);
  };

  const getMountedFirearmName = (id: number | null) => {
    if (!id) return null;
    const f = firearms.find((x) => x.id === id);
    if (f) return `${f.make} ${f.model}`;
    return 'Unknown Firearm';
  };

  const totalValue = accessories.reduce(
    (sum, acc) => sum + (acc.value || 0) * (acc.quantity || 1),
    0
  );
  const totalItemsCount = accessories.reduce((sum, acc) => sum + (acc.quantity || 1), 0);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1>Accessories & Optics</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Track sights, suppressors, mounts, and tactical gear with comprehensive detail cards.
          </p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          <PlusCircle size={20} /> Add Accessory
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div className="search-bar" style={{ flex: 1, maxWidth: '400px' }}>
          <Search size={20} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search accessories by make, model, type, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Value</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent)' }}>
              $
              {totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div style={{ width: '1px', height: '30px', background: 'var(--border-light)' }}></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Item Count</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{totalItemsCount}</div>
          </div>
        </div>
      </div>

      {filteredAccessories.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
          }}
        >
          <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            <AlertCircle size={48} style={{ margin: '0 auto', opacity: 0.5 }} />
          </div>
          <h3>No accessories found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Add your first optic, suppressor, or accessory to start tracking.
          </p>
          <button className="btn-primary" onClick={openNewModal}>
            Add Accessory
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredAccessories.map((acc) => {
            const typeColor = getAccessoryTypeColor(acc.type);
            const totalMounted = acc.mounts
              ? acc.mounts.reduce((sum, m) => sum + (m.quantity || 1), 0)
              : 0;
            const quantity = acc.quantity && acc.quantity > 0 ? acc.quantity : 1;
            const unmountedCount = Math.max(0, quantity - totalMounted);

            return (
              <div
                key={acc.id}
                className="card tactical-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition:
                    'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                  border: '1px solid var(--border-light)',
                  padding: '1.25rem',
                  position: 'relative',
                }}
                onClick={() => setSelectedAccessoryForDetail(acc)}
              >
                {/* Header & Badges */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '85px',
                      height: '85px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)',
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
                      <Camera size={26} color="var(--text-secondary)" style={{ opacity: 0.6 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginBottom: '0.35rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          background: typeColor.bg,
                          color: typeColor.text,
                          border: `1px solid ${typeColor.border}`,
                          padding: '0.12rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
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
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        >
                          🎯 {acc.round_count.toLocaleString()} rds
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
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          NFA
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        margin: '0 0 0.25rem 0',
                        fontSize: '1.05rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {quantity > 1 ? `${quantity}x ` : ''}
                      {acc.manufacturer} {acc.model}
                    </h3>

                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--success)' }}>
                      $
                      {((acc.value || 0) * quantity).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {quantity > 1 && (
                        <span
                          style={{
                            fontSize: '0.75rem',
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

                {/* Feature & Technical Spec Chips */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.4rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.85rem',
                  }}
                >
                  {acc.magnification && (
                    <span
                      style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      🔭 {acc.magnification}
                    </span>
                  )}
                  {acc.lumens && (
                    <span
                      style={{
                        background: 'rgba(251, 191, 36, 0.1)',
                        color: '#fbbf24',
                        border: '1px solid rgba(251, 191, 36, 0.25)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      ⚡ {acc.lumens.toLocaleString()} lm
                    </span>
                  )}
                  {acc.ratedCalibers && (
                    <span
                      style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      🛡️ {acc.ratedCalibers}
                    </span>
                  )}
                  {acc.capacity && (
                    <span
                      style={{
                        background: 'rgba(192, 132, 252, 0.1)',
                        color: '#c084fc',
                        border: '1px solid rgba(192, 132, 252, 0.25)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
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
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Fits: {acc.supportedModels}
                    </span>
                  )}
                  {acc.serialNumber && (
                    <span
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                      }}
                    >
                      SN: {acc.serialNumber}
                    </span>
                  )}
                </div>

                {/* Mounts Allocation Deck */}
                {acc.mounts && acc.mounts.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {acc.mounts.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(56, 189, 248, 0.07)',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                          padding: '0.35rem 0.7rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/details/${m.firearmId}`);
                        }}
                        title="Click to view mounted firearm details"
                      >
                        <LinkIcon size={13} color="var(--accent)" />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          Mounted on:
                        </span>
                        <strong
                          style={{
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1,
                          }}
                        >
                          {getMountedFirearmName(m.firearmId)}
                        </strong>
                        <span
                          style={{
                            background: 'rgba(0,0,0,0.3)',
                            padding: '0.08rem 0.4rem',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        >
                          Qty: {m.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      marginBottom: '1rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '0.35rem 0.6rem',
                      borderRadius: '4px',
                      border: '1px dashed rgba(255,255,255,0.08)',
                    }}
                  >
                    📦 In Storage ({quantity} unmounted)
                  </div>
                )}

                {/* Card Action Buttons */}
                <div
                  style={{
                    marginTop: 'auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAccessoryForDetail(acc);
                    }}
                    className="btn-secondary"
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.4rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Eye size={14} /> View Details
                  </button>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(acc);
                      }}
                      className="btn-icon"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-primary)',
                        padding: '0.45rem',
                        borderRadius: '6px',
                      }}
                      title="Edit Accessory"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(acc.id!);
                      }}
                      className="btn-icon"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        padding: '0.45rem',
                        borderRadius: '6px',
                      }}
                      title="Delete Accessory"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Modal */}
      <AccessoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadData}
        editingId={editingId}
        initialData={formData}
        initialUpc={location.state?.upc}
        firearms={firearms}
      />

      {/* Interactive Tactical Detail Card / Modal */}
      <AccessoryDetailModal
        isOpen={!!selectedAccessoryForDetail}
        accessory={selectedAccessoryForDetail}
        firearms={firearms}
        onClose={() => setSelectedAccessoryForDetail(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};
