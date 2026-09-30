/**
 * prune-uploads.mjs — delete uploaded files the config no longer uses.
 *
 *   node scripts/prune-uploads.mjs          delete them
 *   node scripts/prune-uploads.mjs --dry    only list them
 *
 * The mirror image of check-assets: that one finds config entries whose file
 * is gone, this one finds files whose config entry is gone (a photo removed
 * in the admin, a replaced cover, a re-uploaded CV). The dev server runs the
 * same scan on every save, and `npm run publish` runs it before building, so
 * the repo never carries pictures the site doesn't show.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unusedUploads, pruneUnused } from './lib/uploads.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = resolve(ROOT, 'src/data/portfolio.config.json');
const PUBLIC = resolve(ROOT, 'public');

const dry = process.argv.includes('--dry');
const cfg = JSON.parse(readFileSync(CONFIG, 'utf8'));

const unused = unusedUploads(cfg, PUBLIC);
if (!unused.length) {
  console.log('\x1b[32m  ✓ every uploaded file is in use\x1b[0m');
  process.exit(0);
}

if (dry) {
  console.log(`\x1b[33m  ${unused.length} unused file(s):\x1b[0m`);
  for (const u of unused) console.log('      ' + u);
  console.log('\n  Delete them with:  \x1b[38;5;214mnpm run prune-uploads\x1b[0m\n');
  process.exit(0);
}

const removed = pruneUnused(cfg, PUBLIC);
console.log(`\x1b[32m  ✓ removed ${removed.length} unused file(s)\x1b[0m`);
for (const u of removed) console.log('      ' + u);
