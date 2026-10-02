import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlinePhotograph,
  HiChevronDown,
} from 'react-icons/hi';
import { TbConfetti } from 'react-icons/tb';
import SafeImage from '../SafeImage';
import { useLang } from '../../lib/i18n';
import { dur } from '../../lib/anim';
import { cropFor, cropStyle } from '../../lib/crop';
import { HiOutlineExternalLink } from 'react-icons/hi';
import type { LeadershipEvent, LeadershipKpi, LeadershipStep } from '../../lib/types';

/* -------------------------------------------------------------------------- */
/*  Timeline — how the role grew, one step per period                          */
/* -------------------------------------------------------------------------- */
export function Timeline({ steps, tone }: { steps: LeadershipStep[]; tone: { text: string; dot: string } }) {
  const { t, lang } = useLang();
  const items = steps.filter((s) => t(s.role)?.trim() || t(s.text)?.trim());
  if (!items.length) return null;

  return (
    <div className="mx-auto mt-7 max-w-[62ch]">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
        {lang === 'fr' ? 'Parcours' : 'Timeline'}
      </p>
      <ol className="relative ml-1.5 border-l border-line">
        {items.map((s, i) => (
          <li key={i} className={'relative pl-5 ' + (i === items.length - 1 ? '' : 'pb-5')}>
            <span className={'absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-ink-900 ' + tone.dot} />
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="font-mono text-[10.5px] text-zinc-500">{t(s.period)}</span>
              <span className={'text-[13px] font-semibold ' + tone.text}>{t(s.role)}</span>
            </div>
            {t(s.text)?.trim() && (
              <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-zinc-400">{t(s.text)}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Key figures — small tiles under the story                                  */
/* -------------------------------------------------------------------------- */
export function KpiRow({ kpis, accent }: { kpis: LeadershipKpi[]; accent: string }) {
  const { t, lang } = useLang();
  const items = kpis.filter((k) => k.value?.trim());
  if (!items.length) return null;

  return (
    <div className="mx-auto mt-7 max-w-[62ch]">
      <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
        {lang === 'fr' ? 'Chiffres clés' : 'Key figures'}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((k, i) => (
          <div key={i} className="rounded-xl border border-line bg-white/[0.02] px-3.5 py-3">
            <div className={'font-display text-xl font-bold leading-none ' + accent}>{k.value}</div>
            <div className="mt-1.5 text-[11px] leading-snug text-zinc-500">{t(k.label)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Events — one big box that unfolds into one sub-box per event               */
/*                                                                            */
/*  Collapsed: a strip of event covers plus the count, so the reader sees      */
/*  there is something to open. Expanded: a card per event with its facts     */
/*  (place, date, headcount), a line of description, highlight chips and the  */
/*  photo grid; photos open the shared lightbox through `onShot`, which       */
/*  receives the event id and the index inside that event.                    */
/* -------------------------------------------------------------------------- */
export function EventsBlock({
  events,
  tone,
  onShot,
}: {
  events: LeadershipEvent[];
  tone: { text: string; ring: string; glow: string; dot: string };
  onShot: (eventId: string, index: number) => void;
}) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const list = events.filter((ev) => t(ev.title)?.trim());
  if (!list.length) return null;

  const covers = list.map((ev) => ev.images?.[0]).filter(Boolean) as string[];
  const people = list.reduce((n, ev) => n + (Number(ev.people) || 0), 0);

  return (
    <div className="mt-8 border-t border-line pt-7">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
        {lang === 'fr' ? 'Événements organisés' : 'Events organised'} · {list.length}
      </p>

      {/* ------------------------------ the big box ------------------------------ */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={
          'group relative flex w-full items-stretch gap-4 overflow-hidden rounded-2xl border bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/[0.04] sm:p-4 ' +
          tone.ring
        }
      >
        <span className={'pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full blur-3xl ' + tone.glow} />

        {/* cover strip */}
        {covers.length > 0 ? (
          <span className="relative hidden h-20 w-32 shrink-0 sm:block">
            {covers.slice(0, 3).map((src, i) => (
              <span
                key={src}
                className="absolute top-0 h-20 w-24 overflow-hidden rounded-xl border border-line bg-ink-900 shadow-lg"
                style={{ left: i * 18, transform: `rotate(${(i - 1) * 4}deg)`, zIndex: 3 - i }}
              >
                <SafeImage src={src} style={cropStyle(cropFor(src))} className="h-full w-full" />
              </span>
            ))}
          </span>
        ) : (
          <span className={'grid h-20 w-20 shrink-0 place-items-center rounded-xl border ' + tone.ring + ' ' + tone.text}>
            <TbConfetti size={26} />
          </span>
        )}

        <span className="relative min-w-0 flex-1 self-center">
          <span className="block font-display text-[15px] font-semibold text-zinc-100">
            {lang === 'fr' ? 'Les grands événements' : 'The big events'}
          </span>
          <span className="mt-1 block text-[12.5px] leading-relaxed text-zinc-500">
            {list.map((ev) => t(ev.title)).join(' · ')}
          </span>
          <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px] text-zinc-600">
            {people > 0 && (
              <span className="flex items-center gap-1">
                <HiOutlineUserGroup size={12} /> {people} {lang === 'fr' ? 'participants' : 'participants'}
              </span>
            )}
            {list.some((ev) => ev.images?.length) && (
              <span className="flex items-center gap-1">
                <HiOutlinePhotograph size={12} /> {list.reduce((n, ev) => n + (ev.images?.length ?? 0), 0)}
              </span>
            )}
          </span>
        </span>

        <span
          className={
            'grid h-9 w-9 shrink-0 place-items-center self-center rounded-full border border-line bg-ink-950/60 text-zinc-400 transition-all group-hover:border-accent-500/50 group-hover:text-accent-400 ' +
            (open ? 'rotate-180' : '')
          }
        >
          <HiChevronDown size={18} />
        </span>
      </button>

      {/* ------------------------------ the sub-boxes ------------------------------ */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="events"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: dur(0.35), ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid gap-3 pt-3 sm:grid-cols-2">
              {list.map((ev, i) => {
                const isActive = active === ev.id;
                const facts = [
                  { Icon: HiOutlineLocationMarker, v: t(ev.place) },
                  { Icon: HiOutlineCalendar, v: t(ev.date) },
                  { Icon: HiOutlineUserGroup, v: ev.people ? `${ev.people} ${lang === 'fr' ? 'pers.' : 'people'}` : '' },
                ].filter((f) => f.v?.trim());
                const cover = ev.images?.[0];

                return (
                  <motion.div
                    key={ev.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: dur(0.35), delay: dur(i * 0.06) }}
                    className={
                      'flex flex-col overflow-hidden rounded-2xl border border-line bg-ink-900/70 ' +
                      (isActive ? 'sm:col-span-2' : '')
                    }
                  >
                    {/* cover */}
                    {cover && (
                      <button
                        type="button"
                        onClick={() => onShot(ev.id, 0)}
                        className="group/cov relative block h-36 w-full overflow-hidden border-b border-line"
                      >
                        <SafeImage
                          src={cover}
                          style={cropStyle(cropFor(cover))}
                          className="h-full w-full transition-transform duration-500 group-hover/cov:scale-105"
                        />
                        {ev.images.length > 1 && (
                          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full border border-line bg-ink-950/80 px-2 py-0.5 font-mono text-[10px] text-zinc-300 backdrop-blur">
                            <HiOutlinePhotograph size={11} /> {ev.images.length}
                          </span>
                        )}
                      </button>
                    )}

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-display text-[15px] font-semibold leading-snug text-zinc-100">{t(ev.title)}</h4>
                        <span className={'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ' + tone.dot} />
                      </div>

                      {facts.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 font-mono text-[10.5px] text-zinc-500">
                          {facts.map(({ Icon, v }, k) => (
                            <span key={k} className="flex items-center gap-1">
                              <Icon size={12} className={tone.text} /> {v}
                            </span>
                          ))}
                        </div>
                      )}

                      {t(ev.description)?.trim() && (
                        <p
                          className={
                            'mt-3 whitespace-pre-line text-[13px] leading-relaxed text-zinc-400 ' +
                            (isActive ? '' : 'line-clamp-3')
                          }
                        >
                          {t(ev.description)}
                        </p>
                      )}

                      {ev.highlights?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {ev.highlights.map((h) => (
                            <span key={h} className="rounded-full border border-line bg-ink-850/70 px-2.5 py-0.5 text-[10.5px] text-zinc-400">
                              {h}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* gallery, shown once the sub-box is opened */}
                      <AnimatePresence initial={false}>
                        {isActive && ev.images.length > 1 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: dur(0.3) }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                              {ev.images.map((src, k) => (
                                <button
                                  key={src + k}
                                  type="button"
                                  onClick={() => onShot(ev.id, k)}
                                  className="group/img aspect-[4/3] overflow-hidden rounded-lg border border-line"
                                >
                                  <SafeImage
                                    src={src}
                                    style={cropStyle(cropFor(src))}
                                    className="h-full w-full transition-transform duration-500 group-hover/img:scale-105"
                                  />
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {ev.url && (
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noreferrer"
                          className={'mt-3 flex items-center gap-1 self-start font-mono text-[11px] underline decoration-dotted underline-offset-2 transition-colors hover:text-accent-400 ' + tone.text}
                        >
                          {lang === 'fr' ? 'Voir le post' : 'See the post'} <HiOutlineExternalLink size={12} />
                        </a>
                      )}

                      {(ev.images.length > 1 || (t(ev.description)?.length ?? 0) > 160) && (
                        <button
                          type="button"
                          onClick={() => setActive(isActive ? null : ev.id)}
                          className={'mt-auto flex items-center gap-1 self-start pt-3 font-mono text-[11px] transition-colors hover:text-accent-400 ' + tone.text}
                        >
                          {isActive
                            ? lang === 'fr' ? 'Réduire' : 'Collapse'
                            : lang === 'fr' ? 'Voir les photos et le détail' : 'See photos & details'}
                          <HiChevronDown size={13} className={isActive ? 'rotate-180' : ''} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
