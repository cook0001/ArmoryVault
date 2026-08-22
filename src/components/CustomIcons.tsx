import React from 'react';

export interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 3 Cartridges standing side-by-side (Left, Center taller, Right)
 * Featuring bullet tips, bottleneck casings, extractor grooves, and primer rims.
 */
export const CartridgesIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Left Cartridge */}
    <path d="M4 11 L4 21 M8 11 L8 21" />
    <path d="M4 21 L8 21" />
    <path d="M4 11 C4 9.5, 6 6.5, 6 6.5 C6 6.5, 8 9.5, 8 11 Z" />
    <line x1="4" y1="19" x2="8" y2="19" />

    {/* Center Cartridge (Taller Rifle Round) */}
    <path d="M10 9 L10 21 M14 9 L14 21" />
    <path d="M10 21 L14 21" />
    <path d="M10 9 C10 7, 12 3, 12 3 C12 3, 14 7, 14 9 Z" />
    <line x1="10" y1="19" x2="14" y2="19" />

    {/* Right Cartridge */}
    <path d="M16 11 L16 21 M20 11 L20 21" />
    <path d="M16 21 L20 21" />
    <path d="M16 11 C16 9.5, 18 6.5, 18 6.5 C18 6.5, 20 9.5, 20 11 Z" />
    <line x1="16" y1="19" x2="20" y2="19" />
  </svg>
);

/**
 * .50 Cal Military Surplus Steel Ammo Can
 * With top carrying handle, hinged latch, and stamped structural body lines.
 */
export const AmmoCanIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#f59e0b',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Main can body */}
    <rect x="3" y="8" width="18" height="13" rx="1.5" />
    {/* Overhanging weather lid */}
    <path d="M2 8h20v2.5H2z" />
    {/* Top folding handle */}
    <path d="M8.5 8V4.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1V8" />
    {/* Front toggle clasp */}
    <rect x="10.5" y="10.5" width="3" height="4.5" rx="0.5" />
    {/* Embossed stiffening rib */}
    <line x1="6" y1="17.5" x2="18" y2="17.5" />
  </svg>
);

/**
 * Armory Gun Safe
 * Heavy vault safe with inset door, combination lock dial, and 3-spoke wheel handle.
 */
export const SafeIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Safe body */}
    <rect x="3" y="3" width="18" height="18" rx="2" />
    {/* Safe door bevel */}
    <rect x="6" y="6" width="12" height="12" rx="1" />
    {/* Combination dial */}
    <circle cx="10" cy="12" r="2" />
    <line x1="10" y1="10.5" x2="10" y2="12" />
    {/* Wheel handle spokes */}
    <path d="M14.5 10.5 L14.5 13.5" />
    <path d="M13 12 L16 12" />
  </svg>
);

/**
 * Storage Cabinet / Armory Locker
 * Double door lockable steel security cabinet with vertical divider and handles.
 */
export const CabinetIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#60a5fa',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <line x1="12" y1="3" x2="12" y2="21" />
    {/* Door handles */}
    <line x1="10" y1="11" x2="10" y2="13" />
    <line x1="14" y1="11" x2="14" y2="13" />
    {/* Bottom stand feet */}
    <line x1="6" y1="21" x2="6" y2="23" />
    <line x1="18" y1="21" x2="18" y2="23" />
  </svg>
);

/**
 * Hard Tactical Gun Case / Pelican Case
 * Reinforced protective travel case with dual security latches and textured ribs.
 */
export const GunCaseIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#a78bfa',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <rect x="2" y="6" width="20" height="13" rx="2" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    {/* Latches */}
    <rect x="5.5" y="10" width="2" height="4" rx="0.5" />
    <rect x="16.5" y="10" width="2" height="4" rx="0.5" />
    {/* Mid case split line */}
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

/**
 * Vehicle Armored Vault / Lockbox
 */
export const VehicleVaultIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#f87171',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Vehicle outline */}
    <path d="M3 13 L5 7 L19 7 L21 13 L21 17 L3 17 Z" />
    {/* Wheels */}
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    {/* Keypad lock */}
    <rect x="10" y="10" width="4" height="4" rx="0.5" />
  </svg>
);

/**
 * Bound Book / ATF Compliance Registry Ledger
 * Hardbound official ledger with recording column rules and ribbon marker.
 */
export const BoundBookNavIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Book covers and spine */}
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    {/* Official ledger entry lines */}
    <line x1="9" y1="7" x2="16" y2="7" />
    <line x1="9" y1="11" x2="16" y2="11" />
    <line x1="9" y1="15" x2="13" y2="15" />
  </svg>
);

/**
 * Tactical Accessories Composite (Optic + Weaponlight)
 */
export const AccessoriesNavIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Red dot optic */}
    <rect x="4" y="4" width="10" height="7" rx="1.5" />
    <circle cx="9" cy="7.5" r="1.5" />
    {/* Mounting rail base */}
    <path d="M2 14h20v2H2z" />
    <line x1="6" y1="11" x2="6" y2="14" />
    <line x1="12" y1="11" x2="12" y2="14" />
    {/* Weaponlight underbarrel */}
    <rect x="14" y="16" width="7" height="4" rx="1" />
    <path d="M14 18h-2" />
  </svg>
);

/**
 * Armorer's Bench & Maintenance Kit
 * Armorer's combination barrel/castle-nut wrench and oil bottle.
 */
export const MaintenanceNavIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Armorer's multi-tool wrench */}
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    {/* Castlenut wrench prongs */}
    <path d="M18 2v3M22 6h-3" />
  </svg>
);

/**
 * Ballistics Calculator / Trajectory Reticle
 * Crosshair reticle overlaid with parabolic bullet drop flight curve.
 */
export const BallisticsNavIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Scope crosshair reticle */}
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="12" x2="21" y2="12" />
    {/* Elevation & windage hashmarks */}
    <line x1="11" y1="15" x2="13" y2="15" />
    <line x1="10" y1="18" x2="14" y2="18" />
    <line x1="15" y1="11" x2="15" y2="13" />
  </svg>
);

/**
 * Load Development & Ladder Test
 * Incremental powder charge progression steps across cartridge loads.
 */
export const LoadDevNavIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Cartridge ladder stages (stepped charge levels) */}
    <rect x="3" y="14" width="4" height="7" rx="0.5" />
    <path d="M3 14 L5 11 L7 14 Z" />

    <rect x="10" y="10" width="4" height="11" rx="0.5" />
    <path d="M10 10 L12 6 L14 10 Z" />

    <rect x="17" y="6" width="4" height="15" rx="0.5" />
    <path d="M17 6 L19 2 L21 6 Z" />
  </svg>
);

/**
 * NFA Tracker / ATF Form 4 Tax Stamp Badge
 * Official tax stamp document silhouette with federal eagle star emblem.
 */
export const NfaTrackerNavIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Form shield / stamp frame */}
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    {/* Internal Tax Stamp Star Seal */}
    <polygon points="12 7 13.5 10 17 10.5 14.5 13 15 16.5 12 14.5 9 16.5 9.5 13 7 10.5 10.5 10 12 7" />
  </svg>
);

/**
 * Optic / Scope Crosshairs
 */
export const ScopeIcon: React.FC<IconProps> = ({
  size = 11,
  color = '#38bdf8',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/**
 * Suppressor / Silencer
 * Cylindrical body with knurled end cap and internal baffle segments.
 */
export const SuppressorIcon: React.FC<IconProps> = ({
  size = 11,
  color = '#f59e0b',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <rect x="2" y="7" width="20" height="10" rx="3" />
    <line x1="7" y1="7" x2="7" y2="17" />
    <line x1="12" y1="7" x2="12" y2="17" />
    <line x1="17" y1="7" x2="17" y2="17" />
    {/* Barrel mount thread on left */}
    <rect x="1" y="9.5" width="2" height="5" rx="0.5" />
  </svg>
);

/**
 * Gun Magazine
 * Detachable box magazine with feed lips and stacked rounds witness windows.
 */
export const MagazineIcon: React.FC<IconProps> = ({
  size = 11,
  color = '#c084fc',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <rect x="6" y="2" width="12" height="20" rx="1.5" />
    {/* Feed lips at top */}
    <path d="M8 2 L8 5 L16 5 L16 2" />
    {/* Witness observation holes / ribbing */}
    <circle cx="12" cy="8" r="1" fill={color} />
    <circle cx="12" cy="12" r="1" fill={color} />
    <circle cx="12" cy="16" r="1" fill={color} />
    {/* Baseplate */}
    <line x1="5" y1="22" x2="19" y2="22" />
  </svg>
);

/**
 * Holster
 * Molded pistol retention holster with trigger guard cover and clip.
 */
export const HolsterIcon: React.FC<IconProps> = ({
  size = 11,
  color = '#34d399',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M7 3 L17 3 L18 10 L15 21 L9 21 L6 10 Z" />
    {/* Retention belt clip */}
    <rect x="10" y="7" width="4" height="7" rx="1" />
  </svg>
);

/**
 * Picatinny / Optical Mount
 * MIL-STD-1913 rail profile with clamping cross-bolts.
 */
export const PicatinnyMountIcon: React.FC<IconProps> = ({
  size = 11,
  color = '#60a5fa',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <rect x="2" y="7" width="20" height="5" rx="1" />
    <rect x="4" y="12" width="4" height="5" rx="0.5" />
    <rect x="16" y="12" width="4" height="5" rx="0.5" />
    {/* Rail slots */}
    <line x1="6" y1="7" x2="6" y2="4" />
    <line x1="12" y1="7" x2="12" y2="4" />
    <line x1="18" y1="7" x2="18" y2="4" />
  </svg>
);

/**
 * Tactical 2-Point Sling
 * Webbing sling loop with heavy-duty QD swivel hardware.
 */
export const TacticalSlingIcon: React.FC<IconProps> = ({
  size = 11,
  color = '#fb923c',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M5 7 C5 7, 12 18, 19 7" />
    {/* Swivel QD mount loops */}
    <rect x="3" y="4" width="4" height="5" rx="1" />
    <rect x="17" y="4" width="4" height="5" rx="1" />
  </svg>
);

/**
 * Reloading Smokeless Gunpowder Bottle / Canister
 */
export const GunpowderIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#f59e0b',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Bottle body */}
    <rect x="5" y="8" width="14" height="13" rx="2" />
    {/* Cap & neck */}
    <path d="M9 8V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
    {/* Measurement gauge markings */}
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="15" x2="13" y2="15" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
);

/**
 * Reloading Primer Cup / Tray
 */
export const PrimerIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#fbbf24',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Primer cup circular boundary */}
    <circle cx="12" cy="12" r="8" />
    {/* Anvil 3-point star structure */}
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="4" x2="12" y2="9" />
    <line x1="5" y1="16" x2="9.5" y2="13.5" />
    <line x1="19" y1="16" x2="14.5" y2="13.5" />
  </svg>
);

/**
 * Reloading Empty Brass Casing
 */
export const BrassCaseIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#eab308',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Case body */}
    <path d="M7 8 L7 20 M17 8 L17 20" />
    <path d="M7 20 L17 20" />
    {/* Bottleneck shoulder & neck */}
    <path d="M7 8 L9 5 L9 3 L15 3 L15 5 L17 8" />
    {/* Extractor groove & rim */}
    <line x1="7" y1="18" x2="17" y2="18" />
    <line x1="6" y1="21" x2="18" y2="21" />
  </svg>
);

/**
 * Reloading Bullet / Projectile
 * Aerodynamic pointed boat-tail bullet with cannelure groove.
 */
export const BulletProjectileIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#f97316',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Ogive bullet tip */}
    <path d="M8 12 C8 6, 12 3, 12 3 C12 3, 16 6, 16 12" />
    {/* Bearing surface body */}
    <line x1="8" y1="12" x2="8" y2="18" />
    <line x1="16" y1="12" x2="16" y2="18" />
    {/* Cannelure crimp band */}
    <line x1="8" y1="14" x2="16" y2="14" strokeDasharray="1 1" />
    {/* Boat-tail base */}
    <path d="M8 18 L10 21 L14 21 L16 18" />
  </svg>
);

/**
 * Handgun / Pistol Icon
 * Semi-automatic silhouette with slide, barrel, trigger guard, and grip.
 */
export const HandgunIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Slide & Barrel */}
    <path d="M3 7h16v4H14l-2 3H8l-1-2H3V7z" />
    {/* Grip */}
    <path d="M8 12l2 8h4l1-6" />
    {/* Trigger Guard */}
    <path d="M12 12c0 2-1 3-3 3" />
    {/* Sight */}
    <line x1="4" y1="6" x2="4" y2="7" />
  </svg>
);

/**
 * Rifle Icon
 * Long rifle silhouette with barrel, receiver, optic mount, and stock.
 */
export const RifleIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Barrel & Flash Hider */}
    <path d="M22 8l-8 3H9l-2 2H2v-2l4-2h8l8-1z" />
    {/* Stock */}
    <path d="M6 13l-4 3v3l5-1 2-3" />
    {/* Magazine */}
    <path d="M10 13l-1 4h2l1-4" />
    {/* Scope / Optic */}
    <path d="M11 6h5v2h-5z" />
  </svg>
);

/**
 * Shotgun Icon
 * Long barrel shotgun silhouette with tubular magazine and stock.
 */
export const ShotgunIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Dual Barrel & Magazine Tube */}
    <path d="M22 9L12 11H8l-2 2H2v-2l4-1h8l8-1z" />
    {/* Pump Slide */}
    <rect x="14" y="10" width="4" height="2" rx="0.5" />
    {/* Grip & Stock */}
    <path d="M6 12l-4 4v3l5-1 2-4" />
  </svg>
);

/**
 * Stock Icon
 * Tactical adjustable rifle / carbine buttstock with buffer tube collar, cheek rest, and recoil pad.
 */
export const StockIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#10b981',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Buffer Tube Interface */}
    <path d="M21 7H14V11H21V7Z" />
    {/* Stock Body with Cheek Slope */}
    <path d="M14 7L6 9C4 9.5 3 11 3 13V18C3 19 4 20 5 20L9 19.5L14 13V11" />
    {/* Recoil Buttpad */}
    <path d="M3 13V20" strokeWidth="2.5" />
    {/* Adjustment Lever / Latch */}
    <path d="M10 15L13 14" />
    {/* QD Sling Socket */}
    <circle cx="7" cy="15" r="1" fill={color} />
  </svg>
);

/**
 * Chassis Icon
 * Modular precision bolt-action rifle chassis with M-LOK forend, action inlet, and skeletonized stock.
 */
export const ChassisIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#06b6d4',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Forend with M-LOK Slots */}
    <path d="M22 10H14V13H22V10Z" />
    <line x1="16" y1="11.5" x2="18" y2="11.5" strokeWidth="1.5" />
    <line x1="19.5" y1="11.5" x2="21" y2="11.5" strokeWidth="1.5" />
    {/* Action Bedding & Trigger Guard */}
    <path d="M14 10H10V14C10 15 11 16 12 16H13V13H14" />
    {/* Pistol Grip Interface */}
    <path d="M10 14L8 19H10L11.5 15.5" />
    {/* Skeletonized Buttstock & Cheek Riser */}
    <path d="M10 11H6L3 13V19L6 18L10 13" />
    <path d="M7 8.5H4.5C3.7 8.5 3 9.2 3 10V13" />
    {/* Recoil Pad */}
    <line x1="2" y1="13" x2="2" y2="19" strokeWidth="2.5" />
  </svg>
);

/**
 * Gun Belt Icon
 * Tactical loadout belt / Western cartridge drop belt with heavy-duty buckle and ammo/MOLLE slots.
 */
export const GunBeltIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#eab308',
  className,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Main Belt Strap */}
    <path d="M2 9H22V15H2V9Z" />
    {/* Heavy-Duty Buckle Frame */}
    <rect x="7" y="7.5" width="6" height="9" rx="1.5" strokeWidth="2" />
    {/* Buckle Center Prong / Latch */}
    <line x1="10" y1="9" x2="10" y2="15" strokeWidth="2" />
    {/* Belt Loop / Keeper */}
    <line x1="15" y1="9" x2="15" y2="15" strokeWidth="1.5" />
    {/* Cartridge Loops / Micro-MOLLE Slots */}
    <line x1="18" y1="11" x2="18" y2="13" strokeWidth="1.5" />
    <line x1="20.5" y1="11" x2="20.5" y2="13" strokeWidth="1.5" />
    <line x1="4.5" y1="11" x2="4.5" y2="13" strokeWidth="1.5" />
  </svg>
);
