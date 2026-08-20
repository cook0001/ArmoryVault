const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('--- ArmoryVault Release Preparation ---');
console.log('Version Control Rules:');
console.log('Major: Significant Changes, New Features');
console.log('Minor: Small Changes, Bug Fixes');
console.log('Patch: Very Small Changes, Hotfixes');
console.log('Nightly: Pre-release preview / community test build\n');

rl.question('Is this a major, minor, patch, or nightly release? [major/minor/patch/nightly/cancel]: ', (answer) => {
  const type = answer.trim().toLowerCase();
  
  if (['major', 'minor', 'patch', 'nightly'].includes(type)) {
    console.log(`\nBumping ${type} version...`);
    try {
      if (type === 'nightly') {
        execSync('npm version prerelease --preid=nightly --no-git-tag-version', { stdio: 'inherit' });
      } else {
        execSync(`npm version ${type} --no-git-tag-version`, { stdio: 'inherit' });
      }
      
      console.log('\nRunning TypeScript checks to ensure build stability...');
      execSync('npm run build', { stdio: 'inherit' });
      
      console.log('\n✅ Build successful! Version bumped.');
      console.log('⚠️ IMPORTANT: Did you remember to update CHANGELOG.md?');
      console.log('Run `git commit -am "Release prep"` to finalize.');
    } catch (err) {
      console.error('\n❌ Release preparation failed.');
    }
  } else {
    console.log('Release preparation cancelled.');
  }
  
  rl.close();
});
