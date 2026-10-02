import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync, statSync, createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, extname, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PDFDocument } from 'pdf-lib';
// @ts-expect-error plain ESM helper shared with the scripts/ folder
import { pruneUnused, referencedUrls, UPLOAD_FOLDERS } from './scripts/lib/uploads.mjs';
// @ts-expect-error plain ESM helper shared with the scripts/ folder
import { encodeVideo, posterFrame, probeVideo, compressFile, siteWeight, VIDEO_EXT } from './scripts/lib/media.mjs';

const ROOT = process.cwd();
const CONFIG_PATH = resolve(ROOT, 'src/data/portfolio.config.json');
const PUBLIC_DIR = resolve(ROOT, 'public');

/** Read a request body as a string. */
function readBody(req: any): Promise<string> {
  return new Promise((res, rej) => {
    let raw = '';
    req.on('data', (c: Buffer) => {
      raw += c;
      if (raw.length > 60e6) rej(new Error('payload too large (60 MB cap)')); // guard huge uploads
    });
    req.on('end', () => res(raw));
    req.on('error', rej);
  });
}

const ALLOWED_FOLDERS = new Set(['leadership', 'covers', 'visits', 'docs', 'cv', 'graduation', 'logos', 'videos', '']);
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']);
const DOC_EXT = new Set(['.pdf', '.pptx', '.ppt', '.docx', '.doc', '.xlsx', '.zip']);
/** Office formats that are turned into a PDF on upload (needs PowerPoint / Word on this machine). */
const OFFICE_EXT = new Set(['.pptx', '.ppt', '.docx', '.doc']);

/**
 * Convert an Office file to PDF next to it, via scripts/office-to-pdf.ps1.
 * Returns the PDF path, or null when the conversion is not possible — the
 * caller then keeps the original. Synchronous on purpose: uploads are rare,
 * and a deck takes a few seconds either way.
 */
function officeToPdf(file: string): string | null {
  const out = file.replace(/\.[^.]+$/, '.pdf');
  const r = spawnSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', resolve(ROOT, 'scripts/office-to-pdf.ps1'), '-In', file, '-Out', out],
    { encoding: 'utf8', timeout: 120_000, windowsHide: true },
  );
  if (r.status !== 0 || !existsSync(out)) {
    console.warn('  [admin] PDF conversion failed, keeping the original:', (r.stderr || '').trim().split('\n')[0]);
    return null;
  }
  return out;
}
const ALLOWED_EXT = new Set([...IMAGE_EXT, ...DOC_EXT]);

/**
 * Dev-only admin backend.
 *
 * `apply: 'serve'` means this plugin is ONLY active under `npm run dev`.
 * It is not part of `npm run build`, so the deployed site has no write API,
 * no admin endpoints, and no way for anyone to mutate your content.
 */
function adminApiPlugin(): Plugin {
  return {
    name: 'portfolio-admin-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (!url.startsWith('/__admin/')) return next();

        const json = (code: number, payload: unknown) => {
          res.statusCode = code;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        };

        try {
          // ---- health check ------------------------------------------------
          if (url === '/__admin/ping') return json(200, { ok: true });

          // ---- load current config ----------------------------------------
          if (url === '/__admin/config' && req.method === 'GET') {
            return json(200, {
              config: JSON.parse(readFileSync(CONFIG_PATH, 'utf8')),
              mtime: statSync(CONFIG_PATH).mtimeMs,
            });
          }

          // ---- persist config to disk --------------------------------------
          if (url === '/__admin/config' && req.method === 'POST') {
            const body = await readBody(req);
            const parsed = JSON.parse(body); // throws -> 400, so we never write junk

            // Accepts either a bare config or { config, baseMtime }.
            const incoming = parsed && parsed.config ? parsed.config : parsed;
            const baseMtime = parsed && parsed.config ? parsed.baseMtime : undefined;

            // Refuse to clobber edits made in another tab (or by a script) since
            // this client loaded the file — the caller gets the newer version back.
            if (typeof baseMtime === 'number' && existsSync(CONFIG_PATH)) {
              const current = statSync(CONFIG_PATH).mtimeMs;
              if (current - baseMtime > 1) {
                return json(409, {
                  error: 'config changed on disk since you loaded it',
                  config: JSON.parse(readFileSync(CONFIG_PATH, 'utf8')),
                  mtime: current,
                });
              }
            }

            writeFileSync(CONFIG_PATH, JSON.stringify(incoming, null, 2) + '\n', 'utf8');

            // A photo removed in the admin is gone from the config now — drop
            // the file too, so public/ only ever holds what the site shows.
            const pruned: string[] = pruneUnused(incoming, PUBLIC_DIR);
            if (pruned.length) console.log(`  [admin] removed ${pruned.length} unused upload(s):`, pruned.join(', '));

            return json(200, {
              ok: true,
              path: 'src/data/portfolio.config.json',
              mtime: statSync(CONFIG_PATH).mtimeMs,
              pruned,
            });
          }

          // ---- image upload (base64 data URL -> public/<folder>/) ----------
          if (url === '/__admin/upload' && req.method === 'POST') {
            const { filename, folder = 'leadership', dataUrl } = JSON.parse(await readBody(req));
            if (!ALLOWED_FOLDERS.has(folder)) return json(400, { error: 'bad folder' });

            const ext = extname(String(filename)).toLowerCase();
            if (!ALLOWED_EXT.has(ext)) return json(400, { error: `unsupported type ${ext}` });

            // strip any path components a filename might smuggle in
            const safeBase = basename(String(filename), ext).replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 60);
            const name = `${safeBase || 'image'}-${Date.now().toString(36)}${ext}`;

            const dir = folder ? resolve(PUBLIC_DIR, folder) : PUBLIC_DIR;
            if (!dir.startsWith(PUBLIC_DIR)) return json(400, { error: 'path escape' });
            mkdirSync(dir, { recursive: true });

            const b64 = String(dataUrl).split(',')[1] ?? '';
            const target = resolve(dir, name);
            writeFileSync(target, Buffer.from(b64, 'base64'));

            // decks and Word files are stored as PDF so the viewer can show
            // them inline; the Office original is dropped once the PDF exists
            let finalName = name;
            if (OFFICE_EXT.has(ext)) {
              const pdf = officeToPdf(target);
              if (pdf) {
                unlinkSync(target);
                finalName = basename(pdf);
                console.log(`  [admin] converted ${name} -> ${finalName}`);
              }
            }

            return json(200, { ok: true, url: folder ? `/${folder}/${finalName}` : `/${finalName}`, converted: finalName !== name });
          }

          // ---- video upload: raw body streamed to disk, then made web-ready ---
          // A phone clip is 50–300 MB of HEVC in a .MOV — far beyond the base64
          // JSON route's cap, and not playable in every browser. It is streamed
          // to a temp file and re-encoded to a 720p H.264 MP4 with a poster.
          if (url === '/__admin/upload-video' && req.method === 'POST') {
            const q = new URL(req.url ?? '', 'http://x').searchParams;
            const filename = q.get('filename') ?? 'video.mp4';
            const ext = extname(filename).toLowerCase();
            if (!VIDEO_EXT.has(ext)) return json(400, { error: `unsupported video type ${ext}` });

            const tmp = resolve(tmpdir(), `portfolio-upload-${Date.now().toString(36)}${ext}`);
            await new Promise<void>((res, rej) => {
              const out = createWriteStream(tmp);
              req.pipe(out);
              out.on('finish', () => res());
              out.on('error', rej);
              req.on('error', rej);
            });

            const dir = resolve(PUBLIC_DIR, 'videos');
            mkdirSync(dir, { recursive: true });
            const stem = `${basename(filename, ext).replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 50) || 'video'}-${Date.now().toString(36)}`;
            try {
              await encodeVideo(tmp, resolve(dir, stem + '.mp4'), { maxHeight: 720, crf: 27 });
              await posterFrame(resolve(dir, stem + '.mp4'), resolve(dir, stem + '.jpg'), 0.5);
            } finally {
              if (existsSync(tmp)) unlinkSync(tmp);
            }
            const info = await probeVideo(resolve(dir, stem + '.mp4'));
            console.log(`  [admin] video ${filename} -> videos/${stem}.mp4 (${Math.round(statSync(resolve(dir, stem + '.mp4')).size / 1024)} KB)`);
            return json(200, { ok: true, url: `/videos/${stem}.mp4`, poster: `/videos/${stem}.jpg`, duration: info?.duration ?? 0 });
          }

          // ---- video details (duration, size) -------------------------------
          if (url === '/__admin/video-info' && req.method === 'GET') {
            const q = new URL(req.url ?? '', 'http://x').searchParams.get('url') ?? '';
            const file = resolve(PUBLIC_DIR, q.replace(/^\//, ''));
            if (!file.startsWith(PUBLIC_DIR) || !existsSync(file)) return json(404, { error: 'not found' });
            return json(200, { ...(await probeVideo(file)), bytes: statSync(file).size });
          }

          // ---- trim / mute a video (writes a new file + poster) --------------
          if (url === '/__admin/video-edit' && req.method === 'POST') {
            const { url: vUrl, start = 0, end = 0, mute = false } = JSON.parse(await readBody(req));
            const file = resolve(PUBLIC_DIR, String(vUrl).replace(/^\//, ''));
            if (!file.startsWith(PUBLIC_DIR) || !existsSync(file)) return json(404, { error: 'not found' });
            const dir = resolve(file, '..');
            const stem = `${basename(file, extname(file)).replace(/-cut-[a-z0-9]+$/i, '').replace(/-[a-z0-9]{6,}$/i, '')}-cut-${Date.now().toString(36)}`;
            await encodeVideo(file, resolve(dir, stem + '.mp4'), { start: Number(start) || 0, end: Number(end) || 0, mute: Boolean(mute), maxHeight: 720, crf: 27 });
            await posterFrame(resolve(dir, stem + '.mp4'), resolve(dir, stem + '.jpg'), 0.5);
            const info = await probeVideo(resolve(dir, stem + '.mp4'));
            const rel = String(vUrl).replace(/[^/]+$/, '');
            return json(200, { ok: true, url: rel + stem + '.mp4', poster: rel + stem + '.jpg', duration: info?.duration ?? 0 });
          }

          // ---- site weight report --------------------------------------------
          if (url === '/__admin/weight' && req.method === 'GET') {
            const cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
            const report = siteWeight(PUBLIC_DIR, referencedUrls(cfg), UPLOAD_FOLDERS);
            // the app itself: JS + CSS of the last production build, if there is one
            let bundle = 0;
            const assetsDir = resolve(ROOT, 'dist/assets');
            if (existsSync(assetsDir)) {
              for (const f of readdirSync(assetsDir)) if (/\.(js|css)$/.test(f)) bundle += statSync(resolve(assetsDir, f)).size;
            }
            return json(200, { ...report, bundle });
          }

          // ---- compress one upload in place ----------------------------------
          if (url === '/__admin/compress' && req.method === 'POST') {
            const { url: fUrl } = JSON.parse(await readBody(req));
            const file = resolve(PUBLIC_DIR, String(fUrl).replace(/^\//, ''));
            if (!file.startsWith(PUBLIC_DIR) || !existsSync(file)) return json(404, { error: 'not found' });
            const result = await compressFile(file);
            console.log(`  [admin] compress ${fUrl}: ${result.before} -> ${result.after}`);
            return json(200, { ok: true, ...result });
          }

          // ---- how many pages does an uploaded PDF have? --------------------
          if (url === '/__admin/pdf-info' && req.method === 'GET') {
            const q = new URL(req.url ?? '', 'http://x').searchParams.get('url') ?? '';
            const file = resolve(PUBLIC_DIR, q.replace(/^\//, ''));
            if (!file.startsWith(PUBLIC_DIR) || !existsSync(file)) return json(404, { error: 'not found' });
            const doc = await PDFDocument.load(readFileSync(file), { ignoreEncryption: true });
            return json(200, { pages: doc.getPageCount() });
          }

          // ---- keep only a page range of a PDF (writes a new file) ----------
          if (url === '/__admin/split-pdf' && req.method === 'POST') {
            const { url: pdfUrl, from, to } = JSON.parse(await readBody(req));
            const file = resolve(PUBLIC_DIR, String(pdfUrl).replace(/^\//, ''));
            if (!file.startsWith(PUBLIC_DIR) || !existsSync(file)) return json(404, { error: 'not found' });

            const src = await PDFDocument.load(readFileSync(file), { ignoreEncryption: true });
            const n = src.getPageCount();
            const a = Math.max(1, Math.floor(Number(from)));
            const b = Math.min(n, Math.floor(Number(to)));
            if (!(a <= b)) return json(400, { error: `bad page range ${from}–${to} (document has ${n})` });

            const out = await PDFDocument.create();
            const pages = await out.copyPages(src, Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i));
            pages.forEach((pg) => out.addPage(pg));

            // "<name>-p1-3-<stamp>.pdf", next to the original
            const dir = resolve(file, '..');
            const stem = basename(file, '.pdf').replace(/-p\d+-\d+(-[a-z0-9]+)?$/i, '').replace(/-[a-z0-9]{6,}$/i, '');
            const name = `${stem}-p${a}-${b}-${Date.now().toString(36)}.pdf`;
            writeFileSync(resolve(dir, name), await out.save());
            const rel = String(pdfUrl).replace(/[^/]+$/, name);
            console.log(`  [admin] kept pages ${a}–${b} of ${basename(file)} -> ${name}`);
            return json(200, { ok: true, url: rel, pages: b - a + 1 });
          }

          // ---- list uploaded images ----------------------------------------
          if (url === '/__admin/images' && req.method === 'GET') {
            const out: { url: string; kind: 'image' | 'doc' }[] = [];
            for (const folder of ['leadership', 'covers', 'visits', 'docs', 'cv', 'graduation', 'logos']) {
              const dir = resolve(PUBLIC_DIR, folder);
              if (!existsSync(dir)) continue;
              for (const f of readdirSync(dir)) {
                const ext = extname(f).toLowerCase();
                if (!ALLOWED_EXT.has(ext)) continue;
                out.push({ url: `/${folder}/${f}`, kind: IMAGE_EXT.has(ext) ? 'image' : 'doc' });
              }
            }
            return json(200, { images: out.filter((f) => f.kind === 'image').map((f) => f.url), files: out });
          }

          // ---- delete an uploaded image ------------------------------------
          if (url === '/__admin/delete-image' && req.method === 'POST') {
            const { url: imgUrl } = JSON.parse(await readBody(req));
            const target = resolve(PUBLIC_DIR, String(imgUrl).replace(/^\//, ''));
            if (!target.startsWith(PUBLIC_DIR)) return json(400, { error: 'path escape' });
            if (existsSync(target)) unlinkSync(target);
            return json(200, { ok: true });
          }

          return json(404, { error: 'unknown admin route' });
        } catch (err) {
          return json(400, { error: (err as Error).message });
        }
      });

      const c = '\x1b[38;5;214m';
      const r = '\x1b[0m';
      server.httpServer?.once('listening', () => {
        setTimeout(() => {
          console.log(`\n  ${c}▸ Admin panel${r}  http://localhost:${server.config.server.port ?? 5173}/#/admin   ${c}(dev only)${r}\n`);
        }, 120);
      });
    },
  };
}

/**
 * The instant shell in index.html is painted before the app (and the config
 * inside it) has loaded, so the default theme chosen in the admin is written
 * into the HTML itself. A visitor's saved choice still overrides it at runtime.
 */
function defaultThemePlugin(): Plugin {
  return {
    name: 'portfolio-default-theme',
    transformIndexHtml(html) {
      try {
        const cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
        const theme = cfg.theme?.default === 'dark' ? 'dark' : 'light';
        // the loader bar takes the palette's accent colour
        const accent =
          cfg.theme?.palette === 'custom' && /^#[0-9a-f]{6}$/i.test(cfg.theme?.accent ?? '')
            ? cfg.theme.accent
            : cfg.theme?.palette === 'classic'
              ? '#f59e0b'
              : '#e8412a';
        return html
          .replace('<html lang="fr" data-theme="light">', `<html lang="fr" data-theme="${theme}"${theme === 'dark' ? ' class="dark"' : ''}>`)
          .replace('background: #e8412a;', `background: ${accent};`);
      } catch {
        return html;
      }
    },
  };
}

export default defineConfig({
  // '/' for a user page or a custom domain; '/<repo>/' for a project page.
  // The deploy workflow sets BASE_PATH automatically from the repository name.
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss(), adminApiPlugin(), defaultThemePlugin()],
  // honour a PORT assigned by the tooling, otherwise Vite's default
  server: { port: Number(process.env.PORT) || 5173 },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // React and the animation library change rarely: separate files download
        // in parallel with the app code and stay cached across deploys
        manualChunks(id) {
          if (/node_modules[\/](react|react-dom|scheduler)[\/]/.test(id)) return 'react';
          if (/node_modules[\/](framer-motion|motion-dom|motion-utils)[\/]/.test(id)) return 'motion';
        },
      },
    },
  },
  // the HEIC decoder is one self-contained ESM file with the wasm inlined;
  // pre-bundling it is slow and it only ever loads inside the admin's worker
  optimizeDeps: { exclude: ['libheif-js'] },
});
