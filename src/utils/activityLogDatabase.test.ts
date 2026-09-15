import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const ActivityLogDatabase = require('../../electron/ActivityLogDatabase');

describe('ActivityLogDatabase Layer Tests', () => {
  let tempDir: string;
  let logEncPath: string;
  let masterKey: Buffer;
  let vaultMeta: any;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'av-log-test-'));
    logEncPath = path.join(tempDir, 'activity_log.enc');

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
    } catch {}
  });

  it('starts locked and returns empty list', () => {
    const db = new ActivityLogDatabase(logEncPath);
    expect(db.isLocked()).toBe(true);
    expect(db.getEntries()).toEqual([]);
    expect(db.addEntry({ action: 'create', type: 'firearm', detail: 'Colt Python' })).toBe(false);
  });

  it('unlocks, appends entries, and persists encrypted AES-256-GCM data', () => {
    const db = new ActivityLogDatabase(logEncPath);
    db.unlock(masterKey, vaultMeta);
    expect(db.isLocked()).toBe(false);
    expect(db.getEntries()).toEqual([]);

    db.addEntry({ action: 'create', type: 'firearm', detail: 'Colt Python 357' });
    db.addEntry({ action: 'update', type: 'ammo', detail: '9mm count +50' });

    // Force flush
    db.flushSync();

    // Verify encrypted file was created on disk
    expect(fs.existsSync(logEncPath)).toBe(true);
    const rawFile = JSON.parse(fs.readFileSync(logEncPath, 'utf8'));
    expect(rawFile.encryptedData).toBeDefined();
    expect(rawFile.dataIv).toBeDefined();
    expect(rawFile.dataAuthTag).toBeDefined();
    // Plaintext should not be in the file
    expect(JSON.stringify(rawFile)).not.toContain('Colt Python');

    // Fresh instance decrypts properly
    const freshDb = new ActivityLogDatabase(logEncPath);
    freshDb.unlock(masterKey, vaultMeta);
    const entries = freshDb.getEntries();
    expect(entries.length).toBe(2);
    expect(entries[0].detail).toBe('Colt Python 357');
    expect(entries[1].detail).toBe('9mm count +50');
    expect(entries[0].timestamp).toBeDefined();
  });

  it('caps entries at 1000 items', () => {
    const db = new ActivityLogDatabase(logEncPath);
    db.unlock(masterKey, vaultMeta);

    const initialEntries = [];
    for (let i = 0; i < 1050; i++) {
      initialEntries.push({ action: 'test', detail: `Log entry ${i}` });
    }
    db.saveEntries(initialEntries);

    const entries = db.getEntries();
    expect(entries.length).toBe(1000);
    // Should keep the most recent entries
    expect(entries[entries.length - 1].detail).toBe('Log entry 1049');
    expect(entries[0].detail).toBe('Log entry 50');
  });

  it('clears log on demand', () => {
    const db = new ActivityLogDatabase(logEncPath);
    db.unlock(masterKey, vaultMeta);

    db.addEntry({ action: 'create', detail: 'Item' });
    db.flushSync();
    expect(db.getEntries().length).toBe(1);

    db.clearLog();
    expect(db.getEntries().length).toBe(0);

    // Fresh instance also has 0 entries
    const freshDb = new ActivityLogDatabase(logEncPath);
    freshDb.unlock(masterKey, vaultMeta);
    expect(freshDb.getEntries().length).toBe(0);
  });
});
