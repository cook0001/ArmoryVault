/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';

describe('Zip Archive Backup and Restore Engine', () => {
  let tempDir: string;
  let encPath: string;
  let photoDir: string;
  let docDir: string;
  let outputZipPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'armoryvault-zip-test-'));
    encPath = path.join(tempDir, 'firearms_inventory.enc');
    photoDir = path.join(tempDir, 'photos');
    docDir = path.join(tempDir, 'documents');
    outputZipPath = path.join(tempDir, 'backup.zip');

    fs.mkdirSync(photoDir, { recursive: true });
    fs.mkdirSync(docDir, { recursive: true });

    // Seed mock files
    fs.writeFileSync(encPath, JSON.stringify({
      vault: { salt: 'abc', iv: 'def', authTag: '123', encryptedMasterKey: '456' },
      encryptedData: 'dummy_encrypted_data',
      dataIv: 'dummy_iv',
      dataAuthTag: 'dummy_tag'
    }));

    fs.writeFileSync(path.join(photoDir, 'm1_garand.jpg'), 'fake-image-bytes');
    fs.writeFileSync(path.join(docDir, 'bill_of_sale.pdf'), 'fake-pdf-bytes');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('creates a complete zip archive containing enc database, photos, and documents', () => {
    const zip = new AdmZip();

    // 1. Add database
    expect(fs.existsSync(encPath)).toBe(true);
    zip.addLocalFile(encPath);

    // 2. Add photos
    const photos = fs.readdirSync(photoDir);
    for (const file of photos) {
      if (!file.startsWith('.')) {
        zip.addLocalFile(path.join(photoDir, file), 'photos');
      }
    }

    // 3. Add docs
    const docs = fs.readdirSync(docDir);
    for (const file of docs) {
      if (!file.startsWith('.')) {
        zip.addLocalFile(path.join(docDir, file), 'documents');
      }
    }

    zip.writeZip(outputZipPath);
    expect(fs.existsSync(outputZipPath)).toBe(true);

    // Verify zip archive contents
    const readZip = new AdmZip(outputZipPath);
    const entries = readZip.getEntries().map(e => e.entryName);

    expect(entries).toContain('firearms_inventory.enc');
    expect(entries).toContain('photos/m1_garand.jpg');
    expect(entries).toContain('documents/bill_of_sale.pdf');
  });
});
