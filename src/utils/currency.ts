/**
 * Unified currency formatting & numeric parsing helpers.
 * Prevents string concatenation bugs when adding or displaying valuations across the application.
 */

/**
 * Safely parses any value (string with symbols, raw number, null, undefined)
 * into a valid finite number.
 */
export function parseCurrency(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : 0;
  }
  if (typeof val === 'string') {
    if (!val.trim()) return 0;
    // Strip leading '$', commas, whitespace
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

/**
 * Safely parses any value into a finite number or null if empty/invalid.
 */
export function parseCurrencyOrNull(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'string' && !val.trim()) return null;
  const num = parseCurrency(val);
  return Number.isFinite(num) ? num : null;
}

export interface FormatCurrencyOptions {
  hideZero?: boolean;
  zeroLabel?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Formats any value as a standard US dollar currency string (e.g. "$1,200.00").
 * Guarantees no raw string concatenation (e.g. "$037522500") can ever leak into the UI.
 */
export function formatCurrency(val: any, options?: FormatCurrencyOptions): string {
  if (val === null || val === undefined || val === '') {
    if (options?.zeroLabel) return options.zeroLabel;
    if (options?.hideZero) return '-';
    return '$0.00';
  }

  const num = parseCurrency(val);
  if (num === 0 && options?.hideZero) {
    return options?.zeroLabel || '-';
  }

  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  });
}
