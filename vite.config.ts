import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { resolve, extname, basename } from 'node:path';

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

const ALLOWED_FOLDERS = new Set(['leadership', 'covers', 'visits', 'docs', 'cv', '']);
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const DOC_EXT = new Set(['.pdf', '.pptx', '.ppt', '.docx', '.doc', '.xlsx', '.zip']);
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
            return json(200, {
              ok: true,
              path: 'src/data/portfolio.config.json',
              mtime: statSync(CONFIG_PATH).mtimeMs,
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
            writeFileSync(resolve(dir, name), Buffer.from(b64, 'base64'));

            return json(200, { ok: true, url: folder ? `/${folder}/${name}` : `/${name}` });
          }

          // ---- list uploaded images ----------------------------------------
          if (url === '/__admin/images' && req.method === 'GET') {
            const out: { url: string; kind: 'image' | 'doc' }[] = [];
            for (const folder of ['leadership', 'covers', 'visits', 'docs', 'cv']) {
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

export default defineConfig({
  // '/' for a user page or a custom domain; '/<repo>/' for a project page.
  // The deploy workflow sets BASE_PATH automatically from the repository name.
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss(), adminApiPlugin()],
  // honour a PORT assigned by the tooling, otherwise Vite's default
  server: { port: Number(process.env.PORT) || 5173 },
  build: { outDir: 'dist', sourcemap: false },
});
