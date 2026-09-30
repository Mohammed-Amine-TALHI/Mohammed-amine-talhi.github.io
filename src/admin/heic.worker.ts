/**
 * HEIC → JPEG, off the main thread.
 *
 * libheif (compiled to wasm) decodes an iPhone photo in one to three seconds
 * of pure CPU. Doing that on the main thread froze the admin for every file,
 * one after the other. In a worker the UI keeps responding, several files
 * decode at once on separate cores, and — the biggest saving — the picture
 * is downscaled to the site's maximum edge *before* it is JPEG-encoded, so we
 * never encode, transfer and re-decode a 12-megapixel intermediate.
 *
 * Message in:  { id, buffer, maxEdge, quality }   (buffer is transferred)
 * Message out: { id, ok: true, buffer, width, height } | { id, ok: false, error }
 */
// @ts-expect-error the wasm bundle ships without typings for this entry
import factory from 'libheif-js/libheif-wasm/libheif-bundle.mjs';

interface HeifImage {
  get_width(): number;
  get_height(): number;
  display(
    target: { data: Uint8ClampedArray; width: number; height: number },
    done: (result: { data: Uint8ClampedArray; width: number; height: number } | null) => void,
  ): void;
  free?(): void;
}
interface Libheif {
  HeifDecoder: new () => { decode(buf: Uint8Array): HeifImage[] };
  ready?: Promise<Libheif>;
}

let lib: Promise<Libheif> | null = null;
function getLib(): Promise<Libheif> {
  if (!lib) {
    lib = Promise.resolve(factory()).then(async (m: Libheif) => (m.HeifDecoder ? m : await m.ready!));
  }
  return lib;
}

self.onmessage = async (e: MessageEvent<{ id: number; buffer: ArrayBuffer; maxEdge: number; quality: number }>) => {
  const { id, buffer, maxEdge, quality } = e.data;
  try {
    const heif = await getLib();
    const images = new heif.HeifDecoder().decode(new Uint8Array(buffer));
    const image = images[0];
    if (!image) throw new Error('no image inside the HEIC container');

    const w = image.get_width();
    const h = image.get_height();
    const rgba = await new Promise<Uint8ClampedArray>((resolve, reject) => {
      image.display({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }, (out) =>
        out ? resolve(out.data) : reject(new Error('HEIF decode failed')),
      );
    });
    for (const im of images) im.free?.();

    // paint the pixels, then scale down in the same step if they are too big
    const full = new OffscreenCanvas(w, h);
    full.getContext('2d')!.putImageData(new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0);

    const scale = Math.min(1, maxEdge / Math.max(w, h));
    const width = Math.round(w * scale);
    const height = Math.round(h * scale);
    let out = full;
    if (scale < 1) {
      out = new OffscreenCanvas(width, height);
      const ctx = out.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(full, 0, 0, width, height);
    }

    const jpeg = await (await out.convertToBlob({ type: 'image/jpeg', quality })).arrayBuffer();
    (self as unknown as Worker).postMessage({ id, ok: true, buffer: jpeg, width, height }, [jpeg]);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, ok: false, error: (err as Error)?.message ?? String(err) });
  }
};
