#!/usr/bin/env node

/**
 * ArmoryVault - Automated Release Pruning Engine
 *
 * Enforces the release retention policy:
 * - Keeps exactly the 2 most current Stable releases.
 * - Keeps exactly the 1 most current Nightly (Pre-release) build.
 * - Automatically prunes/deletes any older superseded releases from GitHub.
 *
 * Usage:
 *   node scripts/prune-releases.js                     # Prune current repo (cook0001/ArmoryVault)
 *   node scripts/prune-releases.js --all               # Prune Desktop + Mobile Companion repos
 *   node scripts/prune-releases.js --repo owner/repo   # Prune specific repo
 *   node scripts/prune-releases.js --dry-run           # Preview without deleting
 *   node scripts/prune-releases.js --keep-stable 2 --keep-nightly 1
 */

const { execSync } = require('child_process');

const DEFAULT_DESKTOP_REPO = 'cook0001/ArmoryVault';
const DEFAULT_COMPANION_REPO = 'cook0001/ArmoryVault-Companion-App';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    repo: null,
    dryRun: false,
    keepStable: 2,
    keepNightly: 1,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--all') {
      options.all = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--repo' && args[i + 1]) {
      options.repo = args[++i];
    } else if (arg === '--keep-stable' && args[i + 1]) {
      options.keepStable = parseInt(args[++i], 10) || 2;
    } else if (arg === '--keep-nightly' && args[i + 1]) {
      options.keepNightly = parseInt(args[++i], 10) || 1;
    }
  }

  return options;
}

function fetchReleasesForRepo(repo) {
  try {
    const output = execSync(
      `gh release list --repo "${repo}" --limit 100 --json tagName,isPrerelease,isDraft,publishedAt,createdAt`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return JSON.parse(output || '[]');
  } catch (err) {
    console.error(`⚠️ Failed to fetch releases for ${repo}:`, err.message);
    return [];
  }
}

function pruneRepo(repo, options) {
  console.log(`\n======================================================`);
  console.log(`🔍 Checking Release Retention for: ${repo}`);
  console.log(`   Policy: Keep ${options.keepStable} Stable + ${options.keepNightly} Nightly`);
  if (options.dryRun) console.log(`   [DRY RUN MODE: No releases will be deleted]`);
  console.log(`======================================================`);

  const rawReleases = fetchReleasesForRepo(repo);
  if (!rawReleases || rawReleases.length === 0) {
    console.log(`ℹ️  No releases found in ${repo}.`);
    return { kept: [], deleted: [] };
  }

  // Filter out unpublished drafts
  const published = rawReleases.filter((r) => !r.isDraft);

  // Sort descending by published date / creation date
  published.sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const stableReleases = [];
  const nightlyReleases = [];

  for (const rel of published) {
    const tag = (rel.tagName || '').toLowerCase();
    const isPrerelease =
      rel.isPrerelease ||
      tag.includes('nightly') ||
      tag.includes('beta') ||
      tag.includes('alpha') ||
      tag.includes('rc');

    if (isPrerelease) {
      nightlyReleases.push(rel);
    } else {
      stableReleases.push(rel);
    }
  }

  const keptStable = stableReleases.slice(0, options.keepStable);
  const deleteStable = stableReleases.slice(options.keepStable);

  const keptNightly = nightlyReleases.slice(0, options.keepNightly);
  const deleteNightly = nightlyReleases.slice(options.keepNightly);

  console.log(`\n🟢 Retained Releases:`);
  console.log(`   Stable (${keptStable.length}/${options.keepStable}):`);
  keptStable.forEach((r) =>
    console.log(
      `     ✓ ${r.tagName} (${new Date(r.publishedAt || r.createdAt).toISOString().split('T')[0]})`
    )
  );

  console.log(`   Nightly (${keptNightly.length}/${options.keepNightly}):`);
  keptNightly.forEach((r) =>
    console.log(
      `     ✓ ${r.tagName} (${new Date(r.publishedAt || r.createdAt).toISOString().split('T')[0]})`
    )
  );

  const toDelete = [...deleteStable, ...deleteNightly];

  if (toDelete.length === 0) {
    console.log(`\n✨ Repository ${repo} is already clean! No releases to prune.`);
    return { kept: [...keptStable, ...keptNightly], deleted: [] };
  }

  console.log(`\n🔴 Superseded Releases to Prune (${toDelete.length}):`);
  toDelete.forEach((r) => {
    const type = r.isPrerelease || (r.tagName || '').includes('nightly') ? 'Nightly' : 'Stable';
    console.log(
      `     ✗ ${r.tagName} [${type}] (${new Date(r.publishedAt || r.createdAt).toISOString().split('T')[0]})`
    );
  });

  if (!options.dryRun) {
    console.log(`\n🗑️  Executing deletion on GitHub...`);
    for (const r of toDelete) {
      const tag = r.tagName;
      process.stdout.write(`   Deleting ${tag}... `);
      try {
        execSync(`gh release delete "${tag}" --repo "${repo}" --yes`, {
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        console.log(`✅ Deleted`);
      } catch (err) {
        console.log(`⚠️ Failed: ${err.message}`);
      }
    }
  } else {
    console.log(`\n[DRY RUN] Skipped actual deletion.`);
  }

  return { kept: [...keptStable, ...keptNightly], deleted: toDelete };
}

function main() {
  const options = parseArgs();

  console.log(`🚀 ArmoryVault Release Retention Tool`);
  console.log(`Time: ${new Date().toISOString()}`);

  const targetRepos = [];

  if (options.repo) {
    targetRepos.push(options.repo);
  } else if (options.all) {
    targetRepos.push(DEFAULT_DESKTOP_REPO, DEFAULT_COMPANION_REPO);
  } else {
    // Default to Desktop repo if in desktop repo or no repo specified
    targetRepos.push(DEFAULT_DESKTOP_REPO);
  }

  let totalDeleted = 0;
  for (const repo of targetRepos) {
    const res = pruneRepo(repo, options);
    totalDeleted += res.deleted.length;
  }

  console.log(`\n======================================================`);
  console.log(
    `🎉 All done! ${options.dryRun ? 'Identified' : 'Pruned'} ${totalDeleted} superseded releases.`
  );
  console.log(`======================================================\n`);
}

main();
