import { Firearm } from '../types';

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
    `"${f.make || ''}"`,
    `"${f.model || ''}"`,
    `"${f.serial_number || ''}"`,
    `"${f.caliber || ''}"`,
    `"${f.barrel_length || ''}"`,
    `"${f.action_type || ''}"`,
    `"${f.purchase_date || ''}"`,
    f.purchase_price || '',
    `"${f.condition || ''}"`,
    f.is_sold ? 'Sold' : 'Available',
    `"${f.sold_to_name || ''}"`,
    `"${f.sold_date || ''}"`,
    f.sold_price || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  return csvContent;
};
