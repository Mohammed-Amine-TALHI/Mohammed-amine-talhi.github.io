import { useMemo, useState } from 'react';
import { HiChevronDown, HiChevronUp, HiOutlinePlus, HiOutlineTrash, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import { Card, Button, Input, Select, Field } from '../ui';
import { autoMatch } from '../../lib/skillLinks';
import AssetEditor from '../AssetEditor';
import { resume } from '../../lib/data';
import { ICONS, resolveIcon, searchIcons } from '../../lib/iconRegistry';
import { FAMILY_DOT, FAMILY_LABEL, FAMILIES } from '../../lib/skills';
import type { PortfolioConfig, SkillFamily, SkillItem } from '../../lib/types';

const rid = () => 'sk-' + Math.random().toString(36).slice(2, 9);

const blank = (): SkillItem => ({ id: rid(), name: '', icon: 'code', family: 'dev', projects: [] });

/** Modal grid for choosing an icon, with a search box over labels + keywords. */
function IconPicker({
  current,
  onPick,
  onClose,
}: {
  current: string;
  onPick: (key: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const results = useMemo(() => searchIcons(q), [q]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/85 p-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-ink-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line p-4">
          <HiOutlineSearch className="shrink-0 text-zinc-600" size={16} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={'Search ' + ICONS.length + ' icons — try "lean", "sql", "chart"…'}
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
          />
          <span className="shrink-0 font-mono text-[10px] text-zinc-600">{results.length}</span>
          <button onClick={onClose} className="shrink-0 text-zinc-500 hover:text-zinc-200">
            <HiOutlineX size={18} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 overflow-y-auto p-4 sm:grid-cols-6 md:grid-cols-8">
          {results.map(({ key, Icon, label }) => (
            <button
              key={key}
              onClick={() => {
                onPick(key);
                onClose();
              }}
              title={label}
              className={
                'group flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border p-1 transition-colors ' +
                (key === current
                  ? 'border-accent-500/60 bg-accent-500/[0.12]'
                  : 'border-line bg-ink-950 hover:border-accent-500/40 hover:bg-accent-500/[0.06]')
              }
            >
              <Icon
                className={
                  'text-[20px] transition-colors ' +
                  (key === current ? 'text-accent-400' : 'text-zinc-400 group-hover:text-accent-400')
                }
              />
              <span className="w-full truncate text-center text-[8px] leading-tight text-zinc-600">{label}</span>
            </button>
          ))}

          {!results.length && (
            <p className="col-span-full py-10 text-center text-xs text-zinc-600">No icon matches “{q}”.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SkillsAdminPanel({
  cfg,
  set,
}: {
  cfg: PortfolioConfig;
  set: (fn: (draft: PortfolioConfig) => void) => void;
}) {
  const list = cfg.skills ?? [];
  const [picking, setPicking] = useState<number | null>(null);
  const [linking, setLinking] = useState<string | null>(null);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    set((d) => {
      [d.skills[i], d.skills[j]] = [d.skills[j], d.skills[i]];
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-100">Skills toolbox</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            The icon grid in the About section. {list.length} skills · icons only on the site — the name shows in a
            tooltip on hover.
          </p>
        </div>
        <Button variant="primary" onClick={() => set((d) => void d.skills.push(blank()))}>
          <span className="flex items-center gap-1.5">
            <HiOutlinePlus size={13} /> Add skill
          </span>
        </Button>
      </header>

      {/* live preview of the actual grid */}
      <Card>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">Preview</p>
        <div className="flex flex-wrap gap-2">
          {list.map((s) => {
            const Icon = resolveIcon(s.icon);
            return (
              <div
                key={s.id}
                title={s.name}
                className="relative grid h-11 w-11 place-items-center rounded-xl border border-line bg-ink-850/60"
              >
                <Icon className="text-[20px] text-zinc-500" />
                <span
                  className={'absolute right-1 top-1 h-1 w-1 rounded-full ' + (FAMILY_DOT[s.family] ?? 'bg-zinc-600')}
                />
              </div>
            );
          })}
          {!list.length && <p className="py-4 text-xs text-zinc-600">No skills yet.</p>}
        </div>
      </Card>

      <div className="space-y-2">
        {list.map((s, i) => {
          const Icon = resolveIcon(s.icon);
          return (
            <Card key={s.id}>
              <div className="flex flex-wrap items-center gap-3">
                {/* icon button opens the picker */}
                <button
                  onClick={() => setPicking(i)}
                  title="Change icon"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-ink-950 text-zinc-400 transition-colors hover:border-accent-500/50 hover:text-accent-400"
                >
                  <Icon size={20} />
                </button>

                <div className="min-w-[10rem] flex-1">
                  <Input
                    value={s.name}
                    placeholder="Skill name (shown on hover)"
                    onChange={(e) => set((d) => void (d.skills[i].name = e.target.value))}
                  />
                </div>

                <div className="w-44 shrink-0">
                  <Select
                    value={s.family}
                    onChange={(v) => set((d) => void (d.skills[i].family = v as SkillFamily))}
                    options={FAMILIES.map((f) => ({ value: f, label: FAMILY_LABEL[f].en }))}
                  />
                </div>

                <span
                  className={'h-2.5 w-2.5 shrink-0 rounded-full ' + (FAMILY_DOT[s.family] ?? 'bg-zinc-600')}
                  title={FAMILY_LABEL[s.family]?.en}
                />

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="grid h-7 w-7 place-items-center rounded-md border border-line text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                  >
                    <HiChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === list.length - 1}
                    className="grid h-7 w-7 place-items-center rounded-md border border-line text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                  >
                    <HiChevronDown size={14} />
                  </button>
                  <Button onClick={() => setLinking(linking === s.id ? null : s.id)}>
                    {linking === s.id ? 'Close' : 'Projects'}
                  </Button>
                  <Button variant="danger" onClick={() => set((d) => void d.skills.splice(i, 1))}>
                    <HiOutlineTrash size={13} />
                  </Button>
                </div>
              </div>

              {linking === s.id && (
                <div className="mt-4 border-t border-line pt-4">
                  <Field
                    label="Projects using this skill"
                    hint="matches found in the project text are already linked — tick any extras"
                  >
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {resume.projects.map((p) => {
                        const auto = autoMatch(s).includes(p.id);
                        const manual = (s.projects ?? []).includes(p.id);
                        const linked = auto || manual;
                        return (
                          <button
                            key={p.id}
                            onClick={() =>
                              set((d) => {
                                const list = new Set(d.skills[i].projects ?? []);
                                if (manual) list.delete(p.id);
                                else list.add(p.id);
                                d.skills[i].projects = [...list];
                              })
                            }
                            disabled={auto && !manual}
                            title={auto ? 'Matched automatically from the project text' : undefined}
                            className={
                              'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[11.5px] transition-colors ' +
                              (linked
                                ? 'border-accent-500/50 bg-accent-500/[0.08] text-zinc-200'
                                : 'border-line text-zinc-500 hover:border-zinc-600 hover:text-zinc-300') +
                              (auto && !manual ? ' cursor-default opacity-80' : '')
                            }
                          >
                            <span
                              className={
                                'grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[4px] border text-[8px] ' +
                                (linked ? 'border-accent-500 bg-accent-500 text-ink-950' : 'border-zinc-700')
                              }
                            >
                              {linked ? '✓' : ''}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{p.title.en}</span>
                            {auto && (
                              <span className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[8.5px] uppercase text-zinc-500">
                                auto
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <div className="mt-5">
                    <AssetEditor
                      assets={s.assets ?? []}
                      onChange={(next) => set((d) => void (d.skills[i].assets = next))}
                      label="Attachments"
                      hint="a report, certificate or deck — shown when this skill is selected on the site"
                    />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {picking !== null && list[picking] && (
        <IconPicker
          current={list[picking].icon}
          onPick={(key) => set((d) => void (d.skills[picking].icon = key))}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  );
}
