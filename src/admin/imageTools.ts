/**
 * Client-side image downscaling for the admin panel.
 *
 * A phone camera produces 6960x4640 files of 9–11 MB. Serving those straight to
 * a visitor is the single most expensive thing a portfolio can do — one photo
 * outweighs the entire JavaScript bundle many times over, and it lands hardest
 * on exactly the mobile connections that can least afford it.
 *
 * Every uploaded image is therefore resized to fit within `MAX_EDGE` and
 * re-encoded as JPEG before it leaves the browser. A 6960px photo becomes a
 * ~2000px one at roughly 3–5% of the original weight, with no visible
 * difference at the sizes this site actually displays (the largest is a
 * full-screen lightbox).
 *
 * Done with a canvas rather than a build-time library so there is no native
 * dependency to install, and so it works identically wherever the admin runs.
 */

/** Longest edge, in CSS pixels, after downscaling. */
export const MAX_EDGE = 2000;

/** JPEG quality. 0.82 is the usual sweet spot before artefacts show. */
export const QUALITY = 0.82;

/** Formats worth re-encoding. PNGs of screenshots benefit too. */
const RESIZABLE = /^image\/(jpeg|png|webp)$/i;

export interface Downscaled {
  dataUrl: string;
  filename: string;
  originalBytes: number;
  bytes: number;
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Bytes represented by a base64 data URL, near enough for reporting. */
export function dataUrlBytes(dataUrl: string): number {
  const b64 = dataUrl.split(',')[1] ?? '';
  return Math.round((b64.length * 3) / 4);
}

/**
 * Resize if the image is larger than MAX_EDGE, otherwise pass it through
 * untouched. Animated GIFs are never touched — a canvas would flatten them to
 * a single frame.
 */
export async function downscaleImage(input: File): Promise<Downscaled> {
  const { file, converted } = await fromHeic(input);
  const originalBytes = input.size;
  const passthrough = async (): Promise<Downscaled> => {
    const dataUrl = await readAsDataUrl(file);
    return { dataUrl, filename: file.name, originalBytes, bytes: dataUrlBytes(dataUrl) };
  };

  // a converted HEIC is already a right-sized JPEG — no second pass
  if (converted || !RESIZABLE.test(file.type)) return passthrough();

  const sourceUrl = await readAsDataUrl(file);
  let img: HTMLImageElement;
  try {
    img = await loadImage(sourceUrl);
  } catch {
    return passthrough(); // unreadable by the browser — let the server store it as-is
  }

  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (longest <= MAX_EDGE && originalBytes < 600_000) {
    return { dataUrl: sourceUrl, filename: file.name, originalBytes, bytes: dataUrlBytes(sourceUrl) };
  }

  const scale = Math.min(1, MAX_EDGE / longest);
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return passthrough();

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);

  // a re-encode that somehow grew is not worth keeping
  const bytes = dataUrlBytes(dataUrl);
  if (bytes >= originalBytes) return passthrough();

  // the stored file is now a JPEG whatever it started as
  const filename = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return { dataUrl, filename, originalBytes, bytes };
}

/** iPhone photos: .heic / .heif, which Chrome and Firefox cannot decode. */
export const isHeic = (file: File) =>
  /^image\/hei[cf]$/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

/* -------------------------------------------------------------------------- */
/*  HEIC worker pool                                                          */
/*                                                                            */
/*  One worker per spare core (capped at 4). Jobs are dealt round-robin and   */
/*  each worker runs its own queue, so a batch of eight iPhone photos decodes */
/*  four at a time instead of one after the other. The wasm decoder loads     */
/*  lazily, once per worker, the first time a HEIC is dropped.                */
/* -------------------------------------------------------------------------- */

type Job = { resolve: (r: { buffer: ArrayBuffer; width: number; height: number }) => void; reject: (e: Error) => void };

let pool: Worker[] | null = null;
let next = 0;
let seq = 0;
const jobs = new Map<number, Job>();

function workers(): Worker[] {
  if (pool) return pool;
  const n = Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 2) - 1));
  pool = Array.from({ length: n }, () => {
    const w = new Worker(new URL('./heic.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent) => {
      const { id, ok, buffer, width, height, error } = e.data;
      const job = jobs.get(id);
      if (!job) return;
      jobs.delete(id);
      ok ? job.resolve({ buffer, width, height }) : job.reject(new Error(error));
    };
    return w;
  });
  return pool;
}

/** Spin the workers up ahead of time so the first drop doesn't pay for the wasm load. */
export function warmHeicDecoder() {
  if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') workers();
}

/**
 * Convert a HEIC photo to a JPEG File, already downscaled to MAX_EDGE, so the
 * rest of the pipeline can store it as-is. Anything that isn't HEIC passes
 * straight through with `converted: false`.
 */
async function fromHeic(file: File): Promise<{ file: File; converted: boolean }> {
  if (!isHeic(file)) return { file, converted: false };

  const id = ++seq;
  const buffer = await file.arrayBuffer();
  const result = await new Promise<{ buffer: ArrayBuffer; width: number; height: number }>((resolve, reject) => {
    jobs.set(id, { resolve, reject });
    const ws = workers();
    const w = ws[next++ % ws.length];
    w.postMessage({ id, buffer, maxEdge: MAX_EDGE, quality: QUALITY }, [buffer]);
  });

  const name = file.name.replace(/\.hei[cf]$/i, '') + '.jpg';
  return {
    file: new File([result.buffer], name, { type: 'image/jpeg', lastModified: file.lastModified }),
    converted: true,
  };
}

export const formatBytes = (n: number) =>
  n >= 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';
