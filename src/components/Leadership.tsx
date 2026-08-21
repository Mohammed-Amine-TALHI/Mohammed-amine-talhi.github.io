import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineX, HiOutlineDocumentText, HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { TbUsersGroup, TbFileTypePdf, TbPresentation, TbLayoutBoardSplit, TbBrandGithub } from 'react-icons/tb';
import type { IconType } from 'react-icons';
import SectionHeading from './SectionHeading';
import Lightbox from './Lightbox';
import Portal from './Portal';
import SafeImage from './SafeImage';
import { useLang } from '../lib/i18n';
import { config, ASSET_LABEL } from '../lib/data';
import { dur, on } from '../lib/anim';
import { usePreloadImages } from '../lib/preload';
import { cropStyle, resolveCrop } from '../lib/crop';
import type { AssetKind, LeadershipEntry } from '../lib/types';
import { asset } from '../lib/asset';

/** Per-entry accent tints, picked in the admin panel. */
const ACCENT: Record<string, { ring: string; text: string; glow: string; dot: string }> = {
  amber: { ring: 'border-accent-500/25', text: 'text-accent-400', glow: 'bg-accent-600/12', dot: 'bg-accent-500' },
  sky: { ring: 'border-sky-500/25', text: 'text-sky-400', glow: 'bg-sky-600/12', dot: 'bg-sky-500' },
  emerald: { ring: 'border-emerald-500/25', text: 'text-emerald-400', glow: 'bg-emerald-600/12', dot: 'bg-emerald-500' },
  violet: { ring: 'border-violet-500/25', text: 'text-violet-400', glow: 'bg-violet-600/12', dot: 'bg-violet-500' },
  rose: { ring: 'border-rose-500/25', text: 'text-rose-400', glow: 'bg-rose-600/12', dot: 'bg-rose-500' },
};

const ASSET_STYLE: Record<AssetKind, { Icon: IconType; cls: string }> = {
  report: { Icon: TbFileTypePdf, cls: 'border-rose-500/25 text-rose-300/90 hover:bg-rose-500/10' },
  presentation: { Icon: TbPresentation, cls: 'border-sky-500/25 text-sky-300/90 hover:bg-sky-500/10' },
  poster: { Icon: TbLayoutBoardSplit, cls: 'border-violet-500/25 text-violet-300/90 hover:bg-violet-500/10' },
  code: { Icon: TbBrandGithub, cls: 'border-zinc-600/50 text-zinc-300 hover:bg-white/5' },
  link: { Icon: HiOutlineArrowNarrowRight, cls: 'border-accent-500/25 text-accent-300/90 hover:bg-accent-500/10' },
};

const tint = (k?: string) => ACCENT[k ?? 'amber'] ?? ACCENT.amber;

/* -------------------------------------------------------------------------- */
/*  Collapsed card                                                            */
/*                                                                            */
/*  The cover and the text are separate stacked boxes with a fixed-height      */
/*  image — nothing is ever laid over a photo, which is what made the previous */
/*  card unreadable once an entry had several images and a long description.   */
/* -------------------------------------------------------------------------- */
function Card({
  entry: e,
  index,
  onOpen,
}: {
  entry: LeadershipEntry;
  index: number;
  onOpen: () => void;
}) {
  const { t, lang } = useLang();
  const a = tint(e.accent);
  const docs = (e.assets ?? []).filter((x) => x.url);
  const cover = e.images?.[0];

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={on('scrollReveal') ? { opacity: 0, y: 28 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: dur(0.55), delay: dur(index * 0.07), ease: [0.22, 1, 0.36, 1] }}
      {...(on('hoverLift') ? { whileHover: { y: -5 } } : {})}
      className={
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-ink-900/60 text-left backdrop-blur-sm transition-colors duration-300 ' +
        a.ring
      }
    >
      <span
        className={
          'pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 ' +
          a.glow
        }
      />

      {/* cover — its own box, fixed height, no text inside it.
          A deleted file falls back to the same plate an entry with no photo
          gets, rather than the browser's broken-image icon. */}
      {cover ? (
        <SafeImage
          src={cover}
          style={cropStyle(resolveCrop(e), e.imageFit ?? 'cover')}
          className={
            'block h-40 w-full shrink-0 border-b border-line ' +
            (e.imageFit === 'contain' ? 'bg-ink-950 p-1' : '')
          }
          fallback={
            <span className={'flex h-24 shrink-0 items-center justify-center border-b border-line ' + a.glow}>
              <TbUsersGroup className={a.text} size={26} />
            </span>
          }
        />
      ) : (
        <span className={'flex h-24 shrink-0 items-center justify-center border-b border-line ' + a.glow}>
          <TbUsersGroup className={a.text} size={26} />
        </span>
      )}

      {/* text — its own box, strictly below the image */}
      <span className="relative flex flex-1 flex-col p-5">
        <span className="mb-2 flex items-start justify-between gap-3">
          <span className={'flex items-center gap-2 text-[11px] font-medium ' + a.text}>
            <span className={'h-1.5 w-1.5 rounded-full ' + a.dot} />
            {t(e.role)}
          </span>
          <span className="shrink-0 font-mono text-[10px] text-zinc-600">{t(e.period)}</span>
        </span>

        <span className="font-display text-[15px] font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-accent-300">
          {t(e.title)}
        </span>

        {/* two-line excerpt; the full text lives in the journal view */}
        <span className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">{t(e.description)}</span>

        {e.tags?.length > 0 && (
          <span className="mt-4 flex flex-wrap gap-1.5">
            {e.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line bg-ink-850/70 px-2.5 py-1 text-[10px] text-zinc-500"
              >
                {tag}
              </span>
            ))}
          </span>
        )}

        <span className="mt-auto flex items-center gap-3 pt-4 font-mono text-[11px] text-zinc-600">
          {docs.length > 0 && (
            <span className="flex items-center gap-1">
              <HiOutlineDocumentText size={12} />
              {docs.length}
            </span>
          )}
          <span className={'ml-auto flex items-center gap-1.5 transition-colors group-hover:text-accent-400'}>
            {lang === 'fr' ? 'Lire' : 'Read'}
            <HiOutlineArrowNarrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </span>
    </motion.button>
  );
}

/**
 * One photo in the journal grid.
 *
 * Unmounts itself if the file is missing, so a deleted upload leaves no gap and
 * no broken-image icon — the grid simply has one fewer tile.
 */
function GalleryTile({ src, onOpen }: { src: string; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <button
      onClick={onOpen}
      className="group/img relative aspect-[4/3] overflow-hidden rounded-xl border border-line"
    >
      <img
        src={asset(src)}
        alt=""
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
      />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Expanded "journal" — scrollable prose, then documents, then the photos     */
/* -------------------------------------------------------------------------- */
function Journal({
  entry: e,
  onShot,
  onClose,
}: {
  entry: LeadershipEntry;
  onShot: (i: number) => void;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const a = tint(e.accent);
  const docs = (e.assets ?? []).filter((x) => x.url);
  const paragraphs = t(e.description)
    .split('\n')
    .filter((p) => p.trim());

  return (
    <div className="max-h-[88vh] overflow-y-auto">
      {/* masthead stays put while the story scrolls under it */}
      <header className="sticky top-0 z-10 flex items-start gap-4 border-b border-line bg-ink-900/95 p-5 backdrop-blur-xl sm:p-6">
        <span
          className={
            'grid h-11 w-11 shrink-0 place-items-center rounded-xl border bg-white/[0.03] ' + a.ring + ' ' + a.text
          }
        >
          <TbUsersGroup size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold leading-tight text-zinc-100 sm:text-lg">{t(e.title)}</h3>
          <p className={'mt-1 text-[13px] font-medium leading-snug ' + a.text}>{t(e.role)}</p>
          <p className="mt-0.5 font-mono text-[10.5px] text-zinc-600">{t(e.period)}</p>
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-ink-950/60 text-zinc-300 transition-all hover:scale-105 hover:border-accent-500/60 hover:bg-accent-500 hover:text-ink-950"
        >
          <HiOutlineX size={19} />
        </button>
      </header>

      <div className="p-5 sm:p-7">
        {/* prose column — a 62-character measure and open leading, so it reads
            like a journal entry rather than a caption */}
        <div className="mx-auto max-w-[62ch]">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className={'text-[15px] leading-[1.85] text-zinc-300 ' + (i === 0 ? '' : 'mt-4')}
            >
              {p}
            </p>
          ))}
        </div>

        {e.tags?.length > 0 && (
          <div className="mx-auto mt-7 flex max-w-[62ch] flex-wrap gap-1.5">
            {e.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line bg-ink-850/70 px-3 py-1 text-[11px] text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {docs.length > 0 && (
          <div className="mx-auto mt-7 max-w-[62ch]">
            <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">Documents</p>
            <div className="flex flex-wrap gap-1.5">
              {docs.map((d) => {
                const { Icon, cls } = ASSET_STYLE[d.kind] ?? ASSET_STYLE.link;
                const label = t(d.label)?.trim() || t(ASSET_LABEL[d.kind]);
                const external = /^https?:/i.test(d.url);
                return (
                  <a
                    key={d.id}
                    href={asset(d.url)}
                    target="_blank"
                    rel="noreferrer"
                    {...(external ? {} : { download: '' })}
                    className={
                      'flex items-center gap-1.5 rounded-lg border bg-white/[0.02] px-3 py-2 text-[12px] font-medium transition-colors ' +
                      cls
                    }
                  >
                    <Icon size={14} />
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* photos, underneath the story */}
        {e.images?.length > 0 && (
          <div className="mt-8 border-t border-line pt-7">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
              {lang === 'fr' ? 'Photos' : 'Photos'} · {e.images.length}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {e.images.map((src, i) => (
                <GalleryTile key={src} src={src} onOpen={() => onShot(i)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default function Leadership() {
  const { ui } = useLang();
  const entries = config.leadership ?? [];

  const [openId, setOpenId] = useState<string | null>(null);
  const [shot, setShot] = useState<number | null>(null);
  const entry = entries.find((e) => e.id === openId) ?? null;

  // the journal's gallery is mounted on click, so warm every photo up front —
  // otherwise the grid opens empty and fills in
  usePreloadImages(entries.flatMap((e) => e.images ?? []));

  const isOpen = Boolean(entry);

  // Lock the page behind the journal. Keyed on open/closed only — folding the
  // lightbox index into this effect made it tear down and re-apply on every
  // photo click, which briefly handed scrolling back to the page underneath.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Escape closes the journal, but only once the lightbox has had its turn.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && shot === null) setOpenId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, shot]);

  return (
    <section id="leadership" className="relative scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading index="04" eyebrow={ui('leadership.eyebrow')} title={ui('leadership.title')} />

        {!entries.length ? (
          <p className="rounded-2xl border border-dashed border-line py-16 text-center text-sm text-zinc-600">
            {ui('leadership.empty')}
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {entries.map((e, i) => (
              <Card key={e.id} entry={e} index={i} onOpen={() => setOpenId(e.id)} />
            ))}
          </div>
        )}
      </div>

      <Portal>
      <AnimatePresence>
        {entry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur(0.2) }}
            onClick={() => setOpenId(null)}
            className="fixed inset-0 z-[55] flex items-start justify-center overflow-y-auto bg-ink-950/85 p-4 backdrop-blur-md sm:p-8"
          >
            <motion.article
              initial={{ opacity: 0, y: 26, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.99 }}
              transition={{ duration: dur(0.35), ease: [0.22, 1, 0.36, 1] }}
              onClick={(ev) => ev.stopPropagation()}
              className="relative my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-ink-900 shadow-2xl"
            >
              <Journal entry={entry} onShot={setShot} onClose={() => setOpenId(null)} />
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
      </Portal>

      <Lightbox images={entry?.images ?? []} index={shot} onClose={() => setShot(null)} onIndex={setShot} />
    </section>
  );
}
