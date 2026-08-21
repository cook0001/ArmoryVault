#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
const iconPath = path.join(rootDir, 'build', 'icon.png');

console.log('\n🔍 ========================================================');
console.log('       ArmoryVault Pre-Flight Release Verification');
console.log('========================================================\n');

let failedSteps = 0;

function runStep(name, checkFn) {
  process.stdout.write(`⏳ [CHECK] ${name}... `);
  try {
    const result = checkFn();
    console.log(`\x1b[32mPASSED\x1b[0m ${result ? `(${result})` : ''}`);
  } catch (err) {
    console.log(`\x1b[31mFAILED\x1b[0m`);
    console.error(`   👉 Error: ${err.message || err}`);
    failedSteps++;
  }
}

// 1. Package manifest verification
let pkg;
runStep('Package manifest (package.json)', () => {
  if (!fs.existsSync(pkgPath)) throw new Error('package.json not found');
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.version) throw new Error('Missing version in package.json');
  if (!pkg.main || !fs.existsSync(path.join(rootDir, pkg.main))) {
    throw new Error(`Electron main entry file '${pkg.main}' not found`);
  }
  return `v${pkg.version}`;
});

// 2. Build icon check
runStep('Application Icon asset (build/icon.png)', () => {
  if (!fs.existsSync(iconPath)) throw new Error('build/icon.png is missing');
  const stat = fs.statSync(iconPath);
  if (stat.size < 1000) throw new Error('build/icon.png appears empty or corrupted');
  return `${(stat.size / 1024).toFixed(1)} KB`;
});

// 3. CHANGELOG entry verification
runStep('CHANGELOG.md version documentation', () => {
  if (!fs.existsSync(changelogPath)) throw new Error('CHANGELOG.md not found');
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const cleanVersion = pkg.version.replace('-nightly.', '');
  const hasVersionHeader =
    changelog.includes(`[${pkg.version}]`) || changelog.includes(pkg.version);
  if (!hasVersionHeader) {
    console.warn(
      `\n   ⚠️  Warning: Current version ${pkg.version} not explicitly documented in CHANGELOG.md.`
    );
  }
  return `Checked`;
});

// 4. Git status check
runStep('Git working tree status', () => {
  const status = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf8' }).trim();
  if (status) {
    console.warn(
      `\n   ⚠️  Notice: Uncommitted changes present:\n   ${status.split('\n').join('\n   ')}`
    );
  }
  return status ? 'Working tree has modifications' : 'Clean';
});

// 5. Code Quality & Linter
runStep('Biome code quality & syntax check', () => {
  execSync('npx @biomejs/biome lint src/', { cwd: rootDir, stdio: 'pipe' });
  return 'Clean';
});

// 6. TypeScript Compilation & Vite Build
runStep('TypeScript compile & Vite production bundle', () => {
  execSync('npm run build', { cwd: rootDir, stdio: 'pipe' });
  return 'dist/ generated';
});

// 7. Vitest Test Suite
runStep('Vitest automated test suite', () => {
  execSync('npm test', { cwd: rootDir, stdio: 'pipe' });
  return 'All tests passed';
});

console.log('\n========================================================');
if (failedSteps === 0) {
  console.log('✅ \x1b[32mALL PRE-FLIGHT CHECKS PASSED!\x1b[0m');
  console.log(`📦 Ready for packaging or release tagging for v${pkg.version}`);
  console.log('========================================================\n');
  process.exit(0);
} else {
  console.log(`❌ \x1b[31m${failedSteps} CHECK(S) FAILED.\x1b[0m Fix issues before releasing.`);
  console.log('========================================================\n');
  process.exit(1);
}
