import {
  Activity,
  Crosshair,
  FileText,
  Gauge,
  Hash,
  Layers,
  PlusCircle,
  Printer,
  Sparkles,
  Target,
  Thermometer,
  Trash2,
  TrendingUp,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BallisticsNavIcon,
  BulletProjectileIcon,
  CartridgesIcon,
  ScopeIcon,
} from '../components/CustomIcons';
import type { BallisticProfile, BallisticSolution } from '../types';
import {
  BallisticPreset,
  COMMON_CALIBER_PRESETS,
  solveTrajectory,
} from '../utils/ballisticsEngine';

export const BallisticsCalculator = () => {
  const [profiles, setProfiles] = useState<BallisticProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<BallisticProfile | null>(null);
  const [solutions, setSolutions] = useState<BallisticSolution[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [maxRange, setMaxRange] = useState(1000);
  const [stepYards, setStepYards] = useState(25);
  const [turretUnit, setTurretUnit] = useState<'moa' | 'mil'>('moa');

  // Form state
  const [form, setForm] = useState<Partial<BallisticProfile>>({
    name: '',
    caliber: '',
    bulletWeight: 168,
    ballisticCoefficient: 0.462,
    dragModel: 'G1',
    muzzleVelocity: 2700,
    zeroRange: 100,
    sightHeight: 1.5,
    windSpeed: 10,
    windAngle: 90,
    temperature: 59,
    altitude: 0,
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    if (window.api?.getBallisticProfiles) {
      const p = await window.api.getBallisticProfiles();
      setProfiles(p);
      if (p.length > 0 && !selectedProfile) {
        setSelectedProfile(p[0]);
        setSolutions(solveTrajectory(p[0], maxRange, stepYards));
      }
    }
  };

  const handleProfileSelect = (profile: BallisticProfile) => {
    setSelectedProfile(profile);
    setSolutions(solveTrajectory(profile, maxRange, stepYards));
  };

  const handleRecalculate = () => {
    if (selectedProfile) {
      setSolutions(solveTrajectory(selectedProfile, maxRange, stepYards));
    }
  };

  const handleSaveProfile = async () => {
    if (!form.name || !form.caliber) return;
    const profile = form as BallisticProfile;
    if (window.api?.addBallisticProfile) {
      await window.api.addBallisticProfile(profile);
      await loadProfiles();
      setIsAddModalOpen(false);
      setForm({
        name: '',
        caliber: '',
        bulletWeight: 168,
        ballisticCoefficient: 0.462,
        dragModel: 'G1',
        muzzleVelocity: 2700,
        zeroRange: 100,
        sightHeight: 1.5,
        windSpeed: 10,
        windAngle: 90,
        temperature: 59,
        altitude: 0,
      });
    }
  };

  const handleDeleteProfile = async (id: number) => {
    if (!confirm('Delete this ballistic profile?')) return;
    if (window.api?.deleteBallisticProfile) {
      await window.api.deleteBallisticProfile(id);
      if (selectedProfile?.id === id) {
        setSelectedProfile(null);
        setSolutions([]);
      }
      await loadProfiles();
    }
  };

  const handleApplyPreset = (preset: BallisticPreset) => {
    setForm({
      name: preset.name,
      caliber: preset.caliber,
      bulletWeight: preset.bulletWeight,
      ballisticCoefficient: preset.ballisticCoefficient,
      dragModel: preset.dragModel,
      muzzleVelocity: preset.muzzleVelocity,
      zeroRange: preset.zeroRange,
      sightHeight: preset.sightHeight,
      windSpeed: 10,
      windAngle: 90,
      temperature: 59,
      altitude: 0,
    });
  };

  const handleInstantPresetCalculate = (preset: BallisticPreset) => {
    const tempProfile: BallisticProfile = {
      name: preset.name,
      caliber: preset.caliber,
      bulletWeight: preset.bulletWeight,
      ballisticCoefficient: preset.ballisticCoefficient,
      dragModel: preset.dragModel,
      muzzleVelocity: preset.muzzleVelocity,
      zeroRange: preset.zeroRange,
      sightHeight: preset.sightHeight,
      windSpeed: 10,
      windAngle: 90,
      temperature: 59,
      altitude: 0,
    };
    setSelectedProfile(tempProfile);
    setSolutions(solveTrajectory(tempProfile, maxRange, stepYards));
  };

  const handlePrintDopeCard = () => {
    if (!selectedProfile || solutions.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const unit = turretUnit.toUpperCase();
    const dropKey = turretUnit === 'moa' ? 'dropMOA' : 'dropMIL';
    const driftKey = turretUnit === 'moa' ? 'windDriftMOA' : 'windDriftMIL';

    printWindow.document.write(`
      <html><head><title>DOPE Card — ${selectedProfile.name}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; color: #000; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        .meta { font-size: 11px; color: #555; margin-bottom: 12px; }
        table { border-collapse: collapse; width: 100%; font-size: 11px; }
        th, td { border: 1px solid #333; padding: 3px 6px; text-align: center; }
        th { background: #222; color: #fff; }
        tr:nth-child(even) { background: #f0f0f0; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <h1>DOPE CARD — ${selectedProfile.name}</h1>
      <div class="meta">
        ${selectedProfile.caliber} | ${selectedProfile.bulletWeight}gr | BC ${selectedProfile.ballisticCoefficient} (${selectedProfile.dragModel}) |
        MV ${selectedProfile.muzzleVelocity} fps | Zero ${selectedProfile.zeroRange} yds |
        Wind ${selectedProfile.windSpeed || 0} mph @ ${selectedProfile.windAngle || 90}°
      </div>
      <table>
        <tr><th>Range (yds)</th><th>Drop (${unit})</th><th>Clicks</th><th>Drift (${unit})</th><th>Vel (fps)</th><th>Energy (ft-lbs)</th><th>TOF (s)</th></tr>
        ${solutions
          .map((s) => {
            const clicks =
              turretUnit === 'moa' ? Math.round(s.dropMOA * 4) : Math.round(s.dropMIL * 10);
            return `
          <tr>
            <td>${s.range}</td>
            <td>${(s as any)[dropKey]}</td>
            <td>${clicks}</td>
            <td>${(s as any)[driftKey]}</td>
            <td>${s.velocity}</td>
            <td>${s.energy}</td>
            <td>${s.timeOfFlight}</td>
          </tr>
        `;
          })
          .join('')}
      </table>
      <div class="meta" style="margin-top: 8px;">Generated by ArmoryVault • ${new Date().toLocaleDateString()}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1
            style={{
              color: 'var(--text-primary)',
              margin: 0,
              fontSize: '1.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <BallisticsNavIcon size={24} color="var(--accent)" />
            Ballistics Calculator & DOPE Cards
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            G1/G7 point-mass trajectory solver with comprehensive caliber ballistic library
          </p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle size={16} /> New Profile
        </button>
      </div>

      {/* Quick Caliber Presets Library */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.6rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--accent)',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            <Sparkles size={14} /> Quick Common Caliber Library
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Click any preset to calculate instant ballistics
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {COMMON_CALIBER_PRESETS.slice(0, 8).map((cp) => (
            <button
              key={cp.name}
              onClick={() => handleInstantPresetCalculate(cp)}
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.35rem 0.65rem',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <CartridgesIcon size={12} color="#f59e0b" />
              <span>
                {cp.name.split(' ')[0]} {cp.bulletWeight}gr
              </span>
            </button>
          ))}
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              borderRadius: '8px',
              padding: '0.35rem 0.65rem',
              cursor: 'pointer',
              color: '#34d399',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              fontWeight: 600,
            }}
          >
            + View All {COMMON_CALIBER_PRESETS.length} Calibers
          </button>
        </div>
      </div>

      {/* Profile Selector Cards */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {profiles.map((p) => (
          <div
            key={p.id}
            onClick={() => handleProfileSelect(p)}
            style={{
              padding: '0.75rem 1rem',
              background:
                selectedProfile?.id === p.id ? 'rgba(52, 211, 153, 0.15)' : 'var(--card-bg)',
              border:
                selectedProfile?.id === p.id
                  ? '1px solid var(--accent)'
                  : '1px solid var(--border-light)',
              borderRadius: '10px',
              cursor: 'pointer',
              minWidth: '180px',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <CartridgesIcon size={13} color="#f59e0b" />
              {p.name}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
              {p.caliber} • {p.bulletWeight}gr • {p.muzzleVelocity} fps
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteProfile(p.id!);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--danger)',
                cursor: 'pointer',
                marginTop: 4,
                padding: 0,
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {profiles.length === 0 && (
          <div
            style={{
              color: 'var(--text-muted)',
              padding: '1rem',
              textAlign: 'center',
              width: '100%',
              fontSize: '0.85rem',
            }}
          >
            Select a common preset above or click "New Profile" to create a custom profile.
          </div>
        )}
      </div>

      {/* Controls Row */}
      {selectedProfile && (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            padding: '1rem',
            background: 'var(--card-bg)',
            borderRadius: '10px',
            border: '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Max Range</label>
            <input
              type="number"
              value={maxRange}
              onChange={(e) => setMaxRange(Number(e.target.value))}
              style={{ width: 80 }}
              className="glass-input"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Step</label>
            <select
              value={stepYards}
              onChange={(e) => setStepYards(Number(e.target.value))}
              className="glass-input"
              style={{ width: 80 }}
            >
              <option value={25}>25 yds</option>
              <option value={50}>50 yds</option>
              <option value={100}>100 yds</option>
            </select>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setTurretUnit('moa')}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: turretUnit === 'moa' ? 'var(--accent)' : 'transparent',
                color: turretUnit === 'moa' ? '#000' : 'var(--text-muted)',
              }}
            >
              MOA (1/4 click)
            </button>
            <button
              onClick={() => setTurretUnit('mil')}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: turretUnit === 'mil' ? 'var(--accent)' : 'transparent',
                color: turretUnit === 'mil' ? '#000' : 'var(--text-muted)',
              }}
            >
              MIL (0.1 click)
            </button>
          </div>
          <button
            className="btn-secondary"
            onClick={handleRecalculate}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
          >
            <TrendingUp size={14} /> Recalculate
          </button>
          <button
            className="btn-secondary"
            onClick={handlePrintDopeCard}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
          >
            <Printer size={14} /> Print DOPE Card
          </button>
        </div>
      )}

      {/* Profile Quick Stats */}
      {selectedProfile && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          {[
            {
              icon: <Zap size={16} />,
              label: 'Muzzle Velocity',
              value: `${selectedProfile.muzzleVelocity} fps`,
            },
            {
              icon: <Hash size={16} />,
              label: 'Bullet Weight',
              value: `${selectedProfile.bulletWeight} gr`,
            },
            {
              icon: <Activity size={16} />,
              label: 'BC',
              value: `${selectedProfile.ballisticCoefficient} (${selectedProfile.dragModel})`,
            },
            {
              icon: <Target size={16} />,
              label: 'Zero Range',
              value: `${selectedProfile.zeroRange} yds`,
            },
            {
              icon: <Gauge size={16} />,
              label: 'Sight Height',
              value: `${selectedProfile.sightHeight}"`,
            },
            {
              icon: <Wind size={16} />,
              label: 'Wind',
              value: `${selectedProfile.windSpeed || 0} mph @ ${selectedProfile.windAngle || 90}°`,
            },
            {
              icon: <Thermometer size={16} />,
              label: 'Temp',
              value: `${selectedProfile.temperature || 59}°F`,
            },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <div
                style={{
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.75rem',
                }}
              >
                {stat.icon} {stat.label}
              </div>
              <div
                style={{
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  fontFamily: 'monospace',
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trajectory Table */}
      {solutions.length > 0 && (
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                  {[
                    'Range (yds)',
                    `Drop (${turretUnit.toUpperCase()})`,
                    'Turret Clicks',
                    'Drop (in)',
                    `Drift (${turretUnit.toUpperCase()})`,
                    'Drift (in)',
                    'Velocity (fps)',
                    'Energy (ft-lbs)',
                    'TOF (s)',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '0.65rem 0.75rem',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        letterSpacing: '0.03em',
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {solutions.map((s, i) => {
                  const isZero = s.range === selectedProfile?.zeroRange;
                  const clicks =
                    turretUnit === 'moa' ? Math.round(s.dropMOA * 4) : Math.round(s.dropMIL * 10);
                  return (
                    <tr
                      key={i}
                      style={{
                        background: isZero
                          ? 'rgba(52,211,153,0.08)'
                          : i % 2 === 0
                            ? 'transparent'
                            : 'rgba(255,255,255,0.02)',
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      <td
                        style={{
                          padding: '0.5rem 0.75rem',
                          textAlign: 'center',
                          fontWeight: isZero ? 700 : 500,
                          color: isZero ? 'var(--accent)' : 'var(--text-primary)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {s.range}
                      </td>
                      <td
                        style={{
                          padding: '0.5rem 0.75rem',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: s.drop > 0 ? '#4ade80' : '#f87171',
                        }}
                      >
                        {turretUnit === 'moa' ? s.dropMOA : s.dropMIL}
                      </td>
                      <td
                        style={{
                          padding: '0.5rem 0.75rem',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          color: 'var(--accent)',
                          fontWeight: 700,
                        }}
                      >
                        {clicks > 0 ? `+${clicks}` : clicks}
                      </td>
                      <td
                        style={{
                          padding: '0.5rem 0.75rem',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {s.drop}
                      </td>
                      <td
                        style={{
                          padding: '0.5rem 0.75rem',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          color: '#60a5fa',
                        }}
                      >
                        {turretUnit === 'moa' ? s.windDriftMOA : s.windDriftMIL}
                      </td>
                      <td
                        style={{
                          padding: '0.5rem 0.75rem',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {s.windDrift}
                      </td>
                      <td
                        style={{
                          padding: '0.5rem 0.75rem',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {s.velocity}
                      </td>
                      <td
                        style={{
                          padding: '0.5rem 0.75rem',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {s.energy}
                      </td>
                      <td
                        style={{
                          padding: '0.5rem 0.75rem',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {s.timeOfFlight}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Profile Modal */}
      {isAddModalOpen &&
        createPortal(
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
                borderRadius: '16px',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '620px',
                maxHeight: '85vh',
                overflow: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.15rem' }}>
                  New Ballistic Profile
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Quick Preset Selector inside modal */}
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '0.75rem',
                  background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  borderRadius: '10px',
                }}
              >
                <label
                  style={{
                    display: 'block',
                    color: 'var(--accent)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Auto-Fill from Common Caliber Library:
                </label>
                <select
                  className="glass-input"
                  onChange={(e) => {
                    const p = COMMON_CALIBER_PRESETS.find((x) => x.name === e.target.value);
                    if (p) handleApplyPreset(p);
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    -- Select a Factory Caliber Preset --
                  </option>
                  {['Rifle', 'Handgun', 'Rimfire', 'Shotgun'].map((cat) => (
                    <optgroup key={cat} label={`── ${cat} ──`}>
                      {COMMON_CALIBER_PRESETS.filter((p) => p.category === cat).map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} ({p.muzzleVelocity} fps • BC {p.ballisticCoefficient})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Profile Name', key: 'name', type: 'text', span: 2 },
                  { label: 'Caliber', key: 'caliber', type: 'text' },
                  { label: 'Drag Model', key: 'dragModel', type: 'select', options: ['G1', 'G7'] },
                  { label: 'Bullet Weight (gr)', key: 'bulletWeight', type: 'number' },
                  {
                    label: 'Ballistic Coefficient',
                    key: 'ballisticCoefficient',
                    type: 'number',
                    step: '0.001',
                  },
                  { label: 'Muzzle Velocity (fps)', key: 'muzzleVelocity', type: 'number' },
                  { label: 'Zero Range (yds)', key: 'zeroRange', type: 'number' },
                  { label: 'Sight Height (in)', key: 'sightHeight', type: 'number', step: '0.1' },
                  { label: 'Wind Speed (mph)', key: 'windSpeed', type: 'number' },
                  { label: 'Wind Angle (°)', key: 'windAngle', type: 'number' },
                  { label: 'Temperature (°F)', key: 'temperature', type: 'number' },
                  { label: 'Altitude (ft)', key: 'altitude', type: 'number' },
                ].map((field) => (
                  <div
                    key={field.key}
                    style={{ gridColumn: (field as any).span === 2 ? 'span 2' : undefined }}
                  >
                    <label
                      style={{
                        display: 'block',
                        color: 'var(--text-muted)',
                        fontSize: '0.78rem',
                        marginBottom: 4,
                      }}
                    >
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        className="glass-input"
                        value={(form as any)[field.key] || ''}
                        onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                      >
                        {field.options?.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="glass-input"
                        type={field.type}
                        step={(field as any).step}
                        value={(form as any)[field.key] ?? ''}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            [field.key]:
                              field.type === 'number' ? Number(e.target.value) : e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginTop: '1.25rem',
                  justifyContent: 'flex-end',
                }}
              >
                <button className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSaveProfile}>
                  Save Profile
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
