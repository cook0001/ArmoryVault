import {
  Building2,
  Check,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface FflDealer {
  id: number;
  license_num: string;
  business_name: string;
  trade_name?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  standard_fee?: number | null;
}

export interface FflPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (dealer: FflDealer) => void;
  initialZip?: string;
  initialState?: string;
}

export const FflPickerModal: React.FC<FflPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialZip = '',
  initialState = '',
}) => {
  const [query, setQuery] = useState(initialZip || initialState || '');
  const [dealers, setDealers] = useState<FflDealer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);

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
      setSelectedDealerId(null);
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

      if (window.api?.lookupFFL) {
        const res = await window.api.lookupFFL(params);
        if (res && res.success && Array.isArray(res.data)) {
          setDealers(res.data as FflDealer[]);
          setSource(res.source || 'database');
        } else {
          setDealers([]);
          setError('No licensed FFL dealers matched your search.');
        }
      }
    } catch (err: any) {
      console.error('FFL lookup error:', err);
      setError(err.message || 'Failed to search FFL database');
      setDealers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleSelectAndClose = (dealer: FflDealer) => {
    onSelect(dealer);
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
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                ATF Licensed FFL Directory
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Search 77,485 verified federal firearms licensees for compliant transfer & Bill of
                Sale records
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
              placeholder="Search by 5-digit ZIP code (e.g. 75201) or 2-letter State (e.g. TX)"
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

        {/* Source Badge & Results Count */}
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
            Found <strong>{dealers.length}</strong> licensed dealers
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
              Source:{' '}
              {source === 'local_database'
                ? 'Local ATF SQLite'
                : source === 'cloud_api'
                  ? 'ArmsTrader Network'
                  : 'Vault Directory'}
            </span>
          )}
        </div>

        {/* Dealer Results List */}
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

          {dealers.map((dealer) => {
            const isSelected = selectedDealerId === dealer.id;
            return (
              <div
                key={dealer.id || dealer.license_num}
                onClick={() => setSelectedDealerId(dealer.id)}
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  border: isSelected
                    ? '1.5px solid #3b82f6'
                    : '1px solid var(--border-color, rgba(255,255,255,0.1))',
                  background: isSelected
                    ? 'rgba(59, 130, 246, 0.08)'
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
                      {dealer.business_name}
                    </span>
                    {dealer.trade_name && dealer.trade_name !== dealer.business_name && (
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: '#3b82f6',
                          background: 'rgba(59, 130, 246, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        DBA: {dealer.trade_name}
                      </span>
                    )}
                  </div>

                  {/* FFL License Number */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                    }}
                  >
                    <FileText size={13} />
                    <span>FFL: {dealer.license_num || 'Recorded on File'}</span>
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
                      {dealer.street ? `${dealer.street}, ` : ''}
                      {dealer.city}, {dealer.state} {dealer.zip}
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
                    {dealer.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} />
                        {dealer.phone}
                      </span>
                    )}
                    {dealer.standard_fee != null && (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        Transfer Fee: ${dealer.standard_fee}
                      </span>
                    )}
                  </div>
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
                      handleSelectAndClose(dealer);
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
                    Select FFL
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
