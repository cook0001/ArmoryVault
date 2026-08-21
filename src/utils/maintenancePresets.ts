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
  // 1. Semi-Automatic Handgun
  semi_pistol: {
    id: 'semi_pistol',
    name: 'Semi-Automatic Handgun',
    category: 'Handgun',
    description:
      'Short recoil, striker & hammer pistols (Glock, Sig Sauer P320/P226, 1911, S&W M&P, CZ 75, Beretta 92)',
    tasks: [
      {
        task_name: 'Field Strip, Clean & Lube',
        interval_rounds: 300,
        interval_days: 90,
        notes: 'Clean bore, slide rails, breech face, and apply lubrication to friction points.',
      },
      {
        task_name: 'Replace Recoil Spring Assembly',
        interval_rounds: 3000,
        interval_days: 365,
        notes: 'Prevents frame battering and ensures consistent slide velocity.',
      },
      {
        task_name: 'Replace Extractor & Plunger Spring',
        interval_rounds: 5000,
        notes: 'Maintains positive casing extraction and prevents stovepipe malfunctions.',
      },
      {
        task_name: 'Inspect Striker / Firing Pin & Spring',
        interval_rounds: 10000,
        interval_days: 730,
        notes: 'Inspect firing pin tip wear, channel cleanliness, and spring fatigue.',
      },
      {
        task_name: 'Magazine Spring Inspection',
        interval_rounds: 5000,
        interval_days: 365,
        notes: 'Verify magazine feed lip spacing and replace weakened magazine springs.',
      },
    ],
  },

  // 2. Direct Impingement Semi-Auto Rifle
  semi_rifle: {
    id: 'semi_rifle',
    name: 'Semi-Automatic Rifle (Direct Impingement)',
    category: 'Rifle',
    description:
      'Direct gas impingement carbines and precision rifles (AR-15, AR-10, M4, M16, MK12, MK18)',
    tasks: [
      {
        task_name: 'Clean BCG, Chamber Star & Gas Key',
        interval_rounds: 300,
        interval_days: 90,
        notes:
          'Clean bolt carrier group, carbon on bolt tail, chamber star, and inspect gas key staking.',
      },
      {
        task_name: 'Replace Gas Rings & Extractor Insert/O-Ring',
        interval_rounds: 3000,
        notes: 'Ensures gas seal and strong extraction claw tension under rapid fire.',
      },
      {
        task_name: 'Replace Buffer / Action Spring',
        interval_rounds: 5000,
        interval_days: 730,
        notes: 'Restores proper buffer return rate and prevents carrier bounce.',
      },
      {
        task_name: 'Inspect / Replace Extractor & Ejector Plunger Springs',
        interval_rounds: 5000,
        notes: 'Check ejector plunger spring tension and extractor claw sharpness.',
      },
      {
        task_name: 'Bolt Assembly MPI & Lug Shear Inspection',
        interval_rounds: 10000,
        notes: 'Inspect bolt locking lugs for micro-cracks and verify chamber headspace.',
      },
    ],
  },

  // 3. Gas Piston Semi-Auto Rifle
  semi_piston_rifle: {
    id: 'semi_piston_rifle',
    name: 'Semi-Automatic Rifle (Gas Piston)',
    category: 'Rifle',
    description:
      'Long-stroke & short-stroke gas piston rifles (AK-47 / AK-74, FN SCAR, IWI Tavor, Galil ACE, CZ Bren 2, HK416, SIG MCX)',
    tasks: [
      {
        task_name: 'Clean Piston Head, Gas Regulator & Chamber',
        interval_rounds: 300,
        interval_days: 90,
        notes:
          'Scrape carbon from gas piston face, clean gas port/regulator vents, and chamber throat.',
      },
      {
        task_name: 'Piston Shaft, Guide Rod & Op-Rod Spring Inspection',
        interval_rounds: 3000,
        interval_days: 365,
        notes:
          'Check piston shaft straightness, gas cup seal, and operating rod return spring tension.',
      },
      {
        task_name: 'Replace Recoil Spring Assembly',
        interval_rounds: 5000,
        interval_days: 730,
        notes:
          'Maintains proper bolt velocity and protects rear receiver trunnion from excessive impact.',
      },
      {
        task_name: 'Replace Extractor Claw & Spring',
        interval_rounds: 5000,
        notes: 'Ensures positive extraction of steel and brass cases.',
      },
      {
        task_name: 'Bolt Carrier Locking Lugs & Trunnion Check',
        interval_rounds: 10000,
        notes:
          'Inspect bolt locking lugs and receiver trunnion locking recesses for peening or deformation.',
      },
    ],
  },

  // 4. Delayed Blowback
  semi_roller_delayed: {
    id: 'semi_roller_delayed',
    name: 'Delayed Blowback (Roller, Radial & Lever)',
    category: 'Rifle / Subgun',
    description:
      'Roller-delayed, radial-delayed, & lever-delayed systems (HK MP5 / SP5, HK91 / G3, HK93, CMMG Banshee, FAMAS)',
    tasks: [
      {
        task_name: 'Clean Fluted Chamber, Bolt Head & Locking Piece',
        interval_rounds: 300,
        interval_days: 90,
        notes:
          'Use chamber fluting brush with solvent to clean carbon flutes. Clean locking piece and roller windows.',
      },
      {
        task_name: 'Measure Bolt Gap with Feeler Gauges (.010"-.018")',
        interval_rounds: 1000,
        interval_days: 180,
        notes:
          'Measure gap between bolt head and bolt carrier with action uncocked. Adjust roller sizes (-2/+2) if out of spec.',
      },
      {
        task_name: 'Replace Roller Retainer Plate Spring & Rollers',
        interval_rounds: 3000,
        notes: 'Maintains proper roller retention and prevents bolt head binding in trunnion.',
      },
      {
        task_name: 'Replace Copper Extractor Spring',
        interval_rounds: 3000,
        notes:
          'HK extractor springs fatigue under high-pressure cycling; replace promptly if extraction weakens.',
      },
      {
        task_name: 'Replace Recoil Spring Guide Rod Assembly',
        interval_rounds: 5000,
        interval_days: 730,
        notes: 'Ensures consistent bolt return rate and proper lockup timing.',
      },
    ],
  },

  // 5. Direct Blowback PCC & Carbine
  semi_direct_blowback: {
    id: 'semi_direct_blowback',
    name: 'Direct Blowback PCC & Carbine',
    category: 'Rifle / Subgun',
    description:
      'Heavy bolt mass direct blowback pistol caliber carbines (Ruger PC Carbine, CZ Scorpion Evo 3, Stribog, Sub-2000)',
    tasks: [
      {
        task_name: 'Clean Heavy Bolt Mass, Chamber & Receiver Tracks',
        interval_rounds: 300,
        interval_days: 90,
        notes:
          'Direct blowback produces heavy carbon fouling; clean bolt face, tungsten weight, and receiver channels.',
      },
      {
        task_name: 'Inspect Receiver Buffer Pad / Shock Absorber',
        interval_rounds: 1500,
        interval_days: 365,
        notes: 'Inspect polymer recoil buffer block for cracking, gouging, or compression.',
      },
      {
        task_name: 'Replace Heavy Recoil Spring',
        interval_rounds: 3000,
        interval_days: 365,
        notes: 'Heavy bolt masses accelerate spring fatigue; replace to prevent receiver pounding.',
      },
      {
        task_name: 'Replace Extractor Hook & Spring',
        interval_rounds: 4000,
        notes: 'Check extractor hook sharpness and replace spring to maintain casing grip.',
      },
      {
        task_name: 'Ejector Bar Alignment & Screw Torque Check',
        interval_rounds: 5000,
        notes: 'Verify ejector blade is securely fastened and properly aligned with bolt slot.',
      },
    ],
  },

  // 6. Semi-Automatic Shotgun
  semi_shotgun: {
    id: 'semi_shotgun',
    name: 'Semi-Automatic Shotgun (Gas & Inertia)',
    category: 'Shotgun',
    description:
      'Gas & inertia auto-loaders (Beretta A300/A400, Benelli M2/M4, Mossberg 930/940, Remington 1100)',
    tasks: [
      {
        task_name: 'Clean Gas Piston / Inertia System & Choke Threads',
        interval_rounds: 300,
        interval_days: 90,
        notes:
          'Prevent carbon fouling buildup in gas cylinder or inertia block, and grease choke threads.',
      },
      {
        task_name: 'Clean Magazine Tube & Action Bar Guide',
        interval_rounds: 1000,
        notes: 'Ensure smooth cycling and clean guide surfaces.',
      },
      {
        task_name: 'Replace Action / Recoil Spring (Buttstock)',
        interval_rounds: 3000,
        interval_days: 730,
        notes: 'Maintains proper bolt closure against heavy magnum or light target loads.',
      },
      {
        task_name: 'Replace Gas Piston O-Rings & Extractor',
        interval_rounds: 4000,
        notes: 'Prevents gas leaks and cycling failures.',
      },
      {
        task_name: 'Replace Magazine Spring & Follower',
        interval_rounds: 5000,
        notes: 'Prevents shell feed hang-ups.',
      },
    ],
  },

  // 7. Modern Bolt Action Rifle
  bolt_action: {
    id: 'bolt_action',
    name: 'Modern Bolt Action (Push Feed & CRF)',
    category: 'Rifle',
    description:
      'Hunting & precision turn-bolt rifles (Remington 700, Tikka T3x, Savage 110, Ruger American, Bergara B-14)',
    tasks: [
      {
        task_name: 'Bore Cleaning & Bolt Lug Lubrication',
        interval_rounds: 150,
        interval_days: 90,
        notes:
          'Clean rifling lands, throat, and apply high-pressure grease to rear faces of bolt locking lugs.',
      },
      {
        task_name: 'Disassemble, Clean & Degrease Bolt Internals',
        interval_rounds: 1000,
        interval_days: 365,
        notes: 'Clean firing pin channel, mainspring, and bolt shroud threads.',
      },
      {
        task_name: 'Action Screw Torque & Bedding Check',
        interval_rounds: 1000,
        interval_days: 180,
        notes:
          'Verify action screws torqued to manufacturer spec (35-65 in-lbs) for consistent barrel harmonics.',
      },
      {
        task_name: 'Inspect / Replace Extractor & Plunger Ejector',
        interval_rounds: 3000,
        notes: 'Check ejector plunger spring tension and extractor claw edge.',
      },
      {
        task_name: 'Headspace & Throat Erosion (TE) Check',
        interval_rounds: 3000,
        interval_days: 730,
        notes: 'Measure rifling throat erosion and verify chamber headspace with GO/NO-GO gauges.',
      },
    ],
  },

  // 8. Straight-Pull Bolt Action
  straight_pull_bolt: {
    id: 'straight_pull_bolt',
    name: 'Straight-Pull Bolt Action',
    category: 'Rifle',
    description:
      'Linear camming & collet-locking bolt rifles (Blaser R8, Browning Maral, Savage Impulse, Schmidt-Rubin K31, Heym SR30)',
    tasks: [
      {
        task_name: 'Bore Clean, Linear Rails & Bolt Carrier Wipe',
        interval_rounds: 200,
        interval_days: 90,
        notes:
          'Clean bore and wipe linear receiver guide rails. Lightly lubricate carrier bearing surfaces.',
      },
      {
        task_name: 'Collet Locking Segments / Radial Head Deep Clean',
        interval_rounds: 1000,
        interval_days: 365,
        notes:
          'Deep clean expanding collet locking segments or rotating bolt head teeth to ensure instant radial lockup.',
      },
      {
        task_name: 'Cam Track & Cross-Bolt Pivot Greasing',
        interval_rounds: 1000,
        interval_days: 180,
        notes:
          'Apply synthetic grease to bolt handle linear-to-rotary camming surfaces and pivot pins.',
      },
      {
        task_name: 'Barrel Clamping Screw Torque Verification',
        interval_rounds: 1500,
        interval_days: 180,
        notes:
          'Verify interchangeable barrel hex clamping screws are torqued evenly to spec (e.g. 3.5-5.0 Nm on Blaser).',
      },
      {
        task_name: 'Striker Spring Length & Firing Pin Protrusion',
        interval_rounds: 3000,
        interval_days: 730,
        notes: 'Inspect linear striker spring free length and verify firing pin protrusion.',
      },
    ],
  },

  // 9. Bolt Action Single Shot Target / Match
  bolt_action_target: {
    id: 'bolt_action_target',
    name: 'Bolt Action Single Shot Target / Match',
    category: 'Rifle / Competition',
    description:
      'Solid-bottom match & benchrest single-shot bolt rifles (Remington 40-X, Anschütz 54/64 Match, Savage 12/112 Target, Cooper 21)',
    tasks: [
      {
        task_name: 'Match Bore Clean & Crown Inspection',
        interval_rounds: 100,
        interval_days: 60,
        notes:
          'Clean bore from breech with bore guide using brass jag. Inspect target recessed 11° crown with loupe.',
      },
      {
        task_name: 'Loading Ramp & Single-Feed Tray Clean',
        interval_rounds: 500,
        notes: 'Remove unburnt powder and debris from solid-bottom integral feed ramp.',
      },
      {
        task_name: 'Match Trigger Sear & Dust Blow-Out',
        interval_rounds: 1000,
        interval_days: 180,
        notes:
          'Blow out match trigger housing (2 oz - 2 lbs) with compressed air. Keep dry or use evaporating dry lube; never use heavy grease.',
      },
      {
        task_name: 'Bolt Lug Grease & Striker Assembly Clean',
        interval_rounds: 1000,
        interval_days: 365,
        notes: 'Clean firing pin spring and apply grease to bolt locking lugs and cocking cam.',
      },
      {
        task_name: 'Pillar Bedding & Action Screw Torque Verification',
        interval_rounds: 1000,
        interval_days: 180,
        notes: 'Verify front and rear action screws torqued to match spec (30-45 in-lbs).',
      },
    ],
  },

  // 10. Vintage Military CRF Bolt Action
  vintage_bolt_crf: {
    id: 'vintage_bolt_crf',
    name: 'Vintage Military CRF Bolt Action',
    category: 'Vintage / Surplus',
    description:
      'Controlled-round-feed service rifles (Springfield M1903/M1903A3, Mauser K98k, Lee-Enfield, Mosin-Nagant, Swiss K31, Arisaka, Carcano)',
    tasks: [
      {
        task_name: 'Bore Decontamination & Action Wipe Down',
        interval_rounds: 200,
        interval_days: 60,
        notes:
          'Clean rifling from breech with bore guide. If shooting surplus military ammo, rinse bore and bolt face with hot water/solvent to dissolve primer salts.',
      },
      {
        task_name: 'Disassemble Striker & Bolt Internals Deep Clean',
        interval_rounds: 1000,
        interval_days: 365,
        notes:
          'Disassemble bolt sleeve and striker assembly. Remove hardened cosmoline or varnish. Inspect mainspring length and firing pin protrusion (.055"-.065").',
      },
      {
        task_name: 'Claw Extractor & Spring Collar Tension Check',
        interval_rounds: 2000,
        interval_days: 730,
        notes:
          'Inspect non-rotating Mauser claw extractor lip for chips or rounding. Ensure extractor collar snaps firmly. Never single-load direct into chamber over the claw!',
      },
      {
        task_name: 'Guard Screws & Stock Band Torque / Harmonic Check',
        interval_rounds: 1000,
        interval_days: 180,
        notes:
          'Torque front/rear action screws to 35-45 in-lbs. Check front barrel band and handguard tension for consistent barrel harmonics.',
      },
      {
        task_name: 'Headspace & Throat Erosion (TE) Verification',
        interval_rounds: 3000,
        interval_days: 730,
        notes: 'Verify headspace with precision GO and FIELD gauges. Measure throat wear.',
      },
      {
        task_name: 'Wood Stock Conditioning & Moisture Barrier',
        interval_rounds: 2000,
        interval_days: 180,
        notes:
          'Apply thin coat of Raw/Boiled Linseed Oil or Renaissance Wax to wood furniture and metal surfaces to prevent rust and wood shrinkage in storage.',
      },
    ],
  },

  // 11. Lever Action - Tubular Magazine
  lever_action: {
    id: 'lever_action',
    name: 'Lever Action (Tubular Magazine)',
    category: 'Rifle',
    description:
      'Tubular magazine lever rifles (Marlin 336 / 1895, Winchester 1894 / 1873, Henry Big Boy / Golden Boy)',
    tasks: [
      {
        task_name: 'Bore & Chamber Cleaning, Action Lubrication',
        interval_rounds: 300,
        interval_days: 90,
        notes:
          'Clean chamber, bore, and apply synthetic grease or CLP to lever pivot pins and bolt lugs.',
      },
      {
        task_name: 'Clean Magazine Tube, Spring & Loading Gate',
        interval_rounds: 1000,
        interval_days: 365,
        notes:
          'Remove mag plug, clean carbon inside tubular mag, and inspect loading gate spring tension.',
      },
      {
        task_name: 'Disassemble & Clean Lever, Carrier & Bolt',
        interval_rounds: 2000,
        notes: 'Remove unburned powder from carrier elevator and locking block mortise.',
      },
      {
        task_name: 'Inspect Extractor, Ejector & Lever Linkage Screws',
        interval_rounds: 3000,
        notes: 'Check screw tightness and inspect extractor claw hook for wear.',
      },
      {
        task_name: 'Replace Tubular Magazine Spring',
        interval_rounds: 5000,
        notes: 'Ensures positive cartridge feeding from tube onto carrier elevator.',
      },
    ],
  },

  // 12. Lever Action - Box Magazine & Rotary
  vintage_box_lever: {
    id: 'vintage_box_lever',
    name: 'Lever Action (Box Magazine & Rotary)',
    category: 'Vintage / Hunting',
    description:
      'Box-magazine and rotary lever rifles (Winchester Model 1895, Savage Model 99, Browning BLR)',
    tasks: [
      {
        task_name: 'Chamber & Bore Clean, Action Pivot Lubrication',
        interval_rounds: 250,
        interval_days: 90,
        notes:
          'Clean chamber throat and bore from muzzle with brass guide. Apply high-pressure gun grease to vertical locking bolts and lever pivot pins.',
      },
      {
        task_name: 'Box Magazine Spring & Follower Clean',
        interval_rounds: 1000,
        interval_days: 365,
        notes:
          'Clean integral box magazine. Inspect spring tension and follower movement to ensure smooth feeding of pointed spitzer cartridges.',
      },
      {
        task_name: 'Tang Screws & Buttstock Wrist Torque Check',
        interval_rounds: 500,
        interval_days: 180,
        notes:
          'Check upper and lower tang screws. Heavy-recoil lever guns can split the stock wrist if tang screws work loose.',
      },
      {
        task_name: 'Vertical Locking Bolt & Extractor Inspection',
        interval_rounds: 2500,
        interval_days: 730,
        notes:
          'Inspect vertical locking bolts for uniform mortise contact. Check top-ejector spring and extractor hook for positive casing extraction.',
      },
      {
        task_name: 'Finger Lever Linkage & Pin Wear Inspection',
        interval_rounds: 4000,
        interval_days: 1095,
        notes:
          'Inspect finger lever link, pivot pins, and lever latch spring for excessive play or slop during cycling.',
      },
      {
        task_name: 'Walnut Stock Conditioning & Rust Barrier',
        interval_rounds: 2000,
        interval_days: 180,
        notes:
          'Condition stock with Linseed Oil/Tung Oil and apply microcrystalline wax or CLP rust inhibitor to blued carbon steel surfaces.',
      },
    ],
  },

  // 13. Pump Action Shotgun & Rifle
  pump_action: {
    id: 'pump_action',
    name: 'Pump Action (Shotgun / Rifle)',
    category: 'Shotgun / Rifle',
    description:
      'Slide-action shotguns & rifles (Remington 870 / 7600, Mossberg 500 / 590, Benelli Nova, Winchester SXP)',
    tasks: [
      {
        task_name: 'Bore Clean, Action Bar & Bolt Lube',
        interval_rounds: 500,
        notes: 'Clean barrel, chamber, bolt lugs, and lubricate dual action slide bars.',
      },
      {
        task_name: 'Clean Magazine Tube, Spring & Follower',
        interval_rounds: 1000,
        notes: 'Remove fouling and debris inside mag tube to prevent binding.',
      },
      {
        task_name: 'Inspect / Replace Extractor & Spring',
        interval_rounds: 3000,
        notes: 'Check extractor claw sharpness and spring tension against rim.',
      },
      {
        task_name: 'Inspect Firing Pin & Retaining Pin',
        interval_rounds: 5000,
        notes: 'Inspect for firing pin tip erosion and firing pin return spring condition.',
      },
      {
        task_name: 'Replace Magazine Tube Spring',
        interval_rounds: 5000,
        notes: 'Ensures positive shell feeding from the tubular magazine.',
      },
    ],
  },

  // 14. Revolver - Double Action / Single Action & DAO
  revolver: {
    id: 'revolver',
    name: 'Revolver (Double Action / SA & DAO)',
    category: 'Handgun',
    description:
      'Swing-out cylinder double action revolvers (S&W 686 / Model 10, Ruger GP100 / SP101, Colt Python / King Cobra, Taurus)',
    tasks: [
      {
        task_name: 'Cylinder & Bore Clean, Remove Lead/Carbon Rings',
        interval_rounds: 300,
        notes: 'Clean cylinder charge holes, forcing cone, and top strap.',
      },
      {
        task_name: 'Check Cylinder Gap, Timing & Endshake',
        interval_rounds: 1000,
        notes: 'Verify barrel-cylinder gap (.004-.008") and lockup timing on all chambers.',
      },
      {
        task_name: 'Deep Clean Ejector Star & Crane Assembly',
        interval_rounds: 1500,
        notes: 'Clean under ejector star to prevent cylinder binding.',
      },
      {
        task_name: 'Mainspring & Rebound Spring Inspection',
        interval_rounds: 5000,
        notes: 'Ensure consistent primer ignition and positive trigger return.',
      },
      {
        task_name: 'Clean & Lubricate Internal Lockwork',
        interval_rounds: 5000,
        notes: 'Clean hammer sear, trigger, and cylinder hand.',
      },
    ],
  },

  // 15. Revolver - Single Action Only (Western Gate Load)
  revolver_sa: {
    id: 'revolver_sa',
    name: 'Revolver (Single Action Only / Gate Loading)',
    category: 'Handgun / Western',
    description:
      'Single action loading-gate revolvers (Ruger Blackhawk / Super Blackhawk / Vaquero, Colt SAA Peacemaker, Uberti 1873)',
    tasks: [
      {
        task_name: 'Cylinder, Base Pin & Forcing Cone Clean',
        interval_rounds: 300,
        interval_days: 90,
        notes:
          'Remove cylinder, clean base pin arbor, forcing cone, and scrape lead/carbon buildup from cylinder face.',
      },
      {
        task_name: 'Base Pin Arbor & Bushing Greasing',
        interval_rounds: 500,
        interval_days: 180,
        notes:
          'Apply high-pressure gun grease to base pin and cylinder bushing to prevent binding under heavy recoil.',
      },
      {
        task_name: 'Cylinder Hand, Ratchet Teeth & Bolt Lockup Timing',
        interval_rounds: 1500,
        interval_days: 365,
        notes:
          'Check cylinder bolt drop timing into cylinder notches and inspect ratchet teeth for uniform hand engagement.',
      },
      {
        task_name: 'Ejector Rod Housing Screw Torque & Spring Check',
        interval_rounds: 2000,
        interval_days: 365,
        notes:
          'Check ejector rod housing screw torque (prevent stripping under recoil) and clean spring-loaded ejector tube.',
      },
      {
        task_name: 'Mainspring & Hammer Half-Cock / Sear Inspection',
        interval_rounds: 4000,
        interval_days: 730,
        notes: 'Inspect hammer notches, trigger sear engagement, and leaf mainspring tension.',
      },
    ],
  },

  // 16. Revolver - Top-Break & Tip-Up
  revolver_top_break: {
    id: 'revolver_top_break',
    name: 'Revolver (Top-Break & Tip-Up)',
    category: 'Handgun / Vintage',
    description:
      'Hinged-frame top-break & tip-up revolvers (Webley Mk IV / Mk VI, S&W Schofield, Iver Johnson, H&R Top-Break)',
    tasks: [
      {
        task_name: 'Bore, Cylinder & Top Strap Clean',
        interval_rounds: 200,
        interval_days: 90,
        notes: 'Clean chambers, forcing cone, and breech face. Scrape blackpowder/lead fouling.',
      },
      {
        task_name: 'Top Barrel Latch & Hinge Screw Lockup Check',
        interval_rounds: 500,
        interval_days: 180,
        notes:
          'Inspect top latch stirrup engagement and frame pivot screw tightness. Zero top latch play is required for safety.',
      },
      {
        task_name: 'Automatic Gear Ejector Star & Cam Lever Clean',
        interval_rounds: 1000,
        interval_days: 365,
        notes:
          'Disassemble gear-driven automatic extractor star, clean cam lever, and lubricate return spring.',
      },
      {
        task_name: 'Cylinder Arbor Pin & Hand Pawl Wear Check',
        interval_rounds: 2000,
        interval_days: 730,
        notes: 'Inspect central arbor shaft and cylinder hand pawl for timing wear.',
      },
      {
        task_name: 'Leaf Springs & Hammer Sear Engagement Check',
        interval_rounds: 3000,
        interval_days: 730,
        notes: 'Inspect V-mainspring, trigger return spring, and hammer sear.',
      },
    ],
  },

  // 17. Break Action Double (Over/Under & Side-by-Side)
  break_action: {
    id: 'break_action',
    name: 'Break Action Double (Over/Under & Side-by-Side)',
    category: 'Shotgun / Rifle',
    description:
      'Over/Under and Side-by-Side shotguns & double rifles (Browning Citori, Beretta 686 Silver Pigeon, SxS game guns, Drillungs)',
    tasks: [
      {
        task_name: 'Bore Cleaning & Choke Tube Anti-Seize',
        interval_rounds: 300,
        interval_days: 90,
        notes: 'Clean bores, ejector faces, and apply anti-seize grease to choke tube threads.',
      },
      {
        task_name: 'Clean & Grease Hinge Pin, Trunnions & Forend Iron',
        interval_rounds: 500,
        interval_days: 180,
        notes: 'Apply heavy gun grease to hinge pin, knuckle, and forend iron bearing surfaces.',
      },
      {
        task_name: 'Inspect & Clean Ejector / Extractor Slides',
        interval_rounds: 1500,
        interval_days: 365,
        notes: 'Clean automatic ejector trip rods, springs, and slide tracks in barrel monobloc.',
      },
      {
        task_name: 'Inspect Firing Pins & Return Springs',
        interval_rounds: 5000,
        interval_days: 730,
        notes: 'Check for pitted or eroded firing pin tips and test return spring tension.',
      },
      {
        task_name: 'Inspect Lockup Bite & Top Lever Angle',
        interval_rounds: 5000,
        interval_days: 730,
        notes:
          'Verify top lever rests to the right of center; inspect under-bolt wedge engagement with barrel lugs.',
      },
    ],
  },

  // 18. Break Action Single Shot
  break_action_single: {
    id: 'break_action_single',
    name: 'Break Action Single Shot (CVA, Henry, T/C, H&R)',
    category: 'Single Shot',
    description:
      'Break-open single shot rifles, shotguns, & pistols (CVA Scout/Hunter, Henry Single Shot H015, T/C Encore/Contender, H&R Handi-Rifle, NEF Pardner, Rossi, Baikal MP-18, Blaser K95)',
    tasks: [
      {
        task_name: 'Bore, Breech Face & Extractor/Ejector Slot Clean',
        interval_rounds: 150,
        interval_days: 90,
        notes:
          'Clean bore, chamber, and breech face. Remove carbon and brass shavings beneath the extractor/ejector slide to prevent sticky extraction or failure to lock closed.',
      },
      {
        task_name: 'Clean & Grease Hinge Pin, Underlug & Forend Lug',
        interval_rounds: 300,
        interval_days: 180,
        notes:
          'Apply high-pressure gun grease to barrel pivot/hinge pin, receiver trunnions, and locking bolt underlug to prevent galling under firing thrust.',
      },
      {
        task_name: 'Forend Mounting Screw Torque & Harmonic Check',
        interval_rounds: 500,
        interval_days: 180,
        notes:
          'Check forend mounting screw torque (15-20 in-lbs). Uneven forend screw torque on barrel lugs is the primary cause of vertical stringing and accuracy loss on single shot rifles.',
      },
      {
        task_name: 'Inspect Lockup Bite, Top/Under Lever & Barrel-to-Frame Play',
        interval_rounds: 1500,
        interval_days: 365,
        notes:
          'Inspect locking wedge engagement and ensure zero vertical or lateral play between breech face and barrel when closed.',
      },
      {
        task_name: 'Inspect Firing Pin, Transfer Bar / Hammer Block & Bushing',
        interval_rounds: 3000,
        interval_days: 730,
        notes:
          'Inspect firing pin tip protrusion, return spring, and transfer bar / hammer spur mechanism for wear or peening.',
      },
    ],
  },

  // 19. Falling Block & Rising Block Single Shot
  falling_block_single: {
    id: 'falling_block_single',
    name: 'Falling Block Single Shot (Ruger No. 1, 1885 High Wall, Sharps)',
    category: 'Single Shot',
    description:
      'Vertical falling-block and rising-block lever rifles (Ruger No. 1, Winchester Model 1885 High/Low Wall, Sharps 1874, Browning B78, Farquharson, Dakota Model 10)',
    tasks: [
      {
        task_name: 'Bore & Chamber Throat Clean, Breech Mortise Wipe',
        interval_rounds: 150,
        interval_days: 90,
        notes:
          'Clean bore from breech using bore guide. Clean powder residue from chamber and vertical breech mortise.',
      },
      {
        task_name: 'Clean & Grease Falling Breechblock Tracks & Lever Pivot',
        interval_rounds: 300,
        interval_days: 180,
        notes:
          'Apply heavy grease to vertical sliding tracks, lever linkage pins, and under-lever latch.',
      },
      {
        task_name: 'Extractor / Ejector Slide Clean & Spring Inspection',
        interval_rounds: 1000,
        interval_days: 365,
        notes:
          'Clean extractor slot in breech face. On Ruger No. 1, verify ejector speed adjustment screw and spring tension.',
      },
      {
        task_name: 'Forend Hanger Screw Torque & Quarter-Rib Mount Check',
        interval_rounds: 1000,
        interval_days: 365,
        notes:
          'Verify Ruger No. 1 forend hanger screw torque and scope base quarter-rib screw tightness for repeatable accuracy.',
      },
      {
        task_name: 'Striker / Internal Hammer & Firing Pin Protrusion Check',
        interval_rounds: 3000,
        interval_days: 730,
        notes:
          'Clean firing pin channel and check firing pin protrusion (.055"-.065") and mainspring condition.',
      },
    ],
  },

  // 20. Vintage Rolling Block, Trapdoor & Martini Single Shot
  rolling_block_trapdoor: {
    id: 'rolling_block_trapdoor',
    name: 'Vintage Rolling Block, Trapdoor & Martini',
    category: 'Single Shot / Vintage',
    description:
      'Classic single shot historic and blackpowder/smokeless rifles (Remington No. 1/No. 4 Rolling Block, Springfield Model 1873/1884 Trapdoor, Snider-Enfield, Martini-Henry)',
    tasks: [
      {
        task_name: 'Bore Decontamination & Breech Face Clean',
        interval_rounds: 150,
        interval_days: 60,
        notes:
          'Clean bore and chamber. If shooting blackpowder or corrosive primers, immediately flush with hot water/solvent to neutralize corrosive salts.',
      },
      {
        task_name: 'Inspect Transverse Pivot Pins / Cam Latch Lockup',
        interval_rounds: 500,
        interval_days: 180,
        notes:
          'Inspect rolling block and hammer pivot pins for play, or inspect Trapdoor thumb cam latch for positive mortise engagement.',
      },
      {
        task_name: 'Clean Extractor Rack, Spring & Breech Cavity',
        interval_rounds: 1000,
        interval_days: 365,
        notes:
          'Remove powder fouling under manual extractor slide and clean ejector kicker spring.',
      },
      {
        task_name: 'Tang Screw & Stock Wrist Integrity Check',
        interval_rounds: 1000,
        interval_days: 180,
        notes:
          'Inspect tang screws. Heavy blackpowder/smokeless recoil (.45-70, .50-70) can loosen tang screws and crack vintage stock wrists.',
      },
      {
        task_name: 'Mainspring, Firing Pin Protrusion & Wood Conditioning',
        interval_rounds: 2500,
        interval_days: 365,
        notes:
          'Check leaf mainspring tension, firing pin protrusion, and treat walnut stock with Linseed Oil / Renaissance Wax.',
      },
    ],
  },

  // 21. Modern In-Line Muzzleloader (209 Primer)
  muzzleloader_inline: {
    id: 'muzzleloader_inline',
    name: 'Modern In-Line Muzzleloader (209 Primer)',
    category: 'Muzzleloader',
    description:
      'Modern 209-primer in-line muzzleloading rifles (CVA Optima / Accura / Wolf, Traditions Vortek / Pursuit, Knight Disc / Bighorn)',
    tasks: [
      {
        task_name: 'Post-Range Water/Solvent Bore Clean & Corrosion Flush',
        interval_rounds: 50,
        interval_days: 30,
        notes:
          'Clean bore immediately with blackpowder solvent / hot water to neutralize corrosive propellant salts (Triple 7, Pyrodex, Blackhorn 209).',
      },
      {
        task_name: 'Remove, Clean & Anti-Seize Breech Plug Threads',
        interval_rounds: 50,
        interval_days: 60,
        notes:
          'Remove breech plug, clean flash hole with welding torch tip cleaner, and coat threads with high-temp anti-seize stick.',
      },
      {
        task_name: 'Clean Firing Pin Bushing & 209 Primer Pocket',
        interval_rounds: 200,
        interval_days: 180,
        notes:
          'Remove firing pin bushing, clean primer blow-by carbon, and lubricate firing pin return spring.',
      },
      {
        task_name: 'Replace Breech Plug Flash Channel / Fire Ring',
        interval_rounds: 500,
        interval_days: 365,
        notes:
          'Inspect flash hole diameter with gauge; replace breech plug if orifice has eroded beyond .035".',
      },
      {
        task_name: 'Action Hinge Pin & Break-Open Lever Greasing',
        interval_rounds: 500,
        interval_days: 365,
        notes: 'Apply synthetic grease to break-open pivot pin and trigger sear.',
      },
    ],
  },

  // 22. Traditional Muzzleloader (Caplock, Flintlock & Matchlock)
  muzzleloader_traditional: {
    id: 'muzzleloader_traditional',
    name: 'Traditional Muzzleloader (Caplock & Flintlock)',
    category: 'Muzzleloader / Vintage',
    description:
      'Side-lock percussion cap & flintlock muzzleloaders (Hawken rifles, Kentucky / Pennsylvania longrifles, Springfield 1861 musket)',
    tasks: [
      {
        task_name: 'Hot Soapy Water Barrel Flush & Anti-Rust Barrier',
        interval_rounds: 30,
        interval_days: 30,
        notes:
          'Flush barrel with hot soapy water, dry with patches, and apply heavy coat of Wonder Lube / Barricade rust inhibitor.',
      },
      {
        task_name: 'Remove, Clean & Anti-Seize Percussion Nipple / Touch-Hole',
        interval_rounds: 50,
        interval_days: 60,
        notes:
          'Unscrew percussion nipple or touch-hole liner, clean flash vent, and apply anti-seize grease to threads.',
      },
      {
        task_name: 'Lockplate Disassembly, Bridle & Tumbler Cleaning',
        interval_rounds: 200,
        interval_days: 180,
        notes:
          'Remove lockplate from stock, disassemble hammer tumbler, bridle, and sear; clean carbon fouling and lube with gun oil.',
      },
      {
        task_name: 'Flintlock Frizzen & Flint Leather Inspection',
        interval_rounds: 100,
        interval_days: 90,
        notes:
          'Inspect frizzen face for smooth striking surface; knap or replace English flint and check leather wrap jaw clamp.',
      },
      {
        task_name: 'Stock Barrel Channel Rust Proofing & Linseed Oil',
        interval_rounds: 500,
        interval_days: 180,
        notes:
          'Remove barrel from stock, coat underside barrel channel with beeswax/grease, and treat wood furniture with boiled linseed oil.',
      },
    ],
  },

  // 23. M1 Garand & Military Long-Stroke Gas
  m1_garand: {
    id: 'm1_garand',
    name: 'M1 Garand & Surplus Gas Rifles',
    category: 'Vintage / Surplus',
    description: 'M1 Garand (.30-06 / .308), SKS, SVT-40, FN49 gas-operated military surplus',
    tasks: [
      {
        task_name: 'Bore, Chamber & Gas Cylinder Clean / Corrosive Flush',
        interval_rounds: 250,
        interval_days: 60,
        notes:
          'Clean bore from muzzle using brass bore guide. Clean gas cylinder and piston. If shooting surplus ammo, flush with hot water/solvent immediately to dissolve corrosive salts.',
      },
      {
        task_name: 'Lubriplate / High-Temp Synthetic Grease Application',
        interval_rounds: 500,
        interval_days: 90,
        notes:
          'Apply Lubriplate 130A / synthetic grease to bolt lugs, op-rod cam track, receiver slide grooves, hammer hooks, and bullet guide. Never run M1 Garands dry!',
      },
      {
        task_name: 'Op-Rod Tilt Test & Op-Rod Spring Length Check',
        interval_rounds: 1500,
        interval_days: 365,
        notes:
          'Verify op-rod moves freely at 45° tilt without stock drag. Measure op-rod spring free length (standard min 19.5", replace if under 19.5" to avoid cracked receiver heels).',
      },
      {
        task_name: 'Clip Latch, Clip Ejector & Bullet Guide Inspection',
        interval_rounds: 3000,
        interval_days: 730,
        notes:
          'Inspect en-bloc clip latch pin wear, accelerator tab, and ejector spring tension to prevent 7th round stoppage or premature clip ejection.',
      },
      {
        task_name: 'Gas Cylinder, Throat (TE) & Muzzle Wear (MW) Gauge',
        interval_rounds: 3000,
        interval_days: 730,
        notes:
          'Check gas cylinder internal diameter (< 0.532"). Measure throat erosion (TE) and muzzle wear (MW) with armorer plug gauges.',
      },
      {
        task_name: 'Stock Lockup & Linseed Oil Conditioning',
        interval_rounds: 2000,
        interval_days: 180,
        notes:
          'Inspect front handguard clearance (prevent barrel binding) and condition walnut stock with pure tung oil or boiled linseed oil (BLO).',
      },
    ],
  },

  // 24. M1 Carbine & Short-Stroke Gas Carbines
  m1_carbine: {
    id: 'm1_carbine',
    name: 'M1 Carbine & Short-Stroke Gas Carbines',
    category: 'Vintage / Surplus',
    description:
      'M1 / M2 Carbine (.30 Carbine - Inland, Winchester, Underwood, Rock-Ola, NPM, Quality Hardware)',
    tasks: [
      {
        task_name: 'Bore Clean, Bolt & Slide Rail Lubrication',
        interval_rounds: 300,
        interval_days: 90,
        notes:
          'Clean bore from breech or with crown guard. Lightly lube slide handle track and bolt lugs with light grease/CLP.',
      },
      {
        task_name: 'Gas Tappet Piston Free-Movement Check (Keep Dry)',
        interval_rounds: 600,
        interval_days: 180,
        notes:
          'Verify short-stroke gas piston moves freely inside cylinder nut. Keep dry or clean with evaporating solvent; excess oil burns into carbon fouling and jams piston.',
      },
      {
        task_name: 'Replace Recoil Spring & Operating Slide Spring',
        interval_rounds: 2500,
        interval_days: 365,
        notes:
          'Replace primary recoil spring (standard min 10.25", replace if compressed < 9.75") to prevent bolt bounce and feeding failures.',
      },
      {
        task_name: 'Magazine Catch & Feed Lip Tension Inspection',
        interval_rounds: 1500,
        interval_days: 365,
        notes:
          'Inspect mag catch plunger and feed lips. M1 Carbines are prone to feeding failures if mag catch is worn or mag springs weaken.',
      },
      {
        task_name: 'Bolt Disassembly, Extractor & Ejector Springs',
        interval_rounds: 4000,
        interval_days: 730,
        notes:
          'Use M1 Carbine bolt tool to disassemble bolt. Clean firing pin channel and replace extractor spring/ejector plunger spring.',
      },
    ],
  },
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
    (text.includes('carbine') &&
      (text.includes('.30 carbine') ||
        text.includes('inland') ||
        text.includes('rock-ola') ||
        text.includes('underwood') ||
        text.includes('postal meter') ||
        text.includes('universal carbine')))
  ) {
    return MAINTENANCE_PROFILES.m1_carbine;
  }

  // 3. Muzzleloader - Modern In-Line (209 Primer)
  if (
    text.includes('in-line') ||
    text.includes('inline') ||
    text.includes('209') ||
    text.includes('optima') ||
    text.includes('accura') ||
    text.includes('vortek') ||
    text.includes('cva wolf') ||
    text.includes('knight disc') ||
    text.includes('bighorn')
  ) {
    return MAINTENANCE_PROFILES.muzzleloader_inline;
  }

  // 4. Muzzleloader - Traditional (Percussion, Flintlock, Matchlock)
  if (
    action.includes('muzzleloader') ||
    action.includes('flintlock') ||
    action.includes('percussion') ||
    action.includes('matchlock') ||
    action.includes('wheel-lock') ||
    action.includes('blackpowder') ||
    text.includes('hawken') ||
    text.includes('flintlock') ||
    text.includes('percussion cap') ||
    text.includes('caplock') ||
    text.includes('kentucky rifle') ||
    text.includes('pennsylvania rifle') ||
    text.includes('springfield 1861') ||
    text.includes('musket')
  ) {
    return MAINTENANCE_PROFILES.muzzleloader_traditional;
  }

  // 5. Falling Block / Rising Block Single Shot (Ruger No. 1, 1885 High/Low Wall, Sharps 1874)
  if (
    text.includes('falling block') ||
    text.includes('rising block') ||
    text.includes('ruger no. 1') ||
    text.includes('ruger no 1') ||
    text.includes('ruger #1') ||
    text.includes('ruger number 1') ||
    text.includes('high wall') ||
    text.includes('low wall') ||
    text.includes('model 1885') ||
    text.includes('winchester 1885') ||
    text.includes('sharps 1874') ||
    text.includes('1874 sharps') ||
    text.includes('shiloh sharps') ||
    text.includes('pedersoli sharps') ||
    text.includes('browning b78') ||
    text.includes('b78') ||
    text.includes('farquharson') ||
    text.includes('dakota 10') ||
    text.includes('dakota model 10')
  ) {
    return MAINTENANCE_PROFILES.falling_block_single;
  }

  // 6. Vintage Rolling Block, Trapdoor & Martini Single Shot
  if (
    text.includes('rolling block') ||
    text.includes('remington rolling') ||
    text.includes('trapdoor') ||
    text.includes('springfield 1873') ||
    text.includes('1873 trapdoor') ||
    text.includes('1884 trapdoor') ||
    text.includes('1888 trapdoor') ||
    text.includes('snider') ||
    text.includes('martini-henry') ||
    text.includes('martini cadet') ||
    text.includes('martini') ||
    text.includes('peabody')
  ) {
    return MAINTENANCE_PROFILES.rolling_block_trapdoor;
  }

  // 7. Break Action Single Shot Rifle & Shotgun
  if (
    text.includes('cva scout') ||
    text.includes('cva hunter') ||
    text.includes('handi-rifle') ||
    text.includes('handi rifle') ||
    text.includes('nef pardner') ||
    text.includes('pardner') ||
    text.includes('t/c encore') ||
    text.includes('tc encore') ||
    text.includes('encore') ||
    text.includes('t/c contender') ||
    text.includes('tc contender') ||
    text.includes('contender') ||
    text.includes('thompson center') ||
    text.includes('thompson/center') ||
    text.includes('henry single') ||
    text.includes('h015') ||
    text.includes('rossi single') ||
    text.includes('little badger') ||
    text.includes('chiappa little badger') ||
    text.includes('baikal mp-18') ||
    text.includes('mp-18') ||
    text.includes('mp18') ||
    text.includes('blaser k95') ||
    text.includes('k95') ||
    (action.includes('break') &&
      (action.includes('single') ||
        text.includes('single shot') ||
        text.includes('single-shot'))) ||
    (action.includes('single shot') && !action.includes('bolt'))
  ) {
    return MAINTENANCE_PROFILES.break_action_single;
  }

  // 8. Bolt Action Single Shot Target / Match
  if (
    text.includes('single shot target') ||
    text.includes('single shot bolt') ||
    text.includes('remington 40-x') ||
    text.includes('40-x') ||
    text.includes('anschütz 54') ||
    text.includes('anschutz 54') ||
    text.includes('anschütz 64') ||
    text.includes('anschutz 64') ||
    text.includes('savage 12 target') ||
    text.includes('savage 112 target') ||
    text.includes('cooper 21') ||
    text.includes('cooper model 21')
  ) {
    return MAINTENANCE_PROFILES.bolt_action_target;
  }

  // 9. Straight-Pull Bolt Action
  if (
    action.includes('straight-pull') ||
    action.includes('straight pull') ||
    text.includes('blaser r8') ||
    text.includes('blaser r93') ||
    text.includes('browning maral') ||
    text.includes('savage impulse') ||
    text.includes('heym sr30') ||
    text.includes('schmidt-rubin') ||
    text.includes('k31')
  ) {
    return MAINTENANCE_PROFILES.straight_pull_bolt;
  }

  // 10. Vintage Box-Magazine Lever Action (Winchester 1895, Savage 99, BLR)
  if (
    (action.includes('box magazine') && action.includes('lever')) ||
    text.includes('1895') ||
    text.includes('winchester 1895') ||
    text.includes('model 1895') ||
    text.includes('savage 99') ||
    text.includes('model 99') ||
    text.includes('browning blr')
  ) {
    return MAINTENANCE_PROFILES.vintage_box_lever;
  }

  // 11. Vintage Military CRF Bolt Action
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
    text.includes('arisaka') ||
    text.includes('carcano') ||
    text.includes('m39') ||
    text.includes('m1917') ||
    (text.includes('krag') &&
      (action.includes('bolt') ||
        text.includes('krag-') ||
        text.includes('jørgensen') ||
        text.includes('jorgensen') ||
        text.includes('m1898') ||
        text.includes('1898')))
  ) {
    return MAINTENANCE_PROFILES.vintage_bolt_crf;
  }

  // 12. Tubular Magazine Lever Action
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

  // 13. Delayed Blowback (Roller, Radial & Lever)
  if (
    action.includes('delayed') ||
    text.includes('roller-delayed') ||
    text.includes('roller delayed') ||
    text.includes('radial-delayed') ||
    text.includes('radial delayed') ||
    text.includes('lever-delayed') ||
    text.includes('mp5') ||
    text.includes('sp5') ||
    text.includes('hk91') ||
    text.includes('hk93') ||
    text.includes('hk94') ||
    text.includes('g3') ||
    text.includes('ptr 91') ||
    text.includes('banshee')
  ) {
    return MAINTENANCE_PROFILES.semi_roller_delayed;
  }

  // 14. Direct Blowback PCC & Carbine
  if (
    action.includes('blowback') ||
    text.includes('direct blowback') ||
    text.includes('ruger pc') ||
    text.includes('ruger pcc') ||
    text.includes('scorpion evo') ||
    text.includes('cz scorpion') ||
    text.includes('stribog') ||
    text.includes('sub-2000') ||
    text.includes('sub2000') ||
    text.includes('hi-point carbine')
  ) {
    return MAINTENANCE_PROFILES.semi_direct_blowback;
  }

  // 15. Gas Piston Semi-Auto Rifle
  if (
    action.includes('gas piston') ||
    action.includes('piston') ||
    text.includes('ak-47') ||
    text.includes('ak-74') ||
    text.includes('akm') ||
    text.includes('scar 16') ||
    text.includes('scar 17') ||
    text.includes('scar 20') ||
    text.includes('tavor') ||
    text.includes('x95') ||
    text.includes('galil') ||
    text.includes('bren 2') ||
    text.includes('hk416') ||
    text.includes('mcx') ||
    text.includes('sig mcx')
  ) {
    return MAINTENANCE_PROFILES.semi_piston_rifle;
  }

  // 16. Revolver - Single Action Only (Western Gate Load)
  if (
    (action.includes('single action') && action.includes('revolver')) ||
    text.includes('peacemaker') ||
    text.includes('single action army') ||
    text.includes('blackhawk') ||
    text.includes('super blackhawk') ||
    text.includes('vaquero') ||
    text.includes('uberti 1873') ||
    text.includes('cimarron 1873')
  ) {
    return MAINTENANCE_PROFILES.revolver_sa;
  }

  // 17. Revolver - Top-Break & Tip-Up
  if (
    action.includes('top-break') ||
    action.includes('tip-up') ||
    text.includes('webley') ||
    text.includes('schofield') ||
    text.includes('iver johnson') ||
    text.includes('top break')
  ) {
    return MAINTENANCE_PROFILES.revolver_top_break;
  }

  // 18. Revolver - Double Action / Single Action & DAO
  if (
    action.includes('revolver') ||
    text.includes('revolver') ||
    text.includes('python') ||
    text.includes('686') ||
    text.includes('gp100') ||
    text.includes('sp101') ||
    text.includes('king cobra') ||
    text.includes('kimber k6s') ||
    (action.includes('double action') &&
      (caliber.includes('.357') || caliber.includes('.44') || caliber.includes('.38')))
  ) {
    return MAINTENANCE_PROFILES.revolver;
  }

  // 19. Pump Action (Shotgun & Rifle)
  if (
    action.includes('pump') ||
    action.includes('slide action') ||
    text.includes('pump action') ||
    text.includes('870') ||
    text.includes('500') ||
    text.includes('590') ||
    text.includes('nova') ||
    text.includes('supernova') ||
    text.includes('ksg') ||
    text.includes('mossberg 590') ||
    text.includes('remington 870') ||
    text.includes('remington 7600')
  ) {
    return MAINTENANCE_PROFILES.pump_action;
  }

  // 20. Break Action Double (Over/Under, Side-by-Side, Drilling)
  if (
    action.includes('break') ||
    action.includes('over/under') ||
    action.includes('side-by-side') ||
    action.includes('drilling') ||
    text.includes('break action') ||
    text.includes('over/under') ||
    text.includes('side by side') ||
    text.includes('citori') ||
    text.includes('silver pigeon') ||
    text.includes('over and under')
  ) {
    return MAINTENANCE_PROFILES.break_action;
  }

  // 21. Semi-Auto Shotgun
  const isShotgunCaliber =
    caliber.includes('ga') ||
    caliber.includes('gauge') ||
    caliber.includes('12') ||
    caliber.includes('20') ||
    caliber.includes('.410');
  if (
    ((action.includes('semi') || text.includes('semi-automatic')) && isShotgunCaliber) ||
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

  // 22. Modern Bolt Action (Push & CRF)
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

  // 23. Modern Semi-Auto Rifle (Direct Impingement)
  if (
    text.includes('ar-15') ||
    text.includes('ar-10') ||
    (text.includes('m4') && !isShotgunCaliber) ||
    text.includes('5.56') ||
    text.includes('.223') ||
    text.includes('300 blk') ||
    text.includes('6.5 creed') ||
    (text.includes('.308') && (action.includes('semi') || text.includes('gas'))) ||
    action.includes('direct impingement')
  ) {
    return MAINTENANCE_PROFILES.semi_rifle;
  }

  // 24. Default fallback to Semi-Auto Handgun
  return MAINTENANCE_PROFILES.semi_pistol;
}

/**
 * Builds schedule items for a firearm based on a chosen or detected profile.
 */
export function createScheduleItemsFromProfile(
  profile: MaintenanceProfile,
  baselineRounds: number
): MaintenanceScheduleItem[] {
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();
  return profile.tasks.map((task, idx) => ({
    id: `sched_${profile.id}_${now}_${idx}`,
    task_name: task.task_name,
    interval_rounds: task.interval_rounds,
    interval_days: task.interval_days,
    last_performed_rounds: baselineRounds,
    last_performed_date: today,
    notes: task.notes,
  }));
}
