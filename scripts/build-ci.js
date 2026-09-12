#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const tagName = process.env.TAG_NAME || process.env.GITHUB_REF_NAME || '';

console.log('========================================================');
console.log(`📦 CI Build Dispatch for tag: "${tagName}"`);
console.log(`🚀 Mode: OFFICIAL RELEASE`);
console.log('========================================================\n');

const command = 'npm run release';
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
