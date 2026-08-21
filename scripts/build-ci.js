#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const tagName = process.env.TAG_NAME || process.env.GITHUB_REF_NAME || '';
const isPrereleaseInput = process.env.IS_PRERELEASE === 'true';

const isNightly =
  tagName.includes('nightly') ||
  tagName.includes('beta') ||
  tagName.includes('alpha') ||
  tagName.includes('rc') ||
  isPrereleaseInput;

console.log('========================================================');
console.log(`📦 CI Build Dispatch for tag: "${tagName}"`);
console.log(`🚀 Mode: ${isNightly ? 'NIGHTLY PREVIEW' : 'STABLE RELEASE'}`);
console.log('========================================================\n');

const command = isNightly ? 'npm run release:nightly' : 'npm run release:stable';
console.log(`Executing: ${command}\n`);

try {
  execSync(command, {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  });
  console.log('\n✅ Build & package completed successfully.');
} catch (err) {
  console.error('\n❌ Build execution failed:', err.message || err);
  process.exit(1);
}
