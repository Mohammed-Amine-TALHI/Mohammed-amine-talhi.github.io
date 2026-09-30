import { motion, useScroll, useTransform } from 'framer-motion';
import { anim, dur, loopOn, on, isLowPower } from '../lib/anim';
import type { SketchId } from '../lib/types';

/* ---------------------------------------------------------------------------
   Pencil sketches.

   Eight hand-drawn schemas from the supply-chain / operations / ERP toolbox
   float behind the page: a value-stream map, an Ishikawa diagram, an
   S/4HANA module map, a BPMN-style process, DMAIC, a Gantt with dependencies,
   a Kanban board and a distribution network. They are plain SVG paths in the
   theme's pencil colour, roughened by an SVG turbulence filter so the lines
   wobble like graphite on paper.

   Each one is a fixed-position layer element with a slow drift and a gentle
   parallax on scroll; both stop on low-power devices. Which ones are drawn,
   how bold they are and whether they move all come from the admin panel.
--------------------------------------------------------------------------- */

/* ----------------------------- the drawings ----------------------------- */

const Box = ({ x, y, w, h, r = 3, cls, className }: { x: number; y: number; w: number; h: number; r?: number; cls?: string; className?: string }) => (
  <rect x={x} y={y} width={w} height={h} rx={r} className={cls ?? className} />
);

const Arrow = ({ d, cls, className, strokeDasharray }: { d: string; cls?: string; className?: string; strokeDasharray?: string }) => (
  <path d={d} className={cls ?? className} strokeDasharray={strokeDasharray} markerEnd="url(#arrowhead)" />
);

const Label = ({ x, y, size = 6.5, children, anchor = 'middle' }: { x: number; y: number; size?: number; children: string; anchor?: 'start' | 'middle' | 'end' }) => (
  <text x={x} y={y} fontSize={size} textAnchor={anchor}>{children}</text>
);

/** Value-stream map: supplier → three process steps with data boxes → customer, lead-time ladder below. */
function Vsm() {
  const steps = [
    { x: 70, name: 'MINE', ct: 'C/T 42 min', co: 'C/O 25 min' },
    { x: 170, name: 'WASHING', ct: 'C/T 3.1 h', co: 'Up 83 %' },
    { x: 270, name: 'LOADING', ct: 'C/T 55 min', co: '2 shifts' },
  ];
  return (
    <svg viewBox="0 0 400 220" className="sketch">
      <Label x={200} y={14} size={8}>VALUE STREAM MAP — mine → plant → train</Label>
      {/* supplier and customer factories */}
      <path d="M8 70 v-18 l10 -7 v7 l10 -7 v7 l10 -7 v25 z" />
      <Label x={27} y={80}>SUPPLIER</Label>
      <path d="M352 70 v-18 l10 -7 v7 l10 -7 v7 l10 -7 v25 z" />
      <Label x={373} y={80}>CUSTOMER</Label>
      {/* production control */}
      <Box x={160} y={26} w={80} h={20} />
      <Label x={200} y={39}>PRODUCTION CONTROL</Label>
      <path d="M47 36 h110" className="thin" strokeDasharray="4 3" />
      <path d="M243 36 h107" className="thin" strokeDasharray="4 3" />
      {/* electronic info: zig-zag */}
      <path d="M200 46 l-6 8 l12 6 l-6 8" className="thin" />
      {/* processes */}
      {steps.map((s) => (
        <g key={s.name}>
          <Box x={s.x} y={78} w={64} h={26} />
          <Label x={s.x + 32} y={95} size={7}>{s.name}</Label>
          <Box x={s.x} y={106} w={64} h={30} cls="thin" />
          <Label x={s.x + 32} y={118} size={5.5}>{s.ct}</Label>
          <Label x={s.x + 32} y={129} size={5.5}>{s.co}</Label>
          <circle cx={s.x + 10} cy={84} r={3} className="thin" />
        </g>
      ))}
      {/* inventory triangles between steps */}
      {[142, 242].map((x) => (
        <g key={x}>
          <path d={`M${x} 104 l8 -14 l8 14 z`} />
          <Label x={x + 8} y={100} size={5}>I</Label>
          <Label x={x + 8} y={112} size={5}>{x === 142 ? '4.2 d' : '2.8 d'}</Label>
        </g>
      ))}
      {/* push arrows */}
      <Arrow d="M134 91 h6" />
      <Arrow d="M234 91 h6" />
      {/* trucks */}
      <path d="M50 92 h16 v-8 h6 l5 6 v2 h-27 z M55 92 a2 2 0 1 0 0.1 0 M70 92 a2 2 0 1 0 0.1 0" className="thin" />
      <path d="M338 92 h16 v-8 h6 l5 6 v2 h-27 z" className="thin" />
      {/* timeline ladder */}
      <path d="M60 170 h40 v-14 h64 v14 h36 v-14 h64 v14 h36 v-14 h64 v14 h10" />
      <Label x={80} y={182} size={5.5}>4.2 d</Label>
      <Label x={132} y={152} size={5.5}>42 min</Label>
      <Label x={182} y={182} size={5.5}>2.8 d</Label>
      <Label x={232} y={152} size={5.5}>3.1 h</Label>
      <Label x={282} y={182} size={5.5}>3.9 d</Label>
      <Label x={332} y={152} size={5.5}>55 min</Label>
      <Label x={200} y={205} size={7}>LT = 11.7 d    VA = 4.8 h    PCE = 0.15 %</Label>
      {/* kaizen burst */}
      <path d="M312 118 l4 -6 l2 7 l6 -3 l-2 7 l6 3 l-6 2 l2 7 l-6 -3 l-2 7 l-4 -6 l-5 5 l0 -7 l-7 1 l4 -6 l-6 -3 l7 -2 l-3 -6 l7 2 l0 -7 z" className="thin" />
    </svg>
  );
}

/** Ishikawa / fishbone: 6M cause categories feeding an effect. */
function Ishikawa() {
  const top = ['MAN', 'MACHINE', 'METHOD'];
  const bottom = ['MATERIAL', 'MEASURE', 'MILIEU'];
  return (
    <svg viewBox="0 0 380 200" className="sketch">
      <Label x={190} y={14} size={8}>ISHIKAWA — root cause analysis</Label>
      {/* spine */}
      <Arrow d="M24 108 H300" cls="bold" />
      {/* head */}
      <path d="M300 82 h60 l10 26 l-10 26 h-60 l8 -26 z" />
      <Label x={334} y={105} size={6.5}>EFFECT</Label>
      <Label x={334} y={115} size={5.5}>lead time ↑</Label>
      {/* tail */}
      <path d="M8 96 l16 12 l-16 12 z" className="thin" />
      {top.map((t, i) => {
        const x = 70 + i * 80;
        return (
          <g key={t}>
            <path d={`M${x - 30} 40 L${x} 108`} />
            <Box x={x - 52} y={28} w={46} h={14} className="thin" />
            <Label x={x - 29} y={38}>{t}</Label>
            <path d={`M${x - 24} 54 h-18 M${x - 15} 74 h-18 M${x - 7} 92 h-18`} className="thin" />
          </g>
        );
      })}
      {bottom.map((t, i) => {
        const x = 110 + i * 80;
        return (
          <g key={t}>
            <path d={`M${x - 30} 176 L${x} 108`} />
            <Box x={x - 54} y={174} w={50} h={14} className="thin" />
            <Label x={x - 29} y={184}>{t}</Label>
            <path d={`M${x - 24} 162 h-18 M${x - 15} 142 h-18 M${x - 7} 124 h-18`} className="thin" />
          </g>
        );
      })}
    </svg>
  );
}

/** SAP S/4HANA module map: core with the functional modules radiating out. */
function Erp() {
  const mods = [
    { a: -90, l: 'PP', s: 'production' },
    { a: -40, l: 'MM', s: 'procurement' },
    { a: 10, l: 'EWM', s: 'warehouse' },
    { a: 60, l: 'SD', s: 'sales' },
    { a: 110, l: 'QM', s: 'quality' },
    { a: 160, l: 'PM', s: 'maintenance' },
    { a: 210, l: 'FI/CO', s: 'finance' },
    { a: 260, l: 'IBP', s: 'planning' },
  ];
  const cx = 190, cy = 112, R = 78;
  return (
    <svg viewBox="0 0 380 224" className="sketch">
      <Label x={190} y={14} size={8}>ERP — SAP S/4HANA landscape</Label>
      {/* core hexagon */}
      <path d="M190 78 l30 17 v34 l-30 17 l-30 -17 v-34 z" className="bold" />
      <Label x={190} y={108} size={7}>S/4HANA</Label>
      <Label x={190} y={118} size={5.5}>HANA in-memory</Label>
      <Label x={190} y={127} size={5}>Fiori · BTP</Label>
      {mods.map((m) => {
        const rad = (m.a * Math.PI) / 180;
        const x = cx + Math.cos(rad) * R;
        const y = cy + Math.sin(rad) * R * 0.78;
        const ix = cx + Math.cos(rad) * 36;
        const iy = cy + Math.sin(rad) * 30;
        return (
          <g key={m.l}>
            <path d={`M${ix} ${iy} L${x - Math.cos(rad) * 22} ${y - Math.sin(rad) * 12}`} className="thin" />
            <Box x={x - 22} y={y - 11} w={44} h={22} r={4} />
            <Label x={x} y={y - 1} size={6.5}>{m.l}</Label>
            <Label x={x} y={y + 7} size={4.8}>{m.s}</Label>
          </g>
        );
      })}
      {/* integration ring */}
      <ellipse cx={cx} cy={cy} rx={R + 34} ry={R * 0.78 + 26} className="thin" strokeDasharray="3 4" />
      <Label x={40} y={214} size={5.5} anchor="start">MRP run → planned orders → prod. orders</Label>
      <Label x={340} y={214} size={5.5} anchor="end">P2P · O2C · MTS/MTO</Label>
    </svg>
  );
}

/** BPMN-style process with a decision gateway, two swimlanes. */
function Process() {
  return (
    <svg viewBox="0 0 380 180" className="sketch">
      <Label x={190} y={14} size={8}>PROCESS MAP — order to delivery</Label>
      {/* lanes */}
      <Box x={10} y={24} w={360} h={140} />
      <path d="M10 94 h360 M34 24 v140" className="thin" />
      <text x={22} y={70} fontSize={6} textAnchor="middle" transform="rotate(-90 22 70)">PLANNING</text>
      <text x={22} y={135} fontSize={6} textAnchor="middle" transform="rotate(-90 22 135)">SHOP FLOOR</text>
      {/* start */}
      <circle cx={52} cy={58} r={7} />
      <Arrow d="M60 58 h14" className="thin" />
      <Box x={76} y={44} w={56} h={28} r={6} />
      <Label x={104} y={56}>CHECK</Label>
      <Label x={104} y={65}>STOCK</Label>
      <Arrow d="M133 58 h14" className="thin" />
      {/* gateway */}
      <path d="M164 44 l14 14 l-14 14 l-14 -14 z" />
      <Label x={164} y={61} size={8}>?</Label>
      <Label x={186} y={50} size={5} anchor="start">available</Label>
      <Arrow d="M179 58 h22" className="thin" />
      <Box x={202} y={44} w={56} h={28} r={6} />
      <Label x={230} y={56}>RESERVE</Label>
      <Label x={230} y={65}>& SHIP</Label>
      <Arrow d="M259 58 h30" className="thin" />
      <circle cx={298} cy={58} r={7} className="bold" />
      {/* no branch down */}
      <Label x={170} y={84} size={5} anchor="start">shortage</Label>
      <Arrow d="M164 73 v40" className="thin" />
      <Box x={136} y={114} w={56} h={28} r={6} />
      <Label x={164} y={126}>SCHEDULE</Label>
      <Label x={164} y={135}>(MILP)</Label>
      <Arrow d="M193 128 h22" className="thin" />
      <Box x={216} y={114} w={56} h={28} r={6} />
      <Label x={244} y={126}>PRODUCE</Label>
      <Label x={244} y={135}>lot L</Label>
      <Arrow d="M273 128 h20" className="thin" />
      <Box x={294} y={114} w={56} h={28} r={6} />
      <Label x={322} y={126}>QC</Label>
      <Label x={322} y={135}>release</Label>
      <Arrow d="M322 113 V72 H262" className="thin" strokeDasharray="3 3" />
      <Label x={60} y={158} size={5} anchor="start">◇ gateway   ○ event   ▭ task</Label>
    </svg>
  );
}

/** DMAIC wheel. */
function Dmaic() {
  const phases = ['DEFINE', 'MEASURE', 'ANALYZE', 'IMPROVE', 'CONTROL'];
  const cx = 110, cy = 110, R = 80;
  return (
    <svg viewBox="0 0 220 220" className="sketch">
      <circle cx={cx} cy={cy} r={R} />
      <circle cx={cx} cy={cy} r={42} className="thin" />
      {phases.map((p, i) => {
        const a0 = (-90 + i * 72) * (Math.PI / 180);
        const am = (-90 + i * 72 + 36) * (Math.PI / 180);
        const x1 = cx + Math.cos(a0) * 42, y1 = cy + Math.sin(a0) * 42;
        const x2 = cx + Math.cos(a0) * R, y2 = cy + Math.sin(a0) * R;
        const lx = cx + Math.cos(am) * 61, ly = cy + Math.sin(am) * 61;
        return (
          <g key={p}>
            <path d={`M${x1} ${y1} L${x2} ${y2}`} className="thin" />
            <text x={lx} y={ly + 2} fontSize={6} textAnchor="middle" transform={`rotate(${(-90 + i * 72 + 36) + 90} ${lx} ${ly})`}>
              {p}
            </text>
          </g>
        );
      })}
      <Label x={cx} y={cy - 3} size={8}>DMAIC</Label>
      <Label x={cx} y={cy + 8} size={5.5}>six sigma</Label>
      {/* arrow around */}
      <Arrow d={`M${cx + R + 10} ${cy - 20} A${R + 10} ${R + 10} 0 0 1 ${cx + 20} ${cy + R + 8}`} cls="thin" />
      <Label x={cx} y={212} size={6}>PDCA → plan · do · check · act</Label>
    </svg>
  );
}

/** Gantt with dependency arrows — the scheduling problem. */
function Gantt() {
  const rows = [
    { l: 'J1  drilling', s: 0, e: 4 },
    { l: 'J2  blasting', s: 4, e: 6 },
    { l: 'J3  hauling', s: 6, e: 11 },
    { l: 'J4  crushing', s: 8, e: 13 },
    { l: 'J5  washing', s: 13, e: 19 },
    { l: 'J6  loading', s: 19, e: 22 },
  ];
  const x0 = 80, y0 = 34, cw = 12, rh = 18;
  return (
    <svg viewBox="0 0 380 190" className="sketch">
      <Label x={190} y={14} size={8}>SCHEDULE — MILP sequencing, makespan Cmax</Label>
      <path d={`M${x0} ${y0 - 6} V${y0 + rows.length * rh + 4} H${x0 + 24 * cw}`} className="thin" />
      {Array.from({ length: 25 }, (_, i) => i).map((i) => (
        i % 4 === 0 && <g key={i}><path d={`M${x0 + i * cw} ${y0 - 6} v-3`} className="thin" /><Label x={x0 + i * cw} y={y0 - 11} size={5}>{`t${i}`}</Label></g>
      ))}
      {rows.map((r, i) => (
        <g key={r.l}>
          <Label x={x0 - 6} y={y0 + i * rh + 12} size={5.5} anchor="end">{r.l}</Label>
          <Box x={x0 + r.s * cw} y={y0 + i * rh + 3} w={(r.e - r.s) * cw} h={12} r={2} />
          <path d={`M${x0 + r.s * cw} ${y0 + i * rh + 15} l${(r.e - r.s) * cw} -12`} className="hatch" />
          {i > 0 && (
            <Arrow d={`M${x0 + rows[i - 1].e * cw} ${y0 + (i - 1) * rh + 9} h4 V${y0 + i * rh + 9} H${x0 + r.s * cw - 1}`} cls="thin" />
          )}
        </g>
      ))}
      <path d={`M${x0 + 22 * cw} ${y0 - 6} V${y0 + rows.length * rh + 4}`} className="thin" strokeDasharray="3 3" />
      <Label x={x0 + 22 * cw + 4} y={y0 + rows.length * rh + 14} size={5.5} anchor="start">Cmax</Label>
      <Label x={190} y={180} size={5.5}>min Cmax   s.t.  Sj ≥ Ci + setup(i,j) · xij</Label>
    </svg>
  );
}

/** Kanban board with WIP limits. */
function Kanban() {
  const cols = [
    { t: 'TO DO', n: 4 },
    { t: 'DOING  (WIP 3)', n: 2 },
    { t: 'DONE', n: 3 },
  ];
  return (
    <svg viewBox="0 0 300 200" className="sketch">
      <Label x={150} y={14} size={8}>KANBAN — pull, not push</Label>
      {cols.map((c, i) => {
        const x = 14 + i * 94;
        return (
          <g key={c.t}>
            <Box x={x} y={24} w={84} h={164} />
            <path d={`M${x} 42 h84`} className="thin" />
            <Label x={x + 42} y={36} size={6}>{c.t}</Label>
            {Array.from({ length: c.n }, (_, k) => (
              <g key={k}>
                <Box x={x + 8} y={50 + k * 32} w={68} h={24} r={3} className="thin" />
                <path d={`M${x + 14} ${60 + k * 32} h40 M${x + 14} ${67 + k * 32} h26`} className="hatch" />
              </g>
            ))}
          </g>
        );
      })}
      <Arrow d="M110 150 h-10" cls="thin" />
      <Arrow d="M204 150 h-10" cls="thin" />
      <Label x={150} y={196} size={5.5}>signal → replenish → flow</Label>
    </svg>
  );
}

/** Distribution network: plants → DCs → customers. */
function Network() {
  const plants = [{ x: 40, y: 60 }, { x: 40, y: 130 }];
  const dcs = [{ x: 170, y: 40 }, { x: 170, y: 100 }, { x: 170, y: 160 }];
  const custs = [{ x: 300, y: 30 }, { x: 300, y: 70 }, { x: 300, y: 110 }, { x: 300, y: 150 }, { x: 300, y: 185 }];
  return (
    <svg viewBox="0 0 340 210" className="sketch">
      <Label x={170} y={14} size={8}>NETWORK DESIGN — plants · DCs · customers</Label>
      {plants.map((p) => dcs.map((d) => <path key={`${p.y}-${d.y}`} d={`M${p.x + 14} ${p.y} L${d.x - 12} ${d.y}`} className="thin" />))}
      {dcs.map((d, i) => custs.filter((_, k) => (k + i) % 2 === 0 || k === i).map((c) => (
        <path key={`${d.y}-${c.y}`} d={`M${d.x + 12} ${d.y} L${c.x - 8} ${c.y}`} className="thin" />
      )))}
      {plants.map((p) => (
        <g key={p.y}>
          <path d={`M${p.x - 14} ${p.y + 12} v-18 l9 -7 v7 l9 -7 v7 l10 -7 v25 z`} />
          <Label x={p.x} y={p.y + 24} size={5.5}>plant</Label>
        </g>
      ))}
      {dcs.map((d) => (
        <g key={d.y}>
          <path d={`M${d.x - 12} ${d.y - 10} h24 v20 h-24 z M${d.x - 12} ${d.y - 10} l12 -7 l12 7`} />
          <Label x={d.x} y={d.y + 20} size={5.5}>DC</Label>
        </g>
      ))}
      {custs.map((c) => (
        <circle key={c.y} cx={c.x} cy={c.y} r={6} />
      ))}
      <Label x={300} y={205} size={5.5}>demand dᵢ</Label>
      <Label x={60} y={200} size={5.5} anchor="start">min Σ fⱼyⱼ + Σ cᵢⱼxᵢⱼ   s.t. Σⱼ xᵢⱼ = dᵢ</Label>
    </svg>
  );
}

/* ------------------------------ placement ------------------------------ */

const DRAWINGS: Record<SketchId, () => React.ReactElement> = {
  vsm: Vsm,
  ishikawa: Ishikawa,
  erp: Erp,
  process: Process,
  dmaic: Dmaic,
  gantt: Gantt,
  kanban: Kanban,
  network: Network,
};

export const SKETCH_META: Record<SketchId, { name: string; where: string }> = {
  vsm: { name: 'Value-stream map', where: 'Lean · supplier → mine → plant → customer, lead-time ladder' },
  ishikawa: { name: 'Ishikawa', where: 'Quality · 6M fishbone into an effect' },
  erp: { name: 'SAP S/4HANA map', where: 'ERP · core with PP · MM · EWM · SD · QM · PM · FI/CO · IBP' },
  process: { name: 'Process map', where: 'BPMN · swimlanes, gateway, tasks' },
  dmaic: { name: 'DMAIC wheel', where: 'Six Sigma · define → control' },
  gantt: { name: 'Gantt / MILP', where: 'Scheduling · bars with dependencies and Cmax' },
  kanban: { name: 'Kanban board', where: 'Pull flow · three columns, WIP limit' },
  network: { name: 'Distribution network', where: 'Network design · plants, DCs, customers' },
};

/** Where each sketch sits (vw / vh), how wide, its tilt, and its drift. */
const LAYOUT: { id: SketchId; left: number; top: number; w: number; rot: number; mobile?: boolean; dx: number; dy: number; period: number }[] = [
  { id: 'vsm', left: 2, top: 6, w: 34, rot: -3, mobile: true, dx: 14, dy: 10, period: 38 },
  { id: 'erp', left: 66, top: 4, w: 30, rot: 4, mobile: true, dx: -12, dy: 12, period: 44 },
  { id: 'ishikawa', left: 58, top: 46, w: 30, rot: -2, dx: 10, dy: -12, period: 40 },
  { id: 'gantt', left: 1, top: 52, w: 30, rot: 2, mobile: true, dx: -10, dy: 14, period: 46 },
  { id: 'dmaic', left: 38, top: 68, w: 14, rot: 6, dx: 8, dy: -8, period: 34 },
  { id: 'process', left: 62, top: 76, w: 30, rot: -4, dx: -14, dy: -8, period: 42 },
  { id: 'kanban', left: 30, top: 24, w: 18, rot: 3, dx: 10, dy: 8, period: 36 },
  { id: 'network', left: 4, top: 80, w: 26, rot: -3, mobile: true, dx: 12, dy: -10, period: 48 },
];

export default function Sketches() {
  const enabled = on('sketches');
  const drift = loopOn('sketchDrift') && on('sketches');
  const { scrollY } = useScroll();
  // gentle parallax: the drawings slide up at a fraction of the scroll speed
  const y = useTransform(scrollY, (v) => (isLowPower ? 0 : -v * 0.08));

  if (!enabled) return null;
  const set = anim.sketchSet ?? {};
  const alpha = Math.min(1.5, Math.max(0.2, anim.sketchOpacity ?? 0.6));

  return (
    <motion.div
      className="absolute inset-0"
      style={{ y, '--sketch-alpha': String(0.42 * alpha) } as unknown as React.CSSProperties}
    >
      {/* one filter for every drawing: fine turbulence displaces the strokes a pixel or two */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <filter id="pencil" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M1 1 L9 5 L1 9" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </marker>
        </defs>
      </svg>

      {LAYOUT.filter((l) => set[l.id] !== false).map((l) => {
        const Draw = DRAWINGS[l.id];
        return (
          <motion.div
            key={l.id}
            className={(l.mobile ? '' : 'hidden md:block ') + 'absolute'}
            style={{ left: `${l.left}vw`, top: `${l.top}vh`, width: `${l.w}vw`, minWidth: 220, maxWidth: 560, rotate: l.rot }}
            animate={drift ? { x: [0, l.dx, 0], y: [0, l.dy, 0] } : undefined}
            transition={{ duration: dur(l.period), repeat: Infinity, ease: 'easeInOut' }}
          >
            <Draw />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
