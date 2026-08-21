import { describe, expect, it } from 'vitest';
import {
  calcCostPerGrain,
  calcTheoreticalYield,
  formatPowderMultiUnit,
  GRAINS_PER_OUNCE,
  GRAINS_PER_POUND,
  toGrains,
  toOunces,
  toPounds,
} from './powderUnits';

describe('Powder Units Helper & Conversions', () => {
  it('converts 1 pound correctly to 7000 grains and 16 ounces', () => {
    expect(toGrains(1, 'lbs')).toBe(7000);
    expect(toOunces(1, 'lbs')).toBe(16);
    expect(toPounds(1, 'lbs')).toBe(1);
  });

  it('converts 8 ounces correctly to 0.5 pounds and 3500 grains', () => {
    expect(toGrains(8, 'oz')).toBe(3500);
    expect(toPounds(8, 'oz')).toBe(0.5);
    expect(toOunces(8, 'oz')).toBe(8);
  });

  it('converts 3500 grains correctly to 0.5 pounds and 8 ounces', () => {
    expect(toGrains(3500, 'grains')).toBe(3500);
    expect(toPounds(3500, 'grains')).toBe(0.5);
    expect(toOunces(3500, 'grains')).toBe(8);
  });

  it('formats multi-unit compound strings accurately', () => {
    const res = formatPowderMultiUnit(1.5, 'lbs');
    expect(res.grains).toBe(10500);
    expect(res.oz).toBe(24);
    expect(res.compound).toContain('1 lb 8 oz');
    expect(res.compound).toContain('10,500 gr');
  });

  it('calculates cost per grain correctly', () => {
    // 1 lb ($42.00) => $42.00 / 7000 grains = $0.006 per grain
    const costPerGr = calcCostPerGrain(42.0, 1, 'lbs');
    expect(costPerGr).toBeCloseTo(0.006, 4);
  });

  it('calculates theoretical yield for common handloading calibers', () => {
    // 1 lb (7000 grains) with 41.5 gr (.308 Win charge) = ~168 rounds
    const yield308 = calcTheoreticalYield(1, 'lbs', 41.5);
    expect(yield308).toBe(168);

    // 1 lb (7000 grains) with 4.5 gr (9mm Luger charge) = ~1555 rounds
    const yield9mm = calcTheoreticalYield(1, 'lbs', 4.5);
    expect(yield9mm).toBe(1555);
  });
});
