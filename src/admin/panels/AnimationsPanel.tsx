import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Field, Toggle, Select } from '../ui';
import { PRESETS, PRESET_LABEL, type Channel } from '../../lib/anim';
import { SKETCH_META } from '../../components/Sketches';
import { PALETTES, approxLocation, sunTimes } from '../../lib/theme';
import type { AnimationPreset, NameEffect, PaletteId, PortfolioConfig, SketchId } from '../../lib/types';

/* -------------------------------------------------------------------------- */
/*  Live previews                                                             */
/*                                                                            */
/*  Each one takes the DRAFT speed so the thumbnail reacts as you drag the     */
/*  slider, rather than reading the saved settings module.                    */
/* -------------------------------------------------------------------------- */

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-ink-950">{children}</div>
);

function EtherPreview({ live, s, intensity = 1 }: { live: boolean; s: number; intensity?: number }) {
  return (
    <Frame>
      {/* a cheap CSS stand-in for the WebGL ether — enough to show it is on */}
      <motion.span
        className="absolute -inset-6 blur-md"
        style={{
          background:
            'radial-gradient(40% 55% at 30% 40%, rgba(251,191,36,0.55), transparent 70%), radial-gradient(45% 60% at 70% 65%, rgba(194,65,12,0.6), transparent 70%)',
        }}
        animate={live ? { rotate: [0, 360], scale: [1, 1.25, 1] } : undefined}
        transition={{ duration: 14 * s, repeat: Infinity, ease: 'linear' }}
      />
      {/* same scrim formula the real background uses, so the swatch matches */}
      <span
        className="absolute inset-0 bg-ink-950"
        style={{ opacity: Math.min(0.82, Math.max(0.25, 0.78 - intensity * 0.24)) }}
      />
    </Frame>
  );
}

function BloomPreview({ live, s }: { live: boolean; s: number }) {
  return (
    <Frame>
      <motion.span
        className="absolute -left-3 -top-3 h-12 w-12 rounded-full bg-accent-600/50 blur-lg"
        animate={live ? { x: [0, 34, 0], y: [0, 14, 0], scale: [1, 1.2, 1] } : undefined}
        transition={{ duration: 6 * s, repeat: Infinity, ease: 'easeInOut' }}
      />
    </Frame>
  );
}

function OrbitPreview({ live, s }: { live: boolean; s: number }) {
  return (
    <Frame>
      <span className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-md border border-accent-500/40" />
      <motion.div
        className="absolute left-1/2 top-1/2 h-0 w-0"
        animate={live ? { rotate: 360 } : undefined}
        transition={{ duration: 4 * s, repeat: Infinity, ease: 'linear' }}
      >
        {/* inline transform, not translate-x-* utilities — see the Toggle note in ui.tsx */}
        <span className="absolute h-1.5 w-1.5 rounded-full bg-accent-400" style={{ transform: 'translate(18px, -50%)' }} />
      </motion.div>
    </Frame>
  );
}

function FlowPreview({ live, s }: { live: boolean; s: number }) {
  return (
    <Frame>
      <span className="absolute left-3 right-3 top-1/2 h-px bg-line" />
      {[0, 1, 2].map((i) => (
        <span key={i} className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-zinc-700 bg-ink-900" style={{ left: 8 + i * 36 }} />
      ))}
      {live && (
        <motion.span
          className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent-300 shadow-[0_0_6px_var(--color-accent-400)]"
          initial={{ left: 10 }}
          animate={{ left: [10, 82] }}
          transition={{ duration: 2.2 * s, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </Frame>
  );
}

function PulsePreview({ live, s }: { live: boolean; s: number }) {
  return (
    <Frame>
      <div className="absolute bottom-2 left-4 top-2 w-px overflow-hidden bg-line">
        {live && (
          <motion.span
            className="absolute left-0 h-5 w-px bg-gradient-to-b from-transparent via-accent-400 to-transparent"
            animate={{ top: ['-20%', '100%'] }}
            transition={{ duration: 2 * s, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
      {[0, 1].map((i) => (
        <span key={i} className="absolute left-[13px] h-1.5 w-1.5 rounded-full bg-accent-500" style={{ top: 14 + i * 20 }} />
      ))}
      {[0, 1].map((i) => (
        <span key={i} className="absolute left-6 h-4 w-12 rounded border border-line bg-ink-900" style={{ top: 10 + i * 20 }} />
      ))}
    </Frame>
  );
}

function LiftPreview({ live }: { live: boolean; s: number }) {
  return (
    <Frame>
      <motion.span
        className="absolute inset-x-4 top-4 h-6 rounded border border-line bg-ink-900"
        whileHover={live ? { y: -4, borderColor: 'rgba(245,158,11,0.5)' } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      />
      <span className="absolute inset-x-0 bottom-1 text-center font-mono text-[8px] text-zinc-700">hover me</span>
    </Frame>
  );
}

function RevealPreview({ live, s }: { live: boolean; s: number }) {
  const [k, setK] = useState(0);
  return (
    <button onClick={() => setK((v) => v + 1)} title="Click to replay">
      <Frame>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={String(k) + i}
            className="absolute left-3 h-3 rounded bg-zinc-800"
            style={{ top: 10 + i * 13, width: 60 - i * 12 }}
            initial={live ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 * s, delay: i * 0.1 * s, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </Frame>
    </button>
  );
}

function SketchPreview({ live, s }: { live: boolean; s: number }) {
  return (
    <Frame>
      <motion.svg
        viewBox="0 0 96 56"
        className="absolute inset-0 h-full w-full"
        fill="none"
        stroke="rgba(228,228,236,0.7)"
        strokeWidth="1.2"
        strokeLinecap="round"
        animate={live ? { x: [0, 4, 0], y: [0, -3, 0] } : undefined}
        transition={{ duration: 6 * s, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M10 28 H70" />
        <path d="M70 20 h16 l4 8 l-4 8 h-16 l3 -8 z" />
        <path d="M24 12 L34 28 M40 12 L50 28 M24 44 L34 28 M40 44 L50 28" />
        <rect x="12" y="6" width="14" height="6" rx="1" />
        <rect x="28" y="6" width="14" height="6" rx="1" />
      </motion.svg>
    </Frame>
  );
}

/** Only the boolean on/off channels — sliders and the sketch set are handled separately. */
type ChannelKey = Channel;

const CHANNELS: {
  key: ChannelKey;
  name: string;
  where: string;
  Preview: (p: { live: boolean; s: number; intensity?: number }) => React.ReactElement;
}[] = [
  {
    key: 'liquidEther',
    name: 'Liquid ether',
    where: 'Page background · WebGL flow that follows the cursor',
    Preview: EtherPreview,
  },
  { key: 'backgroundBlooms', name: 'Ambient blooms', where: 'Page background · hero status dot', Preview: BloomPreview },
  { key: 'orbitDots', name: 'Portrait orbit', where: 'About · rotating ring and orbiting dots', Preview: OrbitPreview },
  { key: 'flowConsole', name: 'Flow console', where: 'About · packets, scan line, KPI counter', Preview: FlowPreview },
  { key: 'timelinePulse', name: 'Timeline pulse', where: 'About · the looping bar down the experience rail', Preview: PulsePreview },
  { key: 'sketchDrift', name: 'Sketch drift', where: 'Page background · the pencil schemas slowly float', Preview: SketchPreview },
  { key: 'hoverLift', name: 'Hover lift', where: 'Every card, on mouse-over', Preview: LiftPreview },
  { key: 'scrollReveal', name: 'Scroll reveal', where: 'Everything that fades up as you scroll', Preview: RevealPreview },
];

const NAME_EFFECTS: { value: NameEffect; label: string }[] = [
  { value: 'stroke', label: 'Stroke — outlined letters, filled by a sweeping band' },
  { value: 'shine', label: 'Shine — blur in, then a highlight sweeps across' },
  { value: 'reveal', label: 'Reveal — letters slide up out of a mask' },
  { value: 'typewriter', label: 'Typewriter — typed out with a caret' },
  { value: 'none', label: 'None — static text' },
];

/** Preview of the hero name, matching what HeroName renders. */
function NamePreview({ effect, name, s }: { effect: NameEffect; name: string; s: number }) {
  const [k, setK] = useState(0);
  const chars = [...name];

  return (
    <button
      onClick={() => setK((v) => v + 1)}
      title="Click to replay"
      className="block w-full overflow-hidden rounded-xl border border-line bg-ink-950 px-4 py-6 text-left"
    >
      {effect === 'reveal' && (
        <span className="block whitespace-nowrap font-display text-[clamp(0.9rem,3vw,1.7rem)] font-extrabold tracking-tight text-zinc-100">
          {chars.map((c, i) => (
            <span key={String(k) + i} className="inline-block overflow-hidden align-bottom">
              <motion.span
                className="inline-block"
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.75 * s, delay: (0.05 + i * 0.035) * s, ease: [0.22, 1, 0.36, 1] }}
              >
                {c === ' ' ? ' ' : c}
              </motion.span>
            </span>
          ))}
        </span>
      )}

      {effect === 'typewriter' && (
        <span className="block whitespace-nowrap font-display text-[clamp(0.9rem,3vw,1.7rem)] font-extrabold tracking-tight text-zinc-100">
          {chars.map((c, i) => (
            <motion.span
              key={String(k) + i}
              className="inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.01, delay: (0.1 + i * 0.06) * s }}
            >
              {c === ' ' ? ' ' : c}
            </motion.span>
          ))}
          <motion.span
            className="ml-1 inline-block w-[2px] bg-accent-500 align-middle"
            style={{ height: '0.8em' }}
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{ duration: 1.1 * s, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
          />
        </span>
      )}

      {effect === 'stroke' && (
        <span
          key={k}
          // the real `.stroke-text` class, so this preview cannot drift from the site
          className="stroke-text block whitespace-nowrap text-center font-display text-[clamp(0.9rem,3vw,1.7rem)] font-extrabold tracking-tight"
          data-text={name}
          data-sweep="on"
          style={{ '--sweep-dur': 6.3 * s + 's', '--stroke-w': '1.5px' } as React.CSSProperties}
        >
          {name}
        </span>
      )}

      {effect === 'none' && (
        <span className="block whitespace-nowrap font-display text-[clamp(0.9rem,3vw,1.7rem)] font-extrabold tracking-tight">
          <span className="text-zinc-100">{name.replace(/\s+\S+$/, '')} </span>
          <span className="text-gradient">{name.split(' ').pop()}</span>
        </span>
      )}

      {effect === 'shine' && (
        <motion.span
          key={k}
          className="block whitespace-nowrap bg-clip-text font-display text-[clamp(0.9rem,3vw,1.7rem)] font-extrabold tracking-tight text-transparent"
          style={{
            backgroundImage:
              'linear-gradient(100deg, #e4e4e7 0%, #e4e4e7 32%, var(--color-accent-300) 44%, var(--color-accent-500) 52%, var(--color-accent-600) 60%, #e4e4e7 74%, #e4e4e7 100%)',
            backgroundSize: '260% 100%',
          }}
          animate={{ backgroundPosition: ['160% 0%', '-60% 0%'] }}
          transition={{ duration: 5.5 * s, repeat: Infinity, repeatDelay: 2.2 * s, ease: [0.4, 0, 0.2, 1] }}
        >
          {name}
        </motion.span>
      )}

      <span className="mt-3 block font-mono text-[10px] text-zinc-700">click to replay</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */

export default function AnimationsPanel({
  cfg,
  set,
}: {
  cfg: PortfolioConfig;
  set: (fn: (draft: PortfolioConfig) => void) => void;
}) {
  const a = cfg.animation;
  const s = a.speed || 1;

  /** Applying a preset overwrites every channel but keeps the name effect. */
  const applyPreset = (preset: AnimationPreset) =>
    set((d) => {
      // which schemas are drawn is a content choice, not a motion one — keep it
      d.animation = { ...d.animation, ...PRESETS[preset], preset, sketchSet: d.animation.sketchSet ?? {} };
    });

  /** Keys a preset does not decide: sliders and the sketch selection. */
  const FREE: (keyof typeof PRESETS.balanced)[] = ['speed', 'etherIntensity', 'sketchOpacity', 'sketchSet'];

  /** Flipping a single switch means the config no longer matches a preset. */
  const setChannel = (key: ChannelKey, v: boolean) =>
    set((d) => {
      d.animation[key] = v;
      const match = (Object.keys(PRESETS) as AnimationPreset[]).find((p) =>
        (Object.keys(PRESETS[p]) as (keyof typeof PRESETS.balanced)[]).every(
          (k) => FREE.includes(k) || PRESETS[p][k] === (d.animation[k as ChannelKey] ?? true),
        ),
      );
      d.animation.preset = match ?? d.animation.preset;
    });

  return (
    <div className="space-y-8">
      {/* ------------------------------ presets ------------------------------ */}
      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-zinc-100">Animation presets</h2>
        <p className="mb-4 text-xs text-zinc-500">
          A preset sets every switch below at once. Change any individual switch afterwards and it stays changed.
        </p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(PRESETS) as AnimationPreset[]).map((p) => {
            const active = a.preset === p;
            return (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                className={
                  'rounded-xl border p-4 text-left transition-colors ' +
                  (active
                    ? 'border-accent-500/60 bg-accent-500/[0.08]'
                    : 'border-line bg-ink-900 hover:border-zinc-600')
                }
              >
                <div className="flex items-center justify-between">
                  <span className={'text-sm font-semibold ' + (active ? 'text-accent-300' : 'text-zinc-200')}>
                    {PRESET_LABEL[p].en}
                  </span>
                  {active && <span className="h-2 w-2 rounded-full bg-accent-400" />}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">{PRESET_LABEL[p].hint}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ------------------------------ speed ------------------------------ */}
      <section>
        <Card>
          <Field
            label="Global speed"
            hint="multiplies every duration — lower is faster"
          >
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={s}
                onChange={(e) => set((d) => void (d.animation.speed = Number(e.target.value)))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink-800 accent-accent-500"
              />
              <span className="w-20 shrink-0 text-right font-mono text-sm text-accent-400">
                {s.toFixed(2)}×
              </span>
              <button
                onClick={() => set((d) => void (d.animation.speed = 1))}
                className="font-mono text-[10px] text-zinc-600 underline decoration-dotted hover:text-accent-500"
              >
                reset
              </button>
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-wider text-zinc-700">
              <span>0.5× snappy</span>
              <span>2× languid</span>
            </div>
          </Field>
        </Card>
      </section>

      {/* ------------------------------ ether brightness ------------------------------ */}
      {a.liquidEther !== false && (
        <section>
          <Card>
            <Field label="Liquid ether brightness" hint="how much the background glows through">
              <div className="flex items-center gap-4">
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-600">dark</span>
                <input
                  type="range"
                  min={0.3}
                  max={2}
                  step={0.05}
                  value={a.etherIntensity ?? 1}
                  onChange={(e) => set((d) => void (d.animation.etherIntensity = Number(e.target.value)))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink-800 accent-accent-500"
                />
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-600">bright</span>
                <span className="w-14 shrink-0 text-right font-mono text-sm text-accent-400">
                  {(a.etherIntensity ?? 1).toFixed(2)}×
                </span>
                <button
                  onClick={() => set((d) => void (d.animation.etherIntensity = 1))}
                  className="shrink-0 font-mono text-[10px] text-zinc-600 underline decoration-dotted hover:text-accent-500"
                >
                  reset
                </button>
              </div>

              {/* full-width live swatch of the real gradient + scrim */}
              <div className="relative mt-4 h-24 overflow-hidden rounded-xl border border-line bg-ink-950">
                <motion.span
                  className="absolute -inset-10 blur-xl"
                  style={{
                    background:
                      'radial-gradient(35% 50% at 28% 38%, rgba(251,191,36,0.75), transparent 70%), radial-gradient(40% 55% at 68% 62%, rgba(194,65,12,0.8), transparent 70%), radial-gradient(30% 45% at 50% 85%, rgba(245,158,11,0.5), transparent 70%)',
                  }}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 26 * s, repeat: Infinity, ease: 'linear' }}
                />
                <span
                  className="absolute inset-0 bg-ink-950"
                  style={{ opacity: Math.min(0.82, Math.max(0.25, 0.78 - (a.etherIntensity ?? 1) * 0.24)) }}
                />
                <span className="bg-grid absolute inset-0 opacity-40" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="font-display text-sm font-semibold text-zinc-200">
                    Sample text over the background
                  </span>
                </span>
              </div>
            </Field>
          </Card>
        </section>
      )}

      {/* ------------------------------ theme ------------------------------ */}
      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-zinc-100">Theme</h2>
        <p className="mb-4 text-xs text-zinc-500">
          What a first-time visitor sees. Once they use the switch, their own choice is remembered on their device.
        </p>
        <Card className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {(['auto', 'light', 'dark'] as const).map((th) => {
              const active = (cfg.theme?.default ?? 'light') === th;
              return (
                <button
                  key={th}
                  onClick={() => set((d) => void (d.theme = { ...d.theme, default: th }))}
                  className={
                    'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ' +
                    (active ? 'border-accent-500/60 bg-accent-500/[0.08]' : 'border-line bg-ink-950 hover:border-zinc-600')
                  }
                >
                  <span
                    className={
                      'grid h-10 w-14 shrink-0 place-items-center rounded-lg border font-mono text-[9px] ' +
                      (th === 'light' ? 'border-zinc-300 bg-[#fff] text-zinc-800' : 'border-zinc-700 bg-[#08080b] text-zinc-300')
                    }
                    style={th === 'auto' ? { background: 'linear-gradient(105deg, #fff 50%, #08080b 50%)', color: '#888' } : undefined}
                  >
                    Aa
                  </span>
                  <span>
                    <span className={'block text-sm font-semibold ' + (active ? 'text-accent-300' : 'text-zinc-200')}>
                      {th === 'auto' ? 'Automatic' : th === 'light' ? 'White' : 'Dark'}
                    </span>
                    <span className="block text-[11px] text-zinc-500">
                      {th === 'auto'
                        ? 'White by day, dark from sunset to sunrise.'
                        : th === 'light'
                          ? 'Paper background, graphite sketches.'
                          : 'Ink background, chalk sketches.'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {/* ---- colours ---- */}
          <Field label="Colours" hint="two hues drive every shade on the site">
            <div className="grid gap-2 sm:grid-cols-3">
              {(['brand', 'classic', 'custom'] as PaletteId[]).map((id) => {
                const active = (cfg.theme?.palette ?? 'brand') === id;
                const swatch = id === 'custom'
                  ? { accent: cfg.theme?.accent || '#e8412a', brand: cfg.theme?.brand || '#1d2b5a' }
                  : PALETTES[id];
                return (
                  <button
                    key={id}
                    onClick={() => set((d) => void (d.theme = { ...d.theme, palette: id }))}
                    className={
                      'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ' +
                      (active ? 'border-accent-500/60 bg-accent-500/[0.08]' : 'border-line bg-ink-950 hover:border-zinc-600')
                    }
                  >
                    <span className="flex shrink-0 -space-x-1.5">
                      <span className="h-6 w-6 rounded-full ring-2 ring-ink-950" style={{ background: swatch.accent }} />
                      <span className="h-6 w-6 rounded-full ring-2 ring-ink-950" style={{ background: swatch.brand }} />
                    </span>
                    <span className="min-w-0">
                      <span className={'block text-sm font-semibold ' + (active ? 'text-accent-300' : 'text-zinc-200')}>
                        {id === 'custom' ? 'Custom' : PALETTES[id].name}
                      </span>
                      <span className="block truncate text-[11px] text-zinc-500">
                        {id === 'custom' ? 'Pick your own two colours.' : PALETTES[id].hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {(cfg.theme?.palette ?? 'brand') !== 'custom' && (
              <div className="mt-3">
                <Field label="Dark theme tint" hint="how much of the brand colour goes into the dark background">
                  <div className="flex items-center gap-4">
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-600">black</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={cfg.theme?.tint ?? PALETTES[(cfg.theme?.palette ?? 'brand') as 'brand' | 'classic'].tint}
                      onChange={(e) => set((d) => void (d.theme = { ...d.theme, tint: Number(e.target.value) }))}
                      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink-800 accent-accent-500"
                    />
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-600">tinted</span>
                    <span className="w-12 shrink-0 text-right font-mono text-sm text-accent-400">
                      {Math.round((cfg.theme?.tint ?? PALETTES[(cfg.theme?.palette ?? 'brand') as 'brand' | 'classic'].tint) * 100)}%
                    </span>
                    <button
                      onClick={() => set((d) => { const t = { ...d.theme }; delete t.tint; d.theme = t; })}
                      className="shrink-0 font-mono text-[10px] text-zinc-600 underline decoration-dotted hover:text-accent-500"
                    >
                      reset
                    </button>
                  </div>
                </Field>
              </div>
            )}

            {(cfg.theme?.palette ?? 'brand') === 'custom' && (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(['accent', 'brand'] as const).map((k) => (
                  <label key={k} className="flex items-center gap-3 rounded-lg border border-line bg-ink-950 px-3 py-2">
                    <input
                      type="color"
                      value={cfg.theme?.[k] || (k === 'accent' ? '#e8412a' : '#1d2b5a')}
                      onChange={(e) => set((d) => void (d.theme = { ...d.theme, [k]: e.target.value }))}
                      className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span>
                      <span className="block text-sm text-zinc-200">{k === 'accent' ? 'Accent' : 'Brand'}</span>
                      <span className="block font-mono text-[10px] text-zinc-500">
                        {k === 'accent' ? 'buttons, links, numbers' : 'headings tint, name, sketches'}
                      </span>
                    </span>
                  </label>
                ))}
                <div className="sm:col-span-3">
                  <Field label="Dark theme tint" hint="how much of the brand colour goes into the dark background">
                    <div className="flex items-center gap-4">
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-600">black</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={cfg.theme?.tint ?? (cfg.theme?.ink === 'neutral' ? 0 : 1)}
                        onChange={(e) => set((d) => void (d.theme = { ...d.theme, tint: Number(e.target.value) }))}
                        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink-800 accent-accent-500"
                      />
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-600">tinted</span>
                      <span className="w-12 shrink-0 text-right font-mono text-sm text-accent-400">
                        {Math.round((cfg.theme?.tint ?? (cfg.theme?.ink === 'neutral' ? 0 : 1)) * 100)}%
                      </span>
                    </div>
                  </Field>
                </div>
              </div>
            )}
          </Field>

          {cfg.theme?.default === 'auto' &&
            (() => {
              const loc = approxLocation();
              const sun = sunTimes(new Date(), loc.lat, loc.lng);
              const hm = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <p className="rounded-lg border border-line bg-ink-950 px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
                  Each visitor gets the sun times of their own time zone — no location permission is asked.{' '}
                  {sun ? (
                    <>
                      Here ({loc.zone || 'your zone'}) today: white from{' '}
                      <span className="text-zinc-300">{hm(sun.sunrise)}</span> to{' '}
                      <span className="text-zinc-300">{hm(sun.sunset)}</span>, dark otherwise.
                    </>
                  ) : (
                    'No sunrise or sunset here today — falls back to 07:00–19:00.'
                  )}{' '}
                  A visitor who uses the switch keeps their own choice.
                </p>
              );
            })()}

          <div className="flex items-center gap-4">
            <Toggle on={cfg.theme?.toggle !== false} onChange={(v) => set((d) => void (d.theme = { ...d.theme, toggle: v }))} />
            <div>
              <div className="text-sm text-zinc-200">Show the theme switch</div>
              <div className="text-[11px] text-zinc-500">Bottom-right corner; each click goes automatic → light → dark. Off = visitors get the default only.</div>
            </div>
          </div>
        </Card>
      </section>

      {/* ------------------------------ sketches ------------------------------ */}
      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-zinc-100">Background sketches</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Hand-drawn supply-chain, Lean and ERP schemas behind the page. Pick which ones are drawn and how strong the pencil is.
        </p>
        <Card className="space-y-5">
          <div className="flex items-center gap-4">
            <Toggle on={a.sketches !== false} onChange={(v) => setChannel('sketches', v)} />
            <div>
              <div className="text-sm text-zinc-200">Draw the sketches</div>
              <div className="text-[11px] text-zinc-500">Master switch. Drift (the slow float) is its own switch further down.</div>
            </div>
          </div>

          {a.sketches !== false && (
            <>
              <Field label="Pencil strength" hint="how visible the drawings are">
                <div className="flex items-center gap-4">
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-600">faint</span>
                  <input
                    type="range"
                    min={0.2}
                    max={1.5}
                    step={0.05}
                    value={a.sketchOpacity ?? 0.6}
                    onChange={(e) => set((d) => void (d.animation.sketchOpacity = Number(e.target.value)))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink-800 accent-accent-500"
                  />
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-600">bold</span>
                  <span className="w-14 shrink-0 text-right font-mono text-sm text-accent-400">
                    {(a.sketchOpacity ?? 0.6).toFixed(2)}×
                  </span>
                </div>
              </Field>

              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(SKETCH_META) as SketchId[]).map((id) => {
                  const live = a.sketchSet?.[id] !== false;
                  return (
                    <div key={id} className="flex items-center gap-3 rounded-lg border border-line bg-ink-950 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-zinc-200">{SKETCH_META[id].name}</div>
                        <div className="truncate text-[11px] text-zinc-500">{SKETCH_META[id].where}</div>
                      </div>
                      <Toggle
                        on={live}
                        onChange={(v) => set((d) => void (d.animation.sketchSet = { ...(d.animation.sketchSet ?? {}), [id]: v }))}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </section>

      {/* ------------------------------ hero name ------------------------------ */}
      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-zinc-100">Hero name</h2>
        <p className="mb-4 text-xs text-zinc-500">
          How your name animates in on the landing page. It always stays on one line.
        </p>

        <Card className="space-y-4">
          <Field label="Effect">
            <Select
              value={a.nameEffect}
              onChange={(v) => set((d) => void (d.animation.nameEffect = v as NameEffect))}
              options={NAME_EFFECTS.map((n) => ({ value: n.value, label: n.label }))}
            />
          </Field>
          <NamePreview effect={a.nameEffect} name={cfg.contact.displayName || 'Mohammed Amine TALHI'} s={s} />
        </Card>
      </section>

      {/* ------------------------------ channels ------------------------------ */}
      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-zinc-100">Individual animations</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Each thumbnail is the real animation at your current speed. Switch one off and it disappears from the site.
        </p>

        <div className="space-y-2">
          {CHANNELS.map(({ key, name, where, Preview }) => {
            const live = a[key] !== false;
            return (
              <Card key={key}>
                <div className="flex items-center gap-4">
                  <Preview live={live} s={s} intensity={a.etherIntensity ?? 1} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-zinc-200">{name}</div>
                    <div className="mt-0.5 text-[11px] text-zinc-500">{where}</div>
                  </div>
                  <Toggle on={live} onChange={(v) => setChannel(key, v)} />
                </div>
              </Card>
            );
          })}
        </div>

        <p className="mt-4 rounded-xl border border-line bg-ink-900 p-4 text-[11px] leading-relaxed text-zinc-500">
          Visitors who have <span className="text-zinc-400">“reduce motion”</span> enabled in their operating system
          get the static version regardless of these settings — that override is built in and cannot be switched off.
        </p>
      </section>
    </div>
  );
}
