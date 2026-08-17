import { Ammo, ReloadingComponent, Accessory } from '../types';
import { escapeRegExp } from './caliberHelpers';

export interface ParsedBarcodeResult {
  category: 'ammo' | 'component' | 'accessory' | 'unknown';
  item: any;
  bestTitle: string;
  foundCost?: number;
  
  parsedAmmo?: Partial<Ammo> & { boxPrice?: number };
  parsedComponent?: Partial<ReloadingComponent>;
  parsedAccessory?: Partial<Accessory>;
}

export const decodeHTMLEntities = (text: string | undefined): string => {
  if (!text) return '';
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.documentElement.textContent || text;
};


export const parseBarcodeData = (item: any, ammoList: Ammo[] = []): ParsedBarcodeResult => {
  let foundName = item.title || '';
  if (item.offers && item.offers.length > 0) {
    const titles = [item.title, ...item.offers.map((o: any) => decodeHTMLEntities(o.title))].filter(t => typeof t === 'string' && t.trim().length > 0);
    titles.sort((a, b) => b.length - a.length);
    const bestTitle = titles.find(t => t.length < 120 && /[a-zA-Z]/.test(t));
    if (bestTitle) foundName = bestTitle;
  }
  
  const decodedTitle = decodeHTMLEntities(foundName);
  const rawBrand = decodeHTMLEntities(item.brand);
  const decodedDesc = decodeHTMLEntities(item.description);
  const offersText = (item.offers || []).map((o: any) => decodeHTMLEntities(o.title)).join(' ');
  let combinedText = (decodedTitle + ' ' + rawBrand + ' ' + decodedDesc + ' ' + offersText).toUpperCase();
  
  // Fix common abbreviations
  combinedText = combinedText.replace(/\bHODG\b/g, 'HODGDON');

  let foundCost: number | undefined;
  
  // 1. Prefer median price from active offers (most accurate and current)
  if (item.offers && item.offers.length > 0) {
    const validPrices = item.offers.map((o: any) => parseFloat(o.price)).filter((p: number) => !isNaN(p) && p > 0);
    if (validPrices.length > 0) {
      validPrices.sort((a: number, b: number) => a - b);
      foundCost = parseFloat(validPrices[Math.floor(validPrices.length / 2)].toFixed(2));
    }
  }

  // 2. Fallback to historical records
  if (!foundCost && item.highest_recorded_price && item.lowest_recorded_price) {
    const high = parseFloat(item.highest_recorded_price);
    const low = parseFloat(item.lowest_recorded_price);
    if (high > 0 && low > 0) {
      // If the lowest price is suspiciously low compared to highest (e.g. $2 vs $40), ignore it as a glitch
      if (high / low > 4) foundCost = parseFloat(high.toFixed(2));
      else foundCost = parseFloat(((high + low) / 2).toFixed(2));
    }
  } else if (!foundCost && item.lowest_recorded_price && item.lowest_recorded_price > 0) {
    foundCost = parseFloat(item.lowest_recorded_price.toFixed(2));
  }

  // Detect Category using Heuristics
  let category: 'ammo' | 'component' | 'accessory' | 'unknown' = 'unknown';

  const ammoMatches = combinedText.match(/\b(?:AMMO|AMMUNITION|ROUNDS|RDS|ROUND|RD|CARTRIDGES)\b/g) || [];
  const componentMatches = combinedText.match(/\b(?:POWDER|SMOKELESS|PROPELLANT|HODGDON|IMR|ALLIANT|VIHTAVUORI|ACCURATE|RAMSHOT|SHOOTERS WORLD|VARGET|TITEGROUP|BULLSEYE|AUTOCOMP|W231|W296|1\s*LB|4\s*LB|8\s*LB|1LB|4LB|8LB|POUND|PRIMER|PRIMERS|SRP|LRP|SPP|LPP|SRM|LRM|SPM|LPM|WSR|WLR|WSP|WLP|BRASS|CASES|HULL|HULLS|PROJECTILE|PROJECTILES|BULLET|BULLETS)\b/g) || [];
  const projectileMatches = combinedText.match(/\b(?:FMJ|FMJBT|HP|JHP|BTHP|HPBT|XTP|SST|V-MAX|VMAX|A-MAX|AMAX|LRN|TSX|TTSX|LRX|TAC-TX|ELD-X|ELD|ELD MATCH|SMK|TMK|TGK|MATCHKING|GAMEKING|BLITZKING|ACCUBOND|PARTITION|GOLD DOT|HST|HYDRA-SHOK|HYDRASHOK|CORE-LOKT|CORELOKT|GOLDEN SABER|SILVERTIP|DEFENDER|FUSION|SYNTECH|TERMINAL ASCENT|TROPHY BONDED|INTERLOCK|INTERBOND|BALLISTIC TIP|SCENAR|ORYX|ECOSTRIKE|TIPSTRIKE|BONDSTRIKE|XTREME PENETRATOR|XTREME DEFENDER|HONEYBADGER|V-CROWN|VCROWN|SCHP|MONOFLEX|FLEXLOCK|SUB-X|VARMINT GRENADE|E-TIP|ETIP|RDF|CUSTOM COMPETITION|PUNCH|PHP|CPHP)\b/g) || [];
  const accessoryMatches = combinedText.match(/\b(?:OPTIC|SCOPE|RED DOT|HOLSTER|SUPPRESSOR|SILENCER|SLING|MAGAZINE|MAG|MOUNT|LIGHT|FLASHLIGHT)\b/g) || [];
  
  let scoreAmmo = ammoMatches.length * 3;
  let scoreComponent = componentMatches.length * 3;
  let scoreAccessory = accessoryMatches.length * 3;

  if (projectileMatches.length > 0) {
    if (combinedText.match(/\b(?:BULLET|BULLETS|PROJECTILE|PROJECTILES|HEADS|UNLOADED)\b/) && !combinedText.match(/\b(?:AMMO|AMMUNITION|ROUNDS|RDS)\b/)) {
      scoreComponent += projectileMatches.length * 2;
    } else {
      scoreAmmo += projectileMatches.length * 2;
    }
  }

  if (combinedText.match(/\b(?:FMJ|JHP|PHP|SP|HP)\b/) && combinedText.match(/\b(?:9MM|45 ACP|5\.56|223 REM|22 LR)\b/)) {
    if (combinedText.match(/\b(?:BULLET|BULLETS|PROJECTILE|PROJECTILES)\b/) && !combinedText.match(/\b(?:AMMO|ROUNDS|RDS)\b/)) scoreComponent += 1;
    else scoreAmmo += 1;
  }
  if (combinedText.includes('GRAIN') && combinedText.includes('PACKED PER') && !combinedText.includes('AMMO')) scoreComponent += 2;
  
  if (scoreAccessory > scoreAmmo && scoreAccessory > scoreComponent) category = 'accessory';
  else if (scoreComponent > scoreAmmo && scoreComponent > scoreAccessory) category = 'component';
  else if (scoreAmmo > scoreComponent && scoreAmmo > scoreAccessory) category = 'ammo';
  else if (scoreAmmo > 0 && scoreComponent === 0 && scoreAccessory === 0) category = 'ammo';
  else if (scoreComponent > 0 && scoreAmmo === 0 && scoreAccessory === 0) category = 'component';
  else if (scoreAccessory > 0 && scoreAmmo === 0 && scoreComponent === 0) category = 'accessory';
  // Default to Ammo if completely unsure but has valid price
  else if (category === 'unknown' && foundCost && foundCost > 5 && foundCost < 100) category = 'ammo';

  const result: ParsedBarcodeResult = {
    category,
    item,
    bestTitle: decodedTitle,
    foundCost,
  };

  // Decode Brand properly
  let decodedBrand = rawBrand;
  if (rawBrand && rawBrand.toLowerCase().trim() !== 'brand') {
    const lowerRaw = rawBrand.toLowerCase().trim();
    const ignoredDistributors = ['sports south', 'sports south llc', 'davidsons', 'lipseys', 'zanders', 'rsr group', 'chatillon'];
    if (ignoredDistributors.includes(lowerRaw)) {
      decodedBrand = '';
    } else {
      const existingMatch = ammoList.find(a => (a.manufacturer || '').toLowerCase().trim() === lowerRaw);
      if (existingMatch && existingMatch.manufacturer) {
        decodedBrand = existingMatch.manufacturer;
      } else if (rawBrand === rawBrand.toUpperCase() && rawBrand.length > 4) {
        decodedBrand = rawBrand.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
  } else {
    decodedBrand = '';
  }

  if (!decodedBrand) {
    const uniqueMakes = Array.from(new Set(ammoList.map(a => a.manufacturer).filter(Boolean))) as string[];
    let earliestIndex = -1;
    let earliestMake = '';
    const checkMakes = (makesList: string[]) => {
      for (const make of makesList) {
        const regex = new RegExp(`\\b${escapeRegExp(make)}\\b`, 'i');
        const match = combinedText.match(regex);
        if (match && match.index !== undefined) {
          if (earliestIndex === -1 || match.index < earliestIndex) {
            if (earliestIndex !== -1 && match.index === earliestIndex && make.length > earliestMake.length) {
              earliestMake = make;
            } else if (earliestIndex === -1 || match.index < earliestIndex) {
              earliestIndex = match.index;
              earliestMake = make;
            }
          }
        }
      }
    };
    checkMakes(uniqueMakes);
    if (!earliestMake) {
      const commonMakes = ['CCI', 'Winchester', 'Federal', 'Remington', 'Hornady', 'PMC', 'Fiocchi', 'Sellier & Bellot', 'Magtech', 'Blazer', 'Aguila', 'PPU', 'Sig Sauer', 'Hodgdon', 'IMR', 'Alliant', 'Vihtavuori', 'Accurate', 'Ramshot', 'Shooters World', 'Norma'];
      checkMakes(commonMakes);
    }
    if (earliestMake) decodedBrand = earliestMake;
  }

  // Common extractions
  let grain: number | undefined;
  const grainMatch = combinedText.match(/(\d+(?:\.\d+)?)\s*(?:GR\b|GRAIN)/);
  if (grainMatch) grain = parseFloat(grainMatch[1]);

  let count: number | undefined;
  const qtyMatch = combinedText.match(/(?:UNITS PER BOX|QTY|QUANTITY|COUNT)[\s:]*(\d{1,3}(?:,\d{3})+|\d+)/i) || 
                   combinedText.match(/(\d{1,3}(?:,\d{3})+|\d+)\s*[-/]?\s*(?:ROUNDS|RDS|ROUND|RD|PACK|PK|PER BOX|CT|COUNT|PCS|PIECES|BUCKET|TUB|BX)\b/i) ||
                   combinedText.match(/PACKED PER (\d{1,3}(?:,\d{3})+|\d+)/i);
  let textForCaliber = combinedText;
  if (qtyMatch) {
    count = parseInt(qtyMatch[1].replace(/,/g, ''), 10);
    textForCaliber = combinedText.replace(qtyMatch[0], '');
  }

  if (category === 'accessory') {
    let type: Accessory['type'] = 'Other';
    if (combinedText.match(/\b(?:OPTIC|SCOPE|RED DOT)\b/)) type = 'Optic';
    else if (combinedText.match(/\b(?:SUPPRESSOR|SILENCER)\b/)) type = 'Suppressor';
    else if (combinedText.match(/\b(?:LIGHT|FLASHLIGHT)\b/)) type = 'Light';
    else if (combinedText.match(/\b(?:HOLSTER)\b/)) type = 'Holster';
    else if (combinedText.match(/\b(?:MOUNT)\b/)) type = 'Mount';
    else if (combinedText.match(/\b(?:SLING)\b/)) type = 'Sling';
    else if (combinedText.match(/\b(?:MAGAZINE|MAG)\b/)) type = 'Magazine';

    result.parsedAccessory = {
      manufacturer: decodedBrand,
      model: decodedTitle,
      type,
      value: foundCost
    };
  } else if (category === 'component') {
    let type: ReloadingComponent['type'] | undefined;
    let caliber: string | undefined;
    let weightUnit: 'lbs' | 'oz' | undefined;
    let primerType: string | undefined;
    let isMagnumPrimer: boolean | undefined;
    let bulletType: string | undefined;

    if (combinedText.match(/\b(?:POWDER|SMOKELESS|PROPELLANT|HODGDON|IMR|ALLIANT|VIHTAVUORI|ACCURATE|RAMSHOT|SHOOTERS WORLD|NORMA|VARGET|TITEGROUP|BULLSEYE|RELOADER|CFE|AUTOCOMP|W231|W296|1\s*LB|4\s*LB|8\s*LB|1LB|4LB|8LB|POUND)\b/)) type = 'Powder';
    else if (combinedText.match(/\b(?:PRIMER|PRIMERS|SRP|LRP|SPP|LPP|SRM|LRM|SPM|LPM|WSR|WLR|WSP|WLP)\b/)) type = 'Primer';
    else if (combinedText.match(/\b(?:BRASS|CASE|CASES|HULL|HULLS)\b/)) type = 'Brass';
    else if (combinedText.match(/\b(?:BULLET|BULLETS|PROJECTILE|PROJECTILES|HEADS|FMJ|FMJBT|HP|JHP|BTHP|HPBT|XTP|SST|TSX|TTSX|LRX|TAC-TX|ELD-X|ELD|ELD MATCH|SMK|TMK|TGK|MATCHKING|GAMEKING|BLITZKING|ACCUBOND|PARTITION|GOLD DOT|HST|HYDRA-SHOK|CORE-LOKT|GOLDEN SABER|SILVERTIP|FUSION|SYNTECH|SCENAR|ORYX|XTREME PENETRATOR|XTREME DEFENDER|V-CROWN|SCHP|MONOFLEX|FLEXLOCK|SUB-X|VARMINT GRENADE|E-TIP|RDF|CUSTOM COMPETITION)\b/)) type = 'Bullet';

    if (type === 'Powder' || combinedText.match(/\b(?:8\s*LB|1\s*LB|POUND)\b/)) {
      if (combinedText.match(/\b(?:8\s*LB|8LB)\b/)) weightUnit = 'lbs';
      else if (combinedText.match(/\b(?:1\s*LB|1LB|POUND)\b/)) weightUnit = 'lbs';
      else if (combinedText.match(/\b(?:OZ|OUNCE)\b/)) weightUnit = 'oz';
      else if (type === 'Powder') weightUnit = 'lbs'; // Default to lbs for powder
      
      if (weightUnit === 'lbs' || weightUnit === 'oz') type = type || 'Powder';
    }

    if (type === 'Primer') {
      if (combinedText.match(/\b(?:MAGNUM|MAG|SRM|LRM|SPM|LPM)\b/)) isMagnumPrimer = true;
      if (combinedText.match(/\b(?:SMALL RIFLE|SRP|WSR)\b/)) primerType = 'Small Rifle';
      else if (combinedText.match(/\b(?:LARGE RIFLE|LRP|WLR)\b/)) primerType = 'Large Rifle';
      else if (combinedText.match(/\b(?:SMALL PISTOL|SPP|WSP)\b/)) primerType = 'Small Pistol';
      else if (combinedText.match(/\b(?:LARGE PISTOL|LPP|WLP)\b/)) primerType = 'Large Pistol';
      else if (combinedText.match(/\b(?:209|SHOTGUN)\b/)) primerType = '209 Shotgun';
    }

    if (type === 'Bullet' || type === 'Brass') {
      if (combinedText.match(/30\s*CAL|\.308/)) caliber = '.308 / 30 Cal';
      else if (combinedText.match(/6MM|\.243/)) caliber = '.243 / 6mm';
      else if (combinedText.match(/6\.5MM|\.264|6\.5\s*CREEDMOOR/)) caliber = '.264 / 6.5mm';
      else if (combinedText.match(/7MM|\.284/)) caliber = '.284 / 7mm';
      else if (combinedText.match(/\.270/)) caliber = '.270 Caliber';
      else if (combinedText.match(/\.224|22\s*CAL|\.223|5\.56/)) caliber = '.224 / 22 Cal';
      else if (combinedText.match(/9MM|\.355/)) caliber = '9mm / .355';
      else if (combinedText.match(/\.357|\.38\s*CAL/)) caliber = '.357 / .38 Cal';
      else if (combinedText.match(/\.458|\.45-70/)) caliber = '.458 / 45-70';
      else if (combinedText.match(/\.452|\.45\s*COLT|\.45\s*LONG\s*COLT/)) caliber = '.452 / 45 Colt';
      else if (combinedText.match(/\.451|\.45\s*ACP|\.45\s*AUTO/)) caliber = '.451 / 45 Auto';
      else if (combinedText.match(/\.45\s*CAL/)) caliber = '.45 Caliber';
      else if (combinedText.match(/\.44\s*MAG|\.44\s*SPL|\.44\s*CAL|\.430/)) caliber = '.430 / 44 Cal';
      else if (combinedText.match(/10MM|\.400/)) caliber = '10mm / .400';
    } else {
      const calibers = [{ match: '9MM', val: '9mm Luger' }, { match: '.223', val: '.223 Rem' }, { match: '5.56', val: '5.56 NATO' }, { match: '.308', val: '.308 Win' }, { match: '7.62', val: '7.62x51' }, { match: '300 BLK', val: '.300 Blackout' }, { match: '.45 ACP', val: '.45 ACP' }, { match: '10MM', val: '10mm Auto' }, { match: '.380', val: '.380 ACP' }, { match: '6.5 CREEDMOOR', val: '6.5 Creedmoor' }, { match: '12 GA', val: '12 Gauge' }, { match: '.243', val: '.243 Win' }];
      for (const c of calibers) {
        if (combinedText.includes(c.match)) { caliber = c.val; break; }
      }
    }

    const bTypes = [
      'ELD Match', 'ELD-X', 'MatchKing', 'Tipped MatchKing', 'GameKing', 'GameChanger', 'BlitzKing', 'Pro-Hunter',
      'AccuBond Long Range', 'AccuBond', 'Ballistic Silvertip', 'Ballistic Tip', 'Custom Competition', 'E-Tip', 'Varmageddon',
      'Gold Dot G2', 'Gold Dot', 'Grand Slam', 'DeepCurl', 'Hot-Cor', 'TNT',
      'TTSX', 'TSX', 'LRX', 'TAC-TX', 'TAC-X', 'TAC-XP', 'Varmint Grenade',
      'Critical Defense', 'Critical Duty', 'FlexLock', 'FTX', 'V-Max', 'A-Max', 'XTP Mag', 'XTP', 'SST', 'MonoFlex', 'Sub-X', 'InterLock', 'InterBond',
      'Hydra-Shok Deep', 'Hydra-Shok', 'HST', 'Punch', 'Syntech', 'Terminal Ascent', 'Trophy Bonded', 'Trophy Copper', 'Edge TLR', 'Guard Dog', 'Power-Shok', 'HammerDown', 'Fusion',
      'Core-Lokt Tipped', 'Core-Lokt', 'Golden Saber', 'AccuTip', 'Premier Match',
      'Ranger T-Series', 'Ranger T', 'Defender', 'Power-Point', 'Deer Season XP', 'Extreme Point', 'Copper Impact', 'Silvertip',
      'Hybrid Target', 'Hybrid OTM', 'Elite Hunter', 'Classic Hunter', 'VLD',
      'Scenar-L', 'Scenar', 'Naturalis', 'Mega', 'Oryx', 'Tipstrike', 'Ecostrike', 'Bondstrike', 'Vulkan',
      'Xtreme Penetrator', 'Xtreme Defender', 'Controlled Chaos', 'Maximum Expansion', 'HoneyBadger', 'TUI',
      'V-Crown', 'SCHP', 'Scirocco II', 'Scirocco', 'A-Frame',
      'FMJBT', 'BTHP', 'HPBT', 'OTM', 'FMJ', 'JHP', 'PHP', 'CPHP', 'CPRN', 'TMJ', 'JSP', 'SJHP', 'SJSP', 'SP', 'HP', 'LRN', 'LSWC', 'SWC', 'WC', 'LFN', 'RNFP', 'FP', 'FN',
      'Frangible', 'Subsonic', 'Tracer', 'Green Tip', 'Black Tip'
    ];
    for (const bt of bTypes) {
      const displayBt = bt === 'HPBT' ? 'BTHP' : bt;
      const regex = new RegExp(`\\b${escapeRegExp(bt)}\\b`, 'i');
      if (regex.test(combinedText) || (bt === 'SP' && combinedText.includes('SPIRE POINT'))) {
        bulletType = displayBt;
        break;
      }
    }

    // Guess default quantities for components if not explicitly found
    let finalCount = count;
    if (!finalCount) {
      if (type === 'Powder') finalCount = 1;
      else if (type === 'Primer') {
        if (combinedText.match(/\b100\b/)) finalCount = 100;
        else if (combinedText.match(/\b5000\b/)) finalCount = 5000;
        else finalCount = 1000; // Default to standard brick
      } else if (type === 'Bullet' || type === 'Brass') {
        if (combinedText.match(/\b(?:100|250|500|1000)\b/)) {
           const match = combinedText.match(/\b(100|250|500|1000)\b/);
           if (match) finalCount = parseInt(match[1]);
        }
      }
    }

    let cleanName = decodedTitle
      .replace(/\b\d{6,}\b/g, '') // Remove long UPCs/SKUs
      .replace(/\b(?:\d+-)+\d+\b/g, '') // Remove part numbers with dashes
      .replace(/\b(?:Reloading|Component|Components|Rfl Powder|Powder)\b/ig, '') // Remove redundant keywords
      .replace(/\b(?:Sports South|Sports South Llc|Davidsons|Lipseys|Zanders|RSR Group|Llc|Inc)\b/ig, '') // Remove distributors from title
      .replace(/\bHodg\b/ig, 'Hodgdon')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Capitalize manufacturer if present in name (e.g. Cci -> CCI)
    if (decodedBrand) {
      const brandRegex = new RegExp(`\\b${escapeRegExp(decodedBrand)}\\b`, 'i');
      cleanName = cleanName.replace(brandRegex, decodedBrand);
    }

    result.parsedComponent = {
      type: type || 'Powder',
      manufacturer: decodedBrand,
      name: cleanName,
      caliber,
      grain,
      weightUnit,
      primerType,
      isMagnumPrimer,
      bulletType,
      quantity: finalCount,
      cost: foundCost
    };
  } else if (category === 'ammo') {
    let caliber: string | undefined;
    let projectile: string | undefined;

    const uniqueCalibers = Array.from(new Set(ammoList.map(a => a.caliber).filter(Boolean))) as string[];
    const defaultCalibers = [
      '.22 LR', '.22 Long Rifle', '.22 WMR', '.17 HMR',
      '9mm Luger', '9mm', '5.56 NATO', '.223 Rem', '.308 Win', '7.62x39', '7.62x51',
      '.45 ACP', '.40 S&W', '.380 ACP', '10mm Auto', '.38 Special', '.357 Magnum', '.44 Magnum', '.45 Colt',
      '6.5 Creedmoor', '.30-06 Springfield', '.300 Blackout', '.30-30 Win', '.270 Win', '7mm Rem Mag', '.300 Win Mag',
      '12 Gauge', '20 Gauge', '16 Gauge', '28 Gauge', '.410 Bore'
    ];
    const allCalibers = Array.from(new Set([...uniqueCalibers, ...defaultCalibers]));
    allCalibers.sort((a, b) => b.length - a.length);
    for (const cal of allCalibers) {
      const rawCal = cal.startsWith('.') ? cal.slice(1) : cal;
      const flexibleCal = '(?:\\.)?' + rawCal.split('').map(escapeRegExp).join('\\s*');
      const regex = new RegExp(`(?:^|\\W|_)${flexibleCal}(?:\\W|_|$)`, 'i');
      if (regex.test(textForCaliber)) {
        caliber = cal === '.22 Long Rifle' ? '.22 LR' : cal;
        break;
      }
    }

    const uniqueProjectiles = Array.from(new Set(ammoList.map(a => a.projectile).filter(Boolean))) as string[];
    uniqueProjectiles.sort((a, b) => b.length - a.length);
    for (const proj of uniqueProjectiles) {
      const regex = new RegExp(`\\b${escapeRegExp(proj)}\\b`, 'i');
      if (regex.test(combinedText)) {
        projectile = proj;
        break;
      }
    }
    if (!projectile) {
      const commonProjectiles = [
        'ELD Match', 'ELD-X', 'MatchKing', 'Tipped MatchKing', 'GameKing', 'GameChanger', 'BlitzKing', 'Pro-Hunter',
        'AccuBond Long Range', 'AccuBond', 'Ballistic Silvertip', 'Ballistic Tip', 'Custom Competition', 'E-Tip', 'Varmageddon',
        'Gold Dot G2', 'Gold Dot', 'Grand Slam', 'DeepCurl', 'Hot-Cor', 'TNT',
        'TTSX', 'TSX', 'LRX', 'TAC-TX', 'TAC-X', 'TAC-XP', 'Varmint Grenade',
        'Critical Defense', 'Critical Duty', 'FlexLock', 'FTX', 'V-Max', 'A-Max', 'XTP Mag', 'XTP', 'SST', 'MonoFlex', 'Sub-X', 'InterLock', 'InterBond',
        'Hydra-Shok Deep', 'Hydra-Shok', 'HST', 'Punch', 'Syntech', 'Terminal Ascent', 'Trophy Bonded', 'Trophy Copper', 'Edge TLR', 'Guard Dog', 'Power-Shok', 'HammerDown', 'Fusion',
        'Core-Lokt Tipped', 'Core-Lokt', 'Golden Saber', 'AccuTip', 'Premier Match',
        'Ranger T-Series', 'Ranger T', 'Defender', 'Power-Point', 'Deer Season XP', 'Extreme Point', 'Copper Impact', 'Silvertip',
        'Hybrid Target', 'Hybrid OTM', 'Elite Hunter', 'Classic Hunter', 'VLD',
        'Scenar-L', 'Scenar', 'Naturalis', 'Mega', 'Oryx', 'Tipstrike', 'Ecostrike', 'Bondstrike', 'Vulkan',
        'Xtreme Penetrator', 'Xtreme Defender', 'Controlled Chaos', 'Maximum Expansion', 'HoneyBadger', 'TUI',
        'V-Crown', 'SCHP', 'Scirocco II', 'Scirocco', 'A-Frame',
        'FMJBT', 'BTHP', 'HPBT', 'OTM', 'FMJ', 'JHP', 'PHP', 'CPHP', 'CPRN', 'TMJ', 'JSP', 'SJHP', 'SJSP', 'SP', 'HP', 'LRN', 'LSWC', 'SWC', 'WC', 'LFN', 'RNFP', 'FP', 'FN',
        'Buckshot', 'Rifled Slug', 'Sabot Slug', 'Slug', 'Frangible', 'Subsonic', 'Tracer', 'Green Tip', 'Black Tip'
      ];
      commonProjectiles.sort((a, b) => b.length - a.length);
      for (const proj of commonProjectiles) {
        const regex = new RegExp(`\\b${escapeRegExp(proj)}\\b`, 'i');
        if (regex.test(combinedText)) {
          const expandedMatch = uniqueProjectiles.find(p => {
            const upperP = p.toUpperCase();
            const upperProj = proj.toUpperCase();
            return upperP === upperProj || upperP.startsWith(upperProj + ' ') || upperP.startsWith(upperProj + '(') || upperP.startsWith(upperProj + '-');
          });
          projectile = expandedMatch || proj;
          break;
        }
      }
    }

    if (!count) {
      const titleQtyMatch = decodedTitle.match(/(?:^|\s|\()(\d{1,3}(?:,\d{3})+|\d+)\s*[-/]?\s*(?:ROUNDS|RDS|ROUND|RD|PACK|PK|CT|COUNT|PCS|PIECES|BUCKET|TUB|BX)\b/i) ||
                            decodedTitle.match(/\b(20|25|50|100|200|250|300|325|333|500|525|555|1000|1200|1400|1500|2000|5000|1,000|1,200|1,400|1,500|2,000|5,000)\b/);
      if (titleQtyMatch) {
        count = parseInt(titleQtyMatch[1].replace(/,/g, ''), 10);
      }
    }

    let costPerRound: number | undefined;
    if (foundCost && count) {
      costPerRound = parseFloat((foundCost / count).toFixed(3));
    }

    result.parsedAmmo = {
      manufacturer: decodedBrand,
      grain,
      caliber,
      projectile,
      isPlusP: !!combinedText.match(/\+P|Plus\s*P/i),
      count,
      upc_match: decodedTitle,
      boxPrice: foundCost,
      costPerRound
    };
  }

  return result;
};
