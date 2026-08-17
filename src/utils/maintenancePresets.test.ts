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

  test('detects M1 Garand profile and includes op-rod and Lubriplate tasks', () => {
    const garand: Partial<Firearm> = {
      make: 'Springfield Armory',
      model: 'M1 Garand',
      caliber: '.30-06 Springfield',
      action_type: 'Semi-Automatic'
    };

    const profile = detectFirearmScheduleProfile(garand);
    expect(profile.id).toBe('m1_garand');
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('op-rod'))).toBe(true);
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('lubriplate'))).toBe(true);
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('en-bloc') || t.task_name.toLowerCase().includes('clip latch'))).toBe(true);
  });

  test('detects M1 Carbine profile and includes gas tappet and slide spring tasks', () => {
    const carbine: Partial<Firearm> = {
      make: 'Inland Manufacturing',
      model: 'M1 Carbine',
      caliber: '.30 Carbine',
      action_type: 'Semi-Automatic'
    };

    const profile = detectFirearmScheduleProfile(carbine);
    expect(profile.id).toBe('m1_carbine');
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('tappet'))).toBe(true);
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('mag catch') || t.task_name.toLowerCase().includes('magazine catch'))).toBe(true);
  });

  test('detects Springfield 1903A3 / vintage CRF bolt action profile', () => {
    const m1903: Partial<Firearm> = {
      make: 'Remington',
      model: '1903A3',
      caliber: '.30-06',
      action_type: 'Bolt Action'
    };

    const profile = detectFirearmScheduleProfile(m1903);
    expect(profile.id).toBe('vintage_bolt_crf');
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('claw extractor'))).toBe(true);
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('corrosive') || t.task_name.toLowerCase().includes('decontamination'))).toBe(true);
  });

  test('detects Winchester Model 1895 vintage box-magazine lever action profile', () => {
    const win1895: Partial<Firearm> = {
      make: 'Winchester',
      model: 'Model 1895',
      caliber: '.30-40 Krag',
      action_type: 'Lever Action'
    };

    const profile = detectFirearmScheduleProfile(win1895);
    expect(profile.id).toBe('vintage_box_lever');
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('tang screw') || t.task_name.toLowerCase().includes('wrist'))).toBe(true);
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('box magazine'))).toBe(true);
    expect(profile.tasks.some(t => t.task_name.toLowerCase().includes('locking bolt'))).toBe(true);
  });
});
