import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACCENT_PRESETS,
  adjustHexBrightness,
  applyTheme,
  createCustomAccentPreset,
  DEFAULT_THEME_CONFIG,
  DEFAULT_WIDGET_CONFIG,
  getStoredTheme,
  hexToRgba,
  maskValue,
  resetThemeToDefault,
  saveTheme,
  THEME_STORAGE_KEY,
} from './themeEngine';

describe('ThemeEngine', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.cssText = '';
    // Remove all custom attributes
    const attrs = [
      'data-accent',
      'data-canvas',
      'data-density',
      'data-radius',
      'data-font',
      'data-font-scale',
      'data-grid',
      'data-privacy',
    ];
    attrs.forEach((a) => document.documentElement.removeAttribute(a));
  });

  describe('Color Utilities', () => {
    it('converts 6-digit hex to RGBA string', () => {
      expect(hexToRgba('#3b82f6', 0.5)).toBe('rgba(59, 130, 246, 0.5)');
      expect(hexToRgba('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)');
    });

    it('converts 3-digit shorthand hex to RGBA string', () => {
      expect(hexToRgba('#f00', 0.8)).toBe('rgba(255, 0, 0, 0.8)');
    });

    it('adjusts hex brightness correctly', () => {
      const brightened = adjustHexBrightness('#101010', 0.5);
      expect(brightened).not.toBe('#101010');
      const darkened = adjustHexBrightness('#ffffff', -0.5);
      expect(darkened).not.toBe('#ffffff');
    });

    it('creates custom accent preset with derived hover and glow', () => {
      const custom = createCustomAccentPreset('#ff5500');
      expect(custom.id).toBe('custom');
      expect(custom.primary).toBe('#ff5500');
      expect(custom.border).toContain('rgba(');
      expect(custom.glow).toContain('rgba(');
      expect(custom.badgeBg).toContain('rgba(');
    });
  });

  describe('Accent Presets', () => {
    it('contains all 7 standard tactical themes', () => {
      expect(ACCENT_PRESETS.blue.primary).toBe('#3b82f6');
      expect(ACCENT_PRESETS.green.primary).toBe('#22c55e');
      expect(ACCENT_PRESETS.fde.primary).toBe('#f59e0b');
      expect(ACCENT_PRESETS.crimson.primary).toBe('#ef4444');
      expect(ACCENT_PRESETS.gray.primary).toBe('#94a3b8');
      expect(ACCENT_PRESETS.sand.primary).toBe('#eab308');
      expect(ACCENT_PRESETS.violet.primary).toBe('#8b5cf6');
    });
  });

  describe('Theme Application & Storage', () => {
    it('falls back to default config when localStorage is empty', () => {
      const theme = getStoredTheme();
      expect(theme.accent).toBe('blue');
      expect(theme.canvas).toBe('mesh');
      expect(theme.density).toBe('comfortable');
      expect(theme.radius).toBe('modern');
      expect(theme.privacyMode).toBe(false);
      expect(theme.widgets.statFirearms).toBe(true);
    });

    it('applies theme attributes and CSS variables to document.documentElement', () => {
      applyTheme({
        accent: 'green',
        canvas: 'oled',
        density: 'compact',
        radius: 'sharp',
        privacyMode: true,
      });

      expect(document.documentElement.getAttribute('data-accent')).toBe('green');
      expect(document.documentElement.getAttribute('data-canvas')).toBe('oled');
      expect(document.documentElement.getAttribute('data-density')).toBe('compact');
      expect(document.documentElement.getAttribute('data-radius')).toBe('sharp');
      expect(document.documentElement.getAttribute('data-privacy')).toBe('true');
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#22c55e');
    });

    it('applies custom accent color properly', () => {
      applyTheme({
        accent: 'custom',
        customAccentColor: '#ff0077',
      });

      expect(document.documentElement.getAttribute('data-accent')).toBe('custom');
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#ff0077');
    });

    it('persists changes to localStorage on saveTheme', async () => {
      await saveTheme({ accent: 'crimson', density: 'spacious' });
      const stored = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || '{}');
      expect(stored.accent).toBe('crimson');
      expect(stored.density).toBe('spacious');
    });

    it('resets theme to defaults via resetThemeToDefault', async () => {
      await saveTheme({ accent: 'violet', canvas: 'flat' });
      await resetThemeToDefault();
      const theme = getStoredTheme();
      expect(theme.accent).toBe('blue');
      expect(theme.canvas).toBe('mesh');
    });
  });

  describe('Privacy Discretion Masking', () => {
    it('returns raw value when privacy mode is inactive', () => {
      expect(maskValue('SN-987654321', 'serial', false)).toBe('SN-987654321');
      expect(maskValue('$1,250.00', 'currency', false)).toBe('$1,250.00');
      expect(maskValue('Gun Safe #1', 'location', false)).toBe('Gun Safe #1');
    });

    it('masks serial numbers with discrete bullets when privacy mode is active', () => {
      const masked = maskValue('SN-987654321', 'serial', true);
      expect(masked).toBe('SN••••21');
      expect(maskValue('1234', 'serial', true)).toBe('••••');
    });

    it('masks currency and valuations when privacy mode is active', () => {
      expect(maskValue('$1,250.00', 'currency', true)).toBe('$••••••');
      expect(maskValue(4500, 'currency', true)).toBe('$••••••');
    });

    it('masks storage container locations when privacy mode is active', () => {
      expect(maskValue('Master Bedroom Safe', 'location', true)).toBe('Vault Storage');
    });

    it('handles empty or null inputs gracefully', () => {
      expect(maskValue(null, 'serial', true)).toBe('');
      expect(maskValue(undefined, 'currency', true)).toBe('');
    });
  });
});
