import {
  Check,
  DollarSign,
  Layers,
  Loader2,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Target,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ShootingRange {
  id: number;
  name: string;
  trade_name?: string;
  range_type?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  lane_fee?: number | null;
  fee_type?: string;
  amenities?: string;
  is_public?: number | boolean;
}

export interface RangePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (range: ShootingRange) => void;
  initialZip?: string;
  initialState?: string;
}

export const RangePickerModal: React.FC<RangePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialZip = '',
  initialState = '',
}) => {
  const [query, setQuery] = useState(initialZip || initialState || '');
  const [ranges, setRanges] = useState<ShootingRange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');
  const [selectedRangeId, setSelectedRangeId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const startQuery = initialZip || initialState || '';
      setQuery(startQuery);
      if (startQuery.trim()) {
        executeSearch(startQuery);
      } else {
        executeSearch('');
      }
    } else {
      setSelectedRangeId(null);
      setError(null);
    }
  }, [isOpen, initialZip, initialState]);

  const executeSearch = async (searchTerm: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const term = searchTerm.trim();
      const params: { zip?: string; state?: string; limit?: number } = { limit: 30 };

      if (/^\d{3,5}$/.test(term)) {
        params.zip = term;
      } else if (/^[A-Za-z]{2}$/.test(term)) {
        params.state = term.toUpperCase();
      }

      if (window.api?.lookupRanges) {
        const res = await window.api.lookupRanges(params);
        if (res && res.success && Array.isArray(res.data)) {
          setRanges(res.data as ShootingRange[]);
          setSource(res.source || 'database');
        } else {
          setRanges([]);
          setError('No verified shooting ranges matched your search.');
        }
      }
    } catch (err: any) {
      console.error('Shooting range lookup error:', err);
      setError(err.message || 'Failed to search shooting ranges database');
      setRanges([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleSelectAndClose = (range: ShootingRange) => {
    onSelect(range);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{
          maxWidth: '780px',
          width: '92%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <Target size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                Shooting Range Directory
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Search 2,539 verified shooting facilities, clubs, and tactical complexes
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ZIP code (e.g. 75201) or State abbreviation (e.g. TX)"
              style={{ paddingLeft: '38px', width: '100%' }}
              autoFocus
            />
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ minWidth: '100px' }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
          </button>
        </form>

        {/* Results Metadata Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            marginBottom: '10px',
          }}
        >
          <span>
            Found <strong>{ranges.length}</strong> verified ranges
          </span>
          {source && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
              }}
            >
              <ShieldCheck size={12} color="#10b981" />
              Source: {source === 'local_database' ? 'Local Range Directory' : 'Range Network'}
            </span>
          )}
        </div>

        {/* Range Results List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingRight: '4px',
          }}
        >
          {error && (
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontSize: '0.88rem',
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          {ranges.map((range) => {
            const isSelected = selectedRangeId === range.id;
            return (
              <div
                key={range.id || range.name}
                onClick={() => setSelectedRangeId(range.id)}
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  border: isSelected
                    ? '1.5px solid #f59e0b'
                    : '1px solid var(--border-color, rgba(255,255,255,0.1))',
                  background: isSelected
                    ? 'rgba(245, 158, 11, 0.08)'
                    : 'var(--card-bg, rgba(255,255,255,0.02))',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
                  >
                    <span
                      style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-main)' }}
                    >
                      {range.name}
                    </span>
                    {range.is_public !== undefined && (
                      <span
                        style={{
                          fontSize: '0.74rem',
                          color: range.is_public ? '#10b981' : '#a855f7',
                          background: range.is_public
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(168, 85, 247, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        {range.is_public ? 'Public Access' : 'Private / Club'}
                      </span>
                    )}
                    {range.range_type && (
                      <span
                        style={{
                          fontSize: '0.74rem',
                          color: '#f59e0b',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {range.range_type}
                      </span>
                    )}
                  </div>

                  {/* Address */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary, #9ca3af)',
                      marginTop: '4px',
                    }}
                  >
                    <MapPin size={13} color="#f59e0b" />
                    <span>
                      {range.street ? `${range.street}, ` : ''}
                      {range.city}, {range.state} {range.zip}
                    </span>
                  </div>

                  {/* Phone & Fee */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                    }}
                  >
                    {range.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} />
                        {range.phone}
                      </span>
                    )}
                    {range.lane_fee != null && (
                      <span
                        style={{
                          color: '#10b981',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        <DollarSign size={12} />
                        Lane Fee: ${range.lane_fee} {range.fee_type ? `(${range.fee_type})` : ''}
                      </span>
                    )}
                  </div>

                  {/* Amenities */}
                  {range.amenities && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        marginTop: '6px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Layers size={12} color="#60a5fa" />
                      <span>{range.amenities}</span>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    alignItems: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAndClose(range);
                    }}
                    style={{
                      fontSize: '0.82rem',
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Check size={14} />
                    Select Range
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color, rgba(255,255,255,0.1))',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
