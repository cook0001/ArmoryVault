import { describe, expect, test } from 'vitest';
import { Firearm } from '../types';
import {
  createScheduleItemsFromProfile,
  detectFirearmScheduleProfile,
  MAINTENANCE_PROFILES,
} from './maintenancePresets';

describe('Maintenance Presets & Action Detection', () => {
  test('detects Pump Action for pump shotguns and excludes recoil springs', () => {
    const pumpShotgun: Partial<Firearm> = {
      make: 'Mossberg',
      model: '500 Tactical',
      caliber: '12 GA',
      action_type: 'Pump Action',
    };

    const profile = detectFirearmScheduleProfile(pumpShotgun);
    expect(profile.id).toBe('pump_action');
    expect(profile.name).toBe('Pump Action (Shotgun / Rifle)');

    // Ensure pump action schedule does not contain recoil spring tasks
    const hasRecoilSpring = profile.tasks.some((t) =>
      t.task_name.toLowerCase().includes('recoil spring')
    );
    expect(hasRecoilSpring).toBe(false);

    // Ensure it contains magazine tube / action bar tasks
    const hasActionBar = profile.tasks.some((t) =>
      t.task_name.toLowerCase().includes('action bar')
    );
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
      action_type: 'Revolver (Double Action)',
    };

    const profile = detectFirearmScheduleProfile(revolver);
    expect(profile.id).toBe('revolver');
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('cylinder'))).toBe(true);
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('recoil spring'))).toBe(
      false
    );
  });

  test('detects Bolt Action profile for bolt guns', () => {
    const boltRifle: Partial<Firearm> = {
      make: 'Tikka',
      model: 'T3x Tac A1',
      caliber: '6.5 Creedmoor',
      action_type: 'Bolt Action',
    };

    const profile = detectFirearmScheduleProfile(boltRifle);
    expect(profile.id).toBe('bolt_action');
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('bedding'))).toBe(true);
  });

  test('detects Semi-Automatic Handgun for pistols', () => {
    const pistol: Partial<Firearm> = {
      make: 'Glock',
      model: '19 Gen 5',
      caliber: '9mm',
      action_type: 'Striker-Fired',
    };

    const profile = detectFirearmScheduleProfile(pistol);
    expect(profile.id).toBe('semi_pistol');
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('recoil spring'))).toBe(
      true
    );
  });

  test('detects Semi-Automatic Rifle for AR-15 platforms', () => {
    const ar15: Partial<Firearm> = {
      make: 'Daniel Defense',
      model: 'DDM4 V7',
      caliber: '5.56 NATO',
      action_type: 'Semi-Automatic (Gas)',
    };

    const profile = detectFirearmScheduleProfile(ar15);
    expect(profile.id).toBe('semi_rifle');
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('gas rings'))).toBe(true);
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('buffer'))).toBe(true);
  });

  test('preserves optional interval_days on generated schedule items', () => {
    const pistolProfile = MAINTENANCE_PROFILES.semi_pistol;
    const items = createScheduleItemsFromProfile(pistolProfile, 1200);
    const cleanItem = items.find((i) => i.task_name.toLowerCase().includes('clean'));
    expect(cleanItem).toBeDefined();
    expect(cleanItem?.interval_days).toBe(90);
    expect(cleanItem?.interval_rounds).toBe(300);
  });

  test('detects M1 Garand profile and includes op-rod and Lubriplate tasks', () => {
    const garand: Partial<Firearm> = {
      make: 'Springfield Armory',
      model: 'M1 Garand',
      caliber: '.30-06 Springfield',
      action_type: 'Semi-Automatic',
    };

    const profile = detectFirearmScheduleProfile(garand);
    expect(profile.id).toBe('m1_garand');
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('op-rod'))).toBe(true);
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('lubriplate'))).toBe(true);
    expect(
      profile.tasks.some(
        (t) =>
          t.task_name.toLowerCase().includes('en-bloc') ||
          t.task_name.toLowerCase().includes('clip latch')
      )
    ).toBe(true);
  });

  test('detects M1 Carbine profile and includes gas tappet and slide spring tasks', () => {
    const carbine: Partial<Firearm> = {
      make: 'Inland Manufacturing',
      model: 'M1 Carbine',
      caliber: '.30 Carbine',
      action_type: 'Semi-Automatic',
    };

    const profile = detectFirearmScheduleProfile(carbine);
    expect(profile.id).toBe('m1_carbine');
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('tappet'))).toBe(true);
    expect(
      profile.tasks.some(
        (t) =>
          t.task_name.toLowerCase().includes('mag catch') ||
          t.task_name.toLowerCase().includes('magazine catch')
      )
    ).toBe(true);
  });

  test('detects Springfield 1903A3 / vintage CRF bolt action profile', () => {
    const m1903: Partial<Firearm> = {
      make: 'Remington',
      model: '1903A3',
      caliber: '.30-06',
      action_type: 'Bolt Action',
    };

    const profile = detectFirearmScheduleProfile(m1903);
    expect(profile.id).toBe('vintage_bolt_crf');
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('claw extractor'))).toBe(
      true
    );
    expect(
      profile.tasks.some(
        (t) =>
          t.task_name.toLowerCase().includes('corrosive') ||
          t.task_name.toLowerCase().includes('decontamination')
      )
    ).toBe(true);
  });

  test('detects Winchester Model 1895 vintage box-magazine lever action profile', () => {
    const win1895: Partial<Firearm> = {
      make: 'Winchester',
      model: 'Model 1895',
      caliber: '.30-40 Krag',
      action_type: 'Lever Action',
    };

    const profile = detectFirearmScheduleProfile(win1895);
    expect(profile.id).toBe('vintage_box_lever');
    expect(
      profile.tasks.some(
        (t) =>
          t.task_name.toLowerCase().includes('tang screw') ||
          t.task_name.toLowerCase().includes('wrist')
      )
    ).toBe(true);
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('box magazine'))).toBe(
      true
    );
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('locking bolt'))).toBe(
      true
    );
  });

  test('detects Break Action Single Shot profile for CVA Scout, Henry Single Shot, and H&R Handi-Rifle', () => {
    const cvaScout: Partial<Firearm> = {
      make: 'CVA',
      model: 'Scout V2',
      caliber: '.300 AAC Blackout',
      action_type: 'Break Action Single Shot',
    };

    const profile = detectFirearmScheduleProfile(cvaScout);
    expect(profile.id).toBe('break_action_single');
    expect(profile.name).toContain('Break Action Single Shot');
    expect(
      profile.tasks.some((t) => t.task_name.toLowerCase().includes('forend mounting screw'))
    ).toBe(true);
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('hinge pin'))).toBe(true);
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('transfer bar'))).toBe(
      true
    );
    // Ensure no repeating gas or magazine springs
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('magazine spring'))).toBe(
      false
    );
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('buffer'))).toBe(false);

    const tcEncore: Partial<Firearm> = {
      make: 'Thompson/Center',
      model: 'Encore Pro Hunter',
      caliber: '.30-06 Springfield',
      action_type: 'Single Shot Break Action',
    };
    expect(detectFirearmScheduleProfile(tcEncore).id).toBe('break_action_single');

    const henrySingle: Partial<Firearm> = {
      make: 'Henry Repeating Arms',
      model: 'Single Shot Rifle (H015)',
      caliber: '.45-70 Gov',
      action_type: 'Break Action',
    };
    expect(detectFirearmScheduleProfile(henrySingle).id).toBe('break_action_single');
  });

  test('detects Falling Block Single Shot profile for Ruger No. 1 and Winchester 1885 High Wall', () => {
    const rugerNo1: Partial<Firearm> = {
      make: 'Ruger',
      model: 'No. 1 Medium Sporter',
      caliber: '.375 H&H Magnum',
      action_type: 'Falling Block',
    };

    const profile = detectFirearmScheduleProfile(rugerNo1);
    expect(profile.id).toBe('falling_block_single');
    expect(profile.name).toContain('Falling Block Single Shot');
    expect(
      profile.tasks.some((t) => t.task_name.toLowerCase().includes('falling breechblock'))
    ).toBe(true);
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('forend hanger'))).toBe(
      true
    );
    expect(
      profile.tasks.some(
        (t) =>
          t.task_name.toLowerCase().includes('ejector speed') ||
          t.task_name.toLowerCase().includes('extractor / ejector')
      )
    ).toBe(true);

    const win1885: Partial<Firearm> = {
      make: 'Winchester',
      model: 'Model 1885 High Wall',
      caliber: '.45-70 Government',
      action_type: 'Single Shot Lever',
    };
    expect(detectFirearmScheduleProfile(win1885).id).toBe('falling_block_single');

    const sharps: Partial<Firearm> = {
      make: 'Shiloh Sharps',
      model: '1874 Sharps Long Range Express',
      caliber: '.45-90 Sharps',
      action_type: 'Falling Block',
    };
    expect(detectFirearmScheduleProfile(sharps).id).toBe('falling_block_single');
  });

  test('detects Vintage Rolling Block & Trapdoor Single Shot profile', () => {
    const trapdoor: Partial<Firearm> = {
      make: 'Springfield Armory',
      model: 'Model 1873 Trapdoor',
      caliber: '.45-70 Government',
      action_type: 'Trapdoor Single Shot',
    };

    const profile = detectFirearmScheduleProfile(trapdoor);
    expect(profile.id).toBe('rolling_block_trapdoor');
    expect(profile.name).toContain('Rolling Block');
    expect(profile.name).toContain('Trapdoor');
    expect(
      profile.tasks.some(
        (t) =>
          t.task_name.toLowerCase().includes('cam latch') ||
          t.task_name.toLowerCase().includes('pivot pins')
      )
    ).toBe(true);
    expect(
      profile.tasks.some(
        (t) =>
          t.task_name.toLowerCase().includes('decontamination') ||
          t.task_name.toLowerCase().includes('corrosive')
      )
    ).toBe(true);

    const rollingBlock: Partial<Firearm> = {
      make: 'Remington',
      model: 'No. 1 Rolling Block',
      caliber: '.50-70 Government',
      action_type: 'Rolling Block',
    };
    expect(detectFirearmScheduleProfile(rollingBlock).id).toBe('rolling_block_trapdoor');
  });

  test('detects Gas Piston Semi-Auto Rifle profile for AK-47, SCAR, Tavor, and SIG MCX', () => {
    const ak47: Partial<Firearm> = {
      make: 'Zastava',
      model: 'ZPAP M70 (AK-47)',
      caliber: '7.62x39mm',
      action_type: 'Semi-Automatic (Long-Stroke Gas Piston)',
    };
    const profile = detectFirearmScheduleProfile(ak47);
    expect(profile.id).toBe('semi_piston_rifle');
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('piston head'))).toBe(true);

    const scar: Partial<Firearm> = {
      make: 'FN Herstal',
      model: 'SCAR 17S',
      caliber: '7.62x51mm NATO',
      action_type: 'Semi-Automatic (Short-Stroke Gas Piston)',
    };
    expect(detectFirearmScheduleProfile(scar).id).toBe('semi_piston_rifle');
  });

  test('detects Delayed Blowback profile for MP5, HK91, and CMMG Banshee', () => {
    const mp5: Partial<Firearm> = {
      make: 'Heckler & Koch',
      model: 'SP5 / MP5',
      caliber: '9mm Luger',
      action_type: 'Semi-Automatic (Delayed Blowback - Roller)',
    };
    const profile = detectFirearmScheduleProfile(mp5);
    expect(profile.id).toBe('semi_roller_delayed');
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('bolt gap'))).toBe(true);
    expect(
      profile.tasks.some((t) => t.task_name.toLowerCase().includes('copper extractor spring'))
    ).toBe(true);

    const banshee: Partial<Firearm> = {
      make: 'CMMG',
      model: 'Banshee 300',
      caliber: '10mm Auto',
      action_type: 'Semi-Automatic (Delayed Blowback - Radial)',
    };
    expect(detectFirearmScheduleProfile(banshee).id).toBe('semi_roller_delayed');
  });

  test('detects Direct Blowback PCC profile for Ruger PC Carbine and CZ Scorpion', () => {
    const rugerPcc: Partial<Firearm> = {
      make: 'Ruger',
      model: 'PC Carbine 9mm',
      caliber: '9mm Luger',
      action_type: 'Semi-Automatic (Direct Blowback)',
    };
    const profile = detectFirearmScheduleProfile(rugerPcc);
    expect(profile.id).toBe('semi_direct_blowback');
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('buffer pad'))).toBe(true);
  });

  test('detects Semi-Automatic Shotgun profile for Benelli M4 and Beretta A300', () => {
    const benelliM4: Partial<Firearm> = {
      make: 'Benelli',
      model: 'M4 Tactical',
      caliber: '12 Gauge',
      action_type: 'Semi-Automatic (Gas-Operated Shotgun)',
    };
    const profile = detectFirearmScheduleProfile(benelliM4);
    expect(profile.id).toBe('semi_shotgun');
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('choke'))).toBe(true);
  });

  test('detects Straight-Pull Bolt Action profile for Blaser R8 and Swiss K31', () => {
    const blaserR8: Partial<Firearm> = {
      make: 'Blaser',
      model: 'R8 Professional',
      caliber: '.300 Win Mag',
      action_type: 'Straight-Pull Bolt Action',
    };
    const profile = detectFirearmScheduleProfile(blaserR8);
    expect(profile.id).toBe('straight_pull_bolt');
    expect(
      profile.tasks.some(
        (t) =>
          t.task_name.toLowerCase().includes('collet locking') ||
          t.task_name.toLowerCase().includes('radial head')
      )
    ).toBe(true);
  });

  test('detects Bolt Action Single Shot Target Match profile for Remington 40-X and Anschütz 54', () => {
    const rem40x: Partial<Firearm> = {
      make: 'Remington Custom Shop',
      model: 'Model 40-X Single Shot Target',
      caliber: '6mm BR Norma',
      action_type: 'Bolt Action (Single Shot Target)',
    };
    const profile = detectFirearmScheduleProfile(rem40x);
    expect(profile.id).toBe('bolt_action_target');
    expect(
      profile.tasks.some(
        (t) =>
          t.task_name.toLowerCase().includes('match trigger') ||
          t.task_name.toLowerCase().includes('11° crown')
      )
    ).toBe(true);
  });

  test('detects Single Action Only Revolver profile for Ruger Blackhawk and Colt SAA', () => {
    const saa: Partial<Firearm> = {
      make: 'Colt',
      model: 'Single Action Army Peacemaker',
      caliber: '.45 Colt',
      action_type: 'Revolver (Single Action Only)',
    };
    const profile = detectFirearmScheduleProfile(saa);
    expect(profile.id).toBe('revolver_sa');
    expect(
      profile.tasks.some(
        (t) =>
          t.task_name.toLowerCase().includes('base pin') ||
          t.task_name.toLowerCase().includes('ratchet')
      )
    ).toBe(true);
  });

  test('detects Top-Break Revolver profile for Webley Mk IV and Schofield', () => {
    const webley: Partial<Firearm> = {
      make: 'Webley & Scott',
      model: 'Mark IV .38/200',
      caliber: '.38 S&W',
      action_type: 'Revolver (Top-Break)',
    };
    const profile = detectFirearmScheduleProfile(webley);
    expect(profile.id).toBe('revolver_top_break');
    expect(
      profile.tasks.some(
        (t) =>
          t.task_name.toLowerCase().includes('top barrel latch') ||
          t.task_name.toLowerCase().includes('automatic gear')
      )
    ).toBe(true);
  });

  test('detects Break Action Double profile for Browning Citori and Beretta 686 O/U', () => {
    const citori: Partial<Firearm> = {
      make: 'Browning',
      model: 'Citori 725 Sporting',
      caliber: '12 Gauge',
      action_type: 'Break Action (Over/Under - O/U)',
    };
    const profile = detectFirearmScheduleProfile(citori);
    expect(profile.id).toBe('break_action');
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('choke'))).toBe(true);
    expect(
      profile.tasks.some(
        (t) =>
          t.task_name.toLowerCase().includes('trunnions') ||
          t.task_name.toLowerCase().includes('forend iron')
      )
    ).toBe(true);
  });

  test('detects Modern In-Line Muzzleloader profile for CVA Optima 209', () => {
    const cvaOptima: Partial<Firearm> = {
      make: 'CVA',
      model: 'Optima V2 Muzzleloader',
      caliber: '.50 Caliber',
      action_type: 'Muzzleloader (In-Line 209 Primer)',
    };
    const profile = detectFirearmScheduleProfile(cvaOptima);
    expect(profile.id).toBe('muzzleloader_inline');
    expect(profile.tasks.some((t) => t.task_name.toLowerCase().includes('breech plug'))).toBe(true);
  });

  test('detects Traditional Muzzleloader profile for Flintlock and Percussion Cap guns', () => {
    const hawken: Partial<Firearm> = {
      make: 'Thompson/Center',
      model: 'Hawken Flintlock Rifle',
      caliber: '.50 Caliber',
      action_type: 'Muzzleloader (Flintlock)',
    };
    const profile = detectFirearmScheduleProfile(hawken);
    expect(profile.id).toBe('muzzleloader_traditional');
    expect(
      profile.tasks.some(
        (t) =>
          t.task_name.toLowerCase().includes('frizzen') ||
          t.task_name.toLowerCase().includes('soapy water')
      )
    ).toBe(true);
  });
});
