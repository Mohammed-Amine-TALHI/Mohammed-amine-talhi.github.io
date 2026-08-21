/**
 * optimize-images.mjs — shrink oversized images already in public/.
 *
 *   npm run optimize-images          report what would change
 *   npm run optimize-images -- --write   actually rewrite them
 *
 * The admin panel downscales images in the browser as they are uploaded, so
 * this is for anything that predates that, or that was copied into public/ by
 * hand. Files are rewritten in place, keeping their filename, so nothing in
 * portfolio.config.json needs to change.
 *
 * `sharp` is a devDependency — it runs here and never reaches the built site.
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = resolve(ROOT, 'public');

const MAX_EDGE = 2000;
const QUALITY = 82;
/** Below this, re-encoding costs more clarity than it saves bytes. */
const MIN_BYTES = 400 * 1024;

const write = process.argv.includes('--write');
const IMAGE = /\.(jpe?g|png|webp)$/i;

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  amber: (s) => `\x1b[38;5;214m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
};
const mb = (n) => (n / 1024 / 1024).toFixed(2) + ' MB';

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (IMAGE.test(entry.name)) out.push(full);
  }
  return out;
}

const files = walk(PUBLIC);
let before = 0;
let after = 0;
let touched = 0;

for (const file of files) {
  const size = statSync(file).size;
  before += size;

  // Read into memory first. Handing sharp the path keeps a file handle open,
  // and writing the result back to that same path then fails on Windows.
  const input = readFileSync(file);
  const meta = await sharp(input).metadata();
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
  const oversized = longest > MAX_EDGE || size > MIN_BYTES;

  if (!oversized) {
    after += size;
    continue;
  }

  const buffer = await sharp(input)
    .rotate() // honour EXIF orientation before we discard the metadata
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();

  // never make a file bigger
  if (buffer.length >= size) {
    after += size;
    continue;
  }

  const rel = file.replace(PUBLIC, '').split(sep).join('/');
  console.log(
    `  ${c.amber(rel)}\n    ${meta.width}x${meta.height} ${mb(size)}  ->  ` +
      `${Math.min(MAX_EDGE, meta.width ?? 0)}px ${mb(buffer.length)}  ` +
      c.dim(`(-${Math.round((1 - buffer.length / size) * 100)}%)`),
  );

  if (write) writeFileSync(file, buffer);
  after += buffer.length;
  touched++;
}

console.log(
  `\n  ${files.length} image(s) · ${touched} oversized · ` +
    `${mb(before)} -> ${mb(after)} ` +
    c.dim(`(-${before ? Math.round((1 - after / before) * 100) : 0}%)`),
);

if (!write && touched) {
  console.log(`\n  Nothing was changed. Rewrite them with:`);
  console.log(`  ${c.amber('npm run optimize-images -- --write')}\n`);
} else if (write && touched) {
  console.log(`\n${c.green('  ✓ rewritten in place — filenames unchanged, config untouched')}\n`);
}
