#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

const pathsToClean = [
  'dist',
  'dist-electron',
  'node_modules/.vite',
  'coverage',
  '.tsbuildinfo',
  'tsconfig.tsbuildinfo',
  'tsconfig.node.tsbuildinfo',
  'vite.config.js',
  'vite.config.d.ts',
];

console.log('🧹 Cleaning transient build artifacts & cache...');

for (const target of pathsToClean) {
  const fullPath = path.join(rootDir, target);
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`   🗑️  Removed directory: ${target}`);
    } else {
      fs.rmSync(fullPath, { force: true });
      console.log(`   🗑️  Removed file: ${target}`);
    }
  }
}

console.log('\n✨ Workspace cleaned successfully.');
