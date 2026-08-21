import { useState } from 'react';
import { HiChevronDown, HiChevronUp, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { Toggle, Card, Button, LocField, TagsInput, ImageDrop, Field } from '../ui';
import AssetEditor from '../AssetEditor';
import { resolveCrop } from '../../lib/crop';
import { resume } from '../../lib/data';
import type { PortfolioConfig, Project } from '../../lib/types';

const rid = (p: string) => p + '-' + Math.random().toString(36).slice(2, 9);

const blankProject = (): Project => ({
  id: rid('custom'),
  title: { en: '', fr: '' },
  tag: { en: '', fr: '' },
  period: { en: '', fr: '' },
  bullets: [{ id: rid('b'), text: { en: '', fr: '' } }],
});

export default function ProjectsPanel({
  cfg,
  set,
}: {
  cfg: PortfolioConfig;
  set: (fn: (draft: PortfolioConfig) => void) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  const ordered = cfg.order.projects
    .map((id) => resume.projects.find((p) => p.id === id))
    .filter((p): p is Project => Boolean(p));

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= ordered.length) return;
    set((d) => {
      const list = [...d.order.projects];
      [list[index], list[next]] = [list[next], list[index]];
      d.order.projects = list;
    });
  };

  const visibleCount = ordered.filter((p) => cfg.visibility.projects[p.id] !== false).length;

  /** Binds the shared editor to one project's assets. */
  const AssetsFor = ({ id }: { id: string }) => (
    <AssetEditor
      assets={cfg.projectMeta[id]?.assets ?? []}
      onChange={(next) => set((d) => void (d.projectMeta[id] = { ...(d.projectMeta[id] ?? {}), assets: next }))}
    />
  );

  return (
    <div className="space-y-8">
      {/* ------------------------- synced from ResumeApp ------------------------- */}
      <section>
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-100">Projects from ResumeApp</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {visibleCount} of {ordered.length} shown · run <code className="text-accent-500">npm run sync</code> to
              pull new ones
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => set((d) => ordered.forEach((p) => (d.visibility.projects[p.id] = true)))}>
              Show all
            </Button>
            <Button onClick={() => set((d) => ordered.forEach((p) => (d.visibility.projects[p.id] = false)))}>
              Hide all
            </Button>
          </div>
        </header>

        <div className="space-y-2">
          {ordered.map((p, i) => {
            const on = cfg.visibility.projects[p.id] !== false;
            const meta = cfg.projectMeta[p.id] ?? {};
            const isOpen = open === p.id;
            const docCount = (meta.assets ?? []).filter((a) => a.url).length;

            return (
              <Card key={p.id} className={on ? '' : 'opacity-50'}>
                <div className="flex items-center gap-3">
                  <Toggle on={on} onChange={(v) => set((d) => void (d.visibility.projects[p.id] = v))} />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-zinc-200">{p.title.en}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-zinc-600">
                      <span>{p.period.en}</span>
                      {p.tag.en && <span className="text-accent-600">· {p.tag.en}</span>}
                      {docCount > 0 && (
                        <span className="rounded border border-line px-1.5 py-0.5 text-zinc-500">
                          {docCount} doc{docCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

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
                      disabled={i === ordered.length - 1}
                      className="grid h-7 w-7 place-items-center rounded-md border border-line text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                    >
                      <HiChevronDown size={14} />
                    </button>
                    <Button onClick={() => setOpen(isOpen ? null : p.id)}>{isOpen ? 'Close' : 'Details'}</Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 space-y-5 border-t border-line pt-4">
                    <Field label="Tech stack" hint="comma separated">
                      <TagsInput
                        value={meta.stack ?? []}
                        onChange={(v) => set((d) => void (d.projectMeta[p.id] = { ...meta, stack: v }))}
                        placeholder="Python, Gurobi, Power BI"
                      />
                    </Field>

                    <Field label="Cover image" hint="upload one and the crop frame appears straight away">
                      <ImageDrop
                        folder="covers"
                        single
                        images={meta.cover ? [meta.cover] : []}
                        onChange={(imgs) => set((d) => void (d.projectMeta[p.id] = { ...meta, cover: imgs[0] ?? '' }))}
                        aspect={368 / 144}
                        crop={resolveCrop({ imageCrop: meta.coverCrop })}
                        onCrop={(c) =>
                          set((d) => void (d.projectMeta[p.id] = { ...(d.projectMeta[p.id] ?? {}), coverCrop: c }))
                        }
                      />
                    </Field>

                    <AssetsFor id={p.id} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* ------------------------- custom projects ------------------------- */}
      <section>
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-100">Custom projects</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Live only in the portfolio — never written back to ResumeApp</p>
          </div>
          <Button variant="primary" onClick={() => set((d) => void d.customProjects.push(blankProject()))}>
            <span className="flex items-center gap-1.5">
              <HiOutlinePlus size={13} /> New project
            </span>
          </Button>
        </header>

        <div className="space-y-3">
          {cfg.customProjects.map((p, i) => (
            <Card key={p.id} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] text-zinc-600">{p.id}</span>
                <div className="flex items-center gap-3">
                  <Toggle
                    on={cfg.visibility.projects[p.id] !== false}
                    onChange={(v) => set((d) => void (d.visibility.projects[p.id] = v))}
                  />
                  <Button variant="danger" onClick={() => set((d) => void d.customProjects.splice(i, 1))}>
                    Delete
                  </Button>
                </div>
              </div>

              <LocField label="Title" value={p.title} onChange={(v) => set((d) => void (d.customProjects[i].title = v))} />
              <div className="grid gap-3 sm:grid-cols-2">
                <LocField label="Tag" value={p.tag} onChange={(v) => set((d) => void (d.customProjects[i].tag = v))} />
                <LocField
                  label="Period"
                  value={p.period}
                  onChange={(v) => set((d) => void (d.customProjects[i].period = v))}
                />
              </div>

              <div>
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                  Bullets
                </span>
                <div className="space-y-3">
                  {p.bullets.map((b, bi) => (
                    <div key={b.id} className="flex gap-2">
                      <div className="flex-1">
                        <LocField
                          label={'• ' + (bi + 1)}
                          multiline
                          value={b.text}
                          onChange={(v) => set((d) => void (d.customProjects[i].bullets[bi].text = v))}
                        />
                      </div>
                      <Button variant="danger" onClick={() => set((d) => void d.customProjects[i].bullets.splice(bi, 1))}>
                        <HiOutlineTrash size={13} />
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() =>
                      set((d) => void d.customProjects[i].bullets.push({ id: rid('b'), text: { en: '', fr: '' } }))
                    }
                  >
                    + Add bullet
                  </Button>
                </div>
              </div>

              <Field label="Cover image">
                <ImageDrop
                  folder="covers"
                  single
                  images={cfg.projectMeta[p.id]?.cover ? [cfg.projectMeta[p.id].cover!] : []}
                  onChange={(imgs) =>
                    set(
                      (d) =>
                        void (d.projectMeta[p.id] = { ...(d.projectMeta[p.id] ?? {}), cover: imgs[0] ?? '' }),
                    )
                  }
                />
              </Field>

              <AssetsFor id={p.id} />
            </Card>
          ))}

          {!cfg.customProjects.length && (
            <p className="rounded-xl border border-dashed border-line py-10 text-center text-xs text-zinc-600">
              No custom projects yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
