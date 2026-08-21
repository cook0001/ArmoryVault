#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

console.log('📝 Generating Changelog Draft from Git History...\n');

let lastTag = '';
try {
  lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null', {
    cwd: rootDir,
    encoding: 'utf8',
  }).trim();
} catch (_e) {
  lastTag = '';
}

const revisionRange = lastTag ? `${lastTag}..HEAD` : 'HEAD';
console.log(`Analyzing commits in range: \x1b[36m${revisionRange}\x1b[0m\n`);

let logOutput = '';
try {
  logOutput = execSync(`git log ${revisionRange} --pretty=format:"%s (%h)"`, {
    cwd: rootDir,
    encoding: 'utf8',
  }).trim();
} catch (err) {
  console.error('❌ Could not retrieve git log:', err.message);
  process.exit(1);
}

if (!logOutput) {
  console.log('ℹ️ No new commits found since last tag.');
  process.exit(0);
}

const lines = logOutput.split('\n').filter(Boolean);
const categories = {
  Features: [],
  'Bug Fixes': [],
  'Performance & Optimization': [],
  'Refactoring & Architecture': [],
  'Documentation & Chores': [],
  'Other Changes': [],
};

for (const line of lines) {
  const lower = line.toLowerCase();
  if (lower.startsWith('feat:') || lower.startsWith('feat(')) {
    categories['Features'].push(line.replace(/^feat(\([^)]+\))?:\s*/i, ''));
  } else if (lower.startsWith('fix:') || lower.startsWith('fix(')) {
    categories['Bug Fixes'].push(line.replace(/^fix(\([^)]+\))?:\s*/i, ''));
  } else if (lower.startsWith('perf:') || lower.startsWith('perf(')) {
    categories['Performance & Optimization'].push(line.replace(/^perf(\([^)]+\))?:\s*/i, ''));
  } else if (lower.startsWith('refactor:') || lower.startsWith('refactor(')) {
    categories['Refactoring & Architecture'].push(line.replace(/^refactor(\([^)]+\))?:\s*/i, ''));
  } else if (
    lower.startsWith('chore:') ||
    lower.startsWith('docs:') ||
    lower.startsWith('style:')
  ) {
    categories['Documentation & Chores'].push(
      line.replace(/^(chore|docs|style)(\([^)]+\))?:\s*/i, '')
    );
  } else {
    categories['Other Changes'].push(line);
  }
}

const today = new Date().toISOString().split('T')[0];
let markdown = `## [${pkg.version}] - ${today}\n\n`;

for (const [title, items] of Object.entries(categories)) {
  if (items.length > 0) {
    markdown += `### ${title}\n`;
    for (const item of items) {
      markdown += `- ${item}\n`;
    }
    markdown += '\n';
  }
}

console.log('------------------ [ CHANGELOG SNIPPET PREVIEW ] ------------------\n');
console.log(markdown);
console.log('-------------------------------------------------------------------');
console.log('💡 Tip: Copy and paste the snippet above into CHANGELOG.md before tagging.\n');
