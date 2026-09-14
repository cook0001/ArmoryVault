import {
  Bookmark,
  BookmarkCheck,
  Building2,
  Check,
  Compass,
  DollarSign,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Target,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

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
  distance_miles?: number;
  latitude?: number;
  longitude?: number;
}

const STORAGE_KEY = 'saved_ranges';

const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
];

export const ShootingRanges: React.FC = () => {
  const [zipInput, setZipInput] = useState('');
  const [stateInput, setStateInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [amenityFilter, setAmenityFilter] = useState('all');
  const [publicOnly, setPublicOnly] = useState(false);
  const [ranges, setRanges] = useState<ShootingRange[]>([]);
  const [savedRangeIds, setSavedRangeIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Load bookmarked home ranges
  useEffect(() => {
    loadSavedRanges();
    // Default search TX or initial query
    handleSearch('TX');
  }, []);

  const loadSavedRanges = async () => {
    try {
      if ((window as any).api?.getConfig) {
        const saved = await (window as any).api.getConfig(STORAGE_KEY);
        if (Array.isArray(saved)) setSavedRangeIds(saved);
      } else {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) setSavedRangeIds(JSON.parse(local));
      }
    } catch (e) {
      console.error('Failed to load saved ranges:', e);
    }
  };

  const toggleBookmark = async (rangeId: number) => {
    const updated = savedRangeIds.includes(rangeId)
      ? savedRangeIds.filter((id) => id !== rangeId)
      : [...savedRangeIds, rangeId];

    setSavedRangeIds(updated);
    try {
      if ((window as any).api?.saveConfig) {
        await (window as any).api.saveConfig(STORAGE_KEY, updated);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to save home range:', e);
    }
  };

  const handleSearch = async (overrideState?: string) => {
    setLoading(true);
    const cleanZip = zipInput.trim();
    const cleanState = (overrideState !== undefined ? overrideState : stateInput)
      .toUpperCase()
      .trim();

    try {
      let results: ShootingRange[] = [];
      if ((window as any).api?.lookupRanges) {
        const res = await (window as any).api.lookupRanges({
          zip: cleanZip || undefined,
          state: cleanState || undefined,
          limit: 100,
        });
        if (res && res.data) {
          results = res.data;
        }
      } else if (typeof fetch === 'function') {
        const q = cleanZip ? `zip=${cleanZip}` : cleanState ? `state=${cleanState}` : 'state=TX';
        const res = await fetch(`https://armstrader.store/api/ranges/search?${q}&limit=100`);
        if (res.ok) {
          const json = await res.json();
          results = json.ranges || json.data || [];
        }
      }
      setRanges(results);
    } catch (e) {
      console.error('Error searching shooting ranges:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = (range: ShootingRange) => {
    const full =
      `${range.name}, ${range.street || ''}, ${range.city || ''}, ${range.state || ''} ${range.zip || ''}`
        .replace(/\s+/g, ' ')
        .trim();
    navigator.clipboard.writeText(full);
    setCopiedId(range.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRanges = useMemo(() => {
    return ranges.filter((r) => {
      if (publicOnly && !r.is_public) return false;

      if (typeFilter !== 'all') {
        const rType = (r.range_type || '').toLowerCase();
        if (typeFilter === 'indoor' && !rType.includes('indoor')) return false;
        if (typeFilter === 'outdoor' && !rType.includes('outdoor')) return false;
        if (typeFilter === 'club' && !rType.includes('club')) return false;
        if (typeFilter === 'clays' && !rType.includes('clay') && !rType.includes('trap'))
          return false;
      }

      if (amenityFilter !== 'all') {
        const amenities = (r.amenities || '').toLowerCase();
        if (
          amenityFilter === 'longrange' &&
          !amenities.includes('1000') &&
          !amenities.includes('high power') &&
          !amenities.includes('rifle')
        )
          return false;
        if (
          amenityFilter === 'tactical' &&
          !amenities.includes('tactical') &&
          !amenities.includes('action') &&
          !amenities.includes('bay')
        )
          return false;
        if (amenityFilter === 'steel' && !amenities.includes('steel')) return false;
        if (amenityFilter === 'chrono' && !amenities.includes('chrono')) return false;
      }

      return true;
    });
  }, [ranges, publicOnly, typeFilter, amenityFilter]);

  const stats = useMemo(() => {
    const publicCount = ranges.filter((r) => Boolean(r.is_public)).length;
    const fees = ranges.map((r) => Number(r.lane_fee)).filter((f) => !isNaN(f) && f > 0);
    const avgFee =
      fees.length > 0 ? (fees.reduce((a, b) => a + b, 0) / fees.length).toFixed(0) : '20';
    return {
      total: ranges.length,
      publicCount,
      avgFee,
      savedCount: savedRangeIds.length,
    };
  }, [ranges, savedRangeIds]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #334155',
          paddingBottom: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                padding: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                borderRadius: '10px',
                color: '#38bdf8',
              }}
            >
              <Target size={24} />
            </div>
            <div>
              <h1
                style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}
              >
                Shooting Range & Facility Finder
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Search 2,539 verified shooting ranges by ZIP or state, inspect tactical amenities,
                compare lane fees, and bookmark your home facilities.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => handleSearch()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            background: '#1e293b',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid #334155',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
            }}
          >
            Facilities Loaded
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
            {stats.total}
          </div>
        </div>
        <div
          style={{
            background: '#1e293b',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid #334155',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
            }}
          >
            Public Access
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            {stats.publicCount}
          </div>
        </div>
        <div
          style={{
            background: '#1e293b',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid #334155',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
            }}
          >
            Avg Lane Fee
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            ${stats.avgFee}
          </div>
        </div>
        <div
          style={{
            background: '#1e293b',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid #334155',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
            }}
          >
            Bookmarked Home Ranges
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
            {stats.savedCount}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #334155',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* ZIP Code Input */}
          <div style={{ flex: '1 1 180px', position: 'relative' }}>
            <MapPin
              size={16}
              color="#64748b"
              style={{ position: 'absolute', left: '10px', top: '12px' }}
            />
            <input
              type="text"
              placeholder="Enter 5-digit ZIP..."
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* State Select */}
          <div style={{ width: '130px' }}>
            <select
              value={stateInput}
              onChange={(e) => {
                setStateInput(e.target.value);
                handleSearch(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.85rem',
              }}
            >
              <option value="">All States</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.55rem 1.25rem',
              background: '#0284c7',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Search size={15} />
            Search Facilities
          </button>
        </div>

        {/* Filter Chips */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(51, 65, 85, 0.5)',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Facility Type:
          </span>
          {['all', 'indoor', 'outdoor', 'club', 'clays'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: typeFilter === t ? '#38bdf8' : '#334155',
                background: typeFilter === t ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
                color: typeFilter === t ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}

          <span
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginLeft: '0.5rem',
            }}
          >
            Amenities:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'longrange', label: '1000yd Long Range' },
            { id: 'tactical', label: 'Tactical Bays' },
            { id: 'steel', label: 'Steel Targets' },
            { id: 'chrono', label: 'Chrono Bay' },
          ].map((a) => (
            <button
              key={a.id}
              onClick={() => setAmenityFilter(a.id)}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: amenityFilter === a.id ? '#34d399' : '#334155',
                background: amenityFilter === a.id ? 'rgba(52, 211, 153, 0.15)' : '#0f172a',
                color: amenityFilter === a.id ? '#34d399' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {a.label}
            </button>
          ))}

          <label
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={publicOnly}
              onChange={(e) => setPublicOnly(e.target.checked)}
              style={{ accentColor: '#38bdf8' }}
            />
            Public Only
          </label>
        </div>
      </div>

      {/* Range Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1rem',
        }}
      >
        {filteredRanges.map((range) => {
          const isSaved = savedRangeIds.includes(range.id);
          return (
            <div
              key={range.id}
              style={{
                background: '#1e293b',
                borderRadius: '12px',
                border: isSaved ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid #334155',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isSaved ? '0 0 12px rgba(251, 191, 36, 0.08)' : 'none',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    marginBottom: '0.4rem',
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                      {range.name}
                    </h3>
                    {range.trade_name && range.trade_name !== range.name && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                        {range.trade_name}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => toggleBookmark(range.id)}
                    title={isSaved ? 'Remove from Home Ranges' : 'Bookmark as Home Range'}
                    style={{
                      background: isSaved ? 'rgba(251, 191, 36, 0.15)' : '#0f172a',
                      border: '1px solid',
                      borderColor: isSaved ? '#fbbf24' : '#334155',
                      borderRadius: '8px',
                      padding: '6px',
                      color: isSaved ? '#fbbf24' : '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                </div>

                {/* Badges Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '0.6rem 0' }}>
                  {range.range_type && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                      }}
                    >
                      {range.range_type}
                    </span>
                  )}
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: range.is_public
                        ? 'rgba(52, 211, 153, 0.12)'
                        : 'rgba(245, 158, 11, 0.12)',
                      color: range.is_public ? '#34d399' : '#fbbf24',
                      border: '1px solid',
                      borderColor: range.is_public
                        ? 'rgba(52, 211, 153, 0.25)'
                        : 'rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    {range.is_public ? 'Public' : 'Private / Club'}
                  </span>
                  {range.distance_miles !== undefined && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: '#0f172a',
                        color: '#cbd5e1',
                        border: '1px solid #334155',
                      }}
                    >
                      {range.distance_miles} mi
                    </span>
                  )}
                  {range.lane_fee !== null && range.lane_fee !== undefined && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'rgba(52, 211, 153, 0.1)',
                        color: '#34d399',
                        border: '1px solid rgba(52, 211, 153, 0.25)',
                      }}
                    >
                      ${range.lane_fee} {range.fee_type || 'Lane Fee'}
                    </span>
                  )}
                </div>

                {/* Location & Contact */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '0.8rem',
                    color: '#94a3b8',
                    margin: '0.6rem 0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} color="#64748b" />
                    <span>
                      {range.street ? `${range.street}, ` : ''}
                      {range.city}, {range.state} {range.zip}
                    </span>
                  </div>
                  {range.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} color="#64748b" />
                      <a
                        href={`tel:${range.phone}`}
                        style={{ color: '#38bdf8', textDecoration: 'none' }}
                      >
                        {range.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Amenities */}
                {range.amenities && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#cbd5e1',
                      background: '#0f172a',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #334155',
                      marginTop: '0.5rem',
                    }}
                  >
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Amenities: </span>
                    {range.amenities}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #334155',
                }}
              >
                <button
                  onClick={() => handleCopyAddress(range)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '0.45rem',
                    borderRadius: '6px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: copiedId === range.id ? '#34d399' : '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {copiedId === range.id ? <Check size={13} /> : <MapPin size={13} />}
                  {copiedId === range.id ? 'Copied' : 'Copy Address'}
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${range.name} ${range.street || ''} ${range.city || ''} ${range.state || ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <Navigation size={13} />
                  Directions
                </a>
              </div>
            </div>
          );
        })}

        {filteredRanges.length === 0 && !loading && (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '3rem',
              textAlign: 'center',
              background: '#1e293b',
              borderRadius: '12px',
              border: '1px solid #334155',
            }}
          >
            <Target size={36} color="#64748b" style={{ margin: '0 auto 10px' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
              No Shooting Ranges Found
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Try searching a different ZIP code, adjusting state filters, or clearing amenity
              criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShootingRanges;
