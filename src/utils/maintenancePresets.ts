import { Firearm, MaintenanceScheduleItem } from '../types';

export interface MaintenancePresetTask {
  task_name: string;
  interval_rounds: number;
  interval_days?: number;
  notes?: string;
}

export interface MaintenanceProfile {
  id: string;
  name: string;
  category: string;
  description: string;
  tasks: MaintenancePresetTask[];
}

export const MAINTENANCE_PROFILES: Record<string, MaintenanceProfile> = {
  semi_pistol: {
    id: 'semi_pistol',
    name: 'Semi-Automatic Handgun',
    category: 'Handgun',
    description: 'Striker & Hammer pistols (Glock, Sig Sauer, S&W M&P, 1911, CZ, Beretta)',
    tasks: [
      { task_name: 'Field Strip, Clean & Lube', interval_rounds: 300, interval_days: 90, notes: 'Clean bore, slide rails, breech face, and apply lubrication to friction points.' },
      { task_name: 'Replace Recoil Spring Assembly', interval_rounds: 3000, interval_days: 365, notes: 'Prevents frame battering and ensures consistent slide velocity.' },
      { task_name: 'Replace Extractor & Plunger Spring', interval_rounds: 5000, notes: 'Maintains positive casing extraction and prevents stovepipe malfunctions.' },
      { task_name: 'Inspect Striker / Firing Pin & Spring', interval_rounds: 10000, interval_days: 730, notes: 'Inspect firing pin tip wear, channel cleanliness, and spring fatigue.' },
      { task_name: 'Magazine Spring Inspection', interval_rounds: 5000, interval_days: 365, notes: 'Verify magazine feed lip spacing and replace weakened magazine springs.' }
    ]
  },
  pump_action: {
    id: 'pump_action',
    name: 'Pump Action (Shotgun / Rifle)',
    category: 'Shotgun / Rifle',
    description: 'Pump/slide actions (Remington 870, Mossberg 500/590, Benelli Nova, Winchester SXP)',
    tasks: [
      { task_name: 'Bore Clean, Action Bar & Bolt Lube', interval_rounds: 500, notes: 'Clean barrel, chamber, bolt lugs, and lubricate dual action slide bars.' },
      { task_name: 'Clean Magazine Tube, Spring & Follower', interval_rounds: 1000, notes: 'Remove fouling and debris inside mag tube to prevent binding.' },
      { task_name: 'Inspect / Replace Extractor & Spring', interval_rounds: 3000, notes: 'Check extractor claw sharpness and spring tension against rim.' },
      { task_name: 'Inspect Firing Pin & Retaining Pin', interval_rounds: 5000, notes: 'Inspect for firing pin tip erosion and firing pin return spring condition.' },
      { task_name: 'Replace Magazine Tube Spring', interval_rounds: 5000, notes: 'Ensures positive shell feeding from the tubular magazine.' }
    ]
  },
  semi_rifle: {
    id: 'semi_rifle',
    name: 'Semi-Automatic Rifle (AR-15 / AK / PCC)',
    category: 'Rifle',
    description: 'Direct impingement, gas piston, and blowback carbines (AR-15, AR-10, AK-47, PCC)',
    tasks: [
      { task_name: 'Clean BCG, Chamber & Gas System', interval_rounds: 300, notes: 'Clean bolt carrier group, carbon on bolt tail, chamber star, and gas key.' },
      { task_name: 'Replace Gas Rings & Extractor Insert/O-Ring', interval_rounds: 3000, notes: 'Ensures gas seal and strong extraction claw tension.' },
      { task_name: 'Replace Buffer / Action Spring', interval_rounds: 5000, notes: 'Restores proper buffer return rate and prevents carrier bounce.' },
      { task_name: 'Inspect / Replace Extractor & Ejector Springs', interval_rounds: 5000, notes: 'Check ejector plunger spring and extractor claw wear.' },
      { task_name: 'Replace Complete Bolt Assembly', interval_rounds: 10000, notes: 'Prevents bolt lug shear and maintains proper headspace.' }
    ]
  },
  semi_shotgun: {
    id: 'semi_shotgun',
    name: 'Semi-Automatic Shotgun',
    category: 'Shotgun',
    description: 'Gas & inertia auto-loaders (Beretta A300/A400, Benelli M2/M4, Mossberg 930/940, Remington 1100)',
    tasks: [
      { task_name: 'Clean Gas Piston / Inertia System & Choke Threads', interval_rounds: 300, notes: 'Prevent carbon fouling buildup in gas cylinder or inertia block, and grease choke threads.' },
      { task_name: 'Clean Magazine Tube & Action Bar Guide', interval_rounds: 1000, notes: 'Ensure smooth cycling and clean guide surfaces.' },
      { task_name: 'Replace Action / Recoil Spring', interval_rounds: 3000, notes: 'Maintains proper bolt closure against heavy magnum or light target loads.' },
      { task_name: 'Replace Gas Piston O-Rings & Extractor', interval_rounds: 4000, notes: 'Prevents gas leaks and cycling failures.' },
      { task_name: 'Replace Magazine Spring & Follower', interval_rounds: 5000, notes: 'Prevents shell feed hang-ups.' }
    ]
  },
  bolt_action: {
    id: 'bolt_action',
    name: 'Bolt Action Rifle',
    category: 'Rifle',
    description: 'Precision and hunting bolt guns (Remington 700, Tikka T3x, Savage 110, Ruger American)',
    tasks: [
      { task_name: 'Bore Cleaning & Action Wipe Down', interval_rounds: 150, notes: 'Clean rifling lands, throat, and lightly lube bolt body and locking lugs.' },
      { task_name: 'Disassemble, Clean & Degrease Bolt Internals', interval_rounds: 1000, notes: 'Clean firing pin channel, spring, and shroud threads.' },
      { task_name: 'Action Screw Torque & Bedding Check', interval_rounds: 1000, notes: 'Verify action screws torqued to manufacturer spec for consistent harmonics.' },
      { task_name: 'Inspect / Replace Extractor & Plunger Ejector', interval_rounds: 3000, notes: 'Check ejector spring tension and extractor edge.' },
      { task_name: 'Headspace & Throat Erosion Check', interval_rounds: 3000, notes: 'Measure rifling throat wear and chamber headspace.' }
    ]
  },
  revolver: {
    id: 'revolver',
    name: 'Revolver (Double / Single Action)',
    category: 'Handgun',
    description: 'Revolvers (S&W 686, Ruger GP100/Blackhawk, Colt Python, Taurus)',
    tasks: [
      { task_name: 'Cylinder & Bore Clean, Remove Lead/Carbon Rings', interval_rounds: 300, notes: 'Clean cylinder charge holes, forcing cone, and top strap.' },
      { task_name: 'Check Cylinder Gap, Timing & Endshake', interval_rounds: 1000, notes: 'Verify barrel-cylinder gap (.004-.008") and lockup timing on all chambers.' },
      { task_name: 'Deep Clean Ejector Star & Crane Assembly', interval_rounds: 1500, notes: 'Clean under ejector star to prevent cylinder binding.' },
      { task_name: 'Mainspring & Rebound Spring Inspection', interval_rounds: 5000, notes: 'Ensure consistent primer ignition and positive trigger return.' },
      { task_name: 'Clean & Lubricate Internal Lockwork', interval_rounds: 5000, notes: 'Clean hammer sear, trigger, and cylinder hand.' }
    ]
  },
  lever_action: {
    id: 'lever_action',
    name: 'Lever Action Rifle',
    category: 'Rifle',
    description: 'Marlin 1895/336, Winchester 1894, Henry Big Boy',
    tasks: [
      { task_name: 'Bore & Chamber Cleaning, Action Lubrication', interval_rounds: 300, notes: 'Clean chamber, bore, and lube lever pivots.' },
      { task_name: 'Clean Magazine Tube, Spring & Loading Gate', interval_rounds: 1000, notes: 'Prevent binding of tubular feed spring and follower.' },
      { task_name: 'Disassemble & Clean Lever, Carrier & Bolt', interval_rounds: 2000, notes: 'Remove unburned powder from carrier and locking lugs.' },
      { task_name: 'Inspect Extractor, Ejector & Lever Linkage Screws', interval_rounds: 3000, notes: 'Check screw tightness and extractor tension.' },
      { task_name: 'Replace Tubular Magazine Spring', interval_rounds: 5000, notes: 'Ensure positive feeding into the carrier.' }
    ]
  },
  break_action: {
    id: 'break_action',
    name: 'Break Action (Over/Under, Side-by-Side)',
    category: 'Shotgun / Rifle',
    description: 'Over/Under, Side-by-Side, and Single Shot shotguns & rifles (Browning Citori, Beretta 686)',
    tasks: [
      { task_name: 'Bore Cleaning & Choke Tube Lubrication', interval_rounds: 300, notes: 'Clean bores, ejector faces, and apply anti-seize to choke threads.' },
      { task_name: 'Clean & Grease Hinge Pin, Trunnions & Forend Iron', interval_rounds: 500, notes: 'Apply heavy gun grease to high-pressure bearing surfaces.' },
      { task_name: 'Inspect & Clean Ejector / Extractor Slides', interval_rounds: 1500, notes: 'Clean automatic ejector trip rods and springs.' },
      { task_name: 'Inspect Firing Pins & Return Springs', interval_rounds: 5000, notes: 'Check for pitted firing pin tips and weak return springs.' },
      { task_name: 'Inspect Lockup Tightness & Top Lever Position', interval_rounds: 5000, notes: 'Verify locking bolt engagement and bite.' }
    ]
  },
  m1_garand: {
    id: 'm1_garand',
    name: 'M1 Garand & Surplus Gas Rifles',
    category: 'Vintage / Surplus',
    description: 'M1 Garand (.30-06 / .308), SKS, SVT-40, FN49 gas-operated military surplus',
    tasks: [
      { task_name: 'Bore, Chamber & Gas Cylinder Clean / Corrosive Flush', interval_rounds: 250, interval_days: 60, notes: 'Clean bore from muzzle using brass bore guide. Clean gas cylinder and piston. If shooting surplus ammo, flush with hot water/solvent immediately to dissolve corrosive salts.' },
      { task_name: 'Lubriplate / High-Temp Synthetic Grease Application', interval_rounds: 500, interval_days: 90, notes: 'Apply Lubriplate 130A / synthetic grease to bolt lugs, op-rod cam track, receiver slide grooves, hammer hooks, and bullet guide. Never run M1 Garands dry!' },
      { task_name: 'Op-Rod Tilt Test & Op-Rod Spring Length Check', interval_rounds: 1500, interval_days: 365, notes: 'Verify op-rod moves freely at 45° tilt without stock drag. Measure op-rod spring free length (standard min 19.5", replace if under 19.5" to avoid cracked receiver heels).' },
      { task_name: 'Clip Latch, Clip Ejector & Bullet Guide Inspection', interval_rounds: 3000, interval_days: 730, notes: 'Inspect en-bloc clip latch pin wear, accelerator tab, and ejector spring tension to prevent 7th round stoppage or premature clip ejection.' },
      { task_name: 'Gas Cylinder, Throat (TE) & Muzzle Wear (MW) Gauge', interval_rounds: 3000, interval_days: 730, notes: 'Check gas cylinder internal diameter (< 0.532"). Measure throat erosion (TE) and muzzle wear (MW) with armorer plug gauges.' },
      { task_name: 'Stock Lockup & Linseed Oil Conditioning', interval_rounds: 2000, interval_days: 180, notes: 'Inspect front handguard clearance (prevent barrel binding) and condition walnut stock with pure tung oil or boiled linseed oil (BLO).' }
    ]
  },
  m1_carbine: {
    id: 'm1_carbine',
    name: 'M1 Carbine & Short-Stroke Gas Carbines',
    category: 'Vintage / Surplus',
    description: 'M1 / M2 Carbine (.30 Carbine - Inland, Winchester, Underwood, Rock-Ola, NPM, Quality Hardware)',
    tasks: [
      { task_name: 'Bore Clean, Bolt & Slide Rail Lubrication', interval_rounds: 300, interval_days: 90, notes: 'Clean bore from breech or with crown guard. Lightly lube slide handle track and bolt lugs with light grease/CLP.' },
      { task_name: 'Gas Tappet Piston Free-Movement Check (Keep Dry)', interval_rounds: 600, interval_days: 180, notes: 'Verify short-stroke gas piston moves freely inside cylinder nut. Keep dry or clean with evaporating solvent; excess oil burns into carbon fouling and jams piston.' },
      { task_name: 'Replace Recoil Spring & Operating Slide Spring', interval_rounds: 2500, interval_days: 365, notes: 'Replace primary recoil spring (standard min 10.25", replace if compressed < 9.75") to prevent bolt bounce and feeding failures.' },
      { task_name: 'Magazine Catch & Feed Lip Tension Inspection', interval_rounds: 1500, interval_days: 365, notes: 'Inspect mag catch plunger and feed lips. M1 Carbines are prone to feeding failures if mag catch is worn or mag springs weaken.' },
      { task_name: 'Bolt Disassembly, Extractor & Ejector Springs', interval_rounds: 4000, interval_days: 730, notes: 'Use M1 Carbine bolt tool to disassemble bolt. Clean firing pin channel and replace extractor spring/ejector plunger spring.' }
    ]
  },
  vintage_bolt_crf: {
    id: 'vintage_bolt_crf',
    name: 'Vintage Military CRF Bolt Action',
    category: 'Vintage / Surplus',
    description: 'Controlled-round-feed service rifles (Springfield M1903/M1903A3, Mauser K98k, Lee-Enfield, Mosin-Nagant, Swiss K31, Arisaka)',
    tasks: [
      { task_name: 'Bore Decontamination & Action Wipe Down', interval_rounds: 200, interval_days: 60, notes: 'Clean rifling from breech with bore guide. If shooting surplus military ammo, rinse bore and bolt face with hot water/solvent to dissolve primer salts.' },
      { task_name: 'Disassemble Striker & Bolt Internals Deep Clean', interval_rounds: 1000, interval_days: 365, notes: 'Disassemble bolt sleeve and striker assembly. Remove hardened cosmoline or varnish. Inspect mainspring length and firing pin protrusion (.055"-.065").' },
      { task_name: 'Claw Extractor & Spring Collar Tension Check', interval_rounds: 2000, interval_days: 730, notes: 'Inspect non-rotating Mauser claw extractor lip for chips or rounding. Ensure extractor collar snaps firmly. Never single-load direct into chamber over the claw!' },
      { task_name: 'Guard Screws & Stock Band Torque / Harmonic Check', interval_rounds: 1000, interval_days: 180, notes: 'Torque front/rear action screws to 35-45 in-lbs. Check front barrel band and handguard tension for consistent barrel harmonics.' },
      { task_name: 'Headspace & Throat Erosion (TE) Verification', interval_rounds: 3000, interval_days: 730, notes: 'Verify headspace with precision GO and FIELD gauges. Measure throat wear.' },
      { task_name: 'Wood Stock Conditioning & Moisture Barrier', interval_rounds: 2000, interval_days: 180, notes: 'Apply thin coat of Raw/Boiled Linseed Oil or Renaissance Wax to wood furniture and metal surfaces to prevent rust and wood shrinkage in storage.' }
    ]
  },
  vintage_box_lever: {
    id: 'vintage_box_lever',
    name: 'Vintage Box-Magazine Lever Action',
    category: 'Vintage / Hunting',
    description: 'Box-magazine lever actions (Winchester Model 1895, Savage Model 99, Browning BLR)',
    tasks: [
      { task_name: 'Chamber & Bore Clean, Action Pivot Lubrication', interval_rounds: 250, interval_days: 90, notes: 'Clean chamber throat and bore from muzzle with brass guide. Apply high-pressure gun grease to vertical locking bolts and lever pivot pins.' },
      { task_name: 'Box Magazine Spring & Follower Clean', interval_rounds: 1000, interval_days: 365, notes: 'Clean integral box magazine. Inspect spring tension and follower movement to ensure smooth feeding of pointed/spitzer high-power cartridges (.30-06, .30-40 Krag, 7.62x54R, .405 Win).' },
      { task_name: 'Tang Screws & Buttstock Wrist Torque Check', interval_rounds: 500, interval_days: 180, notes: 'Check upper and lower tang screws. Heavy-recoil Model 1895s can split the stock wrist if tang screws work loose.' },
      { task_name: 'Vertical Locking Bolt & Extractor Inspection', interval_rounds: 2500, interval_days: 730, notes: 'Inspect dual vertical locking bolts for uniform mortise contact. Check top-ejector spring and extractor hook for positive casing extraction.' },
      { task_name: 'Finger Lever Linkage & Pin Wear Inspection', interval_rounds: 4000, interval_days: 1095, notes: 'Inspect finger lever link, pivot pins, and lever latch spring for excessive play or slop during cycling.' },
      { task_name: 'Walnut Stock Conditioning & Rust Barrier', interval_rounds: 2000, interval_days: 180, notes: 'Condition stock with Linseed Oil/Tung Oil and apply microcrystalline wax or CLP rust inhibitor to blued carbon steel surfaces.' }
    ]
  }
};

/**
 * Detects the best maintenance profile based on action_type, caliber, make, and model.
 */
export function detectFirearmScheduleProfile(firearm: Partial<Firearm>): MaintenanceProfile {
  const action = (firearm.action_type || '').toLowerCase();
  const make = (firearm.make || '').toLowerCase();
  const model = (firearm.model || '').toLowerCase();
  const caliber = (firearm.caliber || '').toLowerCase();
  const text = `${action} ${make} ${model} ${caliber}`.toLowerCase();

  // 1. M1 Garand
  if (
    text.includes('garand') || 
    text.includes('m1 garand') || 
    text.includes('svt-40') || 
    text.includes('svt40') || 
    text.includes('fn49') || 
    text.includes('fn-49') || 
    text.includes('sks')
  ) {
    return MAINTENANCE_PROFILES.m1_garand;
  }

  // 2. M1 Carbine
  if (
    text.includes('m1 carbine') || 
    text.includes('m2 carbine') || 
    (text.includes('carbine') && (text.includes('.30 carbine') || text.includes('inland') || text.includes('rock-ola') || text.includes('underwood') || text.includes('postal meter') || text.includes('universal carbine')))
  ) {
    return MAINTENANCE_PROFILES.m1_carbine;
  }

  // 3. Vintage Box-Magazine Lever Action (Winchester 1895, Savage 99)
  if (
    text.includes('1895') || 
    text.includes('winchester 1895') || 
    text.includes('model 1895') || 
    text.includes('savage 99') || 
    text.includes('model 99')
  ) {
    return MAINTENANCE_PROFILES.vintage_box_lever;
  }

  // 4. Vintage Military Controlled-Round-Feed Bolt Action (1903, 1903A3, Mauser, Mosin, Enfield, K31)
  if (
    text.includes('1903') || 
    text.includes('1903a3') || 
    text.includes('03a3') || 
    text.includes('springfield 1903') || 
    text.includes('k98') || 
    text.includes('kar98') || 
    text.includes('gewehr') || 
    text.includes('mauser 98') || 
    text.includes('enfield') || 
    text.includes('smle') || 
    text.includes('no. 4') || 
    text.includes('no. 1 mk') || 
    text.includes('mosin') || 
    text.includes('nagant') || 
    text.includes('k31') || 
    text.includes('schmidt-rubin') || 
    text.includes('arisaka') || 
    text.includes('carcano') || 
    text.includes('m39') || 
    text.includes('m1917') || 
    text.includes('krag')
  ) {
    return MAINTENANCE_PROFILES.vintage_bolt_crf;
  }

  // 5. Pump Action
  if (
    action.includes('pump') || 
    text.includes('pump action') || 
    text.includes('870') || 
    text.includes('500') || 
    text.includes('590') || 
    text.includes('nova') || 
    text.includes('supernova') || 
    text.includes('ksg') ||
    text.includes('mossberg 590') ||
    text.includes('remington 870')
  ) {
    return MAINTENANCE_PROFILES.pump_action;
  }

  // 6. Revolver
  if (
    action.includes('revolver') || 
    text.includes('revolver') || 
    text.includes('python') || 
    text.includes('686') || 
    text.includes('gp100') || 
    text.includes('blackhawk') || 
    text.includes('sp101') || 
    text.includes('single six') ||
    (action.includes('single action') && (caliber.includes('.357') || caliber.includes('.44') || caliber.includes('.45 colt')))
  ) {
    return MAINTENANCE_PROFILES.revolver;
  }

  // 7. Lever Action (Tubular)
  if (
    action.includes('lever') || 
    text.includes('lever action') || 
    text.includes('marlin') || 
    text.includes('henry') || 
    text.includes('winchester 94') || 
    text.includes('30-30') || 
    text.includes('45-70')
  ) {
    return MAINTENANCE_PROFILES.lever_action;
  }

  // 8. Break Action (O/U, SxS)
  if (
    action.includes('break') || 
    text.includes('break action') || 
    text.includes('over/under') || 
    text.includes('side by side') || 
    text.includes('citori') || 
    text.includes('silver pigeon') ||
    text.includes('over and under')
  ) {
    return MAINTENANCE_PROFILES.break_action;
  }

  // 9. Modern Bolt Action
  if (
    action.includes('bolt') || 
    text.includes('bolt action') || 
    text.includes('remington 700') || 
    text.includes('tikka') || 
    text.includes('t3x') || 
    text.includes('savage 110') || 
    text.includes('ruger american') ||
    text.includes('bergara')
  ) {
    return MAINTENANCE_PROFILES.bolt_action;
  }

  // 10. Semi-Auto Shotgun
  const isShotgunCaliber = caliber.includes('ga') || caliber.includes('gauge') || caliber.includes('12') || caliber.includes('20') || caliber.includes('.410');
  if (
    (action.includes('semi') || text.includes('semi-automatic')) && isShotgunCaliber ||
    text.includes('a300') || 
    text.includes('a400') || 
    text.includes('benelli m4') || 
    text.includes('benelli m2') || 
    text.includes('remington 1100') || 
    text.includes('mossberg 930') || 
    text.includes('mossberg 940')
  ) {
    return MAINTENANCE_PROFILES.semi_shotgun;
  }

  // 11. Modern Semi-Auto Rifle (AR-15 / AK / PCC)
  if (
    text.includes('ar-15') || 
    text.includes('ar-10') || 
    (text.includes('m4') && !isShotgunCaliber) || 
    text.includes('ak-47') || 
    text.includes('ak-74') || 
    text.includes('5.56') || 
    text.includes('.223') || 
    text.includes('7.62x39') || 
    text.includes('300 blk') || 
    text.includes('6.5 creed') || 
    (text.includes('.308') && (action.includes('semi') || text.includes('gas') || text.includes('piston'))) || 
    text.includes('galil') || 
    text.includes('scar') || 
    text.includes('tavor') || 
    text.includes('mpx') || 
    text.includes('scorpion') || 
    text.includes('sp5') || 
    text.includes('mp5') ||
    text.includes('ruger pcc')
  ) {
    return MAINTENANCE_PROFILES.semi_rifle;
  }

  // Default to semi-auto handgun
  return MAINTENANCE_PROFILES.semi_pistol;
}

/**
 * Builds schedule items for a firearm based on a chosen or detected profile.
 */
export function createScheduleItemsFromProfile(profile: MaintenanceProfile, baselineRounds: number): MaintenanceScheduleItem[] {
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();
  return profile.tasks.map((task, idx) => ({
    id: `sched_${profile.id}_${now}_${idx}`,
    task_name: task.task_name,
    interval_rounds: task.interval_rounds,
    interval_days: task.interval_days,
    last_performed_rounds: baselineRounds,
    last_performed_date: today,
    notes: task.notes
  }));
}
