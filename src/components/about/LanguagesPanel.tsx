import { motion } from 'framer-motion';
import { TbLanguage } from 'react-icons/tb';
import { useLang } from '../../lib/i18n';
import { languages } from '../../lib/data';
import { dur, on } from '../../lib/anim';

/** Rough proficiency weight per level keyword, for the meters. */
function levelPct(level: string): number {
  const l = level.toLowerCase();
  if (/native|maternelle/.test(l)) return 100;
  if (/fluent|courant/.test(l)) return 92;
  if (/professional|professionnel/.test(l)) return 85;
  if (/basic|notions/.test(l)) return 32;
  return 60;
}

/** Sits directly under the industrial visits, as its own row. */
export default function LanguagesPanel() {
  const { ui, lang } = useLang();
  const langs = languages(lang);

  if (!langs.length) return null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent-500/20 bg-accent-500/[0.07] text-accent-500">
          <TbLanguage size={19} />
        </span>
        <h3 className="font-display text-xl font-semibold text-zinc-200">{ui('about.languages')}</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {langs.map((l, i) => (
          <motion.div
            key={l.name}
            {...(on('scrollReveal')
              ? {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: '-60px' },
                  transition: { duration: dur(0.5), delay: dur(i * 0.08), ease: [0.22, 1, 0.36, 1] as const },
                }
              : {})}
            className="rounded-2xl border border-line bg-ink-900/60 p-4 backdrop-blur-sm transition-colors hover:border-accent-500/30"
          >
            <div className="mb-1 text-sm font-medium text-zinc-200">{l.name}</div>
            <div className="mb-3 font-mono text-[10px] leading-tight text-zinc-600">{l.level}</div>

            <div className="h-1 overflow-hidden rounded-full bg-ink-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-300"
                initial={on('scrollReveal') ? { width: 0 } : false}
                whileInView={{ width: levelPct(l.level) + '%' }}
                viewport={{ once: true }}
                transition={{ duration: dur(1.1), delay: dur(0.15 + i * 0.1), ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
