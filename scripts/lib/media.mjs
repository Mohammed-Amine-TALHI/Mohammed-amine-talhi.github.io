/**
 * media.mjs — video, image and PDF processing for the dev-only admin.
 *
 * Everything here runs on your machine, never on the published site:
 *   - ffmpeg (bundled via the `ffmpeg-static` dev dependency) transcodes,
 *     trims and mutes videos, and grabs poster frames;
 *   - sharp recompresses photos in place;
 *   - pdf-lib + sharp shrink heavy PDFs by recompressing their embedded images.
 *
 * Compression always keeps the original when the result is not meaningfully
 * smaller, so pressing "Compress" twice can never make a file worse.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, renameSync, statSync, unlinkSync, readdirSync } from 'node:fs';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));

export const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
export const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v']);

/** Path of the bundled ffmpeg binary, or null if the dev dependency is missing. */
export function ffmpegPath() {
  try {
    const p = require('ffmpeg-static');
    return p && existsSync(p) ? p : null;
  } catch {
    return null;
  }
}

function run(cmd, args, { timeout = 20 * 60_000 } = {}) {
  return new Promise((res) => {
    const child = spawn(cmd, args, { windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d));
    child.stdout.on('data', () => {});
    const timer = setTimeout(() => child.kill(), timeout);
    child.on('close', (code) => {
      clearTimeout(timer);
      res({ code, stderr });
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      res({ code: -1, stderr: String(e) });
    });
  });
}

/** Duration (seconds) and frame size of a video, read from ffmpeg's banner. */
export async function probeVideo(file) {
  const ff = ffmpegPath();
  if (!ff) return null;
  const { stderr } = await run(ff, ['-hide_banner', '-i', file], { timeout: 30_000 });
  const d = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  const s = stderr.match(/Video:.*?(\d{2,5})x(\d{2,5})/);
  return {
    duration: d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : 0,
    width: s ? Number(s[1]) : 0,
    height: s ? Number(s[2]) : 0,
    hasAudio: /Audio:/.test(stderr),
  };
}

/**
 * Re-encode a video for the web: H.264 + AAC in an MP4 with the index up front
 * (so it starts playing before it has fully downloaded), capped at `maxHeight`.
 * `start` / `end` trim it; `mute` drops the audio track entirely.
 */
export async function encodeVideo(input, output, { start = 0, end = 0, mute = false, maxHeight = 720, crf = 27 } = {}) {
  const ff = ffmpegPath();
  if (!ff) throw new Error('ffmpeg is not installed — run `npm install`');
  const args = ['-y', '-hide_banner'];
  if (start > 0) args.push('-ss', String(start));
  args.push('-i', input);
  if (end > start) args.push('-t', String(end - start));
  args.push(
    '-vf', `scale=-2:'min(${maxHeight},ih)'`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
  );
  if (mute) args.push('-an');
  else args.push('-c:a', 'aac', '-b:a', '96k', '-ac', '2');
  args.push(output);
  const { code, stderr } = await run(ff, args);
  if (code !== 0 || !existsSync(output)) throw new Error('ffmpeg failed: ' + stderr.trim().split('\n').slice(-2).join(' '));
}

/** A JPEG still from the video, used as the tile behind the play button. */
export async function posterFrame(video, output, at = 0.5) {
  const ff = ffmpegPath();
  if (!ff) throw new Error('ffmpeg is not installed');
  const { code } = await run(ff, ['-y', '-hide_banner', '-ss', String(at), '-i', video, '-frames:v', '1', '-vf', "scale=-2:'min(720,ih)'", '-q:v', '4', output], { timeout: 60_000 });
  if (code !== 0 || !existsSync(output)) throw new Error('could not grab a poster frame');
}

/** Swap `tmp` in for `file` only if it is at least 5 % smaller. Returns the bytes saved. */
function keepIfSmaller(file, tmp) {
  const before = statSync(file).size;
  const after = existsSync(tmp) ? statSync(tmp).size : before;
  if (after > 0 && after < before * 0.95) {
    unlinkSync(file);
    renameSync(tmp, file);
    return { before, after, saved: before - after };
  }
  if (existsSync(tmp)) unlinkSync(tmp);
  return { before, after: before, saved: 0 };
}

/** Recompress a photo in place: ≤ 2000 px on the long edge, same format. */
export async function compressImage(file) {
  const sharp = (await import('sharp')).default;
  const ext = extname(file).toLowerCase();
  const tmp = file + '.tmp';
  let img = sharp(readFileSync(file)).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true });
  if (ext === '.png') img = img.png({ compressionLevel: 9, palette: true, quality: 85 });
  else if (ext === '.webp') img = img.webp({ quality: 80 });
  else img = img.jpeg({ quality: 80, mozjpeg: true });
  await img.toFile(tmp);
  return keepIfSmaller(file, tmp);
}

/** Re-encode a video in place at a slightly lower bitrate; keeps trims and audio. */
export async function compressVideo(file) {
  const tmp = file.replace(/(\.[^.]+)$/, '.tmp.mp4');
  await encodeVideo(file, tmp, { maxHeight: 720, crf: 29 });
  return keepIfSmaller(file, tmp);
}

/**
 * Shrink a PDF by recompressing the pictures inside it.
 *
 * Almost all the weight of a brochure or a scanned report is its embedded
 * images, stored at print resolution. Each one is pulled out, capped at
 * `maxEdge` pixels and re-encoded as a good-quality JPEG; text, vectors and
 * fonts are not touched, so the pages stay perfectly sharp. Transparency masks
 * are kept as they are; CMYK and indexed-colour images are left alone.
 */
export async function compressPdf(file, { maxEdge = 1800, quality = 74 } = {}) {
  const { PDFDocument, PDFName, PDFRawStream, PDFNumber, PDFArray, PDFDict } = await import('pdf-lib');
  const sharp = (await import('sharp')).default;
  const zlib = await import('node:zlib');

  const doc = await PDFDocument.load(readFileSync(file), { ignoreEncryption: true, updateMetadata: false });
  const ctx = doc.context;
  const N = (k) => PDFName.of(k);
  const num = (dict, key) => dict.lookupMaybe(N(key), PDFNumber)?.asNumber();

  /** 3 for RGB-like, 1 for grey, 0 for anything we will not touch (CMYK, indexed…). */
  const channelsOf = (cs) => {
    if (cs === N('DeviceRGB') || cs === N('CalRGB')) return 3;
    if (cs === N('DeviceGray') || cs === N('CalGray')) return 1;
    if (cs instanceof PDFArray && cs.size() >= 2 && cs.get(0) === N('ICCBased')) {
      const profile = ctx.lookup(cs.get(1));
      const n = profile?.dict ? num(profile.dict, 'N') : 0;
      return n === 3 ? 3 : n === 1 ? 1 : 0;
    }
    return 0;
  };

  /** Undo the PNG row filters (Predictor 10–15) a FlateDecode image may carry. */
  const unpredict = (buf, columns, colors) => {
    const bpp = colors;
    const rowLen = columns * colors;
    const rows = Math.floor(buf.length / (rowLen + 1));
    const out = Buffer.alloc(rows * rowLen);
    for (let y = 0; y < rows; y++) {
      const ft = buf[y * (rowLen + 1)];
      const src = y * (rowLen + 1) + 1;
      const dst = y * rowLen;
      for (let x = 0; x < rowLen; x++) {
        const raw = buf[src + x];
        const a = x >= bpp ? out[dst + x - bpp] : 0;
        const b2 = y > 0 ? out[dst - rowLen + x] : 0;
        const c = x >= bpp && y > 0 ? out[dst - rowLen + x - bpp] : 0;
        let v;
        if (ft === 0) v = raw;
        else if (ft === 1) v = raw + a;
        else if (ft === 2) v = raw + b2;
        else if (ft === 3) v = raw + ((a + b2) >> 1);
        else {
          const p0 = a + b2 - c;
          const pa = Math.abs(p0 - a), pb = Math.abs(p0 - b2), pc = Math.abs(p0 - c);
          v = raw + (pa <= pb && pa <= pc ? a : pb <= pc ? b2 : c);
        }
        out[dst + x] = v & 255;
      }
    }
    return out;
  };

  // transparency masks are themselves grey images — never recompress those
  const masks = new Set();
  for (const [, obj] of ctx.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream && obj.dict.get(N('Subtype')) === N('Image')) {
      const m = obj.dict.get(N('SMask'));
      if (m) masks.add(ctx.lookup(m));
    }
  }

  for (const [, obj] of ctx.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream) || masks.has(obj)) continue;
    const dict = obj.dict;
    if (dict.get(N('Subtype')) !== N('Image')) continue;
    if (dict.get(N('Mask')) || dict.get(N('ImageMask'))) continue; // colour-key / stencil masks
    const smask = dict.get(N('SMask')) ? ctx.lookup(dict.get(N('SMask'))) : null;
    if (smask?.dict?.get(N('Matte'))) continue; // pre-multiplied alpha: colours depend on the mask

    const width = num(dict, 'Width');
    const height = num(dict, 'Height');
    if (!width || !height || width * height < 200 * 200) continue; // icons are not worth it

    let filter = dict.get(N('Filter'));
    if (filter instanceof PDFArray) filter = filter.size() === 1 ? filter.get(0) : null;

    let input;
    try {
      if (filter === N('DCTDecode')) {
        if (!channelsOf(dict.lookup(N('ColorSpace')))) continue; // CMYK JPEGs keep their profile
        input = sharp(Buffer.from(obj.contents));
      } else if (filter === N('FlateDecode')) {
        const channels = channelsOf(dict.lookup(N('ColorSpace')));
        if (num(dict, 'BitsPerComponent') !== 8 || !channels) continue;

        let raw = zlib.inflateSync(Buffer.from(obj.contents));
        let parms = dict.lookup(N('DecodeParms'));
        if (parms instanceof PDFArray) parms = parms.size() ? ctx.lookup(parms.get(0)) : undefined;
        if (parms instanceof PDFDict) {
          const predictor = num(parms, 'Predictor') ?? 1;
          if (predictor >= 10) raw = unpredict(raw, num(parms, 'Columns') ?? width, num(parms, 'Colors') ?? channels);
          else if (predictor !== 1) continue; // TIFF predictor: not handled
        }
        if (raw.length < width * height * channels) continue;
        input = sharp(raw.subarray(0, width * height * channels), { raw: { width, height, channels } });
      } else continue;

      const meta = await input.metadata();
      const grey = (meta.channels ?? 3) === 1;
      const { data, info } = await input
        .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
        .toColourspace(grey ? 'b-w' : 'srgb')
        .jpeg({ quality, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

      if (data.length >= obj.contents.length * 0.9) continue; // not worth replacing

      const next = dict.clone(ctx);
      next.set(N('Filter'), N('DCTDecode'));
      next.set(N('ColorSpace'), N(grey ? 'DeviceGray' : 'DeviceRGB'));
      next.set(N('BitsPerComponent'), PDFNumber.of(8));
      next.set(N('Width'), PDFNumber.of(info.width));
      next.set(N('Height'), PDFNumber.of(info.height));
      next.set(N('Length'), PDFNumber.of(data.length));
      next.delete(N('DecodeParms'));
      next.delete(N('Decode'));
      obj.contents = data;
      obj.dict = next;
    } catch {
      // an image sharp cannot read is simply kept as it is
    }
  }

  const tmp = file + '.tmp';
  writeFileSync(tmp, await doc.save({ useObjectStreams: true }));
  return keepIfSmaller(file, tmp);
}

/** Dispatch on the file type. */
export async function compressFile(file) {
  const ext = extname(file).toLowerCase();
  if (IMAGE_EXT.has(ext)) return compressImage(file);
  if (ext === '.pdf') return compressPdf(file);
  if (VIDEO_EXT.has(ext)) return compressVideo(file);
  throw new Error('nothing to compress for ' + ext);
}

/* -------------------------------------------------------------------------- */
/*  Site weight                                                               */
/* -------------------------------------------------------------------------- */

/** Above these sizes a file is flagged as slowing the page down. */
export const BUDGET = {
  image: 450 * 1024, // a photo the page shows or preloads
  pdf: 6 * 1024 * 1024, // opened on click, but still a long wait on 4G
  video: 20 * 1024 * 1024,
  /** photos visible on the page itself: covers, portrait, logo, graduation, visits */
  eagerTotalFast: 5 * 1024 * 1024,
  eagerTotalSlow: 10 * 1024 * 1024,
};

const kindOf = (ext) => (IMAGE_EXT.has(ext) || ext === '.gif' || ext === '.avif' || ext === '.svg' ? 'image' : ext === '.pdf' ? 'pdf' : VIDEO_EXT.has(ext) ? 'video' : 'other');

/** Places whose photo is painted on the page itself, not inside a pop-up. */
const ON_PAGE = /^(project cover|profile photo|school logo|graduation$|leadership cover|visits|visit photo)/;

/**
 * Every upload with its size, who uses it, and when the visitor pays for it:
 *   page       — painted on the page (covers, portrait, graduation, visits)
 *   background — gallery photos, warmed up on idle so pop-ups open instantly
 *   click      — documents and videos, fetched only when opened
 *   unused     — on disk but referenced nowhere
 */
export function siteWeight(publicDir, references, folders) {
  const usedBy = new Map();
  for (const r of references) {
    const list = usedBy.get(r.url) ?? [];
    list.push(r.where);
    usedBy.set(r.url, list);
  }
  const files = [];
  for (const folder of folders) {
    const dir = folder ? resolve(publicDir, folder) : publicDir;
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      const full = resolve(dir, f);
      const st = statSync(full);
      if (!st.isFile()) continue;
      const ext = extname(f).toLowerCase();
      const kind = kindOf(ext);
      if (kind === 'other') continue;
      const url = folder ? `/${folder}/${f}` : `/${f}`;
      const limit = BUDGET[kind];
      const users = usedBy.get(url) ?? [];
      const stage = !users.length ? 'unused' : kind !== 'image' ? 'click' : users.some((u) => ON_PAGE.test(u)) ? 'page' : 'background';
      files.push({
        url,
        kind,
        bytes: st.size,
        stage,
        eager: stage === 'page',
        heavy: st.size > limit,
        over: Math.max(0, st.size - limit),
        usedBy: users,
        compressible: kind !== 'image' || IMAGE_EXT.has(ext),
      });
    }
  }
  files.sort((a, b) => b.bytes - a.bytes);
  const sum = (list) => list.reduce((n, f) => n + f.bytes, 0);
  const eager = sum(files.filter((f) => f.eager));
  const status = eager <= BUDGET.eagerTotalFast ? 'fast' : eager <= BUDGET.eagerTotalSlow ? 'ok' : 'slow';
  return {
    status,
    total: sum(files),
    eager,
    background: sum(files.filter((f) => f.stage === 'background')),
    onDemand: sum(files.filter((f) => f.stage === 'click')),
    byKind: Object.fromEntries(['image', 'pdf', 'video'].map((k) => [k, sum(files.filter((f) => f.kind === k))])),
    heavy: files.filter((f) => f.heavy).length,
    budget: BUDGET,
    files,
  };
}
