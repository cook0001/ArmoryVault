import { Accessory, Ammo, Firearm, ReloadingComponent } from '../types';
import { parseCurrency, parseCurrencyOrNull } from './currency';

export type CsvEntityType = 'firearms' | 'ammo' | 'components' | 'accessories';

export interface ParsedCsvData {
  delimiter: string;
  headers: string[];
  rows: string[][];
  rawRows: Record<string, string>[];
}

export interface ColumnMapping {
  csvHeader: string;
  targetField: string; // target property key, or '' to ignore
}

export interface TransformationResult<T> {
  valid: T[];
  warnings: { row: number; item: Partial<T>; message: string }[];
  errors: { row: number; raw: Record<string, string>; message: string }[];
}

/**
 * Strips UTF-8 BOM, normalizes line breaks, and auto-detects delimiter.
 */
export const detectDelimiter = (text: string): string => {
  const firstLine = text.split(/\r\n|\r|\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const pipeCount = (firstLine.match(/\|/g) || []).length;

  if (tabCount > commaCount && tabCount > semiCount) return '\t';
  if (semiCount > commaCount && semiCount > tabCount) return ';';
  if (pipeCount > commaCount && pipeCount > tabCount) return '|';
  return ',';
};

/**
 * RFC 4180 compliant CSV tokenizer supporting quotes, escaped quotes (""),
 * multiline fields, and dynamic delimiters.
 */
export const parseRawCsv = (csvText: string, customDelimiter?: string): ParsedCsvData => {
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const delimiter = customDelimiter || detectDelimiter(cleanText);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  let i = 0;
  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
        }
      } else {
        currentField += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        currentField = '';
        // Only push non-empty rows
        if (currentRow.some((field) => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
      } else {
        currentField += char;
        i++;
      }
    }
  }

  // Push trailing field/row if present
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { delimiter, headers: [], rows: [], rawRows: [] };
  }

  const headers = rows[0];
  const bodyRows = rows.slice(1);
  const rawRows: Record<string, string>[] = bodyRows.map((r) => {
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = r[idx] ?? '';
    });
    return record;
  });

  return {
    delimiter,
    headers,
    rows: bodyRows,
    rawRows,
  };
};

/**
 * Normalizes a header label for synonym matching.
 */
export const normalizeHeader = (header: string): string => {
  return header
    .toLowerCase()
    .replace(/[#_.\-/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Synonym dictionaries for intelligent auto-mapping.
 */
const FIREARMS_SYNONYMS: Record<keyof Firearm | string, string[]> = {
  make: ['make', 'manufacturer', 'mfg', 'brand', 'builder', 'maker'],
  model: ['model', 'model name', 'firearm model', 'gun model', 'name', 'item'],
  serial_number: ['serial number', 'serial', 'serial no', 'sn', 's n', 'serialno', 'serialnum'],
  caliber: ['caliber', 'cal', 'gauge', 'chambering', 'bore'],
  firearm_type: ['firearm type', 'type', 'category', 'classification', 'kind', 'gun type'],
  action_type: ['action type', 'action', 'mechanism', 'operating system'],
  barrel_length: ['barrel length', 'barrel', 'bbl', 'barrel len', 'length', 'barrel length in'],
  finish: ['finish', 'color', 'coating', 'metal finish'],
  condition: ['condition', 'grade', 'state', 'quality', 'grading'],
  purchase_date: [
    'purchase date',
    'acquisition date',
    'acquired date',
    'date acquired',
    'date purchased',
    'buy date',
    'date',
  ],
  purchase_price: [
    'purchase price',
    'cost',
    'price',
    'paid',
    'amount paid',
    'purchase cost',
    'price paid',
    'value',
    'book value',
  ],
  purchased_from: [
    'purchased from',
    'acquired from',
    'seller',
    'dealer',
    'source',
    'ffl',
    'store',
    'vendor',
    'bought from',
  ],
  notes: ['notes', 'description', 'comments', 'remarks', 'details'],
  round_count: ['round count', 'rounds fired', 'rounds', 'shots fired', 'shot count'],
  is_sold: ['is sold', 'sold', 'disposed', 'status'],
  sold_date: ['sold date', 'disposition date', 'date sold', 'sale date'],
  sold_price: ['sold price', 'sale price', 'disposition price', 'amount sold'],
  sold_to_name: ['sold to', 'sold to name', 'disposition to', 'buyer', 'transferee'],
  is_nfa: ['is nfa', 'nfa', 'tax stamp', 'class 3', 'nfa item'],
  nfa_type: ['nfa type', 'stamp type'],
};

const AMMO_SYNONYMS: Record<keyof Ammo | string, string[]> = {
  caliber: ['caliber', 'cal', 'gauge', 'chambering'],
  manufacturer: ['manufacturer', 'brand', 'make', 'mfg'],
  name: ['name', 'product name', 'line', 'ammo name', 'description'],
  bullet_type: ['bullet type', 'projectile', 'bullet', 'type'],
  grain_weight: ['grain weight', 'grain', 'grains', 'bullet weight', 'weight', 'gr'],
  rounds_per_box: ['rounds per box', 'box count', 'box size', 'rpb'],
  boxes: ['boxes', 'box qty', 'number of boxes'],
  quantity: ['quantity', 'rounds', 'count', 'qty', 'total rounds', 'round count', 'in stock'],
  cost_per_round: ['cost per round', 'cpr', 'price per round'],
  box_price: ['box price', 'cost', 'price', 'purchase price', 'amount'],
  location: ['location', 'storage', 'storage location', 'ammo can', 'can'],
  lot_number: ['lot number', 'lot', 'batch', 'batch number'],
  notes: ['notes', 'description', 'comments'],
};

const RECHARGING_SYNONYMS: Record<keyof ReloadingComponent | string, string[]> = {
  type: ['type', 'component type', 'category', 'kind'],
  manufacturer: ['manufacturer', 'brand', 'make', 'mfg'],
  model: ['model', 'name', 'description', 'component name'],
  caliber: ['caliber', 'size', 'size caliber'],
  quantity: ['quantity', 'count', 'units', 'weight', 'qty', 'amount'],
  unit: ['unit', 'unit of measure', 'uom'],
  cost: ['cost', 'price', 'purchase price', 'value'],
  location: ['location', 'storage', 'shelf', 'bin'],
  lot_number: ['lot number', 'lot', 'batch'],
  notes: ['notes', 'comments', 'details'],
};

const ACCESSORY_SYNONYMS: Record<keyof Accessory | string, string[]> = {
  name: ['name', 'accessory name', 'title', 'description', 'item'],
  type: ['type', 'category', 'accessory type'],
  manufacturer: ['manufacturer', 'brand', 'make', 'mfg'],
  model: ['model', 'model name'],
  serial_number: ['serial number', 'serial', 'sn', 's n'],
  value: ['value', 'cost', 'price', 'purchase price'],
  location: ['location', 'storage', 'storage location'],
  condition: ['condition', 'state', 'grade'],
  notes: ['notes', 'comments', 'details'],
};

/**
 * Detects the entity type from CSV headers.
 */
export const detectEntityType = (headers: string[]): CsvEntityType => {
  const normalized = headers.map(normalizeHeader);

  let firearmScore = 0;
  let ammoScore = 0;
  let compScore = 0;
  let accScore = 0;

  for (const h of normalized) {
    if (h.includes('serial')) firearmScore += 4;
    if (h.includes('barrel')) firearmScore += 5;
    if (h.includes('action')) firearmScore += 3;
    if (h.includes('nfa')) firearmScore += 3;
    if (h.includes('caliber') || h.includes('cal')) {
      firearmScore += 2;
      ammoScore += 2;
      compScore += 1;
    }
    if (h.includes('grain') || h.includes('gr')) {
      ammoScore += 4;
      compScore += 2;
    }
    if (h.includes('round') || h.includes('cpr') || h.includes('box')) ammoScore += 3;
    if (h.includes('powder') || h.includes('primer') || h.includes('bullet') || h.includes('brass'))
      compScore += 5;
    if (
      h.includes('optic') ||
      h.includes('holster') ||
      h.includes('accessory') ||
      h.includes('suppressor')
    )
      accScore += 4;
  }

  const scores = [
    { type: 'firearms' as CsvEntityType, score: firearmScore },
    { type: 'ammo' as CsvEntityType, score: ammoScore },
    { type: 'components' as CsvEntityType, score: compScore },
    { type: 'accessories' as CsvEntityType, score: accScore },
  ];

  scores.sort((a, b) => b.score - a.score);
  return scores[0].score > 0 ? scores[0].type : 'firearms';
};

/**
 * Auto-maps CSV headers to target fields using synonym dictionaries.
 */
export const autoMapHeaders = (headers: string[], entityType: CsvEntityType): ColumnMapping[] => {
  let synonyms: Record<string, string[]> = FIREARMS_SYNONYMS;
  if (entityType === 'ammo') synonyms = AMMO_SYNONYMS;
  else if (entityType === 'components') synonyms = RECHARGING_SYNONYMS;
  else if (entityType === 'accessories') synonyms = ACCESSORY_SYNONYMS;

  const mappings: ColumnMapping[] = [];
  const assignedFields = new Set<string>();

  for (const header of headers) {
    const norm = normalizeHeader(header);
    let matchedField = '';

    // Ignore generic ID/Index columns unless explicitly targetable
    if (norm === 'id' || norm === 'row' || norm === 'index' || norm === 'num') {
      mappings.push({ csvHeader: header, targetField: '' });
      continue;
    }

    // 1. Exact match with field key
    for (const [fieldKey, syns] of Object.entries(synonyms)) {
      if (norm === fieldKey.toLowerCase()) {
        matchedField = fieldKey;
        break;
      }
      // 2. Exact match in synonyms list
      if (syns.includes(norm)) {
        matchedField = fieldKey;
        break;
      }
    }

    // 3. Word token matching fallback (avoids loose substring traps like 'id' inside 'paid')
    if (!matchedField) {
      const normTokens = norm.split(' ');
      for (const [fieldKey, syns] of Object.entries(synonyms)) {
        if (assignedFields.has(fieldKey)) continue;
        const hasWordMatch = syns.some((syn) => {
          const synTokens = syn.split(' ');
          return normTokens.some((nt) => nt.length > 2 && synTokens.includes(nt));
        });
        if (hasWordMatch) {
          matchedField = fieldKey;
          break;
        }
      }
    }

    if (matchedField && !assignedFields.has(matchedField)) {
      assignedFields.add(matchedField);
      mappings.push({ csvHeader: header, targetField: matchedField });
    } else {
      mappings.push({ csvHeader: header, targetField: '' });
    }
  }

  return mappings;
};

/**
 * Standardizes common date formats (MM/DD/YYYY, M/D/YY, YYYY-MM-DD, etc.) into ISO YYYY-MM-DD.
 */
export const standardizeDate = (dateStr: string): string => {
  if (!dateStr || !dateStr.trim()) return '';
  const clean = dateStr.trim();

  // Already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // MM/DD/YYYY or M/D/YYYY or MM-DD-YYYY
  const mdyMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (mdyMatch) {
    let year = parseInt(mdyMatch[3], 10);
    if (year < 100) {
      year += year >= 50 ? 1900 : 2000;
    }
    const month = mdyMatch[1].padStart(2, '0');
    const day = mdyMatch[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Attempt JavaScript Date parsing
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return clean;
};

/**
 * Maps common firearm condition inputs into standard ArmoryVault conditions.
 */
export const standardizeCondition = (cond: string): string => {
  const norm = cond.toLowerCase().trim();
  if (norm.includes('new') || norm.includes('nib') || norm.includes('unfired'))
    return 'New / Unfired';
  if (norm.includes('excel') || norm.includes('mint')) return 'Excellent';
  if (norm.includes('very good') || norm.includes('vg')) return 'Very Good';
  if (norm.includes('good')) return 'Good';
  if (norm.includes('fair')) return 'Fair';
  if (norm.includes('poor')) return 'Poor';
  return cond || 'Good';
};

/**
 * Transforms raw CSV rows into typed Firearm objects based on column mappings.
 */
export const transformFirearmsRows = (
  rawRows: Record<string, string>[],
  mappings: ColumnMapping[]
): TransformationResult<Firearm> => {
  const valid: Firearm[] = [];
  const warnings: { row: number; item: Partial<Firearm>; message: string }[] = [];
  const errors: { row: number; raw: Record<string, string>; message: string }[] = [];

  const mapLookup = new Map<string, string>();
  mappings.forEach((m) => {
    if (m.targetField) mapLookup.set(m.csvHeader, m.targetField);
  });

  rawRows.forEach((row, index) => {
    const rowNum = index + 1;
    const item: any = {};

    for (const [csvCol, val] of Object.entries(row)) {
      const target = mapLookup.get(csvCol);
      if (!target || val === undefined || val === null) continue;
      item[target] = val.trim();
    }

    // Required check: Make or Model must exist
    if (!item.make && !item.model) {
      errors.push({
        row: rowNum,
        raw: row,
        message: 'Missing both Make/Manufacturer and Model.',
      });
      return;
    }

    const firearm: Partial<Firearm> = {
      make: item.make || 'Unknown Make',
      model: item.model || 'Unknown Model',
      serial_number: item.serial_number || '',
      caliber: item.caliber || '',
      firearm_type: item.firearm_type || 'Other',
      action_type: item.action_type || '',
      barrel_length: item.barrel_length || '',
      finish: item.finish || '',
      condition: item.condition ? standardizeCondition(item.condition) : 'Good',
      purchase_date: item.purchase_date ? standardizeDate(item.purchase_date) : '',
      purchase_price: item.purchase_price ? parseCurrencyOrNull(item.purchase_price) : null,
      purchased_from: item.purchased_from || '',
      notes: item.notes || '',
      round_count: item.round_count ? parseInt(item.round_count, 10) || 0 : 0,
      is_sold:
        item.is_sold === true ||
        ['sold', 'yes', 'true', 'disposed', '1'].includes(
          String(item.is_sold || '')
            .toLowerCase()
            .trim()
        ) ||
        Boolean(
          item.sold_date ||
            item.sold_to_name ||
            (item.sold_price !== undefined &&
              item.sold_price !== null &&
              String(item.sold_price).trim() !== '')
        ),
      sold_date: item.sold_date ? standardizeDate(item.sold_date) : '',
      sold_price: item.sold_price ? parseCurrencyOrNull(item.sold_price) : null,
      sold_to_name: item.sold_to_name || '',
      is_nfa:
        item.is_nfa === true ||
        ['yes', 'true', '1'].includes(String(item.is_nfa).toLowerCase().trim()),
      nfa_type: item.nfa_type || undefined,
    };

    if (!firearm.serial_number) {
      warnings.push({
        row: rowNum,
        item: firearm,
        message: 'No serial number provided; record will not be deduplicated.',
      });
    }

    valid.push(firearm as Firearm);
  });

  return { valid, warnings, errors };
};

/**
 * Transforms raw CSV rows into typed Ammo objects based on column mappings.
 */
export const transformAmmoRows = (
  rawRows: Record<string, string>[],
  mappings: ColumnMapping[]
): TransformationResult<Ammo> => {
  const valid: Ammo[] = [];
  const warnings: { row: number; item: Partial<Ammo>; message: string }[] = [];
  const errors: { row: number; raw: Record<string, string>; message: string }[] = [];

  const mapLookup = new Map<string, string>();
  mappings.forEach((m) => {
    if (m.targetField) mapLookup.set(m.csvHeader, m.targetField);
  });

  rawRows.forEach((row, index) => {
    const rowNum = index + 1;
    const item: any = {};

    for (const [csvCol, val] of Object.entries(row)) {
      const target = mapLookup.get(csvCol);
      if (!target || val === undefined || val === null) continue;
      item[target] = val.trim();
    }

    if (!item.caliber && !item.manufacturer && !item.name) {
      errors.push({
        row: rowNum,
        raw: row,
        message: 'Missing Caliber, Manufacturer, and Product Name.',
      });
      return;
    }

    const qty = item.quantity ? parseInt(item.quantity.replace(/[^0-9]/g, ''), 10) || 0 : 0;
    const boxPrice = item.box_price ? parseCurrency(item.box_price) : 0;
    const rpb = item.rounds_per_box ? parseInt(item.rounds_per_box, 10) || 0 : 0;
    const cpr = item.cost_per_round
      ? parseCurrency(item.cost_per_round)
      : rpb > 0 && boxPrice > 0
        ? boxPrice / rpb
        : 0;

    const ammo: Partial<Ammo> = {
      caliber: item.caliber || 'Unknown Caliber',
      manufacturer: item.manufacturer || 'Generic',
      type: 'factory',
      count: qty,
      grain:
        item.grain_weight || item.grain
          ? parseInt(item.grain_weight || item.grain, 10) || 0
          : undefined,
      projectile: item.bullet_type || item.projectile || 'FMJ',
      costPerRound: cpr > 0 ? cpr : undefined,
      notes: item.notes || '',
    };

    valid.push(ammo as Ammo);
  });

  return { valid, warnings, errors };
};

/**
 * Transforms raw CSV rows into typed ReloadingComponent objects.
 */
export const transformComponentRows = (
  rawRows: Record<string, string>[],
  mappings: ColumnMapping[]
): TransformationResult<ReloadingComponent> => {
  const valid: ReloadingComponent[] = [];
  const warnings: { row: number; item: Partial<ReloadingComponent>; message: string }[] = [];
  const errors: { row: number; raw: Record<string, string>; message: string }[] = [];

  const mapLookup = new Map<string, string>();
  mappings.forEach((m) => {
    if (m.targetField) mapLookup.set(m.csvHeader, m.targetField);
  });

  rawRows.forEach((row, index) => {
    const rowNum = index + 1;
    const item: any = {};

    for (const [csvCol, val] of Object.entries(row)) {
      const target = mapLookup.get(csvCol);
      if (!target || val === undefined || val === null) continue;
      item[target] = val.trim();
    }

    let type = (item.type || 'powder').toLowerCase();
    if (type.includes('primer')) type = 'primer';
    else if (type.includes('bullet') || type.includes('projectile')) type = 'bullet';
    else if (type.includes('brass') || type.includes('case')) type = 'brass';
    else type = 'powder';

    const comp: Partial<ReloadingComponent> = {
      type: type as any,
      manufacturer: item.manufacturer || 'Unknown',
      name: item.name || item.model || 'Component',
      caliber: item.caliber || '',
      quantity: item.quantity ? parseFloat(item.quantity) || 0 : 0,
      weightUnit: (item.unit || item.weightUnit || (type === 'powder' ? 'lbs' : 'grains')) as any,
      cost: item.cost ? parseCurrency(item.cost) : 0,
      notes: item.notes || '',
    };

    valid.push(comp as ReloadingComponent);
  });

  return { valid, warnings, errors };
};

/**
 * Transforms raw CSV rows into typed Accessory objects.
 */
export const transformAccessoryRows = (
  rawRows: Record<string, string>[],
  mappings: ColumnMapping[]
): TransformationResult<Accessory> => {
  const valid: Accessory[] = [];
  const warnings: { row: number; item: Partial<Accessory>; message: string }[] = [];
  const errors: { row: number; raw: Record<string, string>; message: string }[] = [];

  const mapLookup = new Map<string, string>();
  mappings.forEach((m) => {
    if (m.targetField) mapLookup.set(m.csvHeader, m.targetField);
  });

  rawRows.forEach((row, index) => {
    const rowNum = index + 1;
    const item: any = {};

    for (const [csvCol, val] of Object.entries(row)) {
      const target = mapLookup.get(csvCol);
      if (!target || val === undefined || val === null) continue;
      item[target] = val.trim();
    }

    if (!item.name && !item.model) {
      errors.push({
        row: rowNum,
        raw: row,
        message: 'Missing Accessory Name/Model.',
      });
      return;
    }

    const acc: Partial<Accessory> = {
      type: (item.type as any) || 'Other',
      manufacturer: item.manufacturer || '',
      model: item.model || item.name || 'Accessory',
      serialNumber: item.serial_number || item.serialNumber || '',
      value: item.value ? parseCurrency(item.value) : 0,
      notes: item.notes || '',
      quantity: 1,
    };

    valid.push(acc as Accessory);
  });

  return { valid, warnings, errors };
};

export interface DuplicateResolutionPlan<T> {
  toInsert: T[];
  toUpdate: { existingId: number; updatedItem: Partial<T> }[];
  skippedCount: number;
}

/**
 * Resolves duplicates for Firearms based on serial number.
 */
export const resolveFirearmsDuplicates = (
  newFirearms: Firearm[],
  existingFirearms: Firearm[],
  mode: 'skip' | 'update' | 'import_all'
): DuplicateResolutionPlan<Firearm> => {
  if (mode === 'import_all') {
    return { toInsert: newFirearms, toUpdate: [], skippedCount: 0 };
  }

  const existingBySerial = new Map<string, Firearm>();
  existingFirearms.forEach((f) => {
    if (f.serial_number && f.serial_number.trim()) {
      existingBySerial.set(f.serial_number.trim().toLowerCase(), f);
    }
  });

  const toInsert: Firearm[] = [];
  const toUpdate: { existingId: number; updatedItem: Partial<Firearm> }[] = [];
  let skippedCount = 0;

  newFirearms.forEach((item) => {
    const key = item.serial_number ? item.serial_number.trim().toLowerCase() : '';
    if (key && existingBySerial.has(key)) {
      const existing = existingBySerial.get(key)!;
      if (mode === 'skip') {
        skippedCount++;
      } else if (mode === 'update' && existing.id !== undefined) {
        toUpdate.push({
          existingId: existing.id,
          updatedItem: { ...existing, ...item, id: existing.id },
        });
      }
    } else {
      toInsert.push(item);
    }
  });

  return { toInsert, toUpdate, skippedCount };
};

/**
 * Resolves duplicates for Ammo based on caliber + manufacturer + projectile.
 */
export const resolveAmmoDuplicates = (
  newAmmo: Ammo[],
  existingAmmo: Ammo[],
  mode: 'skip' | 'update' | 'import_all'
): DuplicateResolutionPlan<Ammo> => {
  if (mode === 'import_all') {
    return { toInsert: newAmmo, toUpdate: [], skippedCount: 0 };
  }

  const existingMap = new Map<string, Ammo>();
  existingAmmo.forEach((a) => {
    const key = `${a.caliber || ''}__${a.manufacturer || ''}__${a.projectile || ''}`
      .toLowerCase()
      .trim();
    existingMap.set(key, a);
  });

  const toInsert: Ammo[] = [];
  const toUpdate: { existingId: number; updatedItem: Partial<Ammo> }[] = [];
  let skippedCount = 0;

  newAmmo.forEach((item) => {
    const key = `${item.caliber || ''}__${item.manufacturer || ''}__${item.projectile || ''}`
      .toLowerCase()
      .trim();
    if (existingMap.has(key)) {
      const existing = existingMap.get(key)!;
      if (mode === 'skip') {
        skippedCount++;
      } else if (mode === 'update' && existing.id !== undefined) {
        const addedQty = Number(item.count) || 0;
        toUpdate.push({
          existingId: existing.id,
          updatedItem: {
            ...existing,
            count: (Number(existing.count) || 0) + addedQty,
          },
        });
      }
    } else {
      toInsert.push(item);
    }
  });

  return { toInsert, toUpdate, skippedCount };
};
