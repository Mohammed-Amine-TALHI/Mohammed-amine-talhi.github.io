import { motion } from 'framer-motion';
import { HiOutlineX, HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { TbFolderCode } from 'react-icons/tb';
import { useLang } from '../../lib/i18n';
import { dur, on } from '../../lib/anim';
import { projectsForSkill } from '../../lib/skillLinks';
import { endYear } from '../../lib/data';
import { resolveIcon } from '../../lib/iconRegistry';
import { FAMILY_DOT } from '../../lib/skills';
import { ASSET_LABEL } from '../../lib/data';
import { useDocViewer } from '../DocViewer';
import { TbFileTypePdf } from 'react-icons/tb';
import type { SkillItem } from '../../lib/types';

/** Scroll to a project card and pulse it. */
function goToProject(id: string) {
  const el = document.getElementById('project-' + id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('flash-target');
  window.setTimeout(() => el.classList.remove('flash-target'), 1800);
}

/**
 * Takes over the right-hand panel when a skill icon is clicked, listing every
 * project that used it. Selecting one jumps to that card in the Projects
 * section and flashes it.
 */
export default function SkillProjects({ skill, onClose }: { skill: SkillItem; onClose: () => void }) {
  const { t, ui, lang } = useLang();
  const { open: openDoc } = useDocViewer();
  const projects = projectsForSkill(skill);
  const Icon = resolveIcon(skill.icon);

  return (
    <motion.div
      key={skill.id}
      initial={on('scrollReveal') ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur(0.3), ease: [0.22, 1, 0.36, 1] }}
      className="flex max-h-[26rem] flex-col overflow-hidden rounded-2xl border border-accent-500/30 bg-ink-900/70 backdrop-blur-sm"
    >
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent-500/30 bg-accent-500/[0.08] text-accent-400">
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={'h-1.5 w-1.5 shrink-0 rounded-full ' + FAMILY_DOT[skill.family]} />
            <span className="truncate font-display text-sm font-semibold text-zinc-100">{skill.name}</span>
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
            {projects.length} {ui('skills.usedIn')}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-zinc-500 transition-colors hover:text-accent-400"
        >
          <HiOutlineX size={15} />
        </button>
      </header>

      {/* evidence attached directly to the skill — a report, certificate, deck */}
      {(skill.assets ?? []).filter((a) => a.url).length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-3">
          {(skill.assets ?? [])
            .filter((a) => a.url)
            .map((a) => {
              const label = t(a.label)?.trim() || t(ASSET_LABEL[a.kind]);
              const external = /^https?:/i.test(a.url);
              const cn =
                'flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-white/[0.02] px-2.5 py-1.5 text-[11px] font-medium text-rose-300/90 transition-colors hover:bg-rose-500/10';

              return external ? (
                <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className={cn}>
                  <TbFileTypePdf size={13} />
                  {label}
                </a>
              ) : (
                <button
                  key={a.id}
                  onClick={() => openDoc({ url: a.url, title: skill.name + ' — ' + label })}
                  className={cn}
                >
                  <TbFileTypePdf size={13} />
                  {label}
                </button>
              );
            })}
        </div>
      )}

      {projects.length === 0 ? (
        <p className="px-4 py-10 text-center text-[13px] text-zinc-600">{ui('skills.noProjects')}</p>
      ) : (
        <div className="overflow-y-auto">
          {projects.map((p, i) => {
            const year = endYear(p.period);
            return (
              <motion.button
                key={p.id}
                initial={on('scrollReveal') ? { opacity: 0, x: -10 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: dur(0.3), delay: dur(i * 0.04) }}
                onClick={() => goToProject(p.id)}
                className="group flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent-500/[0.07]"
              >
                <TbFolderCode className="mt-0.5 shrink-0 text-accent-500/70" size={15} />

                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium leading-snug text-zinc-200 transition-colors group-hover:text-accent-300">
                    {t(p.title)}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-zinc-600">
                    {year > 0 && <span>{year}</span>}
                    {t(p.tag)?.trim() && <span className="truncate text-accent-600/80">· {t(p.tag)}</span>}
                  </span>
                </span>

                <HiOutlineArrowNarrowRight
                  size={13}
                  className="mt-1 shrink-0 text-zinc-700 transition-all group-hover:translate-x-0.5 group-hover:text-accent-500"
                />
              </motion.button>
            );
          })}
        </div>
      )}

      <p className="border-t border-line px-4 py-2.5 font-mono text-[10px] text-zinc-700">
        {lang === 'fr' ? 'Cliquez un projet pour y aller' : 'Click a project to jump to it'}
      </p>
    </motion.div>
  );
}
