import { useState } from 'react';
import { motion } from 'framer-motion';
import { skills, FAMILY_DOT, FAMILY_LABEL, FAMILIES } from '../../lib/skills';
import { useLang } from '../../lib/i18n';
import FlowConsole from './FlowConsole';
import SkillProjects from './SkillProjects';
import { linkCounts } from '../../lib/skillLinks';
import { config } from '../../lib/data';
import type { SkillItem } from '../../lib/types';

/* Icons pop in one after another as the grid scrolls into view. */
const grid = { hidden: {}, show: { transition: { staggerChildren: 0.035 } } };
const tile = {
  hidden: { opacity: 0, scale: 0.6, y: 14 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 320, damping: 20 },
  },
};

export default function SkillsPanel() {
  const { ui, lang } = useLang();
  const items = skills();
  // hovering feeds the console title; clicking pins the skill and swaps the
  // right-hand panel for the list of projects that used it
  const [focus, setFocus] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const raw: SkillItem[] = config.skills ?? [];
  const counts = linkCounts(raw);
  const pickedSkill = raw.find((s) => s.id === picked) ?? null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      {/* ------------------- icon grid (no labels, by design) ------------------- */}
      <div>
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h3 className="font-display text-xl font-semibold text-zinc-200">{ui('about.skills')}</h3>
          <span className="font-mono text-[11px] text-zinc-600">{ui('about.skillsHint')}</span>
        </div>

        <motion.div
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-5 gap-2.5 sm:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6"
        >
          {items.map(({ id, name, Icon, family }) => (
            <motion.button
              key={id}
              type="button"
              variants={tile}
              onHoverStart={() => setFocus(name)}
              onHoverEnd={() => setFocus(null)}
              onClick={() => setPicked((cur) => (cur === id ? null : id))}
              aria-pressed={picked === id}
              whileHover={{ y: -6, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="group relative aspect-square"
            >
              <div
                className={
                  'relative flex h-full w-full items-center justify-center rounded-xl border bg-ink-850/60 transition-colors duration-300 group-hover:border-accent-500/50 group-hover:bg-accent-500/[0.08] ' +
                  (picked === id ? 'border-accent-500 bg-accent-500/[0.12]' : 'border-line')
                }
              >
                <Icon
                  className={
                    'text-[22px] transition-colors duration-300 group-hover:text-accent-400 sm:text-[24px] ' +
                    (picked === id ? 'text-accent-400' : 'text-zinc-500')
                  }
                  aria-label={name}
                />

                {/* how many projects this skill links to */}
                {counts[id] > 0 && (
                  <span className="pointer-events-none absolute -bottom-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full border border-ink-950 bg-accent-500 px-1 font-mono text-[9px] font-bold text-ink-950">
                    {counts[id]}
                  </span>
                )}
                {/* glow bloom behind the tile on hover */}
                <span className="pointer-events-none absolute inset-0 rounded-xl bg-accent-500/25 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
                {/* group colour marker in the corner */}
                <span
                  className={
                    'pointer-events-none absolute right-1.5 top-1.5 h-1 w-1 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 ' +
                    FAMILY_DOT[family]
                  }
                />
              </div>

              {/* tooltip: the only place a skill name is ever written */}
              <span className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-ink-800 px-2.5 py-1 font-mono text-[10px] text-zinc-300 opacity-0 shadow-lg transition-all duration-200 group-hover:-top-10 group-hover:opacity-100">
                {name}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* legend for the four colour groups */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-7 flex flex-wrap gap-x-5 gap-y-2"
        >
          {FAMILIES.filter((f) => items.some((s) => s.family === f)).map((f) => (
            <span key={f} className="flex items-center gap-2 text-[11px] text-zinc-600">
              <span className={'h-1.5 w-1.5 rounded-full ' + FAMILY_DOT[f]} />
              {FAMILY_LABEL[f][lang]}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ------------------- companion panel -------------------
           the flow console by default; the linked projects once a skill
           is clicked, so the two halves of the section stay in one place */}
      {pickedSkill ? (
        <SkillProjects skill={pickedSkill} onClose={() => setPicked(null)} />
      ) : (
        <FlowConsole focus={focus} />
      )}
    </div>
  );
}
