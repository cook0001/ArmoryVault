/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { parseBarcodeData } from './BarcodeEngine';

describe('BarcodeEngine', () => {
  it('should correctly classify a known ammunition UPC', () => {
    const mockAmmoItem = {
      title: 'Winchester 9mm Luger 115 Grain FMJ 50 Rounds',
      brand: 'Winchester',
      description: '9mm target ammunition full metal jacket',
      offers: [{ price: '15.99', title: 'Winchester 9mm' }]
    };
    
    const result = parseBarcodeData(mockAmmoItem, []);
    expect(result.category).toBe('ammo');
    expect(result.parsedAmmo?.caliber).toBe('9mm Luger');
    expect(result.parsedAmmo?.grain).toBe(115);
    expect(result.parsedAmmo?.count).toBe(50);
    expect(result.foundCost).toBe(15.99);
  });

  it('should correctly classify a reloading powder UPC', () => {
    const mockPowderItem = {
      title: 'Hodgdon Varget Smokeless Powder 1 lb',
      brand: 'Hodgdon',
      description: 'Extruded rifle powder',
      offers: [{ price: '45.00', title: 'Hodgdon Varget 1 LB' }]
    };
    
    const result = parseBarcodeData(mockPowderItem, []);
    expect(result.category).toBe('component');
    expect(result.parsedComponent?.type).toBe('Powder');
    expect(result.parsedComponent?.weightUnit).toBe('lbs');
    expect(result.foundCost).toBe(45.00);
  });

  it('should correctly classify a primer UPC', () => {
    const mockPrimerItem = {
      title: 'CCI Small Rifle Primers #400 Box of 1000',
      brand: 'CCI',
      description: 'Standard small rifle primers',
      offers: [{ price: '85.50', title: 'CCI 400 SRP' }]
    };
    
    const result = parseBarcodeData(mockPrimerItem, []);
    expect(result.category).toBe('component');
    expect(result.parsedComponent?.type).toBe('Primer');
    expect(result.parsedComponent?.primerType).toBe('Small Rifle');
    expect(result.parsedComponent?.quantity).toBe(1000);
  });

  it('should correctly classify an accessory (optic) UPC', () => {
    const mockOpticItem = {
      title: 'Vortex Optics Crossfire II 2-7x32 Riflescope',
      brand: 'Vortex',
      description: 'Second focal plane V-Plex reticle optic',
      offers: [{ price: '129.99', title: 'Vortex Crossfire II Scope' }]
    };
    
    const result = parseBarcodeData(mockOpticItem, []);
    expect(result.category).toBe('accessory');
    expect(result.parsedAccessory?.type).toBe('Optic');
  });
  
  it('should correctly parse bulk 1,400 round bucket ammo UPC (047700415208)', () => {
    const mockRemingtonBucket = {
      title: 'Remington Golden Bullet .22 LR 36 Grain PHP 1,400 Rounds Bucket O Bullets',
      brand: 'Remington',
      description: 'High velocity 22 Long Rifle 36gr plated hollow point ammo 1,400 RD bucket',
      offers: [{ price: '89.99', title: 'Remington 22 LR 1,400 Rd' }]
    };
    
    const result = parseBarcodeData(mockRemingtonBucket, []);
    expect(result.category).toBe('ammo');
    expect(result.parsedAmmo?.manufacturer).toBe('Remington');
    expect(result.parsedAmmo?.caliber).toBe('.22 LR');
    expect(result.parsedAmmo?.grain).toBe(36);
    expect(result.parsedAmmo?.projectile).toBe('PHP');
    expect(result.parsedAmmo?.count).toBe(1400);
    expect(result.foundCost).toBe(89.99);
  });

  it('should correctly parse 1400 RD without comma', () => {
    const mockRemingtonItem = {
      title: 'Remington 21231 22 LR 36 GR PHP 1400 RD',
      brand: 'Remington',
      description: 'Plated Hollow Point 22LR 1400 rounds',
      offers: []
    };
    
    const result = parseBarcodeData(mockRemingtonItem, []);
    expect(result.category).toBe('ammo');
    expect(result.parsedAmmo?.caliber).toBe('.22 LR');
    expect(result.parsedAmmo?.count).toBe(1400);
  });

  it('should correctly classify and extract proprietary bullet types (Hornady ELD-X, Federal HST, Barnes TTSX, Speer Gold Dot)', () => {
    // 1. Hornady ELD-X 6.5 Creedmoor
    const eldxItem = {
      title: 'Hornady Precision Hunter 6.5 Creedmoor 143 Grain ELD-X 20 Rounds',
      brand: 'Hornady',
      description: 'Extremely Low Drag expanding match hunting ammunition',
      offers: [{ price: '42.99', title: 'Hornady 6.5 Creedmoor ELD-X' }]
    };
    const eldxResult = parseBarcodeData(eldxItem, []);
    expect(eldxResult.category).toBe('ammo');
    expect(eldxResult.parsedAmmo?.projectile).toBe('ELD-X');
    expect(eldxResult.parsedAmmo?.caliber).toBe('6.5 Creedmoor');
    expect(eldxResult.parsedAmmo?.grain).toBe(143);

    // 2. Federal HST 9mm Luger
    const hstItem = {
      title: 'Federal Premium Law Enforcement 9mm Luger 124 Grain HST Tactical JHP 50 Rounds',
      brand: 'Federal',
      description: 'Law enforcement tactical expanding hollow point ammunition',
      offers: [{ price: '34.99', title: 'Federal HST 9mm 124gr' }]
    };
    const hstResult = parseBarcodeData(hstItem, []);
    expect(hstResult.category).toBe('ammo');
    expect(hstResult.parsedAmmo?.projectile).toBe('HST');
    expect(hstResult.parsedAmmo?.caliber).toBe('9mm Luger');
    expect(hstResult.parsedAmmo?.count).toBe(50);

    // 3. Barnes TTSX Bullets (Reloading Component)
    const ttsxComponent = {
      title: 'Barnes Tipped Triple-Shock X (TTSX) Bullets .308 Caliber 168 Grain 50 Count',
      brand: 'Barnes',
      description: 'Lead-free copper hunting projectiles',
      offers: [{ price: '48.00', title: 'Barnes .308 TTSX 168gr' }]
    };
    const ttsxResult = parseBarcodeData(ttsxComponent, []);
    expect(ttsxResult.category).toBe('component');
    expect(ttsxResult.parsedComponent?.bulletType).toBe('TTSX');
    expect(ttsxResult.parsedComponent?.caliber).toBe('.308 / 30 Cal');
    expect(ttsxResult.parsedComponent?.grain).toBe(168);
    expect(ttsxResult.parsedComponent?.quantity).toBe(50);

    // 4. Speer Gold Dot 45 ACP
    const goldDotItem = {
      title: 'Speer Gold Dot Personal Protection .45 ACP 230 Grain 20 Rounds',
      brand: 'Speer',
      description: 'Uni-Cor bonded core handgun defense ammunition',
      offers: [{ price: '28.50', title: 'Speer Gold Dot 45 Auto' }]
    };
    const gdResult = parseBarcodeData(goldDotItem, []);
    expect(gdResult.category).toBe('ammo');
    expect(gdResult.parsedAmmo?.projectile).toBe('Gold Dot');
    expect(gdResult.parsedAmmo?.caliber).toBe('.45 ACP');
  });

  it('should fallback to unknown if the text contains no definitive keywords', () => {
    const mockUnknownItem = {
      title: 'Generic Metal Box',
      brand: 'Unknown',
      description: 'A box made of metal',
      offers: []
    };
    
    const result = parseBarcodeData(mockUnknownItem, []);
    expect(result.category).toBe('unknown');
  });
});
