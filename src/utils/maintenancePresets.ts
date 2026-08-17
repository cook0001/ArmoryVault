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

  // 1. Pump Action
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

  // 2. Revolver
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

  // 3. Lever Action
  if (
    action.includes('lever') || 
    text.includes('lever action') || 
    text.includes('marlin') || 
    text.includes('henry') || 
    text.includes('winchester 94') || 
    text.includes('1895') || 
    text.includes('30-30') || 
    text.includes('45-70')
  ) {
    return MAINTENANCE_PROFILES.lever_action;
  }

  // 4. Break Action (O/U, SxS)
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

  // 5. Bolt Action
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

  // 6. Semi-Auto Shotgun
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

  // 7. Semi-Auto Rifle (AR-15 / AK / PCC)
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
