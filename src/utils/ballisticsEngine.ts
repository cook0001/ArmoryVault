/**
 * Ballistic Trajectory Solver
 *
 * Implements a simplified point-mass G1/G7 drag model for calculating bullet
 * drop, wind drift, time of flight, velocity, and energy at discrete range
 * intervals. Uses standard atmosphere (59°F / 15°C, 29.92 inHg, sea level)
 * with optional temperature & altitude corrections.
 *
 * References:
 *  - JBM Ballistics trajectory solver (for verification)
 *  - Pejsa ballistic model (simplified analytical approach)
 *  - Bryan Litz, Applied Ballistics for Long Range Shooting
 */

import type { BallisticProfile, BallisticSolution } from '../types';

// Standard atmospheric constants
const STANDARD_TEMP_F = 59;
const STANDARD_PRESSURE_INHG = 29.92;
const SPEED_OF_SOUND_FPS = 1116.45; // ft/s at standard temp

/**
 * Atmospheric density ratio — corrects drag for non-standard conditions.
 * Uses a simplified ideal-gas approximation.
 */
function atmosphericDensityRatio(
  temperatureF: number = STANDARD_TEMP_F,
  altitudeFt: number = 0
): number {
  const tempR = temperatureF + 459.67; // Rankine
  const stdTempR = STANDARD_TEMP_F + 459.67;

  // Pressure lapse with altitude (barometric formula simplified)
  const pressureRatio = (1 - 6.8756e-6 * altitudeFt) ** 5.2559;

  // Density ratio = (P/P0) * (T0/T)
  return pressureRatio * (stdTempR / tempR);
}

/**
 * Standard drag function — G1 reference projectile drag coefficient table.
 * Uses a simplified piecewise polynomial fit to the Ingalls G1 drag table.
 * Mach number is the primary argument.
 */
function dragCoefficientG1(mach: number): number {
  if (mach <= 0) return 0;
  if (mach < 0.5) return 0.1198 + 0.0076 * mach;
  if (mach < 0.7) return 0.1198 + 0.019 * (mach - 0.5);
  if (mach < 0.875) return 0.1236 + 0.13 * (mach - 0.7);
  if (mach < 1.0) return 0.1461 + 0.61 * (mach - 0.875);
  if (mach < 1.065) return 0.2224 + 2.42 * (mach - 1.0);
  if (mach < 1.25) return 0.3797 + 0.21 * (mach - 1.065);
  if (mach < 1.5) return 0.4186 - 0.2 * (mach - 1.25);
  if (mach < 2.0) return 0.3686 - 0.13 * (mach - 1.5);
  if (mach < 3.0) return 0.3036 - 0.057 * (mach - 2.0);
  return 0.2466 - 0.018 * (mach - 3.0);
}

/**
 * G7 drag coefficient table (boat-tail match bullets, long range projectiles).
 */
function dragCoefficientG7(mach: number): number {
  if (mach <= 0) return 0;
  if (mach < 0.5) return 0.12 + 0.005 * mach;
  if (mach < 0.7) return 0.1225 + 0.012 * (mach - 0.5);
  if (mach < 0.875) return 0.1249 + 0.08 * (mach - 0.7);
  if (mach < 1.0) return 0.1389 + 0.55 * (mach - 0.875);
  if (mach < 1.065) return 0.2076 + 2.0 * (mach - 1.0);
  if (mach < 1.25) return 0.3376 + 0.15 * (mach - 1.065);
  if (mach < 1.5) return 0.3654 - 0.18 * (mach - 1.25);
  if (mach < 2.0) return 0.3204 - 0.12 * (mach - 1.5);
  if (mach < 3.0) return 0.2604 - 0.05 * (mach - 2.0);
  return 0.2104 - 0.015 * (mach - 3.0);
}

/**
 * Solve the ballistic trajectory for a given profile.
 * Returns solution data at every `stepYards` interval from 0 to `maxRange`.
 */
export function solveTrajectory(
  profile: BallisticProfile,
  maxRange: number = 1000,
  stepYards: number = 25
): BallisticSolution[] {
  const {
    bulletWeight,
    ballisticCoefficient: bc,
    dragModel,
    muzzleVelocity,
    zeroRange,
    sightHeight,
    windSpeed = 0,
    windAngle = 90, // Degrees, 90 = full crosswind
    temperature = STANDARD_TEMP_F,
    altitude = 0,
  } = profile;

  const dragFn = dragModel === 'G7' ? dragCoefficientG7 : dragCoefficientG1;
  const densityRatio = atmosphericDensityRatio(temperature, altitude);

  // Wind decomposition (crosswind component)
  const windAngleRad = (windAngle * Math.PI) / 180;
  const crosswind = windSpeed * Math.sin(windAngleRad) * 1.46667; // mph to ft/s
  const headwind = windSpeed * Math.cos(windAngleRad) * 1.46667;

  // Simulation step (time-step integration)
  const dt = 0.0005; // seconds per step (0.5ms — fine granularity)
  const GRAVITY = 32.174; // ft/s²

  // State variables
  let x = 0; // horizontal distance (ft)
  let y = -sightHeight / 12; // vertical position (ft), sight is above bore
  let vx = muzzleVelocity; // horizontal velocity (ft/s)
  let vy = 0; // vertical velocity (ft/s)
  let windDriftFt = 0;
  let t = 0; // time of flight (s)

  // First, determine the launch angle needed to zero at zeroRange
  // We'll iterate to find the right angle
  let launchAngle = 0;
  const zeroRangeFt = zeroRange * 3;

  // Binary search for zero angle
  let lowAngle = 0;
  let highAngle = 0.05; // radians (~2.86 degrees, more than enough)

  for (let iteration = 0; iteration < 50; iteration++) {
    const midAngle = (lowAngle + highAngle) / 2;

    // Simulate to zero range with this angle
    let sx = 0;
    let sy = -sightHeight / 12;
    let svx = muzzleVelocity * Math.cos(midAngle);
    let svy = muzzleVelocity * Math.sin(midAngle);

    while (sx < zeroRangeFt) {
      const v = Math.sqrt(svx * svx + svy * svy);
      const mach = v / SPEED_OF_SOUND_FPS;
      const cd = dragFn(mach);
      const decel = (cd / bc) * densityRatio * v * v * 0.000005349;

      const ax = -decel * (svx / v);
      const ay = -GRAVITY - decel * (svy / v);

      svx += ax * dt;
      svy += ay * dt;
      sx += svx * dt;
      sy += svy * dt;
    }

    if (sy > 0) {
      highAngle = midAngle;
    } else {
      lowAngle = midAngle;
    }
    launchAngle = midAngle;
  }

  // Now simulate with the correct launch angle
  vx = muzzleVelocity * Math.cos(launchAngle);
  vy = muzzleVelocity * Math.sin(launchAngle);
  x = 0;
  y = -sightHeight / 12;
  windDriftFt = 0;
  t = 0;

  const solutions: BallisticSolution[] = [];
  let nextRangeYards = 0;
  const maxRangeFt = maxRange * 3;

  // Record solution at range = 0
  solutions.push({
    range: 0,
    drop: 0,
    dropMOA: 0,
    dropMIL: 0,
    windDrift: 0,
    windDriftMOA: 0,
    windDriftMIL: 0,
    velocity: muzzleVelocity,
    energy: (bulletWeight * muzzleVelocity * muzzleVelocity) / 450240,
    timeOfFlight: 0,
  });
  nextRangeYards = stepYards;

  while (x < maxRangeFt && vx > 50) {
    const v = Math.sqrt(vx * vx + vy * vy);
    const mach = v / SPEED_OF_SOUND_FPS;
    const cd = dragFn(mach);
    const decel = (cd / bc) * densityRatio * v * v * 0.000005349;

    const ax = -decel * (vx / v);
    const ay = -GRAVITY - decel * (vy / v);

    vx += ax * dt;
    vy += ay * dt;
    x += vx * dt;
    y += vy * dt;

    // Wind drift — the projectile's horizontal lag applied as drift
    const windLag = crosswind - (crosswind * vx) / muzzleVelocity;
    windDriftFt += windLag * dt;

    t += dt;

    const rangeYards = x / 3;

    if (rangeYards >= nextRangeYards) {
      const dropInches = y * 12; // ft to in
      const driftInches = windDriftFt * 12;
      const velocity = Math.sqrt(vx * vx + vy * vy);
      const rangeForMOA = nextRangeYards || 1;

      solutions.push({
        range: nextRangeYards,
        drop: Math.round(dropInches * 100) / 100,
        dropMOA: Math.round((dropInches / (rangeForMOA * 1.047)) * 100) / 100,
        dropMIL: Math.round((dropInches / (rangeForMOA * 3.6)) * 100) / 100,
        windDrift: Math.round(driftInches * 100) / 100,
        windDriftMOA: Math.round((driftInches / (rangeForMOA * 1.047)) * 100) / 100,
        windDriftMIL: Math.round((driftInches / (rangeForMOA * 3.6)) * 100) / 100,
        velocity: Math.round(velocity),
        energy: Math.round((bulletWeight * velocity * velocity) / 450240),
        timeOfFlight: Math.round(t * 1000) / 1000,
      });

      nextRangeYards += stepYards;
    }
  }

  return solutions;
}

export interface BallisticPreset {
  name: string;
  category: 'Handgun' | 'Rifle' | 'Rimfire' | 'Shotgun';
  caliber: string;
  bulletWeight: number;
  ballisticCoefficient: number;
  dragModel: 'G1' | 'G7';
  muzzleVelocity: number;
  zeroRange: number;
  sightHeight: number;
  description: string;
}

export const COMMON_CALIBER_PRESETS: BallisticPreset[] = [
  // --- Handgun ---
  {
    name: '9mm Luger 115gr FMJ Standard',
    category: 'Handgun',
    caliber: '9mm Luger',
    bulletWeight: 115,
    ballisticCoefficient: 0.135,
    dragModel: 'G1',
    muzzleVelocity: 1180,
    zeroRange: 25,
    sightHeight: 0.8,
    description: 'Standard 115gr range / target factory load (Winchester / Federal / Magtech)',
  },
  {
    name: '9mm Luger 124gr NATO / +P',
    category: 'Handgun',
    caliber: '9mm Luger',
    bulletWeight: 124,
    ballisticCoefficient: 0.15,
    dragModel: 'G1',
    muzzleVelocity: 1150,
    zeroRange: 25,
    sightHeight: 0.8,
    description: '124gr FMJ NATO standard / Speer Gold Dot duty load',
  },
  {
    name: '9mm Luger 147gr Subsonic',
    category: 'Handgun',
    caliber: '9mm Luger',
    bulletWeight: 147,
    ballisticCoefficient: 0.18,
    dragModel: 'G1',
    muzzleVelocity: 990,
    zeroRange: 25,
    sightHeight: 0.8,
    description: 'Heavy subsonic 147gr suppressed / competition load (Federal Syntech / HST)',
  },
  {
    name: '.45 ACP 230gr FMJ Ball',
    category: 'Handgun',
    caliber: '.45 ACP',
    bulletWeight: 230,
    ballisticCoefficient: 0.19,
    dragModel: 'G1',
    muzzleVelocity: 850,
    zeroRange: 25,
    sightHeight: 0.8,
    description: 'Classic 230gr military ball standard load',
  },
  {
    name: '.40 S&W 180gr FMJ',
    category: 'Handgun',
    caliber: '.40 S&W',
    bulletWeight: 180,
    ballisticCoefficient: 0.16,
    dragModel: 'G1',
    muzzleVelocity: 990,
    zeroRange: 25,
    sightHeight: 0.8,
    description: 'Standard law enforcement / target 180gr load',
  },
  {
    name: '10mm Auto 180gr Full Power',
    category: 'Handgun',
    caliber: '10mm Auto',
    bulletWeight: 180,
    ballisticCoefficient: 0.175,
    dragModel: 'G1',
    muzzleVelocity: 1250,
    zeroRange: 25,
    sightHeight: 0.8,
    description: 'Full-power 180gr defense / woods load (Underwood / Sig Sauer)',
  },
  {
    name: '.380 ACP 95gr FMJ',
    category: 'Handgun',
    caliber: '.380 ACP',
    bulletWeight: 95,
    ballisticCoefficient: 0.1,
    dragModel: 'G1',
    muzzleVelocity: 950,
    zeroRange: 15,
    sightHeight: 0.7,
    description: 'Pocket pistol / concealed carry standard load',
  },
  {
    name: '.357 Magnum 158gr JSP',
    category: 'Handgun',
    caliber: '.357 Magnum',
    bulletWeight: 158,
    ballisticCoefficient: 0.17,
    dragModel: 'G1',
    muzzleVelocity: 1250,
    zeroRange: 50,
    sightHeight: 0.9,
    description: 'High-energy revolver hunting and defense standard',
  },
  {
    name: '.44 Magnum 240gr JSP',
    category: 'Handgun',
    caliber: '.44 Magnum',
    bulletWeight: 240,
    ballisticCoefficient: 0.205,
    dragModel: 'G1',
    muzzleVelocity: 1350,
    zeroRange: 50,
    sightHeight: 0.9,
    description: 'Heavy magnum handgun / lever action carbine load',
  },

  // --- Rimfire ---
  {
    name: '.22 LR 40gr Standard Velocity',
    category: 'Rimfire',
    caliber: '.22 LR',
    bulletWeight: 40,
    ballisticCoefficient: 0.125,
    dragModel: 'G1',
    muzzleVelocity: 1070,
    zeroRange: 50,
    sightHeight: 1.5,
    description: 'Subsonic match & target ammunition (CCI Standard Velocity / ELEY)',
  },
  {
    name: '.22 LR 36gr High Velocity CPHP',
    category: 'Rimfire',
    caliber: '.22 LR',
    bulletWeight: 36,
    ballisticCoefficient: 0.115,
    dragModel: 'G1',
    muzzleVelocity: 1260,
    zeroRange: 50,
    sightHeight: 1.5,
    description: 'Plinking & small game high velocity (CCI Mini-Mag / Federal Bulk)',
  },

  // --- Rifle ---
  {
    name: '5.56x45mm NATO 55gr M193',
    category: 'Rifle',
    caliber: '5.56x45mm NATO',
    bulletWeight: 55,
    ballisticCoefficient: 0.243,
    dragModel: 'G1',
    muzzleVelocity: 3240,
    zeroRange: 100,
    sightHeight: 2.6,
    description: 'Standard AR-15 mil-spec 55gr FMJ (16-20" barrel, 2.6" optic height)',
  },
  {
    name: '5.56x45mm NATO 62gr M855 Green Tip',
    category: 'Rifle',
    caliber: '5.56x45mm NATO',
    bulletWeight: 62,
    ballisticCoefficient: 0.304,
    dragModel: 'G1',
    muzzleVelocity: 3020,
    zeroRange: 100,
    sightHeight: 2.6,
    description: 'Military 62gr steel-core penetrator ballistics',
  },
  {
    name: '5.56x45mm / .223 Rem 77gr Mk262 Mod 1 OTM',
    category: 'Rifle',
    caliber: '5.56x45mm NATO',
    bulletWeight: 77,
    ballisticCoefficient: 0.372,
    dragModel: 'G1',
    muzzleVelocity: 2750,
    zeroRange: 100,
    sightHeight: 2.6,
    description: 'Special forces match grade long-range precision load (Black Hills)',
  },
  {
    name: '.300 AAC Blackout 125gr Supersonic',
    category: 'Rifle',
    caliber: '.300 AAC Blackout',
    bulletWeight: 125,
    ballisticCoefficient: 0.32,
    dragModel: 'G1',
    muzzleVelocity: 2215,
    zeroRange: 100,
    sightHeight: 2.6,
    description: 'Standard supersonic hunting and defense load',
  },
  {
    name: '.300 AAC Blackout 220gr Subsonic',
    category: 'Rifle',
    caliber: '.300 AAC Blackout',
    bulletWeight: 220,
    ballisticCoefficient: 0.605,
    dragModel: 'G1',
    muzzleVelocity: 1020,
    zeroRange: 50,
    sightHeight: 2.6,
    description: 'Heavy high-BC suppressed subsonic round (Hornady / Sig Sauer)',
  },
  {
    name: '7.62x39mm 123gr FMJ Ball',
    category: 'Rifle',
    caliber: '7.62x39mm',
    bulletWeight: 123,
    ballisticCoefficient: 0.265,
    dragModel: 'G1',
    muzzleVelocity: 2350,
    zeroRange: 100,
    sightHeight: 2.0,
    description: 'Standard AK-47 / SKS surplus and factory load (Wolf / Barnaul)',
  },
  {
    name: '.308 Winchester 168gr Sierra MatchKing BTHP',
    category: 'Rifle',
    caliber: '.308 Winchester',
    bulletWeight: 168,
    ballisticCoefficient: 0.462,
    dragModel: 'G1',
    muzzleVelocity: 2650,
    zeroRange: 100,
    sightHeight: 1.5,
    description: 'The precision benchmark match load (Federal Gold Medal Match)',
  },
  {
    name: '.308 Win / 7.62 NATO 175gr M118LR BTHP',
    category: 'Rifle',
    caliber: '.308 Winchester',
    bulletWeight: 175,
    ballisticCoefficient: 0.505,
    dragModel: 'G1',
    muzzleVelocity: 2580,
    zeroRange: 100,
    sightHeight: 1.5,
    description: 'Extended long-range military sniper & precision load (M118LR)',
  },
  {
    name: '6.5mm Creedmoor 140gr Hornady ELD-Match',
    category: 'Rifle',
    caliber: '6.5 Creedmoor',
    bulletWeight: 140,
    ballisticCoefficient: 0.646,
    dragModel: 'G1',
    muzzleVelocity: 2710,
    zeroRange: 100,
    sightHeight: 1.5,
    description: 'High-BC extreme long-range match ammunition (Hornady Match)',
  },
  {
    name: '6.5mm Creedmoor 147gr ELD-Match',
    category: 'Rifle',
    caliber: '6.5 Creedmoor',
    bulletWeight: 147,
    ballisticCoefficient: 0.697,
    dragModel: 'G1',
    muzzleVelocity: 2695,
    zeroRange: 100,
    sightHeight: 1.5,
    description: 'Ultra-high BC heavy 6.5mm long range competition load',
  },
  {
    name: '.30-06 Springfield 150gr Core-Lokt SP',
    category: 'Rifle',
    caliber: '.30-06 Springfield',
    bulletWeight: 150,
    ballisticCoefficient: 0.314,
    dragModel: 'G1',
    muzzleVelocity: 2910,
    zeroRange: 100,
    sightHeight: 1.5,
    description: 'Classic American big game hunting standard',
  },
  {
    name: '.300 Winchester Magnum 190gr MatchKing',
    category: 'Rifle',
    caliber: '.300 Win Mag',
    bulletWeight: 190,
    ballisticCoefficient: 0.533,
    dragModel: 'G1',
    muzzleVelocity: 2900,
    zeroRange: 100,
    sightHeight: 1.5,
    description: 'High-power long range sniper and magnum big game load',
  },
  {
    name: '.338 Lapua Magnum 250gr Scenar',
    category: 'Rifle',
    caliber: '.338 Lapua Mag',
    bulletWeight: 250,
    ballisticCoefficient: 0.675,
    dragModel: 'G1',
    muzzleVelocity: 2950,
    zeroRange: 100,
    sightHeight: 1.8,
    description: 'Military anti-personnel / extreme long range benchmark (Lapua)',
  },
  {
    name: '.50 BMG 660gr M33 Ball',
    category: 'Rifle',
    caliber: '.50 BMG',
    bulletWeight: 660,
    ballisticCoefficient: 0.67,
    dragModel: 'G1',
    muzzleVelocity: 2750,
    zeroRange: 100,
    sightHeight: 2.0,
    description: 'Heavy anti-materiel standard round (Barrett M82 / M107)',
  },

  // --- Shotgun ---
  {
    name: '12 Gauge 1 oz Rifled Slug',
    category: 'Shotgun',
    caliber: '12 Gauge',
    bulletWeight: 437,
    ballisticCoefficient: 0.109,
    dragModel: 'G1',
    muzzleVelocity: 1600,
    zeroRange: 50,
    sightHeight: 1.2,
    description: '1 oz (437gr) standard Foster rifled slug for smoothbore shotguns',
  },
];
