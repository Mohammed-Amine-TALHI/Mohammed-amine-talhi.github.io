import { useCallback, useEffect, useRef, useState } from 'react';
import { HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi';
import { Button } from './ui';

/* ---------------------------------------------------------------------------
   Privacy blur.

   Place soft round blurs over faces (or anything else) on a photo. Unlike the
   crop, this is deliberately DESTRUCTIVE: a blur that only lived in the config
   would leave the sharp original sitting in public/ for anyone to open, which
   defeats the point. So "Apply" bakes the blur into a new file, uploads it,
   and swaps every reference to the old URL for the new one; the sharp original
   is then deleted from public/ by the unused-file sweep on the next save.

   Each spot is stored in image-relative units while editing (centre in 0..1,
   radius as a fraction of the shorter side) so the preview canvas and the
   full-resolution export draw exactly the same thing.
--------------------------------------------------------------------------- */

export interface BlurSpot {
  id: number;
  /** round for faces; rectangle for text, logos, table columns */
  shape: 'round' | 'rect';
  x: number; // centre, 0..1 of width
  y: number; // centre, 0..1 of height
  r: number; // round: radius, fraction of the shorter side
  w: number; // rect: width, fraction of the image width
  h: number; // rect: height, fraction of the image height
  strength: number; // 0.15 (light) .. 1 (heavy)
  feather: number; // 0 (hard edge) .. 1 (fades from the centre)
}

const DEFAULT_SPOT = { r: 0.07, w: 0.22, h: 0.06, strength: 0.55, feather: 0.6 };

/** Paint the photo with every blur spot onto `ctx` at W×H. Shared by preview and export. */
function paint(ctx: CanvasRenderingContext2D, img: HTMLImageElement, spots: BlurSpot[], W: number, H: number) {
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0, W, H);

  const short = Math.min(W, H);
  for (const s of spots) {
    if (s.shape === 'rect') {
      const rw = s.w * W;
      const rh = s.h * H;
      const blur = Math.max(2, Math.min(rw, rh) * 0.35 * s.strength);
      // feather: how far the edge fades, up to a third of the short side
      const f = Math.min(rw, rh) * 0.33 * s.feather;
      const pad = Math.ceil(blur * 2 + f);
      const pw = Math.ceil(rw + pad * 2);
      const ph = Math.ceil(rh + pad * 2);
      const bx = Math.round(s.x * W - pw / 2);
      const by = Math.round(s.y * H - ph / 2);

      const patch = document.createElement('canvas');
      patch.width = pw;
      patch.height = ph;
      const p = patch.getContext('2d')!;
      p.filter = `blur(${blur}px)`;
      p.drawImage(img, -bx, -by, W, H);

      // keep a soft-edged rectangle of it
      p.globalCompositeOperation = 'destination-in';
      p.filter = f > 0.5 ? `blur(${f / 2}px)` : 'none';
      p.fillStyle = '#000';
      p.fillRect(pad + f / 2, pad + f / 2, rw - f, rh - f);
      p.filter = 'none';

      ctx.drawImage(patch, bx, by);
      continue;
    }

    const r = s.r * short;
    const blur = Math.max(1, r * 0.45 * s.strength);
    // the patch is larger than the circle so the blur has real pixels to pull from at its edge
    const pad = Math.ceil(blur * 2);
    const size = Math.ceil(r * 2 + pad * 2);
    const bx = Math.round(s.x * W - size / 2);
    const by = Math.round(s.y * H - size / 2);

    const patch = document.createElement('canvas');
    patch.width = size;
    patch.height = size;
    const p = patch.getContext('2d')!;
    p.filter = `blur(${blur}px)`;
    p.drawImage(img, -bx, -by, W, H);

    // keep only a soft disc of the blurred patch
    p.filter = 'none';
    p.globalCompositeOperation = 'destination-in';
    const g = p.createRadialGradient(size / 2, size / 2, r * (1 - s.feather), size / 2, size / 2, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    p.fillStyle = g;
    p.fillRect(0, 0, size, size);

    ctx.drawImage(patch, bx, by);
  }
}

export default function BlurEditor({
  src,
  onApply,
  onClose,
}: {
  src: string;
  /** receives the finished image as a data URL plus the filename to store it under */
  onApply: (dataUrl: string, filename: string) => Promise<void>;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [spots, setSpots] = useState<BlurSpot[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  /** the shape a click on empty space drops */
  const [mode, setMode] = useState<'round' | 'rect'>('round');
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const nextId = useRef(1);

  // load the photo once
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    img.src = src;
  }, [src]);

  // preview size: fit 760 × 520 without upscaling
  const img = imgRef.current;
  const scale = img ? Math.min(1, 760 / img.naturalWidth, 520 / img.naturalHeight) : 1;
  const W = img ? Math.round(img.naturalWidth * scale) : 0;
  const H = img ? Math.round(img.naturalHeight * scale) : 0;

  // redraw on every change
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !img) return;
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d')!;
    paint(ctx, img, spots, W, H);

    // selection ring — preview only, never exported
    const short = Math.min(W, H);
    for (const s of spots) {
      ctx.beginPath();
      if (s.shape === 'rect') ctx.rect((s.x - s.w / 2) * W, (s.y - s.h / 2) * H, s.w * W, s.h * H);
      else ctx.arc(s.x * W, s.y * H, s.r * short, 0, Math.PI * 2);
      ctx.setLineDash(s.id === sel ? [] : [5, 4]);
      // dark under-stroke so the outline shows on white screenshots too
      ctx.lineWidth = s.id === sel ? 3.5 : 2.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.stroke();
      ctx.lineWidth = s.id === sel ? 2 : 1;
      ctx.strokeStyle = s.id === sel ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)';
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }, [img, spots, sel, W, H, ready]);

  const at = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };

  /** Topmost spot under a point, if any. */
  const hit = useCallback(
    (x: number, y: number) => {
      const short = Math.min(W, H);
      for (let i = spots.length - 1; i >= 0; i--) {
        const s = spots[i];
        if (s.shape === 'rect') {
          if (Math.abs(x - s.x) <= s.w / 2 && Math.abs(y - s.y) <= s.h / 2) return s;
          continue;
        }
        const d = Math.hypot((x - s.x) * W, (y - s.y) * H);
        if (d <= s.r * short) return s;
      }
      return null;
    },
    [spots, W, H],
  );

  const onDown = (e: React.PointerEvent) => {
    const { x, y } = at(e);
    const s = hit(x, y);
    if (s) {
      setSel(s.id);
      drag.current = { id: s.id, dx: x - s.x, dy: y - s.y };
    } else {
      // click on empty space: drop a new blur there
      const id = nextId.current++;
      setSpots((list) => [...list, { id, shape: mode, x, y, ...DEFAULT_SPOT }]);
      setSel(id);
      drag.current = { id, dx: 0, dy: 0 };
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const { x, y } = at(e);
    const d = drag.current;
    setSpots((list) =>
      list.map((s) =>
        s.id === d.id ? { ...s, x: Math.min(1, Math.max(0, x - d.dx)), y: Math.min(1, Math.max(0, y - d.dy)) } : s,
      ),
    );
  };

  const onUp = () => {
    drag.current = null;
  };

  /** Scroll over the photo resizes the selected blur. */
  const onWheel = (e: React.WheelEvent) => {
    if (sel === null) return;
    const k = e.deltaY < 0 ? 1.08 : 0.92;
    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
    setSpots((list) =>
      list.map((s) =>
        s.id !== sel
          ? s
          : s.shape === 'rect'
            ? { ...s, w: clamp(s.w * k, 0.01, 1), h: clamp(s.h * k, 0.01, 1) }
            : { ...s, r: clamp(s.r * k, 0.015, 0.5) },
      ),
    );
  };

  const selected = spots.find((s) => s.id === sel) ?? null;
  const patch = (p: Partial<BlurSpot>) => setSpots((list) => list.map((s) => (s.id === sel ? { ...s, ...p } : s)));

  const apply = async () => {
    if (!img || !spots.length) return;
    setBusy(true);
    try {
      const out = document.createElement('canvas');
      out.width = img.naturalWidth;
      out.height = img.naturalHeight;
      paint(out.getContext('2d')!, img, spots, out.width, out.height);

      // keep PNG for PNG sources (transparency), JPEG otherwise
      const isPng = /\.png$/i.test(src);
      const dataUrl = out.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.9);
      const base = (src.split('/').pop() ?? 'photo').replace(/\.[^.]+$/, '').replace(/-blur$/, '').replace(/-[a-z0-9]{6,}$/i, '');
      await onApply(dataUrl, `${base}-blur${isPng ? '.png' : '.jpg'}`);
    } finally {
      setBusy(false);
    }
  };

  const Slider = ({
    label,
    value,
    min,
    max,
    onChange,
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
  }) => (
    <label className="flex items-center gap-3">
      <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={(max - min) / 100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink-800 accent-accent-500"
      />
    </label>
  );

  return (
    <div className="mt-4 rounded-xl border border-accent-500/30 bg-ink-950/60 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent-400">Privacy blur</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Click the photo to drop a blur · drag to move · scroll to resize · fine-tune with the sliders.
          </p>
          <div className="mt-2 inline-flex rounded-lg border border-line p-0.5 text-[11px]">
            {(['round', 'rect'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  'rounded-md px-2.5 py-1 transition-colors ' +
                  (mode === m ? 'bg-accent-500 text-[color:var(--on-accent)]' : 'text-zinc-400 hover:text-zinc-200')
                }
              >
                {m === 'round' ? '● Round — faces' : '▭ Rectangle — text, logos'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={apply} disabled={busy || !spots.length}>
            {busy ? 'Applying…' : `Apply ${spots.length || ''} blur${spots.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[auto_minmax(14rem,1fr)]">
        <div className="overflow-hidden rounded-lg border border-line bg-ink-900">
          {ready ? (
            <canvas
              ref={canvasRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onWheel={onWheel}
              style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
            />
          ) : (
            <div className="grid h-40 w-64 place-items-center font-mono text-[10px] text-zinc-600">loading…</div>
          )}
        </div>

        <div className="space-y-4">
          {selected ? (
            <div className="space-y-3 rounded-lg border border-line bg-ink-900 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-200">Selected blur</span>
                <button
                  onClick={() => {
                    setSpots((list) => list.filter((s) => s.id !== sel));
                    setSel(null);
                  }}
                  title="Remove this blur"
                  className="grid h-7 w-7 place-items-center rounded-md border border-line text-zinc-500 hover:text-red-400"
                >
                  <HiOutlineTrash size={13} />
                </button>
              </div>
              {selected.shape === 'rect' ? (
                <>
                  <Slider label="Width" value={selected.w} min={0.01} max={1} onChange={(v) => patch({ w: v })} />
                  <Slider label="Height" value={selected.h} min={0.01} max={1} onChange={(v) => patch({ h: v })} />
                </>
              ) : (
                <Slider label="Size" value={selected.r} min={0.015} max={0.5} onChange={(v) => patch({ r: v })} />
              )}
              <Slider label="Strength" value={selected.strength} min={0.15} max={1} onChange={(v) => patch({ strength: v })} />
              <Slider label="Soft edge" value={selected.feather} min={0} max={1} onChange={(v) => patch({ feather: v })} />
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-line p-3 text-[11px] leading-relaxed text-zinc-500">
              <HiOutlinePlus className="mr-1 inline" size={12} />
              Pick a shape, then click on the photo to add a blur. Select one to adjust its size, strength and how
              softly it fades into the picture.
            </p>
          )}

          {spots.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {spots.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSel(s.id)}
                  className={
                    'rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors ' +
                    (s.id === sel ? 'border-accent-500/60 text-accent-300' : 'border-line text-zinc-500 hover:text-zinc-300')
                  }
                >
                  {s.shape === 'rect' ? '▭' : '●'} {i + 1}
                </button>
              ))}
            </div>
          )}

          <p className="text-[10.5px] leading-relaxed text-zinc-600">
            Applying writes a <span className="text-zinc-400">new blurred file</span> and swaps it in everywhere this
            photo is used. The sharp original is removed from <code>public/</code> on your next save — it cannot be
            recovered from the site afterwards.
          </p>
        </div>
      </div>
    </div>
  );
}
