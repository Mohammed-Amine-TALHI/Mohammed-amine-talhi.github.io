import { useCallback, useEffect, useRef, useState } from 'react';
import { HiOutlineRefresh, HiOutlineZoomIn, HiOutlineZoomOut } from 'react-icons/hi';
import { TbArrowsMove } from 'react-icons/tb';
import { Button } from './ui';
import { clamp, cropStyle, DEFAULT_CROP, type Crop } from '../lib/crop';

/**
 * Manual crop control.
 *
 * The frame is the real card aspect, so what you see here is exactly what the
 * site renders. Drag inside it to move the picture, scroll or use the slider to
 * zoom. Nothing is written to the image file — the numbers are stored on the
 * entry and applied with CSS, so you can always come back and re-frame it.
 */
export default function CropBox({
  src,
  crop,
  onChange,
  fit = 'cover',
  aspect = 368 / 160, // the leadership card's cover box
}: {
  src: string;
  crop: Crop;
  onChange: (c: Crop) => void;
  fit?: 'cover' | 'contain';
  aspect?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (fit === 'contain') return; // nothing overflows, so nothing to pan
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, cx: crop.x, cy: crop.y };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const box = boxRef.current;
    if (!d || !box) return;

    const r = box.getBoundingClientRect();
    // Dragging right reveals more of the left-hand side, which means moving the
    // focal point left — hence the subtraction. Zoom shrinks the travel needed.
    const dx = ((e.clientX - d.x) / r.width) * 100;
    const dy = ((e.clientY - d.y) / r.height) * 100;
    onChange({ ...crop, x: clamp(d.cx - dx / crop.zoom), y: clamp(d.cy - dy / crop.zoom) });
  };

  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const setZoom = useCallback(
    (z: number) => onChange({ ...crop, zoom: Math.min(4, Math.max(1, Number(z.toFixed(2)))) }),
    [crop, onChange],
  );

  // wheel-to-zoom, non-passive so the page doesn't scroll underneath
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(crop.zoom + (e.deltaY < 0 ? 0.12 : -0.12));
    };
    box.addEventListener('wheel', onWheel, { passive: false });
    return () => box.removeEventListener('wheel', onWheel);
  }, [crop.zoom, setZoom]);

  return (
    <div className="space-y-2.5">
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ aspectRatio: String(aspect) }}
        className={
          'relative w-full max-w-sm select-none overflow-hidden rounded-xl border border-line bg-ink-950 ' +
          (fit === 'contain' ? '' : dragging ? 'cursor-grabbing' : 'cursor-grab')
        }
      >
        <img
          src={src}
          alt=""
          draggable={false}
          style={cropStyle(crop, fit)}
          className={'pointer-events-none h-full w-full ' + (fit === 'contain' ? 'bg-ink-950 p-1' : '')}
        />

        {/* rule-of-thirds guides, only while dragging */}
        {dragging && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-y-0 left-1/3 w-px bg-white/25" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-white/25" />
            <div className="absolute inset-x-0 top-1/3 h-px bg-white/25" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-white/25" />
          </div>
        )}

        {fit !== 'contain' && !dragging && (
          <span className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-md bg-ink-950/80 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-zinc-400">
            <TbArrowsMove size={11} />
            drag to reframe · scroll to zoom
          </span>
        )}
      </div>

      <div className="flex max-w-sm items-center gap-2">
        <HiOutlineZoomOut className="shrink-0 text-zinc-600" size={14} />
        <input
          type="range"
          min={1}
          max={4}
          step={0.05}
          value={crop.zoom}
          disabled={fit === 'contain'}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink-800 accent-accent-500 disabled:opacity-40"
        />
        <HiOutlineZoomIn className="shrink-0 text-zinc-600" size={14} />
        <span className="w-11 shrink-0 text-right font-mono text-[11px] text-accent-400">
          {crop.zoom.toFixed(2)}×
        </span>
        <Button onClick={() => onChange({ ...DEFAULT_CROP })} title="Reset framing">
          <HiOutlineRefresh size={13} />
        </Button>
      </div>

      <p className="font-mono text-[10px] text-zinc-600">
        x {Math.round(crop.x)}% · y {Math.round(crop.y)}% — the file itself is never modified
      </p>
    </div>
  );
}
