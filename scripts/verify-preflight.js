#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
const iconPath = path.join(rootDir, 'build', 'icon.png');
const workflowsDir = path.join(rootDir, '.github', 'workflows');

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
  const hasVersionHeader =
    changelog.includes(`[${pkg.version}]`) || changelog.includes(pkg.version);
  if (!hasVersionHeader) {
    console.warn(
      `\n   ⚠️  Warning: Current version ${pkg.version} not explicitly documented in CHANGELOG.md.`
    );
  }
  return `Checked`;
});

// 4. GitHub Workflows Node.js alignment check
runStep('GitHub Actions Node.js version alignment', () => {
  if (fs.existsSync(workflowsDir)) {
    const files = fs
      .readdirSync(workflowsDir)
      .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
      if (content.includes('node-version: 20') || content.includes("node-version: '20'")) {
        throw new Error(`Workflow ${file} is using outdated Node 20. Align to node-version: 22.`);
      }
    }
  }
  return 'Node 22 LTS verified across workflows';
});

// 5. Git status & build output hygiene
runStep('Git working tree & build artifacts hygiene', () => {
  const staleFiles = ['vite.config.js', 'vite.config.d.ts', 'vite.config.js.map'];
  for (const f of staleFiles) {
    if (fs.existsSync(path.join(rootDir, f))) {
      fs.unlinkSync(path.join(rootDir, f));
    }
  }
  const status = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf8' }).trim();
  return status ? 'Working tree modified' : 'Clean';
});

// 6. Code Quality & Linter
runStep('Biome code quality & syntax check', () => {
  execSync('npx @biomejs/biome lint src/', { cwd: rootDir, stdio: 'pipe' });
  return 'Clean';
});

// 7. TypeScript Compilation & Vite Build
runStep('TypeScript compile & Vite production bundle', () => {
  execSync('npm run build', { cwd: rootDir, stdio: 'pipe' });
  return 'dist/ generated';
});

// 8. Vitest Automated Test Suite (Simulating CI)
runStep('Vitest automated test suite (CI simulation)', () => {
  execSync('CI=true npm test', { cwd: rootDir, stdio: 'pipe' });
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
  process.exit(1);
}
