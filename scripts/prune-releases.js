#!/usr/bin/env node

/**
 * ArmoryVault - Automated Release Pruning Engine
 *
 * Enforces the release retention policy:
 * - Keeps the 3 most current releases.
 * - Automatically prunes/deletes older superseded releases from GitHub.
 *
 * Usage:
 *   node scripts/prune-releases.js                     # Prune current repo (cook0001/ArmoryVault)
 *   node scripts/prune-releases.js --all               # Prune Desktop + Mobile Companion repos
 *   node scripts/prune-releases.js --repo owner/repo   # Prune specific repo
 *   node scripts/prune-releases.js --dry-run           # Preview without deleting
 *   node scripts/prune-releases.js --keep 3
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
    keep: 3,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--all') {
      options.all = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--repo' && args[i + 1]) {
      options.repo = args[++i];
    } else if ((arg === '--keep' || arg === '--keep-stable') && args[i + 1]) {
      options.keep = parseInt(args[++i], 10) || 3;
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
  console.log(`   Policy: Keep ${options.keep} Most Recent Official Releases`);
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

  const kept = published.slice(0, options.keep);
  const toDelete = published.slice(options.keep);

  console.log(`\n🟢 Retained Releases (${kept.length}/${options.keep}):`);
  kept.forEach((r) =>
    console.log(
      `     ✓ ${r.tagName} (${new Date(r.publishedAt || r.createdAt).toISOString().split('T')[0]})`
    )
  );

  if (toDelete.length === 0) {
    console.log(`\n✨ Repository ${repo} is already clean! No releases to prune.`);
    return { kept, deleted: [] };
  }

  console.log(`\n🔴 Superseded Releases to Prune (${toDelete.length}):`);
  toDelete.forEach((r) => {
    console.log(
      `     ✗ ${r.tagName} (${new Date(r.publishedAt || r.createdAt).toISOString().split('T')[0]})`
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

  return { kept, deleted: toDelete };
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
