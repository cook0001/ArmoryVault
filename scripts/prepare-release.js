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
console.log('Patch: Very Small Changes, Hotfixes\n');

rl.question('Is this a major, minor, or patch release? [major/minor/patch/cancel]: ', (answer) => {
  const type = answer.trim().toLowerCase();
  
  if (['major', 'minor', 'patch'].includes(type)) {
    console.log(`\nBumping ${type} version...`);
    try {
      execSync(`npm version ${type} --no-git-tag-version`, { stdio: 'inherit' });
      
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
