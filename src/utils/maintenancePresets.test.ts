import { describe, test, expect } from 'vitest';
import { detectFirearmScheduleProfile, createScheduleItemsFromProfile, MAINTENANCE_PROFILES } from './maintenancePresets';
import { Firearm } from '../types';

describe('Maintenance Presets & Action Detection', () => {
  test('detects Pump Action for pump shotguns and excludes recoil springs', () => {
    const pumpShotgun: Partial<Firearm> = {
      make: 'Mossberg',
      model: '500 Tactical',
      caliber: '12 GA',
      action_type: 'Pump Action'
    };

    const profile = detectFirearmScheduleProfile(pumpShotgun);
    expect(profile.id).toBe('pump_action');
    expect(profile.name).toBe('Pump Action (Shotgun / Rifle)');

    // Ensure pump action schedule does not contain recoil spring tasks
    const hasRecoilSpring = profile.tasks.some(t => t.task_name.toLowerCase().includes('recoil spring'));
    expect(hasRecoilSpring).toBe(false);

    // Ensure it contains magazine tube / action bar tasks
    const hasActionBar = profile.tasks.some(t => t.task_name.toLowerCase().includes('action bar'));
    expect(hasActionBar).toBe(true);

    const items = createScheduleItemsFromProfile(profile, 500);
    expect(items.length).toBe(5);
    expect(items[0].last_performed_rounds).toBe(500);
  });

  test('detects Revolver profile for revolvers and excludes recoil spring or magazine tasks', () => {
    const revolver: Partial<Firearm> = {
      make: 'Smith & Wesson',
      model: '686 Plus',
      caliber: '.357 Magnum',
      action_type: 'Revolver (Double Action)'
    };

    const profile = detectFirearmScheduleProfile(revolver);
    expect(profile.id).toBe('revolver');
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('cylinder'))).toBe(true);
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('recoil spring'))).toBe(false);
  });

  test('detects Bolt Action profile for bolt guns', () => {
    const boltRifle: Partial<Firearm> = {
      make: 'Tikka',
      model: 'T3x Tac A1',
      caliber: '6.5 Creedmoor',
      action_type: 'Bolt Action'
    };

    const profile = detectFirearmScheduleProfile(boltRifle);
    expect(profile.id).toBe('bolt_action');
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('bedding'))).toBe(true);
  });

  test('detects Semi-Automatic Handgun for pistols', () => {
    const pistol: Partial<Firearm> = {
      make: 'Glock',
      model: '19 Gen 5',
      caliber: '9mm',
      action_type: 'Striker-Fired'
    };

    const profile = detectFirearmScheduleProfile(pistol);
    expect(profile.id).toBe('semi_pistol');
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('recoil spring'))).toBe(true);
  });

  test('detects Semi-Automatic Rifle for AR-15 platforms', () => {
    const ar15: Partial<Firearm> = {
      make: 'Daniel Defense',
      model: 'DDM4 V7',
      caliber: '5.56 NATO',
      action_type: 'Semi-Automatic (Gas)'
    };

    const profile = detectFirearmScheduleProfile(ar15);
    expect(profile.id).toBe('semi_rifle');
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('gas rings'))).toBe(true);
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('buffer'))).toBe(true);
  });

  test('preserves optional interval_days on generated schedule items', () => {
    const pistolProfile = MAINTENANCE_PROFILES.semi_pistol;
    const items = createScheduleItemsFromProfile(pistolProfile, 1200);
    const cleanItem = items.find(i => i.task_name.toLowerCase().includes('clean'));
    expect(cleanItem).toBeDefined();
    expect(cleanItem?.interval_days).toBe(90);
    expect(cleanItem?.interval_rounds).toBe(300);
  });
});
