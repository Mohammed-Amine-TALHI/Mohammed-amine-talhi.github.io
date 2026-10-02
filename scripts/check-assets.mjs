/**
 * check-assets.mjs — find config entries pointing at files that no longer exist.
 *
 *   node scripts/check-assets.mjs           report only
 *   node scripts/check-assets.mjs --prune   also drop the dead references
 *
 * Deleting an upload from public/ does not remove it from portfolio.config.json,
 * so the site keeps asking for a file that isn't there. That shows as a broken
 * image on the live page, which is why `npm run publish` refuses to ship it.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { referencedUrls } from './lib/uploads.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = resolve(ROOT, 'src/data/portfolio.config.json');
const PUBLIC = resolve(ROOT, 'public');

const prune = process.argv.includes('--prune');
const cfg = JSON.parse(readFileSync(CONFIG, 'utf8'));

const alive = (u) => !u || !u.startsWith('/') || existsSync(resolve(PUBLIC, u.slice(1)));
const dead = [];
const note = (u, where) => {
  if (u && u.startsWith('/') && !alive(u)) dead.push({ url: u, where });
};

// ---- walk everything that can hold a file path (see scripts/lib/uploads.mjs) ----
for (const r of referencedUrls(cfg)) note(r.url, r.where);

if (!dead.length) {
  console.log('\x1b[32m  ✓ every referenced file exists\x1b[0m');
  process.exit(0);
}

console.log(`\x1b[31m  ✗ ${dead.length} reference(s) point at files that no longer exist:\x1b[0m`);
for (const d of dead) console.log(`      ${d.where.padEnd(34)} -> ${d.url}`);

if (!prune) {
  console.log('\n  Re-upload them in the admin panel, or drop the dead links with:');
  console.log('  \x1b[38;5;214mnpm run fix-assets\x1b[0m\n');
  process.exit(1);
}

// ---- --prune: strip the dead references ----
const keep = (u) => alive(u);
if (!alive(cfg.profile?.photo)) cfg.profile.photo = '';
if (!alive(cfg.profile?.schoolLogo)) cfg.profile.schoolLogo = '';
if (cfg.graduation) cfg.graduation.images = (cfg.graduation.images ?? []).filter(keep);
for (const l of ['en', 'fr']) if (cfg.cv?.[l] && !alive(cfg.cv[l].url)) cfg.cv[l] = null;

for (const e of cfg.leadership ?? []) {
  e.images = (e.images ?? []).filter(keep);
  e.assets = (e.assets ?? []).filter((a) => keep(a.url));
  for (const ev of e.events ?? []) ev.images = (ev.images ?? []).filter(keep);
}
for (const m of Object.values(cfg.projectMeta ?? {})) {
  if (!alive(m.cover)) m.cover = '';
  if (m.assets) m.assets = m.assets.filter((a) => keep(a.url));
  if (m.videos) m.videos = m.videos.filter((v) => keep(v.url));
}
if (cfg.visits) {
  cfg.visits.images = (cfg.visits.images ?? []).filter(keep);
  for (const v of Object.values(cfg.visits.perVisit ?? {})) {
    if (v.images) v.images = v.images.filter(keep);
  }
}
for (const p of Object.values(cfg.languageProof ?? {})) {
  p.images = (p.images ?? []).filter(keep);
  p.assets = (p.assets ?? []).filter((a) => keep(a.url));
}
for (const s of cfg.skills ?? []) {
  if (s.assets) s.assets = s.assets.filter((a) => keep(a.url));
}

writeFileSync(CONFIG, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
console.log(`\n\x1b[32m  ✓ dropped ${dead.length} dead reference(s)\x1b[0m`);
console.log('    Re-upload anything you still want in the admin panel.\n');
