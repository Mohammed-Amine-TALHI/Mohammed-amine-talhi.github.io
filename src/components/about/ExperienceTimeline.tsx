import { motion } from 'framer-motion';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { useLang } from '../../lib/i18n';
import { visibleExperiences } from '../../lib/data';
import { dur, on, loopOn } from '../../lib/anim';

export default function ExperienceTimeline() {
  const { t, ui } = useLang();
  const experiences = visibleExperiences();

  if (!experiences.length) return null;

  return (
    <div>
      <h3 className="mb-8 font-display text-xl font-semibold text-zinc-200">{ui('about.experience')}</h3>

      <div className="relative pl-8 sm:pl-12">
        {/* ---------------------------------------------------------------
            The rail. A static hairline, with a glowing segment that loops
            from top to bottom forever — the "pulse" travelling down the
            career timeline. Two offset copies keep the motion continuous
            instead of visibly restarting.
        --------------------------------------------------------------- */}
        <div className="absolute bottom-2 left-[3px] top-2 w-px overflow-hidden bg-line sm:left-[7px]">
          {loopOn('timelinePulse') &&
            [0, 2].map((delay) => (
              <motion.div
                key={delay}
                className="absolute left-0 h-28 w-px bg-gradient-to-b from-transparent via-accent-400 to-transparent"
                style={{ filter: 'drop-shadow(0 0 6px var(--color-accent-500))' }}
                animate={{ top: ['-15%', '100%'] }}
                transition={{ duration: dur(4), repeat: Infinity, ease: 'linear', delay: dur(delay) }}
              />
            ))}
        </div>

        <div className="space-y-6">
          {experiences.map((exp, i) => (
            <motion.article
              key={exp.id}
              id={exp.id}
              initial={{ opacity: 0, x: 34 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-70px' }}
              transition={{ duration: dur(0.6), delay: dur(i * 0.08), ease: [0.22, 1, 0.36, 1] }}
              {...(on('hoverLift') ? { whileHover: { x: 6 } } : {})}
              className="group relative scroll-mt-28 rounded-2xl border border-line bg-ink-900/60 p-5 backdrop-blur-sm transition-colors duration-300 hover:border-accent-500/35 hover:bg-ink-850/70 target:border-accent-500 sm:p-6"
            >
              {/* node sitting on the rail, aligned with the card title */}
              <span className="absolute -left-8 top-7 flex h-[7px] w-[7px] items-center justify-center sm:-left-12">
                <span className="absolute h-[7px] w-[7px] rounded-full bg-accent-500 ring-4 ring-ink-950" />
                {loopOn('timelinePulse') && (
                  <motion.span
                    className="absolute h-[7px] w-[7px] rounded-full bg-accent-400"
                    animate={{ scale: [1, 2.6, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: dur(2.4), repeat: Infinity, ease: 'easeInOut', delay: dur(i * 0.35) }}
                  />
                )}
              </span>

              {/* connector from the rail to the card */}
              <span className="absolute -left-8 top-[30px] h-px w-8 bg-gradient-to-r from-accent-500/60 to-transparent sm:-left-12 sm:w-12" />

              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <h4 className="font-display text-[15px] font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-accent-300 sm:text-base">
                    {t(exp.role)}
                  </h4>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-zinc-400">
                    <span className="font-medium text-accent-500/90">{t(exp.org)}</span>
                    <span className="flex items-center gap-1 text-xs text-zinc-600">
                      <HiOutlineLocationMarker size={12} />
                      {t(exp.location)}
                    </span>
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-line bg-ink-800/80 px-3 py-1 font-mono text-[10.5px] text-zinc-500">
                  {t(exp.period)}
                </span>
              </div>

              <ul className="mt-4 space-y-2.5">
                {exp.bullets.map((b) => (
                  <li key={b.id} className="flex gap-3 text-[13.5px] leading-relaxed text-zinc-400">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent-600/70" />
                    <span>{t(b.text)}</span>
                  </li>
                ))}
              </ul>

              {/* hairline that sweeps in along the card's top edge on hover */}
              <span className="pointer-events-none absolute inset-x-5 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-accent-500/70 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
