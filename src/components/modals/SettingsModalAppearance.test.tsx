/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DEFAULT_THEME_CONFIG, THEME_STORAGE_KEY } from '@/utils/themeEngine';
import { SettingsModal } from './SettingsModal';

describe('SettingsModal - Appearance & Personalization', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-accent');
    document.documentElement.removeAttribute('data-canvas');
    document.documentElement.removeAttribute('data-density');
    document.documentElement.removeAttribute('data-radius');
    document.documentElement.removeAttribute('data-font');
    document.documentElement.removeAttribute('data-font-scale');
    document.documentElement.removeAttribute('data-privacy');

    window.api = {
      ...window.api,
      getBackupFolder: vi.fn().mockResolvedValue(null),
      getConfig: vi.fn().mockResolvedValue(null),
      setConfig: vi.fn().mockResolvedValue(true),
    } as any;
  });

  test('renders the Appearance & Personalization section with preset palettes', async () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={() => {}}
        onOpenChangePassword={() => {}}
        onOpenRecoveryKey={() => {}}
      />
    );

    expect(screen.getByText('Appearance & Personalization')).toBeDefined();
    expect(screen.getByText('Tactical Accent Palettes')).toBeDefined();
    expect(screen.getByText('Tactical Blue')).toBeDefined();
    expect(screen.getByText('OD / Ranger Green')).toBeDefined();
    expect(screen.getByText('Flat Dark Earth / Coyote')).toBeDefined();
    expect(screen.getByText('Night Vision Crimson')).toBeDefined();
    expect(screen.getByText('Stealth Gunmetal')).toBeDefined();
    expect(screen.getByText('Desert Sand')).toBeDefined();
    expect(screen.getByText('Cyber Violet')).toBeDefined();
  });

  test('clicking preset accent updates localStorage and document attributes', async () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={() => {}}
        onOpenChangePassword={() => {}}
        onOpenRecoveryKey={() => {}}
      />
    );

    const greenBtn = screen.getByText('OD / Ranger Green');
    fireEvent.click(greenBtn);

    const stored = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || '{}');
    expect(stored.accent).toBe('green');
    expect(document.documentElement.getAttribute('data-accent')).toBe('green');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#22c55e');
  });

  test('clicking canvas background option sets data-canvas attribute', async () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={() => {}}
        onOpenChangePassword={() => {}}
        onOpenRecoveryKey={() => {}}
      />
    );

    const oledBtn = screen.getByText('OLED Pure Black');
    fireEvent.click(oledBtn);

    const stored = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || '{}');
    expect(stored.canvas).toBe('oled');
    expect(document.documentElement.getAttribute('data-canvas')).toBe('oled');
  });

  test('clicking UI density and corner geometry updates attributes', async () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={() => {}}
        onOpenChangePassword={() => {}}
        onOpenRecoveryKey={() => {}}
      />
    );

    const compactBtn = screen.getByText('Compact');
    fireEvent.click(compactBtn);

    const sharpBtn = screen.getByText('Tactical (3px)');
    fireEvent.click(sharpBtn);

    const stored = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || '{}');
    expect(stored.density).toBe('compact');
    expect(stored.radius).toBe('sharp');
    expect(document.documentElement.getAttribute('data-density')).toBe('compact');
    expect(document.documentElement.getAttribute('data-radius')).toBe('sharp');
  });

  test('toggling Discretion Shield updates privacy mode and button label', async () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={() => {}}
        onOpenChangePassword={() => {}}
        onOpenRecoveryKey={() => {}}
      />
    );

    const shieldBtn = screen.getByText('Enable Shield');
    fireEvent.click(shieldBtn);

    const stored = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || '{}');
    expect(stored.privacyMode).toBe(true);
    expect(document.documentElement.getAttribute('data-privacy')).toBe('true');
    expect(screen.getByText('Shield Enabled')).toBeDefined();
  });

  test('expanding widget manager allows toggling individual micro-widgets', async () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={() => {}}
        onOpenChangePassword={() => {}}
        onOpenRecoveryKey={() => {}}
      />
    );

    const accordionBtn = screen.getByText('Modular Widget Visibility Manager');
    fireEvent.click(accordionBtn);

    expect(screen.getByText('Command Bar Metrics (Top 5 Stats)')).toBeDefined();
    expect(screen.getByText('Firearms Count')).toBeDefined();

    const firearmsCheck = screen.getByLabelText('Firearms Count') as HTMLInputElement;
    expect(firearmsCheck.checked).toBe(true);

    fireEvent.click(firearmsCheck);

    const stored = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || '{}');
    expect(stored.widgets.statFirearms).toBe(false);
  });

  test('Reset Defaults restores original theme configuration', async () => {
    window.confirm = vi.fn().mockReturnValue(true);

    render(
      <SettingsModal
        isOpen={true}
        onClose={() => {}}
        onOpenChangePassword={() => {}}
        onOpenRecoveryKey={() => {}}
      />
    );

    // Change to violet
    fireEvent.click(screen.getByText('Cyber Violet'));
    expect(document.documentElement.getAttribute('data-accent')).toBe('violet');

    // Click reset
    fireEvent.click(screen.getByText('Reset Defaults'));

    expect(window.confirm).toHaveBeenCalled();
    const stored = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || '{}');
    expect(stored.accent).toBe('blue');
    expect(document.documentElement.getAttribute('data-accent')).toBe('blue');
  });
});
