import { Bookmark, Sliders, Sparkles, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CustomSchedulePreset, Firearm } from '../../../types';
import {
  detectFirearmScheduleProfile,
  MAINTENANCE_PROFILES,
  MaintenanceProfile,
} from '../../../utils/maintenancePresets';

interface MaintenancePresetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  firearm: Firearm;
  customPresets: CustomSchedulePreset[];
  onLoadPreset: (presetId: string, mode: 'replace' | 'append', isCustom: boolean) => void;
  onDeleteCustomPreset: (id: string, e: React.MouseEvent) => void;
}

export const MaintenancePresetPickerModal: React.FC<MaintenancePresetPickerModalProps> = ({
  isOpen,
  onClose,
  firearm,
  customPresets,
  onLoadPreset,
  onDeleteCustomPreset,
}) => {
  const [presetTab, setPresetTab] = useState<'profiles' | 'custom'>('profiles');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    () => detectFirearmScheduleProfile(firearm).id
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedPresetId(detectFirearmScheduleProfile(firearm).id);
    }
  }, [isOpen, firearm]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100100 }}>
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
          <button className="btn-icon" onClick={onClose}>
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
              {presetTab === 'profiles' ? 'Available Action Profiles' : 'Your Custom Templates'}
            </div>

            {presetTab === 'profiles' ? (
              (Object.values(MAINTENANCE_PROFILES) as MaintenanceProfile[]).map((profile) => {
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
                      border: isSelected ? '1px solid #fbbf24' : '1px solid var(--border-light)',
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
                        onClick={(e) => onDeleteCustomPreset(preset.id, e)}
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
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
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
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
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
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {firearm.maintenance_schedules && firearm.maintenance_schedules.length > 0 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onLoadPreset(selectedPresetId, 'append', presetTab === 'custom')}
            >
              Append to Existing Tasks
            </button>
          )}
          <button
            type="button"
            className="btn-primary"
            onClick={() => onLoadPreset(selectedPresetId, 'replace', presetTab === 'custom')}
          >
            <Sparkles size={16} /> Apply Preset
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
