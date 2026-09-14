import {
  AlertCircle,
  Archive,
  Barcode,
  Calendar,
  Check,
  ChevronRight,
  Copy,
  Layers,
  Package,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

export type LabelPreset = 'avery_5160' | 'avery_5163' | 'thermal_62mm';

export interface PrintableItem {
  id: string | number;
  type: 'ammo' | 'storage' | 'firearm';
  title: string;
  subtitle: string;
  code: string;
  extra?: string;
  qrPayload: string;
  count?: number;
}

export const BatchLabelStudio: React.FC = () => {
  const [preset, setPreset] = useState<LabelPreset>('avery_5160');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [includeQr, setIncludeQr] = useState(true);
  const [includeDate, setIncludeDate] = useState(true);
  const [includeBarcode, setIncludeBarcode] = useState(true);
  const [showGridBorder, setShowGridBorder] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'ammo' | 'storage' | 'firearms'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Source inventory loaded from window.api or mock fallback
  const [items, setItems] = useState<PrintableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const printableList: PrintableItem[] = [];

      // 1. Ammo Items
      if (window.api?.getAmmo) {
        const ammo = (await window.api.getAmmo()) || [];
        ammo.forEach((a: any) => {
          printableList.push({
            id: `ammo-${a.id}`,
            type: 'ammo',
            title: `${a.brand || 'Ammo'} ${a.name || ''}`.trim(),
            subtitle: a.caliber || 'Ammunition',
            code: a.sku || `AV-AMMO-${a.id}`,
            extra: `${a.count || 0} rds ${a.bullet_weight ? `• ${a.bullet_weight}gr` : ''}`,
            qrPayload: `armoryvault://ammo/${a.id}`,
            count: Number(a.count) || 0,
          });
        });
      }

      // 2. Storage Locations
      if (window.api?.getStorageLocations) {
        const locs = (await window.api.getStorageLocations()) || [];
        locs.forEach((loc: any) => {
          printableList.push({
            id: `storage-${loc.id}`,
            type: 'storage',
            title: loc.name || 'Storage Container',
            subtitle: loc.type ? loc.type.toUpperCase() : 'LOCATION',
            code: `AV-LOC-${loc.id}`,
            extra: loc.room ? `Room: ${loc.room}` : 'Vault Storage',
            qrPayload: `armoryvault://storage/${loc.id}`,
          });
        });
      }

      // 3. Firearms
      if (window.api?.getFirearms) {
        const firearms = (await window.api.getFirearms()) || [];
        firearms.forEach((f: any) => {
          printableList.push({
            id: `firearm-${f.id}`,
            type: 'firearm',
            title: `${f.make} ${f.model}`,
            subtitle: f.caliber || 'Firearm',
            code: f.serial_number ? `SN: ${f.serial_number}` : `AV-GUN-${f.id}`,
            extra: f.action_type || 'Firearm',
            qrPayload: `armoryvault://firearm/${f.id}`,
          });
        });
      }

      // Fallback sample items if empty
      if (printableList.length === 0) {
        printableList.push(
          {
            id: 'sample-ammo-1',
            type: 'ammo',
            title: 'Federal American Eagle',
            subtitle: '9mm Luger • 124gr FMJ',
            code: 'AV-AMMO-101',
            extra: '500 rds in Box',
            qrPayload: 'armoryvault://ammo/101',
            count: 500,
          },
          {
            id: 'sample-ammo-2',
            type: 'ammo',
            title: 'Hornady Black 75gr BTHP',
            subtitle: '5.56x45mm NATO',
            code: 'AV-AMMO-102',
            extra: '200 rds in Can',
            qrPayload: 'armoryvault://ammo/102',
            count: 200,
          },
          {
            id: 'sample-loc-1',
            type: 'storage',
            title: 'Ammo Can #4 (Green .50 Cal)',
            subtitle: 'AMMUNITION CANISTER',
            code: 'AV-LOC-04',
            extra: 'Capacity: 1,000 rds',
            qrPayload: 'armoryvault://storage/4',
          },
          {
            id: 'sample-loc-2',
            type: 'storage',
            title: 'Top Shelf Liberty Safe',
            subtitle: 'SECURITY VAULT',
            code: 'AV-LOC-01',
            extra: 'Handgun Staging',
            qrPayload: 'armoryvault://storage/1',
          }
        );
      }

      setItems(printableList);

      // Select first 5 items by default
      const initialMap: Record<string, number> = {};
      printableList.slice(0, 6).forEach((item) => {
        initialMap[String(item.id)] = 1;
      });
      setSelectedItems(initialMap);
    } catch (e) {
      console.error('Failed to load inventory for Label Studio:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab === 'ammo' && item.type !== 'ammo') return false;
      if (activeTab === 'storage' && item.type !== 'storage') return false;
      if (activeTab === 'firearms' && item.type !== 'firearm') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, activeTab, searchQuery]);

  const handleToggleItem = (id: string | number) => {
    const key = String(id);
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = 1;
      }
      return next;
    });
  };

  const handleSetCopies = (id: string | number, qty: number) => {
    const key = String(id);
    const validQty = Math.max(1, Math.min(100, qty));
    setSelectedItems((prev) => ({
      ...prev,
      [key]: validQty,
    }));
  };

  const handleSelectAllFiltered = () => {
    const next = { ...selectedItems };
    filteredItems.forEach((item) => {
      next[String(item.id)] = next[String(item.id)] || 1;
    });
    setSelectedItems(next);
  };

  const handleClearSelection = () => {
    setSelectedItems({});
  };

  // Build the flat array of labels to render based on quantity
  const labelsToRender = useMemo(() => {
    const list: PrintableItem[] = [];
    items.forEach((item) => {
      const count = selectedItems[String(item.id)] || 0;
      for (let i = 0; i < count; i++) {
        list.push(item);
      }
    });
    return list;
  }, [items, selectedItems]);

  const totalLabels = labelsToRender.length;
  const labelsPerSheet = preset === 'avery_5160' ? 30 : preset === 'avery_5163' ? 10 : 1;
  const totalSheets =
    preset === 'thermal_62mm' ? totalLabels : Math.ceil(totalLabels / labelsPerSheet);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="label-studio-page"
      style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}
    >
      {/* Dynamic Print CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-sheet-area, .printable-sheet-area * {
            visibility: visible;
          }
          .printable-sheet-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
            color: black !important;
          }
          .label-sheet-page {
            page-break-after: always;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="no-print" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Printer size={22} color="#3b82f6" />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text-primary, #fff)',
                  }}
                >
                  Batch Label & QR Print Studio
                </h1>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary, #94a3b8)',
                  }}
                >
                  Avery multi-label sheet generator and thermal continuous roll printing for ammo
                  cans, bins, and vaults
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={loadInventory}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                color: 'var(--text-primary, #fff)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={15} />
              Sync Items
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={totalLabels === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: totalLabels > 0 ? '#2563eb' : '#475569',
                border: 'none',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: totalLabels > 0 ? 'pointer' : 'not-allowed',
                boxShadow: totalLabels > 0 ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
              }}
            >
              <Printer size={16} />
              Print {totalLabels} {totalLabels === 1 ? 'Label' : 'Labels'} ({totalSheets}{' '}
              {totalSheets === 1 ? 'Sheet' : 'Sheets'})
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Split Layout */}
      <div
        className="no-print"
        style={{
          display: 'grid',
          gridTemplateColumns: '380px 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Preset & Selector Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Preset Selector Card */}
          <div
            style={{
              background: 'var(--bg-secondary, rgba(30, 41, 59, 0.7))',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}
            >
              <Layers size={16} color="#3b82f6" />
              <h3
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  margin: 0,
                  color: 'var(--text-primary, #fff)',
                }}
              >
                Label Format Presets
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                {
                  id: 'avery_5160',
                  title: 'Avery 5160 / 8160 (30-Up)',
                  desc: '1" × 2-5/8" • 3 cols × 10 rows • Boxes, Mags, Bins',
                  badge: 'Standard Sheet',
                },
                {
                  id: 'avery_5163',
                  title: 'Avery 5163 / 8163 (10-Up)',
                  desc: '2" × 4" • 2 cols × 5 rows • Ammo Cans & Crates',
                  badge: 'Weatherproof Can',
                },
                {
                  id: 'thermal_62mm',
                  title: 'Continuous Thermal (62mm)',
                  desc: '2.4" Continuous Roll • Brother QL / Dymo',
                  badge: 'Thermal Roll',
                },
              ].map((p) => {
                const isSelected = preset === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setPreset(p.id as LabelPreset)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: isSelected
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: isSelected ? '#60a5fa' : '#fff',
                        }}
                      >
                        {p.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isSelected
                            ? 'rgba(59, 130, 246, 0.3)'
                            : 'rgba(255,255,255,0.08)',
                          color: isSelected ? '#93c5fd' : '#94a3b8',
                        }}
                      >
                        {p.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', margin: 0, color: '#94a3b8' }}>{p.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Label Elements Toggles */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Element Toggles
              </span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginTop: '10px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeQr}
                    onChange={(e) => setIncludeQr(e.target.checked)}
                  />
                  Sync QR Code
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeDate}
                    onChange={(e) => setIncludeDate(e.target.checked)}
                  />
                  Packed Date
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeBarcode}
                    onChange={(e) => setIncludeBarcode(e.target.checked)}
                  />
                  SKU / Barcode
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showGridBorder}
                    onChange={(e) => setShowGridBorder(e.target.checked)}
                  />
                  Cut Border Lines
                </label>
              </div>
            </div>
          </div>

          {/* Item Selector Card */}
          <div
            style={{
              background: 'var(--bg-secondary, rgba(30, 41, 59, 0.7))',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              borderRadius: '12px',
              padding: '18px',
              maxHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={16} color="#3b82f6" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#fff' }}>
                  Select Inventory Items
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>
                {Object.keys(selectedItems).length} selected
              </span>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              {(['all', 'ammo', 'storage', 'firearms'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: activeTab === tab ? 600 : 400,
                    background: activeTab === tab ? '#2563eb' : 'rgba(255,255,255,0.06)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search
                size={14}
                color="#94a3b8"
                style={{ position: 'absolute', left: '10px', top: '9px' }}
              />
              <input
                type="text"
                placeholder="Search caliber, container, serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '7px 10px 7px 32px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: '0.8rem',
                }}
              />
            </div>

            {/* Select/Deselect All bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '0.75rem',
              }}
            >
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Select All Filtered ({filteredItems.length})
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Clear All
              </button>
            </div>

            {/* Scrollable Item List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '4px',
              }}
            >
              {filteredItems.map((item) => {
                const isSelected = !!selectedItems[String(item.id)];
                const copies = selectedItems[String(item.id)] || 1;

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: isSelected
                        ? 'rgba(59, 130, 246, 0.12)'
                        : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flex: 1,
                        cursor: 'pointer',
                        minWidth: 0,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleItem(item.id)}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {item.subtitle} {item.extra ? `• ${item.extra}` : ''}
                        </div>
                      </div>
                    </label>

                    {isSelected && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Qty:</span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={copies}
                          onChange={(e) =>
                            handleSetCopies(item.id, parseInt(e.target.value, 10) || 1)
                          }
                          style={{
                            width: '42px',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Live Print Preview */}
        <div
          style={{
            background: 'var(--bg-secondary, rgba(30, 41, 59, 0.7))',
            border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <QrCode size={16} color="#3b82f6" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#fff' }}>
                Live Sheet Preview (Sheet 1 of {totalSheets || 1})
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {totalLabels} {totalLabels === 1 ? 'label queued' : 'labels queued'}
            </span>
          </div>

          {/* Actual Printable Canvas Wrapper */}
          <div
            className="printable-sheet-area"
            style={{
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '24px',
              overflowX: 'auto',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            {totalLabels === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <Package size={40} style={{ opacity: 0.4, marginBottom: '10px' }} />
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
                  No items selected for label printing
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>
                  Check items on the left to populate the sheet
                </p>
              </div>
            ) : preset === 'avery_5160' ? (
              /* Avery 5160 Layout: 3 columns x 10 rows */
              <div
                className="label-sheet-page"
                style={{
                  width: '8.5in',
                  minHeight: '11in',
                  margin: '0 auto',
                  padding: '0.5in 0.1875in',
                  boxSizing: 'border-box',
                  background: 'white',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 2.625in)',
                  gridAutoRows: '1in',
                  columnGap: '0.125in',
                  rowGap: '0',
                }}
              >
                {labelsToRender.slice(0, 30).map((label, idx) => (
                  <div
                    key={`${label.id}-${idx}`}
                    style={{
                      boxSizing: 'border-box',
                      padding: '5px 8px',
                      border: showGridBorder ? '0.5pt dashed #cbd5e1' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      color: '#0f172a',
                      overflow: 'hidden',
                    }}
                  >
                    {includeQr && (
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          flexShrink: 0,
                          border: '1px solid #e2e8f0',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'white',
                        }}
                      >
                        {/* Vector QR Representation */}
                        <svg width="40" height="40" viewBox="0 0 33 33" fill="#0f172a">
                          <rect x="0" y="0" width="7" height="7" />
                          <rect x="1" y="1" width="5" height="5" fill="white" />
                          <rect x="2" y="2" width="3" height="3" />
                          <rect x="26" y="0" width="7" height="7" />
                          <rect x="27" y="1" width="5" height="5" fill="white" />
                          <rect x="28" y="2" width="3" height="3" />
                          <rect x="0" y="26" width="7" height="7" />
                          <rect x="1" y="27" width="5" height="5" fill="white" />
                          <rect x="2" y="28" width="3" height="3" />
                          <rect x="10" y="2" width="3" height="3" />
                          <rect x="16" y="4" width="3" height="3" />
                          <rect x="12" y="12" width="9" height="9" />
                          <rect x="14" y="14" width="5" height="5" fill="white" />
                          <rect x="22" y="14" width="4" height="4" />
                          <rect x="14" y="24" width="4" height="4" />
                          <rect x="24" y="24" width="5" height="5" />
                        </svg>
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '8.5pt',
                          fontWeight: 'bold',
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {label.title}
                      </div>
                      <div
                        style={{
                          fontSize: '7pt',
                          color: '#475569',
                          marginTop: '1px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {label.subtitle}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '3px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '6.5pt',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            color: '#1e293b',
                          }}
                        >
                          {label.code}
                        </span>
                        {includeDate && (
                          <span style={{ fontSize: '6pt', color: '#64748b' }}>
                            {new Date().toISOString().split('T')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : preset === 'avery_5163' ? (
              /* Avery 5163 Can Label: 2 columns x 5 rows */
              <div
                className="label-sheet-page"
                style={{
                  width: '8.5in',
                  minHeight: '11in',
                  margin: '0 auto',
                  padding: '0.5in 0.156in',
                  boxSizing: 'border-box',
                  background: 'white',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 4in)',
                  gridAutoRows: '2in',
                  columnGap: '0.1875in',
                  rowGap: '0',
                }}
              >
                {labelsToRender.slice(0, 10).map((label, idx) => (
                  <div
                    key={`${label.id}-${idx}`}
                    style={{
                      boxSizing: 'border-box',
                      padding: '12px 16px',
                      border: showGridBorder ? '0.5pt dashed #cbd5e1' : '1px solid #e2e8f0',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      color: '#0f172a',
                      background: 'white',
                    }}
                  >
                    {includeQr && (
                      <div
                        style={{
                          width: '90px',
                          height: '90px',
                          flexShrink: 0,
                          border: '1px solid #cbd5e1',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'white',
                        }}
                      >
                        <svg width="80" height="80" viewBox="0 0 33 33" fill="#0f172a">
                          <rect x="0" y="0" width="7" height="7" />
                          <rect x="1" y="1" width="5" height="5" fill="white" />
                          <rect x="2" y="2" width="3" height="3" />
                          <rect x="26" y="0" width="7" height="7" />
                          <rect x="27" y="1" width="5" height="5" fill="white" />
                          <rect x="28" y="2" width="3" height="3" />
                          <rect x="0" y="26" width="7" height="7" />
                          <rect x="1" y="27" width="5" height="5" fill="white" />
                          <rect x="2" y="28" width="3" height="3" />
                          <rect x="10" y="2" width="3" height="3" />
                          <rect x="16" y="4" width="3" height="3" />
                          <rect x="12" y="12" width="9" height="9" />
                          <rect x="14" y="14" width="5" height="5" fill="white" />
                          <rect x="22" y="14" width="4" height="4" />
                          <rect x="14" y="24" width="4" height="4" />
                          <rect x="24" y="24" width="5" height="5" />
                        </svg>
                      </div>
                    )}

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '7.5pt',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            background: '#0f172a',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '2px',
                          }}
                        >
                          ARMORYVAULT SECURE
                        </span>
                        {includeDate && (
                          <span style={{ fontSize: '7.5pt', color: '#64748b' }}>
                            {new Date().toISOString().split('T')[0]}
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '13pt',
                          fontWeight: 'bold',
                          lineHeight: 1.15,
                          color: '#0f172a',
                        }}
                      >
                        {label.title}
                      </div>

                      <div
                        style={{
                          fontSize: '9.5pt',
                          color: '#334155',
                          fontWeight: 600,
                          marginTop: '2px',
                        }}
                      >
                        {label.subtitle}
                      </div>

                      {label.extra && (
                        <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '2px' }}>
                          {label.extra}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: '8px',
                          paddingTop: '4px',
                          borderTop: '0.5pt solid #cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{ fontSize: '8pt', fontFamily: 'monospace', fontWeight: 'bold' }}
                        >
                          {label.code}
                        </span>
                        <span style={{ fontSize: '7pt', color: '#94a3b8' }}>
                          SCAN WITH COMPANION
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Thermal 62mm Continuous Roll */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  alignItems: 'center',
                }}
              >
                {labelsToRender.map((label, idx) => (
                  <div
                    key={`${label.id}-${idx}`}
                    style={{
                      width: '62mm',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      color: '#0f172a',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    {includeQr && (
                      <div style={{ width: '56px', height: '56px', flexShrink: 0 }}>
                        <svg width="56" height="56" viewBox="0 0 33 33" fill="#0f172a">
                          <rect x="0" y="0" width="7" height="7" />
                          <rect x="1" y="1" width="5" height="5" fill="white" />
                          <rect x="2" y="2" width="3" height="3" />
                          <rect x="26" y="0" width="7" height="7" />
                          <rect x="27" y="1" width="5" height="5" fill="white" />
                          <rect x="28" y="2" width="3" height="3" />
                          <rect x="0" y="26" width="7" height="7" />
                          <rect x="1" y="27" width="5" height="5" fill="white" />
                          <rect x="2" y="28" width="3" height="3" />
                          <rect x="12" y="12" width="9" height="9" />
                          <rect x="14" y="14" width="5" height="5" fill="white" />
                        </svg>
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '9pt',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {label.title}
                      </div>
                      <div style={{ fontSize: '7.5pt', color: '#475569' }}>{label.subtitle}</div>
                      <div
                        style={{
                          fontSize: '7pt',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          marginTop: '2px',
                        }}
                      >
                        {label.code}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
