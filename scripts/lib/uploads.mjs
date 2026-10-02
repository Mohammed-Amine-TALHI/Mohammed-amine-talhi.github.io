/**
 * uploads.mjs — which files under public/ does the config actually use?
 *
 * Shared by `check-assets` (config → missing file), `prune-uploads`
 * (file → no config entry) and the dev-server save handler, so the three can
 * never disagree about where a path can live in portfolio.config.json.
 *
 * Add a new config field that holds a file path? Add it to `referencedUrls`
 * below, or the prune step will happily delete it.
 */
import { existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { resolve, extname } from 'node:path';

/** Folders the admin uploads into. Root ('') holds the profile photo. */
export const UPLOAD_FOLDERS = ['', 'covers', 'docs', 'cv', 'leadership', 'visits', 'graduation', 'logos', 'videos'];

/** Files at the public root that are part of the site, not uploads. */
const KEEP_ROOT = new Set(['favicon.svg', 'CNAME', 'robots.txt', '.nojekyll']);

const UPLOAD_EXT = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg',
  '.pdf', '.pptx', '.ppt', '.docx', '.doc', '.xlsx', '.zip',
  '.mp4', '.webm', '.mov', '.m4v',
]);

/** Every site-absolute path ("/covers/x.jpg") the config points at, with where it came from. */
export function referencedUrls(cfg) {
  const out = [];
  const note = (u, where) => {
    if (typeof u === 'string' && u.startsWith('/')) out.push({ url: u, where });
  };

  note(cfg.profile?.photo, 'profile photo');
  note(cfg.profile?.schoolLogo, 'school logo');
  note(cfg.profile?.resumeUrl, 'profile CV link');
  for (const l of ['en', 'fr']) note(cfg.cv?.[l]?.url, `CV ${l.toUpperCase()}`);

  for (const e of cfg.leadership ?? []) {
    const name = (e.title?.en || e.title?.fr || e.id || '').slice(0, 28);
    // only the first photo is on the card; the rest live in the journal pop-up
    (e.images ?? []).forEach((u, i) => note(u, `${i === 0 ? 'leadership cover' : 'leadership gallery'} · ${name}`));
    (e.assets ?? []).forEach((a) => note(a?.url, `leadership doc · ${name}`));
    for (const ev of e.events ?? []) (ev?.images ?? []).forEach((u) => note(u, `event · ${name}`));
  }
  for (const [id, m] of Object.entries(cfg.projectMeta ?? {})) {
    note(m?.cover, `project cover · ${id}`);
    (m?.gallery ?? []).forEach((u) => note(u, `project gallery · ${id}`));
    (m?.assets ?? []).forEach((a) => note(a?.url, `project doc · ${id}`));
    for (const v of m?.videos ?? []) {
      note(v?.url, `project video · ${id}`);
      note(v?.poster, `video poster · ${id}`);
    }
  }
  (cfg.visits?.images ?? []).forEach((u) => note(u, 'visits'));
  for (const v of Object.values(cfg.visits?.perVisit ?? {})) {
    (v?.images ?? []).forEach((u) => note(u, 'visit photo'));
    note(v?.url, 'visit link');
  }
  // the mosaic shows six; any further photo is only seen in the lightbox
  (cfg.graduation?.images ?? []).forEach((u, i) => note(u, i < 6 ? 'graduation' : 'graduation gallery'));
  for (const [k, p] of Object.entries(cfg.languageProof ?? {})) {
    (p?.images ?? []).forEach((u) => note(u, `language · ${k}`));
    (p?.assets ?? []).forEach((a) => note(a?.url, `language doc · ${k}`));
  }
  for (const s of cfg.skills ?? []) {
    (s?.assets ?? []).forEach((a) => note(a?.url, `skill · ${s.name}`));
  }
  return out;
}

/** Every upload currently on disk, as site-absolute paths. */
export function uploadedFiles(publicDir) {
  const out = [];
  for (const folder of UPLOAD_FOLDERS) {
    const dir = folder ? resolve(publicDir, folder) : publicDir;
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      const full = resolve(dir, f);
      if (!statSync(full).isFile()) continue;
      if (!folder && KEEP_ROOT.has(f)) continue;
      if (!UPLOAD_EXT.has(extname(f).toLowerCase())) continue;
      out.push(folder ? `/${folder}/${f}` : `/${f}`);
    }
  }
  return out;
}

/** Uploads on disk that nothing in the config points at any more. */
export function unusedUploads(cfg, publicDir) {
  const used = new Set(referencedUrls(cfg).map((r) => decodeURI(r.url)));
  return uploadedFiles(publicDir).filter((u) => !used.has(u));
}

/**
 * Delete the unused uploads. Returns the list removed. Paths are resolved
 * back under public/ and checked, so a hostile config value cannot reach
 * outside it.
 */
export function pruneUnused(cfg, publicDir) {
  const removed = [];
  for (const u of unusedUploads(cfg, publicDir)) {
    const target = resolve(publicDir, u.slice(1));
    if (!target.startsWith(publicDir)) continue;
    if (existsSync(target)) {
      unlinkSync(target);
      removed.push(u);
    }
  }
  return removed;
}
