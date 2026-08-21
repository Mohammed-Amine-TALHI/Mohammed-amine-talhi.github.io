import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineLocationMarker, HiOutlineExternalLink, HiOutlinePhotograph } from 'react-icons/hi';
import { TbBuildingWarehouse } from 'react-icons/tb';
import { useLang } from '../../lib/i18n';
import { config, industrialVisits, splitVisit } from '../../lib/data';
import { dur, on } from '../../lib/anim';
import Lightbox from '../Lightbox';
import { asset } from '../../lib/asset';

/**
 * Industrial visits.
 *
 * Pulled out of the education card so each visit gets its own single-line row:
 * organisation, the place visited, and the detail truncated rather than wrapped.
 * Trip photos sit above, and the EMINES write-up is linked from the header.
 */
export default function VisitsPanel() {
  const { t, ui, lang } = useLang();
  const { items } = industrialVisits();
  const visits = config.visits ?? { postUrl: '', postLabel: { en: '', fr: '' }, images: [], perVisit: {} };

  // gallery = trip photos plus anything attached to an individual visit
  const gallery = [
    ...(visits.images ?? []),
    ...items.flatMap((it) => visits.perVisit?.[it.id]?.images ?? []),
  ];
  const [shot, setShot] = useState<number | null>(null);

  if (!items.length) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-zinc-200">{ui('visits.title')}</h3>
          <p className="mt-1 text-sm text-zinc-500">{ui('visits.blurb')}</p>
        </div>

        {visits.postUrl && (
          <a
            href={visits.postUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2 rounded-xl border border-accent-500/30 bg-accent-500/[0.07] px-4 py-2.5 text-xs font-medium text-accent-300 transition-colors hover:bg-accent-500/[0.15]"
          >
            {t(visits.postLabel)?.trim() || ui('visits.post')}
            <HiOutlineExternalLink size={13} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        )}
      </div>

      {/* ---- trip photos ---- */}
      {gallery.length > 0 && (
        <motion.div
          {...(on('scrollReveal')
            ? {
                initial: { opacity: 0, y: 20 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: '-60px' },
                transition: { duration: dur(0.6), ease: [0.22, 1, 0.36, 1] as const },
              }
            : {})}
          className="mb-5 flex gap-2.5 overflow-x-auto pb-2"
        >
          {gallery.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setShot(i)}
              className="group relative h-28 w-40 shrink-0 overflow-hidden rounded-xl border border-line"
            >
              <img
                src={asset(src)}
                alt=""
                className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent" />
            </button>
          ))}
        </motion.div>
      )}

      {/* ---- one row per visit, never wrapping ---- */}
      <div className="overflow-hidden rounded-2xl border border-line bg-ink-900/60 backdrop-blur-sm">
        {items.map((it, i) => {
          const { org, detail } = splitVisit(t(it.text));
          const meta = visits.perVisit?.[it.id];
          const place = t(it.location);

          return (
            <motion.div
              key={it.id}
              {...(on('scrollReveal')
                ? {
                    initial: { opacity: 0, x: -14 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: true, margin: '-40px' },
                    transition: { duration: dur(0.45), delay: dur(i * 0.06), ease: [0.22, 1, 0.36, 1] as const },
                  }
                : {})}
              className="group flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 transition-colors hover:bg-white/[0.025] sm:gap-4 sm:px-5"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-ink-850 text-accent-500/80 transition-colors group-hover:border-accent-500/40">
                <TbBuildingWarehouse size={15} />
              </span>

              {/* org name — fixed width so the column lines up */}
              <span className="w-24 shrink-0 truncate font-display text-[13.5px] font-semibold text-zinc-100 sm:w-32">
                {org}
              </span>

              {/* the place visited */}
              {place && (
                <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11.5px] text-accent-500/90">
                  <HiOutlineLocationMarker size={12} />
                  {place}
                </span>
              )}

              {/* detail: truncated on one line rather than wrapping */}
              <span
                className="hidden min-w-0 flex-1 truncate text-[13px] text-zinc-500 md:block"
                title={detail}
              >
                {detail}
              </span>

              {meta?.images?.length ? (
                <button
                  onClick={() => setShot(gallery.indexOf(meta.images![0]))}
                  className="ml-auto flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 font-mono text-[10px] text-zinc-600 transition-colors hover:border-accent-500/40 hover:text-accent-400 md:ml-0"
                >
                  <HiOutlinePhotograph size={11} />
                  {meta.images!.length}
                </button>
              ) : null}

              {meta?.url && (
                <a
                  href={meta.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-zinc-600 transition-colors hover:text-accent-400"
                  aria-label={org + ' link'}
                >
                  <HiOutlineExternalLink size={13} />
                </a>
              )}

              <span className="ml-auto shrink-0 font-mono text-[10px] text-zinc-700 md:hidden">
                {String(i + 1).padStart(2, '0')}
              </span>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-3 font-mono text-[10.5px] text-zinc-700 md:hidden">
        {lang === 'fr' ? 'Tournez l’écran pour voir les détails' : 'Rotate for details'}
      </p>

      <Lightbox
        images={gallery}
        index={shot !== null && shot >= 0 ? shot : null}
        onClose={() => setShot(null)}
        onIndex={setShot}
      />
    </div>
  );
}
