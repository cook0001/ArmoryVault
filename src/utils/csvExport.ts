import { Firearm } from '../types';

/** Escapes a CSV field per RFC 4180: wraps in quotes and doubles any internal quotes. */
const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  return '"' + str.replace(/"/g, '""') + '"';
};

export const exportToCSV = (firearms: Firearm[]): string => {
  if (!firearms || firearms.length === 0) return '';

  const headers = [
    'ID', 'Make', 'Model', 'Serial Number', 'Caliber', 
    'Barrel Length', 'Action Type', 'Purchase Date', 
    'Purchase Price', 'Condition', 'Status', 
    'Sold To', 'Sale Date', 'Sale Price'
  ];

  const rows = firearms.map(f => [
    f.id,
    escapeCSV(f.make),
    escapeCSV(f.model),
    escapeCSV(f.serial_number),
    escapeCSV(f.caliber),
    escapeCSV(f.barrel_length),
    escapeCSV(f.action_type),
    escapeCSV(f.purchase_date),
    f.purchase_price || '',
    escapeCSV(f.condition),
    f.is_sold ? 'Sold' : 'Available',
    escapeCSV(f.sold_to_name),
    escapeCSV(f.sold_date),
    f.sold_price || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  return csvContent;
};
