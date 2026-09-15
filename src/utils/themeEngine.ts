/**
 * ArmoryVault Desktop - Theme & Personalization Engine
 * Manages tactical accent palettes, canvas backgrounds, interface density,
 * typography, corner geometry, privacy discretion mode, and widget visibility.
 */

export type ThemeAccent =
  | 'blue'
  | 'green'
  | 'fde'
  | 'crimson'
  | 'gray'
  | 'sand'
  | 'violet'
  | 'custom';

export type CanvasStyle = 'mesh' | 'oled' | 'navy' | 'flat';

export type UiDensity = 'compact' | 'comfortable' | 'spacious';

export type CornerRadius = 'sharp' | 'modern' | 'pill';

export type FontFamily = 'sans' | 'mono' | 'system';

export type FontScale = 'compact' | 'standard' | 'large';

export type GridDensity = 'standard' | 'compact' | 'showcase';

export interface WidgetVisibilityConfig {
  // Command Bar Metrics
  statFirearms: boolean;
  statAmmo: boolean;
  statRounds: boolean;
  statValuation: boolean;
  statService: boolean;

  // Major Sectional Widgets
  collectionAnalytics: boolean;
  storageOverview: boolean;
  storageValuations: boolean;
  categoryChips: boolean;
  exportBinder: boolean;

  // Firearm Card Micro-Widgets
  wearGauges: boolean;
  mountedAccessories: boolean;
  telemetryStrip: boolean;
  storageBadges: boolean;
  showThumbnails: boolean;

  // Sub-page Widgets
  ammoLowStockAlert: boolean;
  ammoValuation: boolean;
  accessoryValuation: boolean;
}

export interface ThemeConfig {
  accent: ThemeAccent;
  customAccentColor?: string;
  canvas: CanvasStyle;
  density: UiDensity;
  radius: CornerRadius;
  font: FontFamily;
  fontScale: FontScale;
  gridDensity: GridDensity;
  privacyMode: boolean;
  widgets: WidgetVisibilityConfig;
  startupRoute: string;
}

export interface AccentPreset {
  id: ThemeAccent;
  name: string;
  primary: string;
  hover: string;
  border: string;
  glow: string;
  badgeBg: string;
}

export const ACCENT_PRESETS: Record<Exclude<ThemeAccent, 'custom'>, AccentPreset> = {
  blue: {
    id: 'blue',
    name: 'Tactical Blue',
    primary: '#3b82f6',
    hover: '#60a5fa',
    border: 'rgba(59, 130, 246, 0.35)',
    glow: 'rgba(59, 130, 246, 0.3)',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
  },
  green: {
    id: 'green',
    name: 'OD / Ranger Green',
    primary: '#22c55e',
    hover: '#4ade80',
    border: 'rgba(34, 197, 94, 0.35)',
    glow: 'rgba(34, 197, 94, 0.3)',
    badgeBg: 'rgba(34, 197, 94, 0.15)',
  },
  fde: {
    id: 'fde',
    name: 'Flat Dark Earth / Coyote',
    primary: '#f59e0b',
    hover: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.35)',
    glow: 'rgba(245, 158, 11, 0.3)',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
  },
  crimson: {
    id: 'crimson',
    name: 'Night Vision Crimson',
    primary: '#ef4444',
    hover: '#f87171',
    border: 'rgba(239, 68, 68, 0.35)',
    glow: 'rgba(239, 68, 68, 0.3)',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
  },
  gray: {
    id: 'gray',
    name: 'Stealth Gunmetal',
    primary: '#94a3b8',
    hover: '#cbd5e1',
    border: 'rgba(148, 163, 184, 0.35)',
    glow: 'rgba(148, 163, 184, 0.25)',
    badgeBg: 'rgba(148, 163, 184, 0.15)',
  },
  sand: {
    id: 'sand',
    name: 'Desert Sand',
    primary: '#eab308',
    hover: '#fde047',
    border: 'rgba(234, 179, 8, 0.35)',
    glow: 'rgba(234, 179, 8, 0.3)',
    badgeBg: 'rgba(234, 179, 8, 0.15)',
  },
  violet: {
    id: 'violet',
    name: 'Cyber Violet',
    primary: '#8b5cf6',
    hover: '#a78bfa',
    border: 'rgba(139, 92, 246, 0.35)',
    glow: 'rgba(139, 92, 246, 0.3)',
    badgeBg: 'rgba(139, 92, 246, 0.15)',
  },
};

export const DEFAULT_WIDGET_CONFIG: WidgetVisibilityConfig = {
  statFirearms: true,
  statAmmo: true,
  statRounds: true,
  statValuation: true,
  statService: true,
  collectionAnalytics: false,
  storageOverview: true,
  storageValuations: true,
  categoryChips: true,
  exportBinder: true,
  wearGauges: true,
  mountedAccessories: true,
  telemetryStrip: true,
  storageBadges: true,
  showThumbnails: true,
  ammoLowStockAlert: true,
  ammoValuation: true,
  accessoryValuation: true,
};

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  accent: 'blue',
  customAccentColor: '#3b82f6',
  canvas: 'mesh',
  density: 'comfortable',
  radius: 'modern',
  font: 'sans',
  fontScale: 'standard',
  gridDensity: 'standard',
  privacyMode: false,
  widgets: DEFAULT_WIDGET_CONFIG,
  startupRoute: '/',
};

export const THEME_STORAGE_KEY = 'armoryvault_theme_config';

/**
 * Converts a hex color (#RRGGBB or #RGB) into an RGBA string with given alpha.
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length !== 6) {
    return `rgba(59, 130, 246, ${alpha})`;
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Lightens or darkens a hex color by a percentage factor (-1.0 to 1.0).
 */
export const adjustHexBrightness = (hex: string, factor: number): string => {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length !== 6) return hex;
  let r = parseInt(clean.substring(0, 2), 16);
  let g = parseInt(clean.substring(2, 4), 16);
  let b = parseInt(clean.substring(4, 6), 16);

  if (factor > 0) {
    r = Math.min(255, Math.round(r + (255 - r) * factor));
    g = Math.min(255, Math.round(g + (255 - g) * factor));
    b = Math.min(255, Math.round(b + (255 - b) * factor));
  } else {
    r = Math.max(0, Math.round(r * (1 + factor)));
    g = Math.max(0, Math.round(g * (1 + factor)));
    b = Math.max(0, Math.round(b * (1 + factor)));
  }

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Generates an AccentPreset object from a custom hex string.
 */
export const createCustomAccentPreset = (hex: string): AccentPreset => {
  const primary = hex.startsWith('#') ? hex : `#${hex}`;
  const hover = adjustHexBrightness(primary, 0.2);
  return {
    id: 'custom',
    name: 'Custom',
    primary,
    hover,
    border: hexToRgba(primary, 0.35),
    glow: hexToRgba(primary, 0.3),
    badgeBg: hexToRgba(primary, 0.15),
  };
};

/**
 * Reads the stored ThemeConfig from localStorage with fallback to defaults.
 */
export const getStoredTheme = (): ThemeConfig => {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_THEME_CONFIG,
      ...parsed,
      widgets: {
        ...DEFAULT_WIDGET_CONFIG,
        ...(parsed.widgets || {}),
      },
    };
  } catch {
    return DEFAULT_THEME_CONFIG;
  }
};

/**
 * Applies all theme variables and data attributes to the document element.
 */
export const applyTheme = (config: Partial<ThemeConfig>): ThemeConfig => {
  if (typeof document === 'undefined') {
    return { ...DEFAULT_THEME_CONFIG, ...config };
  }

  const current = getStoredTheme();
  const merged: ThemeConfig = {
    ...current,
    ...config,
    widgets: {
      ...current.widgets,
      ...(config.widgets || {}),
    },
  };

  const root = document.documentElement;

  // 1. Accent color tokens
  let preset: AccentPreset;
  if (merged.accent === 'custom' && merged.customAccentColor) {
    preset = createCustomAccentPreset(merged.customAccentColor);
  } else {
    preset = ACCENT_PRESETS[merged.accent as keyof typeof ACCENT_PRESETS] || ACCENT_PRESETS.blue;
  }

  root.style.setProperty('--accent', preset.primary);
  root.style.setProperty('--accent-primary', preset.primary);
  root.style.setProperty('--accent-hover', preset.hover);
  root.style.setProperty('--accent-primary-hover', preset.hover);
  root.style.setProperty('--border-highlight', preset.border);
  root.style.setProperty('--glow', `0 0 25px ${preset.glow}`);
  root.style.setProperty('--shadow-glow', `0 0 35px ${preset.glow}`);

  // 2. Data attributes for declarative CSS styling
  root.setAttribute('data-accent', merged.accent);
  root.setAttribute('data-canvas', merged.canvas);
  root.setAttribute('data-density', merged.density);
  root.setAttribute('data-radius', merged.radius);
  root.setAttribute('data-font', merged.font);
  root.setAttribute('data-font-scale', merged.fontScale);
  root.setAttribute('data-grid', merged.gridDensity);
  root.setAttribute('data-privacy', String(merged.privacyMode));

  return merged;
};

/**
 * Persists theme configuration to localStorage, updates the DOM,
 * informs the Electron main process via config.json, and fires a window event.
 */
export const saveTheme = async (config: Partial<ThemeConfig>): Promise<ThemeConfig> => {
  const updated = applyTheme(config);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updated));
    // Also sync legacy keys so older components stay aligned
    localStorage.setItem(
      'armoryvault_storage_valuations',
      String(updated.widgets.storageValuations)
    );
  } catch (e) {
    console.warn('Failed to write theme to localStorage:', e);
  }

  if (typeof window !== 'undefined' && (window as any).api?.setConfig) {
    try {
      await (window as any).api.setConfig('theme_config', updated);
      await (window as any).api.setConfig(
        'showCollectionAnalytics',
        updated.widgets.collectionAnalytics
      );
      await (window as any).api.setConfig(
        'showStorageValuations',
        updated.widgets.storageValuations
      );
    } catch (e) {
      console.warn('Failed to sync theme config to main process:', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('armoryvault-theme-change', { detail: updated }));
  }

  return updated;
};

/**
 * Resets all theme and widget visibility options to the default configuration.
 */
export const resetThemeToDefault = async (): Promise<ThemeConfig> => {
  return saveTheme(DEFAULT_THEME_CONFIG);
};

/**
 * Privacy masking utility.
 * Replaces sensitive values with discrete placeholders when privacy mode is active.
 */
export const maskValue = (
  value: string | number | null | undefined,
  type: 'serial' | 'currency' | 'location' | 'text' = 'text',
  isPrivacyActive: boolean
): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);

  if (!isPrivacyActive) return str;

  switch (type) {
    case 'serial':
      if (str.length <= 4) return '••••';
      return `${str.substring(0, 2)}••••${str.substring(str.length - 2)}`;
    case 'currency':
      return '$••••••';
    case 'location':
      return 'Vault Storage';
    case 'text':
    default:
      return '••••••••';
  }
};
