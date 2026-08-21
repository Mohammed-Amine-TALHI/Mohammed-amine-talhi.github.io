import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlineExternalLink,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineX,
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlineArrowNarrowRight,
} from 'react-icons/hi';
import { TbFolderCode, TbFileTypePdf, TbPresentation, TbLayoutBoardSplit, TbBrandGithub } from 'react-icons/tb';
import type { IconType } from 'react-icons';
import SectionHeading from './SectionHeading';
import SafeImage from './SafeImage';
import Portal from './Portal';
import Lightbox from './Lightbox';
import { useDocViewer } from './DocViewer';
import { useLang } from '../lib/i18n';
import { visibleProjects, projectTags, config, endYear, projectAssets, ASSET_LABEL } from '../lib/data';
import { dur, on } from '../lib/anim';
import { cropStyle, resolveCrop } from '../lib/crop';
import { usePreloadImages } from '../lib/preload';
import { asset } from '../lib/asset';
import type { AssetKind, Project } from '../lib/types';

/* Each document type gets its own icon and tint, so a card's attachments are
   readable at a glance the way they are on a conference poster session. */
const ASSET_STYLE: Record<AssetKind, { Icon: IconType; cls: string }> = {
  report: { Icon: TbFileTypePdf, cls: 'border-rose-500/25 text-rose-300/90 hover:bg-rose-500/10' },
  presentation: { Icon: TbPresentation, cls: 'border-sky-500/25 text-sky-300/90 hover:bg-sky-500/10' },
  poster: { Icon: TbLayoutBoardSplit, cls: 'border-violet-500/25 text-violet-300/90 hover:bg-violet-500/10' },
  code: { Icon: TbBrandGithub, cls: 'border-zinc-600/50 text-zinc-300 hover:bg-white/5' },
  link: { Icon: HiOutlineExternalLink, cls: 'border-accent-500/25 text-accent-300/90 hover:bg-accent-500/10' },
};

const galleryOf = (id: string) => config.projectMeta?.[id]?.gallery ?? [];

/* -------------------------------------------------------------------------- */
/*  Card — compact, and entirely clickable                                    */
/* -------------------------------------------------------------------------- */
function Card({ project: p, index, onOpen }: { project: Project; index: number; onOpen: () => void }) {
  const { t, lang } = useLang();
  const meta = config.projectMeta?.[p.id];
  const assets = projectAssets(p.id);
  const gallery = galleryOf(p.id);
  const year = endYear(p.period);

  return (
    <motion.button
      type="button"
      id={'project-' + p.id}
      onClick={onOpen}
      layout
      initial={on('scrollReveal') ? { opacity: 0, y: 26, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ duration: dur(0.5), delay: dur(Math.min(index * 0.04, 0.3)), ease: [0.22, 1, 0.36, 1] }}
      {...(on('hoverLift') ? { whileHover: { y: -5 } } : {})}
      className="group relative flex scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-line bg-ink-900/60 text-left backdrop-blur-sm transition-colors duration-300 hover:border-accent-500/35"
    >
      <span className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-accent-600/12 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      {meta?.cover && (
        <span className="relative block h-36 shrink-0 overflow-hidden border-b border-line">
          <SafeImage
            src={meta.cover}
            style={cropStyle(resolveCrop({ imageCrop: meta.coverCrop }))}
            className="h-full w-full opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent" />
          {gallery.length > 0 && (
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-ink-950/80 px-2 py-1 font-mono text-[10px] text-zinc-300">
              <HiOutlinePhotograph size={11} />
              {gallery.length}
            </span>
          )}
        </span>
      )}

      <span className="relative flex flex-1 flex-col p-5">
        <span className="mb-3 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <TbFolderCode className="text-accent-500/80" size={17} />
            {p.tag && t(p.tag).trim() && (
              <span className="rounded-md border border-accent-500/20 bg-accent-500/[0.07] px-2 py-0.5 text-[10px] font-medium text-accent-400/90">
                {t(p.tag)}
              </span>
            )}
          </span>
          {year > 0 && <span className="font-mono text-[10px] text-zinc-600">{year}</span>}
        </span>

        <span className="font-display text-[15px] font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-accent-300">
          {t(p.title)}
        </span>
        <span className="mt-1.5 font-mono text-[10.5px] text-zinc-600">{t(p.period)}</span>

        {/* a taste; the full write-up is in the journal */}
        <span className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-zinc-500">{t(p.bullets[0]?.text)}</span>

        {meta?.stack?.length ? (
          <span className="mt-4 flex flex-wrap gap-1.5">
            {meta.stack.slice(0, 4).map((s) => (
              <span key={s} className="rounded border border-line bg-ink-850/70 px-2 py-0.5 text-[10px] text-zinc-500">
                {s}
              </span>
            ))}
          </span>
        ) : null}

        <span className="mt-auto flex items-center gap-3 pt-5 font-mono text-[11px] text-zinc-600">
          {assets.length > 0 && (
            <span className="flex items-center gap-1">
              <HiOutlineDocumentText size={12} />
              {assets.length}
            </span>
          )}
          {p.bullets.length > 1 && <span>{p.bullets.length} pts</span>}
          <span className="ml-auto flex items-center gap-1.5 transition-colors group-hover:text-accent-400">
            {lang === 'fr' ? 'Lire' : 'Read'}
            <HiOutlineArrowNarrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </span>
    </motion.button>
  );
}

/** A photo that removes itself if the file is gone, so no broken tiles. */
function GalleryTile({ src, onOpen }: { src: string; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <button onClick={onOpen} className="group/img relative aspect-[4/3] overflow-hidden rounded-xl border border-line">
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
/*  Journal — the full write-up, documents, then the photos                   */
/* -------------------------------------------------------------------------- */
function Journal({
  project: p,
  onShot,
  onClose,
}: {
  project: Project;
  onShot: (i: number) => void;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const { open: openDoc } = useDocViewer();
  const meta = config.projectMeta?.[p.id];
  const assets = projectAssets(p.id);
  const gallery = galleryOf(p.id);
  const year = endYear(p.period);

  return (
    <div className="max-h-[88vh] overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-start gap-4 border-b border-line bg-ink-900/95 p-5 backdrop-blur-xl sm:p-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent-500/25 bg-accent-500/[0.07] text-accent-400">
          <TbFolderCode size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold leading-tight text-zinc-100 sm:text-lg">{t(p.title)}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-zinc-600">
            <span>{t(p.period)}</span>
            {t(p.tag)?.trim() && <span className="text-accent-500/90">· {t(p.tag)}</span>}
            {year > 0 && <span>· {year}</span>}
          </p>
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
        {/* the full write-up, every bullet */}
        <ul className="mx-auto max-w-[64ch] space-y-3.5">
          {p.bullets.map((b) => (
            <li key={b.id} className="flex gap-3 text-[14.5px] leading-[1.75] text-zinc-300">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500/80" />
              <span>{t(b.text)}</span>
            </li>
          ))}
        </ul>

        {meta?.stack?.length ? (
          <div className="mx-auto mt-7 max-w-[64ch]">
            <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
              {lang === 'fr' ? 'Outils' : 'Stack'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {meta.stack.map((s) => (
                <span key={s} className="rounded-full border border-line bg-ink-850/70 px-3 py-1 text-[11px] text-zinc-400">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {assets.length > 0 && (
          <div className="mx-auto mt-7 max-w-[64ch]">
            <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">Documents</p>
            <div className="flex flex-wrap gap-1.5">
              {assets.map((a) => {
                const { Icon, cls } = ASSET_STYLE[a.kind] ?? ASSET_STYLE.link;
                const label = t(a.label)?.trim() || t(ASSET_LABEL[a.kind]);
                const external = /^https?:/i.test(a.url);
                const cn =
                  'flex items-center gap-1.5 rounded-lg border bg-white/[0.02] px-3 py-2 text-[12px] font-medium transition-colors ' +
                  cls;

                return external ? (
                  <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className={cn}>
                    <Icon size={14} />
                    {label}
                  </a>
                ) : (
                  <button
                    key={a.id}
                    onClick={() => openDoc({ url: a.url, title: t(p.title) + ' — ' + label })}
                    className={cn}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* the work itself */}
        {gallery.length > 0 && (
          <div className="mt-8 border-t border-line pt-7">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
              {lang === 'fr' ? 'Photos' : 'Photos'} · {gallery.length}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {gallery.map((src, i) => (
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

export default function Projects() {
  const { ui, lang } = useLang();
  const [filter, setFilter] = useState<string>('__all');
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [shot, setShot] = useState<number | null>(null);
  const PREVIEW = 6;

  const projects = useMemo(() => visibleProjects(), []);
  const tags = useMemo(() => projectTags(lang), [lang]);

  const matching = projects.filter(
    (p) => filter === '__all' || (p.tag?.[lang] || p.tag?.en || '').trim() === filter,
  );
  const shown = showAll ? matching : matching.slice(0, PREVIEW);
  const hidden = matching.length - shown.length;

  const project = projects.find((p) => p.id === openId) ?? null;
  const gallery = project ? galleryOf(project.id) : [];
  const isOpen = Boolean(project);

  // every project photo, warmed on idle, so a journal opens already painted
  usePreloadImages(projects.flatMap((p) => galleryOf(p.id)));

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shot === null) setOpenId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, shot]);

  return (
    <section id="projects" className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading index="02" eyebrow={ui('projects.eyebrow')} title={ui('projects.title')}>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {['__all', ...tags].map((tag) => {
              const active = filter === tag;
              return (
                <button
                  key={tag}
                  onClick={() => {
                    setFilter(tag);
                    setShowAll(false);
                  }}
                  className={
                    'relative rounded-full border px-4 py-2 text-xs transition-colors ' +
                    (active
                      ? 'border-accent-500/50 text-accent-300'
                      : 'border-line text-zinc-500 hover:border-zinc-600 hover:text-zinc-300')
                  }
                >
                  {active && (
                    <motion.span
                      layoutId="project-filter"
                      className="absolute inset-0 rounded-full bg-accent-500/[0.12]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{tag === '__all' ? ui('projects.all') : tag}</span>
                </button>
              );
            })}
            <span className="ml-auto font-mono text-[11px] text-zinc-600">
              {matching.length} {ui('projects.count')}
            </span>
          </div>
        </SectionHeading>

        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {shown.map((p, i) => (
              <Card key={p.id} project={p} index={i} onOpen={() => setOpenId(p.id)} />
            ))}
          </AnimatePresence>
        </motion.div>

        {!matching.length && <p className="py-16 text-center text-sm text-zinc-600">{ui('projects.empty')}</p>}

        {hidden > 0 && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setShowAll(true)}
              className="group flex items-center gap-2.5 rounded-xl border border-line bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-zinc-300 transition-colors hover:border-accent-500/40 hover:text-accent-300"
            >
              {ui('projects.showMore')}
              <span className="rounded-md bg-accent-500/15 px-1.5 py-0.5 font-mono text-[10px] text-accent-400">
                +{hidden}
              </span>
              <HiOutlineChevronDown size={15} className="transition-transform group-hover:translate-y-0.5" />
            </button>
          </div>
        )}

        {showAll && matching.length > PREVIEW && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => {
                setShowAll(false);
                document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm text-zinc-500 transition-colors hover:text-accent-300"
            >
              <HiOutlineChevronUp size={15} className="transition-transform group-hover:-translate-y-0.5" />
              {ui('projects.showLess')}
            </button>
          </div>
        )}
      </div>

      <Portal>
        <AnimatePresence>
          {project && (
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
                onClick={(e) => e.stopPropagation()}
                className="relative my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-ink-900 shadow-2xl"
              >
                <Journal project={project} onShot={setShot} onClose={() => setOpenId(null)} />
              </motion.article>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>

      <Lightbox images={gallery} index={shot} onClose={() => setShot(null)} onIndex={setShot} />
    </section>
  );
}
