/**
 * Powder Unit Conversions & Telemetry Utility
 *
 * Standard ballistic reloading constants:
 * - 1 pound (lb) = 16 ounces (oz) = 7,000 grains (gr)
 * - 1 ounce (oz) = 437.5 grains (gr) = 0.0625 pounds (lb)
 * - 1 grain (gr) = 1/7000 lb = 1/437.5 oz
 */

export const GRAINS_PER_POUND = 7000;
export const GRAINS_PER_OUNCE = 437.5;
export const OUNCES_PER_POUND = 16;

export type PowderWeightUnit = 'lbs' | 'oz' | 'grains';

/**
 * Normalizes any unit string to a standardized PowderWeightUnit
 */
export const normalizePowderUnit = (unit?: string): PowderWeightUnit => {
  if (!unit) return 'lbs';
  const clean = unit.toLowerCase().trim();
  if (clean === 'oz' || clean === 'ounce' || clean === 'ounces') return 'oz';
  if (clean === 'grains' || clean === 'grain' || clean === 'gr') return 'grains';
  return 'lbs';
};

/**
 * Converts a powder amount from any unit into grains
 */
export const toGrains = (amount: number, unit?: string): number => {
  if (!amount || isNaN(amount)) return 0;
  const normalized = normalizePowderUnit(unit);
  switch (normalized) {
    case 'lbs':
      return amount * GRAINS_PER_POUND;
    case 'oz':
      return amount * GRAINS_PER_OUNCE;
    case 'grains':
      return amount;
  }
};

/**
 * Converts a powder amount from any unit into decimal pounds (lbs)
 */
export const toPounds = (amount: number, unit?: string): number => {
  if (!amount || isNaN(amount)) return 0;
  const grains = toGrains(amount, unit);
  return Number((grains / GRAINS_PER_POUND).toFixed(4));
};

/**
 * Converts a powder amount from any unit into decimal ounces (oz)
 */
export const toOunces = (amount: number, unit?: string): number => {
  if (!amount || isNaN(amount)) return 0;
  const grains = toGrains(amount, unit);
  return Number((grains / GRAINS_PER_OUNCE).toFixed(3));
};

export interface PowderMultiUnitBreakdown {
  lbs: number;
  oz: number;
  grains: number;
  formattedLbs: string;
  formattedOz: string;
  formattedGrains: string;
  summary: string;
  compound: string;
}

/**
 * Calculates a complete multi-unit breakdown of a given powder weight
 */
export const formatPowderMultiUnit = (amount: number, unit?: string): PowderMultiUnitBreakdown => {
  const grains = toGrains(amount, unit);
  const lbs = Number((grains / GRAINS_PER_POUND).toFixed(3));
  const oz = Number((grains / GRAINS_PER_OUNCE).toFixed(2));

  // Compound format: e.g. "1 lb 8 oz (10,500 gr)" or "8.5 oz (3,718 gr)"
  const wholeLbs = Math.floor(grains / GRAINS_PER_POUND);
  const remGrains = grains - wholeLbs * GRAINS_PER_POUND;
  const remOz = Number((remGrains / GRAINS_PER_OUNCE).toFixed(1));

  let compound = '';
  if (wholeLbs > 0) {
    compound =
      remOz > 0 ? `${wholeLbs} lb ${remOz} oz` : `${wholeLbs} lb${wholeLbs > 1 ? 's' : ''}`;
  } else {
    compound = `${oz} oz`;
  }
  compound += ` (${Math.round(grains).toLocaleString()} gr)`;

  return {
    lbs,
    oz,
    grains: Math.round(grains),
    formattedLbs: `${lbs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })} lbs`,
    formattedOz: `${oz.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} oz`,
    formattedGrains: `${Math.round(grains).toLocaleString()} grains`,
    summary: `${lbs} lbs • ${oz} oz • ${Math.round(grains).toLocaleString()} gr`,
    compound,
  };
};

/**
 * Calculates cost per grain given total cost and total quantity
 */
export const calcCostPerGrain = (totalCost: number, amount: number, unit?: string): number => {
  if (!totalCost || totalCost <= 0 || !amount || amount <= 0) return 0;
  const totalGrains = toGrains(amount, unit);
  if (totalGrains <= 0) return 0;
  return totalCost / totalGrains;
};

/**
 * Calculates theoretical rounds that can be manufactured with the available powder
 */
export const calcTheoreticalYield = (
  amount: number,
  unit: string | undefined,
  chargeGrains: number
): number => {
  if (!amount || amount <= 0 || !chargeGrains || chargeGrains <= 0) return 0;
  const totalGrains = toGrains(amount, unit);
  return Math.floor(totalGrains / chargeGrains);
};
