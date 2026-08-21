#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const tag = `v${pkg.version}`;
const isNightly = tag.includes('nightly') || tag.includes('beta') || tag.includes('alpha');

console.log(
  `\n🏷️  Preparing to tag and publish release: ${tag} (${isNightly ? 'Nightly Preview' : 'Stable'})\n`
);

try {
  console.log('1. Running full pre-flight verification...');
  execSync('node scripts/verify-preflight.js', { cwd: rootDir, stdio: 'inherit' });

  console.log(`\n2. Creating annotated tag: ${tag}...`);
  // Remove local tag if exists
  try {
    execSync(`git tag -d ${tag}`, { cwd: rootDir, stdio: 'pipe' });
  } catch (_) {}

  execSync(
    `git tag -a ${tag} -m "ArmoryVault ${tag} (${isNightly ? 'Nightly Preview' : 'Stable Release'})"`,
    { cwd: rootDir, stdio: 'inherit' }
  );

  console.log(`\n3. Pushing tag ${tag} to GitHub...`);
  // Push with tag deletion fallback
  try {
    execSync(`git push origin :refs/tags/${tag}`, { cwd: rootDir, stdio: 'pipe' });
  } catch (_) {}
  execSync(`git push origin ${tag}`, { cwd: rootDir, stdio: 'inherit' });

  console.log(
    `\n🎉 Success! Tag ${tag} pushed to GitHub. Build & Release workflow is now running.\n`
  );
} catch (err) {
  console.error(`\n❌ Tagging failed: ${err.message || err}`);
  process.exit(1);
}
