import { describe, expect, it } from 'vitest';
import { formatCurrency, parseCurrency, parseCurrencyOrNull } from './currency';

describe('currency utils', () => {
  describe('parseCurrency', () => {
    it('handles clean numbers', () => {
      expect(parseCurrency(1200)).toBe(1200);
      expect(parseCurrency(375.52)).toBe(375.52);
      expect(parseCurrency(0)).toBe(0);
    });

    it('handles numeric strings and strips leading zeroes or symbols', () => {
      expect(parseCurrency('1200')).toBe(1200);
      expect(parseCurrency('02000')).toBe(2000);
      expect(parseCurrency('$1,250.75')).toBe(1250.75);
      expect(parseCurrency('  $500  ')).toBe(500);
      expect(parseCurrency('375.52')).toBe(375.52);
    });

    it('handles null, undefined, empty, and invalid values gracefully', () => {
      expect(parseCurrency(null)).toBe(0);
      expect(parseCurrency(undefined)).toBe(0);
      expect(parseCurrency('')).toBe(0);
      expect(parseCurrency('   ')).toBe(0);
      expect(parseCurrency('invalid')).toBe(0);
      expect(parseCurrency(NaN)).toBe(0);
    });

    it('prevents JavaScript string concatenation bug', () => {
      // Simulating the exact bug from user screenshot:
      // firearms: '375', accs: 225, ammo: 0, comps: 0
      const firearmsVal = '375';
      const accsVal = 225;
      const ammoVal = 0;
      const compsVal = 0;

      // Old buggy behavior: 0 + '375' + 225 + 0 + 0 = '037522500'
      const buggySum = 0 + (firearmsVal as any) + accsVal + ammoVal + compsVal;
      expect(buggySum).toBe('037522500');

      // Fixed safe behavior:
      const safeSum =
        parseCurrency(firearmsVal) +
        parseCurrency(accsVal) +
        parseCurrency(ammoVal) +
        parseCurrency(compsVal);
      expect(safeSum).toBe(600);
      expect(formatCurrency(safeSum)).toBe('$600.00');
    });
  });

  describe('parseCurrencyOrNull', () => {
    it('returns numbers when valid', () => {
      expect(parseCurrencyOrNull('1200')).toBe(1200);
      expect(parseCurrencyOrNull(500.25)).toBe(500.25);
    });

    it('returns null for empty / null / undefined', () => {
      expect(parseCurrencyOrNull(null)).toBeNull();
      expect(parseCurrencyOrNull(undefined)).toBeNull();
      expect(parseCurrencyOrNull('')).toBeNull();
      expect(parseCurrencyOrNull('   ')).toBeNull();
    });
  });

  describe('formatCurrency', () => {
    it('formats standard numbers with 2 decimal places and commas', () => {
      expect(formatCurrency(1200)).toBe('$1,200.00');
      expect(formatCurrency(375.52)).toBe('$375.52');
      expect(formatCurrency(2000000)).toBe('$2,000,000.00');
    });

    it('formats strings properly without concatenation artifacts', () => {
      expect(formatCurrency('1200')).toBe('$1,200.00');
      expect(formatCurrency('$1,200.50')).toBe('$1,200.50');
    });

    it('handles zero and nulls', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(null)).toBe('$0.00');
      expect(formatCurrency(null, { zeroLabel: '-' })).toBe('-');
      expect(formatCurrency(0, { hideZero: true })).toBe('-');
    });
  });
});
