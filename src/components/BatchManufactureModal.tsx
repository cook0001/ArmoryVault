import React, { useState, useEffect } from 'react';
import { Ammo, ReloadingComponent } from '../types';
import { Sparkles, AlertTriangle, CheckCircle, Package, Layers, Scale } from 'lucide-react';

interface BatchManufactureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ammo: Ammo;
}

export const BatchManufactureModal: React.FC<BatchManufactureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ammo
}) => {
  const [batchQuantity, setBatchQuantity] = useState<number>(100);
  const [components, setComponents] = useState<ReloadingComponent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Selected Component IDs for deduction
  const [selectedPowderId, setSelectedPowderId] = useState<number | ''>('');
  const [selectedPrimerId, setSelectedPrimerId] = useState<number | ''>('');
  const [selectedBrassId, setSelectedBrassId] = useState<number | ''>('');
  const [selectedBulletId, setSelectedBulletId] = useState<number | ''>('');

  useEffect(() => {
    if (isOpen) {
      loadComponents();
    }
  }, [isOpen, ammo]);

  const loadComponents = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.getComponents) {
        const comps = await window.api.getComponents();
        setComponents(comps || []);
        autoMatchComponents(comps || []);
      }
    } catch (e) {
      console.error('Failed to load reloading components:', e);
    } finally {
      setLoading(false);
    }
  };

  const autoMatchComponents = (comps: ReloadingComponent[]) => {
    // 1. Powder match
    if (ammo.powder) {
      const powderQuery = ammo.powder.toLowerCase().trim();
      const powder = comps.find(c =>
        c.type === 'Powder' &&
        (`${c.manufacturer || ''} ${c.name || ''} ${c.caliber || ''}`).toLowerCase().includes(powderQuery)
      );
      if (powder?.id) setSelectedPowderId(powder.id);
    }

    // 2. Primer match
    const primerStr = `${ammo.primer || ''} ${ammo.primer_type || ''}`.toLowerCase().trim();
    if (primerStr) {
      const tokens = primerStr.split(/\s+/).filter(t => t.length >= 3);
      const primer = comps.find(c => {
        if (c.type !== 'Primer') return false;
        const compStr = `${c.manufacturer || ''} ${c.name || ''} ${c.primerType || ''} ${c.caliber || ''}`.toLowerCase();
        if (compStr.includes(primerStr) || primerStr.includes(compStr)) return true;
        if (ammo.primer_type && compStr.includes(ammo.primer_type.toLowerCase())) return true;
        return tokens.some(tok => compStr.includes(tok));
      });
      if (primer?.id) setSelectedPrimerId(primer.id);
    }

    // 3. Brass match
    if (ammo.caliber) {
      const calQuery = ammo.caliber.toLowerCase().trim();
      const brass = comps.find(c =>
        c.type === 'Brass' &&
        (c.caliber?.toLowerCase().includes(calQuery) || calQuery.includes(c.caliber?.toLowerCase() || ''))
      );
      if (brass?.id) setSelectedBrassId(brass.id);
    }

    // 4. Bullet match
    if (ammo.caliber) {
      const calQuery = ammo.caliber.toLowerCase().trim();
      const bullet = comps.find(c =>
        c.type === 'Bullet' &&
        (c.caliber?.toLowerCase().includes(calQuery) || calQuery.includes(c.caliber?.toLowerCase() || '')) &&
        (!ammo.grain || String(c.grain || '') === String(ammo.grain) || String(c.name || '').includes(String(ammo.grain)))
      );
      if (bullet?.id) setSelectedBulletId(bullet.id);
    }
  };

  if (!isOpen) return null;

  // Powder calculations
  const powderComp = components.find(c => c.id === selectedPowderId);
  const chargeGrains = Number(ammo.powderCharge) || 0;
  const totalGrainsNeeded = chargeGrains * batchQuantity;
  
  let powderNeededDisplay = '';
  let powderHasShortage = false;
  let powderAvailable = powderComp?.quantity || 0;

  if (powderComp && chargeGrains > 0) {
    if (powderComp.weightUnit === 'oz') {
      const ozNeeded = Number((totalGrainsNeeded / 437.5).toFixed(2));
      powderNeededDisplay = `${ozNeeded} oz (${totalGrainsNeeded.toLocaleString()} gr)`;
      powderHasShortage = (powderComp.quantity || 0) < ozNeeded;
    } else {
      const lbsNeeded = Number((totalGrainsNeeded / 7000).toFixed(3));
      powderNeededDisplay = `${lbsNeeded} lbs (${totalGrainsNeeded.toLocaleString()} gr)`;
      powderHasShortage = (powderComp.quantity || 0) < lbsNeeded;
    }
  }

  // Primer calculations
  const primerComp = components.find(c => c.id === selectedPrimerId);
  const primerHasShortage = primerComp ? (primerComp.quantity || 0) < batchQuantity : false;

  // Brass calculations
  const brassComp = components.find(c => c.id === selectedBrassId);
  const brassHasShortage = brassComp ? (brassComp.quantity || 0) < batchQuantity : false;

  // Bullet calculations
  const bulletComp = components.find(c => c.id === selectedBulletId);
  const bulletHasShortage = bulletComp ? (bulletComp.quantity || 0) < batchQuantity : false;

  const anyShortage = powderHasShortage || primerHasShortage || brassHasShortage || bulletHasShortage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchQuantity <= 0) return;

    setIsSubmitting(true);
    try {
      if (window.api && window.api.manufactureHandloadBatch) {
        const deductions: any = {};

        if (selectedPowderId && chargeGrains > 0) {
          deductions.powderId = Number(selectedPowderId);
          deductions.powderAmountGrains = chargeGrains;
        }
        if (selectedPrimerId) {
          deductions.primerId = Number(selectedPrimerId);
          deductions.primerCount = batchQuantity;
        }
        if (selectedBrassId) {
          deductions.brassId = Number(selectedBrassId);
          deductions.brassCount = batchQuantity;
        }
        if (selectedBulletId) {
          deductions.bulletId = Number(selectedBulletId);
          deductions.bulletCount = batchQuantity;
        }

        const res = await window.api.manufactureHandloadBatch(ammo.id!, batchQuantity, deductions);
        if (res && res.success) {
          onSuccess();
          onClose();
        } else {
          alert(`Failed to manufacture batch: ${res?.error || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Error manufacturing batch:', err);
      alert('Failed to manufacture handload batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal" style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={22} style={{ color: 'var(--accent)' }} />
            <div>
              <h3 style={{ margin: 0 }}>Assemble Handload Batch</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {ammo.caliber} &bull; {ammo.grain ? `${ammo.grain}gr ` : ''}{ammo.projectile || 'Bullet'} ({ammo.powder || 'Powder'} {ammo.powderCharge ? `${ammo.powderCharge}gr` : ''})
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
          {/* Batch Quantity Selector */}
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                Batch Quantity (Rounds to Assemble)
              </label>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Will add +{batchQuantity} rounds to finished stock and deduct required components.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {[50, 100, 250, 500].map(qty => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setBatchQuantity(qty)}
                  className={batchQuantity === qty ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                >
                  {qty}
                </button>
              ))}
              <input
                type="number"
                min="1"
                step="1"
                className="form-input"
                style={{ width: '90px', padding: '0.35rem 0.6rem', textAlign: 'center', fontWeight: 700 }}
                value={batchQuantity}
                onChange={(e) => setBatchQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                required
              />
            </div>
          </div>

          {/* Component Deduction Table */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
              Component Inventory Depletion Breakdown
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* 1. Powder */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '8px', border: powderHasShortage ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Scale size={16} style={{ color: '#fbbf24' }} />
                    <strong style={{ fontSize: '0.9rem' }}>Gunpowder: {ammo.powder || 'N/A'}</strong>
                  </div>
                  {chargeGrains > 0 && (
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: powderHasShortage ? '#ef4444' : 'var(--accent)' }}>
                      Need: {powderNeededDisplay}
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    value={selectedPowderId}
                    onChange={(e) => setSelectedPowderId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">-- Do not deduct powder --</option>
                    {components.filter(c => c.type === 'Powder').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.manufacturer} {c.name || ''} (In Stock: {c.quantity || 0} {c.weightUnit || 'lbs'})
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.8rem', color: powderHasShortage ? '#ef4444' : 'var(--text-secondary)', textAlign: 'right' }}>
                    {powderComp ? (
                      powderHasShortage ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                          <AlertTriangle size={14} /> Shortage (Have {powderAvailable} {powderComp.weightUnit || 'lbs'})
                        </span>
                      ) : (
                        <span style={{ color: '#4ade80', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle size={14} /> In Stock ({powderAvailable} {powderComp.weightUnit || 'lbs'})
                        </span>
                      )
                    ) : (
                      'No powder selected'
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Primers */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '8px', border: primerHasShortage ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Layers size={16} style={{ color: '#38bdf8' }} />
                    <strong style={{ fontSize: '0.9rem' }}>Primers: {ammo.primer || ammo.primer_type || 'N/A'}</strong>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: primerHasShortage ? '#ef4444' : 'var(--accent)' }}>
                    Need: {batchQuantity.toLocaleString()} primers
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    value={selectedPrimerId}
                    onChange={(e) => setSelectedPrimerId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">-- Do not deduct primers --</option>
                    {components.filter(c => c.type === 'Primer').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.manufacturer} {c.name || ''} {c.primerType || ''} (In Stock: {c.quantity || 0})
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.8rem', color: primerHasShortage ? '#ef4444' : 'var(--text-secondary)', textAlign: 'right' }}>
                    {primerComp ? (
                      primerHasShortage ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                          <AlertTriangle size={14} /> Shortage (Have {primerComp.quantity || 0})
                        </span>
                      ) : (
                        <span style={{ color: '#4ade80', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle size={14} /> In Stock ({primerComp.quantity || 0})
                        </span>
                      )
                    ) : (
                      'No primer selected'
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Brass / Cases */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '8px', border: brassHasShortage ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Package size={16} style={{ color: '#c084fc' }} />
                    <strong style={{ fontSize: '0.9rem' }}>Brass / Cases: {ammo.brass || ammo.caliber}</strong>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: brassHasShortage ? '#ef4444' : 'var(--accent)' }}>
                    Need: {batchQuantity.toLocaleString()} cases
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    value={selectedBrassId}
                    onChange={(e) => setSelectedBrassId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">-- Do not deduct brass --</option>
                    {components.filter(c => c.type === 'Brass').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.manufacturer} {c.caliber} (In Stock: {c.quantity || 0})
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.8rem', color: brassHasShortage ? '#ef4444' : 'var(--text-secondary)', textAlign: 'right' }}>
                    {brassComp ? (
                      brassHasShortage ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                          <AlertTriangle size={14} /> Shortage (Have {brassComp.quantity || 0})
                        </span>
                      ) : (
                        <span style={{ color: '#4ade80', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle size={14} /> In Stock ({brassComp.quantity || 0})
                        </span>
                      )
                    ) : (
                      'No brass selected'
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Bullets / Projectiles */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '8px', border: bulletHasShortage ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} style={{ color: '#f59e0b' }} />
                    <strong style={{ fontSize: '0.9rem' }}>Projectiles: {ammo.bullet_manufacturer ? `${ammo.bullet_manufacturer} ` : ''}{ammo.grain ? `${ammo.grain}gr ` : ''}{ammo.projectile || ''}</strong>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: bulletHasShortage ? '#ef4444' : 'var(--accent)' }}>
                    Need: {batchQuantity.toLocaleString()} bullets
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    value={selectedBulletId}
                    onChange={(e) => setSelectedBulletId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">-- Do not deduct bullets --</option>
                    {components.filter(c => c.type === 'Bullet').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.manufacturer} {c.caliber} {c.grain ? `${c.grain}gr ` : ''}{c.name || ''} (In Stock: {c.quantity || 0})
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.8rem', color: bulletHasShortage ? '#ef4444' : 'var(--text-secondary)', textAlign: 'right' }}>
                    {bulletComp ? (
                      bulletHasShortage ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                          <AlertTriangle size={14} /> Shortage (Have {bulletComp.quantity || 0})
                        </span>
                      ) : (
                        <span style={{ color: '#4ade80', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle size={14} /> In Stock ({bulletComp.quantity || 0})
                        </span>
                      )
                    ) : (
                      'No bullets selected'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions" style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || batchQuantity <= 0}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Sparkles size={16} /> {isSubmitting ? 'Assembling...' : `Manufacture Batch (+${batchQuantity} Rds)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
