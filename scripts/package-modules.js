#!/usr/bin/env node
/**
 * scripts/package-modules.js
 *
 * Packages each standalone modular extension from `src/modules/<id>/`
 * into a distribution zip archive (`dist-modules/module-<id>.zip`)
 * along with `dist-modules/modules-index.json` for GitHub Release assets.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AdmZip = require('adm-zip');

const rootDir = path.resolve(__dirname, '..');
const modulesDir = path.join(rootDir, 'src', 'modules');
const outputDir = path.join(rootDir, 'dist-modules');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📦 Packaging ArmoryVault Modular Extensions for GitHub Releases...\n');

const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const appVersion = packageJson.version;

const moduleFolders = fs
  .readdirSync(modulesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory() && dirent.name !== 'registry')
  .map((dirent) => dirent.name);

const indexPayload = {
  appVersion,
  generatedAt: new Date().toISOString(),
  modules: {},
};

for (const modId of moduleFolders) {
  const modDir = path.join(modulesDir, modId);
  const manifestPath = path.join(modDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.warn(`⚠️ Skipping ${modId}: missing manifest.json`);
    continue;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const zip = new AdmZip();

  // Add all files from module directory
  zip.addLocalFolder(modDir, '');

  const zipFilename = `module-${modId}.zip`;
  const zipPath = path.join(outputDir, zipFilename);
  zip.writeZip(zipPath);

  const zipBuffer = fs.readFileSync(zipPath);
  const sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex');
  const sizeKb = (zipBuffer.length / 1024).toFixed(1);

  indexPayload.modules[modId] = {
    ...manifest,
    filename: zipFilename,
    sha256,
    sizeBytes: zipBuffer.length,
    sizeKb: `${sizeKb} KB`,
    downloadUrl: `https://github.com/cook0001/ArmoryVault/releases/download/v${appVersion}/${zipFilename}`,
  };

  console.log(
    `  ✓ ${manifest.name} (${manifest.id} v${manifest.version}) -> ${zipFilename} (${sizeKb} KB)`
  );
}

// Write catalog index
const indexPath = path.join(outputDir, 'modules-index.json');
fs.writeFileSync(indexPath, JSON.stringify(indexPayload, null, 2), 'utf8');

console.log(
  `\n✨ Successfully packaged ${Object.keys(indexPayload.modules).length} modules to dist-modules/`
);
console.log(`📄 Modules catalog generated at: dist-modules/modules-index.json\n`);
