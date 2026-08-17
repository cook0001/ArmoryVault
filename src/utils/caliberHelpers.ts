import { Ammo } from '../types';

/**
 * Escapes special regex characters in a string for safe use in RegExp constructors.
 */
export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Returns the standard pellet count for common buckshot loads based on gauge, shell length, and shot size.
 */
export const getStandardPelletCount = (caliber?: string, shell_length?: string, shot_size?: string): number | '' => {
  if (!caliber || !shell_length || !shot_size) return '';
  const cal = caliber.toLowerCase();
  const len = shell_length.trim().replace(/"/g, '');
  const shot = shot_size.trim().toLowerCase();

  if (cal.includes('10')) {
    if (len === '3 1/2' && shot === '00 buck') return 18;
    if (len === '3 1/2' && shot === '4 buck') return 54;
  }
  if (cal.includes('12')) {
    if (len === '2 3/4' && shot === '000 buck') return 8;
    if (len === '3' && shot === '000 buck') return 10;
    if (len === '2 3/4' && shot === '00 buck') return 9;
    if (len === '3' && shot === '00 buck') return 12;
    if (len === '3 1/2' && shot === '00 buck') return 15;
    if (len === '2 3/4' && shot === '0 buck') return 12;
    if (len === '2 3/4' && shot === '1 buck') return 16;
    if (len === '3' && shot === '1 buck') return 24;
    if (len === '2 3/4' && shot === '2 buck') return 15;
    if (len === '2 3/4' && shot === '3 buck') return 20;
    if (len === '2 3/4' && shot === '4 buck') return 27;
    if (len === '3' && shot === '4 buck') return 41;
  }
  if (cal.includes('16')) {
    if (len === '2 3/4' && shot === '1 buck') return 12;
    if (len === '2 3/4' && shot === '2 buck') return 14;
  }
  if (cal.includes('20')) {
    if (len === '2 3/4' && shot === '2 buck') return 12;
    if (len === '3' && shot === '2 buck') return 18;
    if (len === '2 3/4' && shot === '3 buck') return 20;
    if (len === '2 3/4' && shot === '4 buck') return 24;
  }
  if (cal.includes('28')) {
    if (len === '2 3/4' && shot === '4 buck') return 15;
  }
  if (cal.includes('.410') || cal.includes('410')) {
    if (len === '2 1/2' && shot === '000 buck') return 3;
    if (len === '3' && shot === '000 buck') return 5;
    if (len === '3' && shot === '4 buck') return 9;
  }
  return '';
};

/**
 * Generates a valid 12-digit UPC code for internal handload tracking.
 */
export const generateInternalUPC = (): string => {
  let upc = '4';
  for (let i = 0; i < 10; i++) {
    upc += Math.floor(Math.random() * 10).toString();
  }
  let oddSum = 0;
  let evenSum = 0;
  for (let i = 0; i < 11; i++) {
    if (i % 2 === 0) {
      oddSum += parseInt(upc[i]);
    } else {
      evenSum += parseInt(upc[i]);
    }
  }
  const total = (oddSum * 3) + evenSum;
  const checkDigit = (10 - (total % 10)) % 10;
  return upc + checkDigit.toString();
};

/**
 * Formats a caliber string, adding a leading period for imperial calibers that start with a digit.
 */
export const formatCaliber = (c: string): string => {
  if (!c) return c;
  let val = c.trim();
  if (/^\d/.test(val)) {
    const lower = val.toLowerCase();
    const isMetric = lower.includes('mm') || lower.includes('x') || 
                     ['5.56', '7.62', '6.5', '5.7', '5.45'].some(m => lower.startsWith(m));
    const isGauge = lower.includes('gauge') || lower.includes('ga') || lower.includes('bore');
    if (!isMetric && !isGauge) {
      val = '.' + val;
    }
  }
  return val;
};

/**
 * Builds a lookup map of caliber -> category from user's existing ammo inventory.
 */
export const buildCustomCategories = (ammoList: Ammo[]): Record<string, string> => {
  const map: Record<string, string> = {};
  ammoList.forEach(a => {
    if (a.category && a.category !== 'Other' && a.caliber) {
      map[a.caliber.toLowerCase().replace(/\s+/g, '')] = a.category;
    }
  });
  return map;
};

export const pistolCalibers = [
  '9mm', '45 ACP', '40 S&W', '380 ACP', '380 Auto', '38 Special', '357 Mag', '10mm', '44 Mag', '44 Special', '45 Colt', '25 ACP', '32 ACP', '5.7x28', '5.7', '9x19', '32 Auto', '25 Auto',
  '7.62x25', '7.62x38', '9x18', '7.63x25', '7.65x21', '455 Webley', '38 S&W', '38/200', '32 S&W', '38-40', '44-40', '9mm Makarov', '7.62 Tokarev', '7.62 Nagant', '30 Luger', '30 Mauser'
];
export const rifleCalibers = [
  '223 Rem', '223', '5.56 NATO', '5.56', '308 Win', '308', '7.62 NATO', '7.62x39', '7.62', '6.5 Creedmoor', '6.5', '30-06', '270 Win', '270', '300 Blackout', '300 Win Mag', '300', '22 LR', '22 Long', '22 WMR', '17 HMR', '7mm Rem Mag', '7mm', '30-30', '45-70', '5.45',
  '30-40 Krag', '30 Carbine', '303 British', '7.62x54', '7.62x54r', '7.92x57', '8mm Mauser', '8x57', '6.5x55', '6.5 Swede', '7.5x55', '7.5 Swiss', '7.65x53', '7x57', '7mm Mauser', '6.5x50', 'Arisaka', '7.7x58', '6.5x52', 'Carcano', '7.35x51', '8x56', '8x50', '7.5x54', 'French', '405 Win', '32 Win Special', '35 Rem', '300 Savage', '250-3000'
];

/**
 * Comprehensive master list of bullet and projectile types (standard, match, defensive, and proprietary).
 */
export const COMPREHENSIVE_BULLET_TYPES = [
  // Standard & Military Types
  'FMJ (Full Metal Jacket)',
  'FMJBT (Full Metal Jacket Boat Tail)',
  'JHP (Jacketed Hollow Point)',
  'HP (Hollow Point)',
  'BTHP (Boat Tail Hollow Point)',
  'HPBT (Hollow Point Boat Tail)',
  'TMJ (Total Metal Jacket)',
  'SP (Soft Point)',
  'JSP (Jacketed Soft Point)',
  'SJHP (Semi-Jacketed Hollow Point)',
  'SJSP (Semi-Jacketed Soft Point)',
  'LRN (Lead Round Nose)',
  'LSWC (Lead Semi-Wadcutter)',
  'WC (Wadcutter)',
  'SWC (Semi-Wadcutter)',
  'LFN (Lead Flat Nose)',
  'RNFP (Round Nose Flat Point)',
  'FP (Flat Point)',
  'FN (Flat Nose)',
  'PHP (Plated Hollow Point)',
  'CPHP (Copper Plated Hollow Point)',
  'CPRN (Copper Plated Round Nose)',
  'OTM (Open Tip Match)',
  'Frangible',
  'Subsonic',
  'Tracer',
  'Green Tip (M855 / SS109)',
  'Black Tip / AP (Armor Piercing)',
  'Buckshot',
  'Rifled Slug',
  'Sabot Slug',

  // Hornady Proprietary & Trademarked
  'ELD Match (Hornady)',
  'ELD-X (Hornady)',
  'V-Max (Hornady)',
  'A-Max (Hornady)',
  'XTP (Hornady)',
  'XTP Mag (Hornady)',
  'FTX / Flex Tip (Hornady)',
  'FlexLock / Critical Duty (Hornady)',
  'Critical Defense (Hornady)',
  'SST / Super Shock Tip (Hornady)',
  'CX Monolithic Copper (Hornady)',
  'GMX (Hornady)',
  'InterLock (Hornady)',
  'InterBond (Hornady)',
  'Sub-X Subsonic (Hornady)',
  'HAP Action Pistol (Hornady)',
  'MonoFlex (Hornady)',
  'NTX Lead-Free (Hornady)',
  'DGX / DGS Dangerous Game (Hornady)',

  // Federal Premium Proprietary
  'HST Tactical JHP (Federal)',
  'Hydra-Shok (Federal)',
  'Hydra-Shok Deep (Federal)',
  'Punch Defensive (Federal)',
  'Syntech Total Synthetic Jacket (Federal)',
  'Fusion Bonded Soft Point (Federal)',
  'Terminal Ascent (Federal)',
  'Trophy Bonded Tip / Bear Claw (Federal)',
  'Trophy Copper (Federal)',
  'Edge TLR (Federal)',
  'Guard Dog / EFMJ (Federal)',
  'Power-Shok (Federal)',
  'HammerDown (Federal)',

  // Sierra Proprietary
  'MatchKing / SMK (Sierra)',
  'Tipped MatchKing / TMK (Sierra)',
  'GameKing / SBT / HPBT (Sierra)',
  'GameChanger / TGK (Sierra)',
  'BlitzKing / SBK (Sierra)',
  'Pro-Hunter (Sierra)',
  'Prairie Enemy (Sierra)',
  'Sports Master (Sierra)',

  // Speer Proprietary
  'Gold Dot (Speer)',
  'Gold Dot G2 (Speer)',
  'Lawman TMJ (Speer)',
  'Grand Slam (Speer)',
  'DeepCurl (Speer)',
  'Hot-Cor (Speer)',
  'TNT / TNT Green (Speer)',

  // Barnes Proprietary (All-Copper / Lead-Free)
  'TSX Triple-Shock X (Barnes)',
  'TTSX Tipped Triple-Shock (Barnes)',
  'LRX Long Range X (Barnes)',
  'TAC-X / TAC-TX (Barnes)',
  'TAC-XP Handgun (Barnes)',
  'VOR-TX (Barnes)',
  'Banded Solid (Barnes)',
  'Varmint Grenade (Barnes)',

  // Nosler Proprietary
  'Partition (Nosler)',
  'AccuBond (Nosler)',
  'AccuBond Long Range / ABLR (Nosler)',
  'Ballistic Tip (Nosler)',
  'Custom Competition HPBT (Nosler)',
  'E-Tip Lead-Free (Nosler)',
  'Varmageddon (Nosler)',
  'RDF Reduced Drag Factor (Nosler)',
  'Ballistic Silvertip (Nosler/Winchester)',

  // Winchester Proprietary
  'Silvertip Defense (Winchester)',
  'Ranger T-Series / Talon (Winchester)',
  'Defender / Bonded PDX1 (Winchester)',
  'Power-Point / PP (Winchester)',
  'Deer Season XP / Extreme Point (Winchester)',
  'Copper Impact (Winchester)',
  'USA Ready Open Tip (Winchester)',

  // Remington Proprietary
  'Golden Bullet PHP (Remington)',
  'Core-Lokt / Core-Lokt Tipped (Remington)',
  'Core-Lokt Ultra Bonded (Remington)',
  'Golden Saber / Bonded (Remington)',
  'Premier Match (Remington)',
  'AccuTip / AccuTip-V (Remington)',
  'Thunderbolt (Remington)',

  // Berger Proprietary
  'VLD Very Low Drag (Berger)',
  'Hybrid Target / Hybrid OTM (Berger)',
  'Elite Hunter (Berger)',
  'Classic Hunter (Berger)',
  'Juggernaut Target (Berger)',

  // Lapua & Norma Proprietary
  'Scenar / Scenar-L OTM (Lapua)',
  'Naturalis Lead-Free (Lapua)',
  'Mega Soft Point (Lapua)',
  'Oryx Bonded (Norma)',
  'Tipstrike / Ecostrike / Bondstrike (Norma)',
  'Vulkan (Norma)',

  // Underwood / Lehigh Defense & Specialty
  'Xtreme Penetrator / XP (Lehigh/Underwood)',
  'Xtreme Defender / XD (Lehigh/Underwood)',
  'Controlled Chaos (Lehigh/Underwood)',
  'Maximum Expansion (Lehigh/Underwood)',
  'HoneyBadger (Black Hills)',
  'MK262 Mod 1 OTM (Black Hills)',
  'TUI Tumble Upon Impact (Fort Scott)',
  'V-Crown JHP (Sig Sauer)',
  'Elite Ball FMJ (Sig Sauer)',
  'First Defense SCHP (Magtech)',
  'Scirocco II Bonded (Swift)',
  'A-Frame (Swift)',
  'Solid Copper Hollow Point (SCHP)',
  'Monolithic Solid'
];

/**
 * Determines the ammo category (Pistol, Rifle, Shotgun, Other) based on caliber string.
 */
export const getAmmoCategory = (caliber: string, customMap?: Record<string, string>): 'Pistol' | 'Rifle' | 'Shotgun' | 'Other' => {
  if (!caliber) return 'Other';
  const c = caliber.toLowerCase().replace(/\s+/g, '');
  if (customMap && customMap[c]) return customMap[c] as any;
  if (c.includes('gauge') || c.includes('ga') || c.includes('.410') || c.includes('bore')) return 'Shotgun';
  if (pistolCalibers.some(p => c.includes(p.toLowerCase().replace(/\s+/g, '')))) return 'Pistol';
  if (rifleCalibers.some(r => c.includes(r.toLowerCase().replace(/\s+/g, '')))) return 'Rifle';
  return 'Other';
};
