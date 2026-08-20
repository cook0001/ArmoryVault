#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist-electron', 'nightly');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('⚡ Building ArmoryVault (NIGHTLY PREVIEW CHANNEL)...');
console.log(`📦 Output directory: dist-electron/nightly\n`);

const args = process.argv.slice(2);
const builderCommand = process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder';
const builderBin = path.join(rootDir, 'node_modules', '.bin', builderCommand);

const fullArgs = [
  ...args,
  '-c.directories.output=dist-electron/nightly'
];

const result = spawnSync(builderBin, fullArgs, {
  cwd: rootDir,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (result.error) {
  console.error('❌ Build failed to execute:', result.error);
  process.exit(1);
}

process.exit(result.status !== null ? result.status : 0);
