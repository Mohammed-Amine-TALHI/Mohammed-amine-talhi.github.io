import { motion } from 'framer-motion';
import { HiOutlineAcademicCap, HiOutlineLocationMarker } from 'react-icons/hi';
import { useLang } from '../../lib/i18n';
import { resume } from '../../lib/data';
import { dur, on } from '../../lib/anim';

/**
 * Degrees and coursework.
 *
 * The industrial-visit bullet group is deliberately skipped here — it now has
 * its own <VisitsPanel /> below, so each visit can get a full single-line row.
 */
export default function EducationPanel() {
  const { t, ui } = useLang();

  return (
    <div>
      <h3 className="mb-8 font-display text-xl font-semibold text-zinc-200">{ui('about.education')}</h3>

      <div className="grid gap-5 lg:grid-cols-2">
        {resume.education.map((edu, i) => (
          <motion.div
            key={edu.id}
            {...(on('scrollReveal')
              ? {
                  initial: { opacity: 0, y: 26 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: '-70px' },
                  transition: { duration: dur(0.6), delay: dur(i * 0.1), ease: [0.22, 1, 0.36, 1] as const },
                }
              : {})}
            className="group relative overflow-hidden rounded-2xl border border-line bg-ink-900/60 p-5 backdrop-blur-sm transition-colors hover:border-accent-500/30 sm:p-6"
          >
            {/* faint accent wash that fades in on hover */}
            <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent-600/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative flex items-start gap-4">
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent-500/20 bg-accent-500/[0.07] text-accent-500">
                <HiOutlineAcademicCap size={19} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
                  <h4 className="font-display text-[15px] font-semibold text-zinc-100 sm:text-base">
                    {t(edu.school)}
                  </h4>
                  <span className="shrink-0 font-mono text-[10.5px] text-zinc-500">{t(edu.period)}</span>
                </div>

                <p className="mt-1.5 text-sm leading-relaxed text-accent-500/90">{t(edu.degree)}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-zinc-600">
                  <HiOutlineLocationMarker size={12} />
                  {t(edu.location)}
                </p>

                {/* only the inline groups (coursework) render here */}
                {edu.bullets
                  .filter((b) => b.inline && b.items?.length)
                  .map((b) => (
                    <div key={b.id} className="mt-4">
                      {b.heading && (
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                          {t(b.heading)}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {b.items?.map((it) => (
                          <span
                            key={it.id}
                            className="rounded-md border border-line bg-ink-850/70 px-2.5 py-1 text-[11px] text-zinc-400"
                          >
                            {t(it.text)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
