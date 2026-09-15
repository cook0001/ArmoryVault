import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// Require CommonJS SkuDatabase directly
const SkuDatabase = require('../../electron/SkuDatabase');

describe('SkuDatabase Layer Tests', () => {
  let tempDir: string;
  let skuEncPath: string;
  let masterKey: Buffer;
  let vaultMeta: any;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'armoryvault-sku-test-'));
    skuEncPath = path.join(tempDir, 'skus_database.enc');

    masterKey = crypto.randomBytes(32);
    vaultMeta = {
      salt: crypto.randomBytes(16).toString('hex'),
      iv: crypto.randomBytes(12).toString('hex'),
      authTag: crypto.randomBytes(16).toString('hex'),
      encryptedMasterKey: 'mock-encrypted-key',
    };
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  });

  it('starts locked and returns empty object', () => {
    const db = new SkuDatabase(skuEncPath);
    expect(db.isLocked()).toBe(true);
    expect(db.getSkus()).toEqual({});
    expect(() => db.saveSkus({ '012345678901': { manufacturer: 'Winchester' } })).toThrow(
      'SKU database is locked'
    );
  });

  it('unlocks with masterKey and performs CRUD with AES-256-GCM persistence', () => {
    const db = new SkuDatabase(skuEncPath);
    db.unlock(masterKey, vaultMeta);
    expect(db.isLocked()).toBe(false);
    expect(db.getSkus()).toEqual({});

    // 1. Save SKU
    db.saveSkus({
      '020892212345': {
        category: 'ammo',
        manufacturer: 'Federal',
        caliber: '9mm Luger',
        count: 50,
      },
    });

    // Force flush to disk
    db.flushSync();
    expect(fs.existsSync(skuEncPath)).toBe(true);

    // 2. Read back from memory cache
    const cached = db.getSkus();
    expect(cached['020892212345']).toBeDefined();
    expect(cached['020892212345'].caliber).toBe('9mm Luger');

    // 3. Lock clears cache and keys
    db.lock();
    expect(db.isLocked()).toBe(true);
    expect(db.getSkus()).toEqual({});

    // 4. Unlock with fresh instance decrypts from disk
    const db2 = new SkuDatabase(skuEncPath);
    db2.unlock(masterKey, vaultMeta);
    const restored = db2.getSkus();
    expect(restored['020892212345']).toBeDefined();
    expect(restored['020892212345'].manufacturer).toBe('Federal');

    // 5. Delete SKU
    db2.deleteSku('020892212345');
    db2.flushSync();
    expect(db2.getSkus()['020892212345']).toBeUndefined();
  });

  it('supports exporting and importing catalog JSON', () => {
    const db = new SkuDatabase(skuEncPath);
    db.unlock(masterKey, vaultMeta);

    db.saveSkus({
      'UPC-100': { manufacturer: 'Hornady', caliber: '6.5 Creedmoor' },
      'UPC-200': { manufacturer: 'CCI', componentType: 'Primer' },
    });
    db.flushSync();

    const catalog = db.exportCatalogJson();
    expect(catalog.format).toBe('armoryvault_sku_catalog');
    expect(catalog.itemCount).toBe(2);
    expect(catalog.skus['UPC-100']).toBeDefined();

    // Create second database and import
    const secondPath = path.join(tempDir, 'second_skus.enc');
    const db2 = new SkuDatabase(secondPath);
    db2.unlock(masterKey, vaultMeta);

    db2.importCatalogJson(catalog, 'merge');
    expect(db2.getSkus()['UPC-100'].caliber).toBe('6.5 Creedmoor');
    expect(db2.getSkus()['UPC-200'].componentType).toBe('Primer');
  });

  it('updates vault metadata on password change without data corruption', () => {
    const db = new SkuDatabase(skuEncPath);
    db.unlock(masterKey, vaultMeta);

    db.saveSkus({
      'TEST-SKU': { manufacturer: 'Remington', count: 100 },
    });
    db.flushSync();

    const newVaultMeta = {
      ...vaultMeta,
      salt: crypto.randomBytes(16).toString('hex'),
    };

    db.updateVaultMeta(newVaultMeta, masterKey);

    // Verify written file contains new vaultMeta
    const fileContent = JSON.parse(fs.readFileSync(skuEncPath, 'utf8'));
    expect(fileContent.vault.salt).toBe(newVaultMeta.salt);

    // Verify data remains fully decryptable
    const db2 = new SkuDatabase(skuEncPath);
    db2.unlock(masterKey, newVaultMeta);
    expect(db2.getSkus()['TEST-SKU'].count).toBe(100);
  });
});
