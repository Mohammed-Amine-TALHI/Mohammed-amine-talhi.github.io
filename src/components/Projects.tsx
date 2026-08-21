import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { TbFolderCode, TbFileTypePdf, TbPresentation, TbLayoutBoardSplit, TbBrandGithub } from 'react-icons/tb';
import type { IconType } from 'react-icons';
import SectionHeading from './SectionHeading';
import { useLang } from '../lib/i18n';
import { visibleProjects, projectTags, config, endYear, projectAssets, ASSET_LABEL } from '../lib/data';
import { dur, on } from '../lib/anim';
import type { AssetKind } from '../lib/types';
import { asset } from '../lib/asset';

/* Each document type gets its own icon and tint, so a card's attachments are
   readable at a glance the way they are on a conference poster session. */
const ASSET_STYLE: Record<AssetKind, { Icon: IconType; cls: string }> = {
  report: { Icon: TbFileTypePdf, cls: 'border-rose-500/25 text-rose-300/90 hover:bg-rose-500/10' },
  presentation: { Icon: TbPresentation, cls: 'border-sky-500/25 text-sky-300/90 hover:bg-sky-500/10' },
  poster: { Icon: TbLayoutBoardSplit, cls: 'border-violet-500/25 text-violet-300/90 hover:bg-violet-500/10' },
  code: { Icon: TbBrandGithub, cls: 'border-zinc-600/50 text-zinc-300 hover:bg-white/5' },
  link: { Icon: HiOutlineExternalLink, cls: 'border-accent-500/25 text-accent-300/90 hover:bg-accent-500/10' },
};

export default function Projects() {
  const { t, ui, lang } = useLang();
  const [filter, setFilter] = useState<string>('__all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const projects = useMemo(() => visibleProjects(), []);
  const tags = useMemo(() => projectTags(lang), [lang]);

  const shown = projects.filter(
    (p) => filter === '__all' || (p.tag?.[lang] || p.tag?.en || '').trim() === filter,
  );

  return (
    <section id="projects" className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading index="02" eyebrow={ui('projects.eyebrow')} title={ui('projects.title')}>
          {/* filter row */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {['__all', ...tags].map((tag) => {
              const active = filter === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setFilter(tag)}
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
              {shown.length} {ui('projects.count')}
            </span>
          </div>
        </SectionHeading>

        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {shown.map((p, i) => {
              const meta = config.projectMeta?.[p.id];
              const assets = projectAssets(p.id);
              const open = expanded === p.id;
              const year = endYear(p.period);

              return (
                <motion.article
                  key={p.id}
                  id={'project-' + p.id}
                  layout
                  initial={on('scrollReveal') ? { opacity: 0, y: 26, scale: 0.97 } : false}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ duration: dur(0.5), delay: dur(Math.min(i * 0.04, 0.3)), ease: [0.22, 1, 0.36, 1] }}
                  className="group relative flex scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-line bg-ink-900/60 backdrop-blur-sm transition-colors duration-300 hover:border-accent-500/35"
                >
                  {/* accent glow that follows the card on hover */}
                  <span className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-accent-600/12 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                  {meta?.cover && (
                    <div className="relative h-36 overflow-hidden border-b border-line">
                      <img
                        src={asset(meta.cover)}
                        alt=""
                        className="h-full w-full object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent" />
                    </div>
                  )}

                  <div className="relative flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <TbFolderCode className="text-accent-500/80" size={17} />
                        {p.tag && t(p.tag).trim() && (
                          <span className="rounded-md border border-accent-500/20 bg-accent-500/[0.07] px-2 py-0.5 text-[10px] font-medium text-accent-400/90">
                            {t(p.tag)}
                          </span>
                        )}
                      </span>
                      {year > 0 && <span className="font-mono text-[10px] text-zinc-600">{year}</span>}
                    </div>

                    <h3 className="font-display text-[15px] font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-accent-300">
                      {t(p.title)}
                    </h3>
                    <p className="mt-1.5 font-mono text-[10.5px] text-zinc-600">{t(p.period)}</p>

                    {/* first bullet always visible; the rest reveal on demand */}
                    <ul className="mt-4 space-y-2">
                      {p.bullets.slice(0, open ? undefined : 1).map((b) => (
                        <li key={b.id} className="flex gap-2.5 text-[13px] leading-relaxed text-zinc-400">
                          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent-600/70" />
                          <span>{t(b.text)}</span>
                        </li>
                      ))}
                    </ul>

                    {meta?.stack?.length ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {meta.stack.map((s) => (
                          <span key={s} className="rounded border border-line bg-ink-850/70 px-2 py-0.5 text-[10px] text-zinc-500">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {/* attached documents: report, deck, poster, code, links */}
                    {assets.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-1.5">
                        {assets.map((a) => {
                          const { Icon, cls } = ASSET_STYLE[a.kind] ?? ASSET_STYLE.link;
                          const label = t(a.label)?.trim() || t(ASSET_LABEL[a.kind]);
                          const external = /^https?:/i.test(a.url);
                          return (
                            <a
                              key={a.id}
                              href={asset(a.url)}
                              target="_blank"
                              rel="noreferrer"
                              {...(external ? {} : { download: '' })}
                              className={
                                'flex items-center gap-1.5 rounded-lg border bg-white/[0.02] px-2.5 py-1.5 text-[11px] font-medium transition-colors ' +
                                cls
                              }
                            >
                              <Icon size={13} />
                              {label}
                            </a>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-auto flex items-center gap-3 pt-5">
                      {p.bullets.length > 1 && (
                        <button
                          onClick={() => setExpanded(open ? null : p.id)}
                          className="font-mono text-[11px] text-zinc-500 transition-colors hover:text-accent-400"
                        >
                          {open
                            ? lang === 'fr' ? '— Réduire' : '— Show less'
                            : lang === 'fr' ? `+ ${p.bullets.length - 1} de plus` : `+ ${p.bullets.length - 1} more`}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {!shown.length && <p className="py-16 text-center text-sm text-zinc-600">{ui('projects.empty')}</p>}
      </div>
    </section>
  );
}
