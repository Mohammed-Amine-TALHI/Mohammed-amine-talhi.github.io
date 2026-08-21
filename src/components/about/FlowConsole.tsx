import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView } from 'framer-motion';
import { useLang } from '../../lib/i18n';
import { dur, on } from '../../lib/anim';

/* Node x-positions along the flow rail (SVG user units). */
const NODES = [52, 148, 244, 340];
const RAIL_Y = 56;
const BARS = 14;
/* Deterministic pseudo-heights so the chart looks organic but never re-shuffles. */
const BAR_H = [38, 62, 30, 74, 52, 88, 44, 68, 34, 80, 58, 46, 72, 40];

/**
 * Right-hand panel of the skills block.
 *
 * A looping "flow optimizer" readout: material moves along a 4-stage chain,
 * a throughput chart rebalances underneath, and a KPI counts up. It mirrors
 * what Amine actually does — mine -> stockyard -> plant -> loading — so the
 * animation carries meaning rather than being pure decoration.
 *
 * `focus` is the skill name currently hovered in the icon grid; when set it
 * takes over the console title, wiring the two halves of the section together.
 */
export default function FlowConsole({ focus }: { focus: string | null }) {
  const { lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [kpi, setKpi] = useState(0);
  const live = on('flowConsole'); // admin can freeze the console into a static diagram

  // count the KPI up once, when the panel first scrolls into view
  useEffect(() => {
    if (!inView) return;
    if (!live) {
      setKpi(18.4);
      return;
    }
    const controls = animate(0, 18.4, {
      duration: dur(1.8),
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setKpi(v),
    });
    return () => controls.stop();
  }, [inView, live]);

  const stages = lang === 'fr' ? ['Mine', 'Stock', 'Laverie', 'Train'] : ['Mine', 'Stock', 'Plant', 'Train'];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-line bg-ink-900/70 backdrop-blur-sm"
    >
      {/* fake window chrome */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        <span className="ml-2 truncate font-mono text-[11px] text-zinc-500">{focus ?? 'flow_optimizer.py'}</span>
        <span className="ml-auto flex items-center gap-1.5">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            animate={live ? { opacity: [1, 0.25, 1] } : undefined}
            transition={{ duration: dur(1.6), repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400/80">live</span>
        </span>
      </div>

      <svg viewBox="0 0 392 264" className="w-full" role="img" aria-label="Animated supply chain flow visualisation">
        <defs>
          <linearGradient id="railGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-accent-600)" stopOpacity="0.25" />
            <stop offset="50%" stopColor="var(--color-accent-400)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--color-accent-600)" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--color-accent-700)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-accent-400)" stopOpacity="0.95" />
          </linearGradient>
          <filter id="glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ---- the rail the material travels along ---- */}
        <line
          x1={NODES[0]}
          y1={RAIL_Y}
          x2={NODES[3]}
          y2={RAIL_Y}
          stroke="#242430"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <motion.line
          x1={NODES[0]}
          y1={RAIL_Y}
          x2={NODES[3]}
          y2={RAIL_Y}
          stroke="url(#railGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        />

        {/* ---- stage nodes ---- */}
        {NODES.map((x, i) => (
          <g key={x}>
            {/* halo that pulses in sequence, as if each stage fires in turn */}
            <motion.circle
              cx={x}
              cy={RAIL_Y}
              r="16"
              fill="var(--color-accent-500)"
              initial={{ opacity: 0 }}
              animate={live ? { opacity: [0, 0.22, 0], scale: [0.8, 1.5, 0.8] } : undefined}
              transition={{ duration: dur(3.2), repeat: Infinity, ease: 'easeInOut', delay: dur(i * 0.8) }}
              style={{ transformOrigin: x + 'px ' + RAIL_Y + 'px' }}
            />
            <circle cx={x} cy={RAIL_Y} r="11" fill="#0c0c11" stroke="#2f2f3d" strokeWidth="1.5" />
            <motion.circle
              cx={x}
              cy={RAIL_Y}
              r="4"
              fill="var(--color-accent-400)"
              animate={live ? { opacity: [0.35, 1, 0.35] } : { opacity: 0.85 }}
              transition={{ duration: dur(3.2), repeat: Infinity, ease: 'easeInOut', delay: dur(i * 0.8) }}
            />
            <text x={x} y={RAIL_Y + 34} textAnchor="middle" className="fill-zinc-500 font-mono text-[9px]">
              {stages[i]}
            </text>
          </g>
        ))}

        {/* ---- packets moving down the chain ---- */}
        {live && [0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            r="4.5"
            cx={NODES[0]}
            cy={RAIL_Y}
            fill="var(--color-accent-300)"
            filter="url(#glow)"
            // Translate rather than animate the `cx` attribute: framer can't seed
            // a raw SVG attribute from a keyframe array (it writes cx="undefined"
            // on the first frame), and a transform is cheaper to composite anyway.
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: [0, NODES[3] - NODES[0]], opacity: [0, 1, 1, 0] }}
            transition={{
              x: { duration: dur(4), repeat: Infinity, ease: 'linear', delay: dur(i * 1.33) },
              opacity: { duration: dur(4), repeat: Infinity, times: [0, 0.06, 0.94, 1], delay: dur(i * 1.33) },
            }}
          />
        ))}

        {/* ---- throughput chart ---- */}
        <line x1="34" y1="232" x2="358" y2="232" stroke="#242430" strokeWidth="1" />
        {Array.from({ length: BARS }).map((_, i) => {
          const w = 16;
          const gap = 7;
          const x = 36 + i * (w + gap);
          const h = BAR_H[i];
          return (
            <motion.rect
              key={i}
              x={x}
              width={w}
              rx="3"
              fill="url(#barGrad)"
              initial={{ height: 0, y: 232 }}
              whileInView={{ height: h, y: 232 - h }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* gentle continuous breathing so the chart never feels frozen */}
              <animate
                attributeName="opacity"
                values="0.75;1;0.75"
                dur="3s"
                begin={i * 0.18 + 's'}
                repeatCount="indefinite"
              />
            </motion.rect>
          );
        })}

        {/* ---- scan line sweeping across the chart ---- */}
        {live && (
          <motion.rect
            y="126"
            width="1.5"
            height="106"
            fill="var(--color-accent-300)"
            opacity="0.5"
            animate={{ x: [34, 358] }}
            transition={{ duration: dur(5), repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
          />
        )}
      </svg>

      {/* ---- KPI strip ---- */}
      <div className="grid grid-cols-3 gap-px border-t border-line bg-line">
        {[
          { v: '+' + kpi.toFixed(1) + '%', l: lang === 'fr' ? 'Débit' : 'Throughput', hl: true },
          { v: '0.15%', l: 'PCE', hl: false },
          { v: '11.7d', l: lang === 'fr' ? 'Délai' : 'Lead time', hl: false },
        ].map((k) => (
          <div key={k.l} className="bg-ink-900 px-3 py-3.5 text-center">
            <div className={'font-mono text-sm font-semibold ' + (k.hl ? 'text-accent-400' : 'text-zinc-300')}>
              {k.v}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-600">{k.l}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
