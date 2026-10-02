import { HiOutlinePlus, HiChevronUp, HiChevronDown, HiOutlineTrash } from 'react-icons/hi';
import { Card, Button, LocField, TagsInput, ImageDrop, Field, Select, Input } from '../ui';
import AssetEditor from '../AssetEditor';
import { resolveCrop } from '../../lib/crop';
import type { LeadershipEntry, LeadershipEvent, PortfolioConfig } from '../../lib/types';

const blankEvent = (): LeadershipEvent => ({
  id: 'ev-' + Math.random().toString(36).slice(2, 9),
  title: { en: '', fr: '' },
  place: { en: '', fr: '' },
  date: { en: '', fr: '' },
  people: '',
  description: { en: '', fr: '' },
  highlights: [],
  images: [],
});

const ACCENTS = ['amber', 'sky', 'emerald', 'violet', 'rose'] as const;

const SWATCH: Record<string, string> = {
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
};

const blank = (): LeadershipEntry => ({
  id: 'lead-' + Math.random().toString(36).slice(2, 9),
  title: { en: '', fr: '' },
  role: { en: '', fr: '' },
  period: { en: '', fr: '' },
  description: { en: '', fr: '' },
  images: [],
  tags: [],
  accent: 'amber',
});

/** Presets for the things Amine is actually involved in, to save typing. */
const PRESETS: { label: string; make: () => LeadershipEntry }[] = [
  {
    label: '🏀 Basketball',
    make: () => ({
      ...blank(),
      title: { en: 'Basketball', fr: 'Basketball' },
      role: { en: 'Team Captain', fr: 'Capitaine' },
      tags: ['Basketball', 'Sport', 'Leadership'],
      accent: 'amber',
    }),
  },
  {
    label: '🎓 Club',
    make: () => ({
      ...blank(),
      title: { en: 'Club name', fr: 'Nom du club' },
      role: { en: 'Member', fr: 'Membre' },
      tags: ['Student life'],
      accent: 'violet',
    }),
  },
];

export default function LeadershipPanel({
  cfg,
  set,
}: {
  cfg: PortfolioConfig;
  set: (fn: (draft: PortfolioConfig) => void) => void;
}) {
  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= cfg.leadership.length) return;
    set((d) => {
      const l = d.leadership;
      [l[index], l[next]] = [l[next], l[index]];
    });
  };

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-100">Leadership &amp; student life</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Clubs, basketball, associations — with photos. This whole section is portfolio-only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p.label} onClick={() => set((d) => void d.leadership.push(p.make()))}>
              {p.label}
            </Button>
          ))}
          <Button variant="primary" onClick={() => set((d) => void d.leadership.push(blank()))}>
            <span className="flex items-center gap-1.5">
              <HiOutlinePlus size={13} /> Blank
            </span>
          </Button>
        </div>
      </header>

      <div className="space-y-3">
        {cfg.leadership.map((e, i) => (
          <Card key={e.id} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="grid h-7 w-7 place-items-center rounded-md border border-line text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                >
                  <HiChevronUp size={14} />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === cfg.leadership.length - 1}
                  className="grid h-7 w-7 place-items-center rounded-md border border-line text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                >
                  <HiChevronDown size={14} />
                </button>
                <span className="ml-2 font-mono text-[10px] text-zinc-600">{e.id}</span>
              </div>

              <div className="flex items-center gap-3">
                {/* accent picker */}
                <div className="flex gap-1.5">
                  {ACCENTS.map((a) => (
                    <button
                      key={a}
                      title={a}
                      onClick={() => set((d) => void (d.leadership[i].accent = a))}
                      className={
                        'h-5 w-5 rounded-full transition-transform ' +
                        SWATCH[a] +
                        (e.accent === a ? ' scale-110 ring-2 ring-white/70' : ' opacity-50 hover:opacity-100')
                      }
                    />
                  ))}
                </div>
                <Button variant="danger" onClick={() => set((d) => void d.leadership.splice(i, 1))}>
                  Delete
                </Button>
              </div>
            </div>

            <LocField label="Title" value={e.title} onChange={(v) => set((d) => void (d.leadership[i].title = v))} />

            <div className="grid gap-3 sm:grid-cols-2">
              <LocField label="Role" value={e.role} onChange={(v) => set((d) => void (d.leadership[i].role = v))} />
              <LocField label="Period" value={e.period} onChange={(v) => set((d) => void (d.leadership[i].period = v))} />
            </div>

            <LocField
              label="Story"
              hint="one line per paragraph — shown as a scrollable journal entry when the card is clicked"
              multiline
              value={e.description}
              onChange={(v) => set((d) => void (d.leadership[i].description = v))}
            />

            <Field label="Tags">
              <TagsInput
                value={e.tags ?? []}
                onChange={(v) => set((d) => void (d.leadership[i].tags = v))}
                placeholder="Basketball, Leadership, Sport"
              />
            </Field>

            <Field label="Photos" hint="the first is the card cover — its crop frame appears below">
              <ImageDrop
                images={e.images ?? []}
                onChange={(v) => set((d) => void (d.leadership[i].images = v))}
                aspect={368 / 160}
                fit={e.imageFit ?? 'cover'}
                crop={resolveCrop(e)}
                onCrop={(c) => set((d) => void (d.leadership[i].imageCrop = c))}
                itemCrops={{
                  get: (url) => resolveCrop({ imageCrop: cfg.crops?.[url] }),
                  set: (url, c) => set((d) => void ((d.crops ??= {})[url] = c)),
                  aspect: 4 / 3,
                }}
              />
            </Field>

            {e.images?.[0] && (
              <Field label="Cover framing" hint="how the first photo fills the card">
                <div className="max-w-xs">
                  <Select
                    value={e.imageFit ?? 'cover'}
                    onChange={(v) => set((d) => void (d.leadership[i].imageFit = v as 'cover' | 'contain'))}
                    options={[
                      { value: 'cover', label: 'Fill — crop to the card' },
                      { value: 'contain', label: 'Fit — show the whole image' },
                    ]}
                  />
                </div>
              </Field>
            )}

            <AssetEditor
              assets={e.assets ?? []}
              onChange={(next) => set((d) => void (d.leadership[i].assets = next))}
              hint="report, poster, deck or link — shown inside the journal view"
            />

            {/* ------------------------------ timeline ------------------------------ */}
            <Field label="Timeline" hint="how the role evolved — one step per year or position, shown under the story">
              <div className="space-y-3">
                {(e.timeline ?? []).map((st, si) => (
                  <div key={si} className="space-y-3 rounded-xl border border-line bg-ink-950/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-zinc-600">step {si + 1}</span>
                      <Button variant="danger" onClick={() => set((d) => void d.leadership[i].timeline!.splice(si, 1))}>
                        <HiOutlineTrash size={13} />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <LocField label="Period" value={st.period} onChange={(v) => set((d) => void (d.leadership[i].timeline![si].period = v))} placeholder="2023 – 2024" />
                      <LocField label="Role" value={st.role} onChange={(v) => set((d) => void (d.leadership[i].timeline![si].role = v))} placeholder="Project lead" />
                    </div>
                    <LocField label="What I did" multiline value={st.text} onChange={(v) => set((d) => void (d.leadership[i].timeline![si].text = v))} />
                  </div>
                ))}
                <Button
                  onClick={() =>
                    set((d) => void (d.leadership[i].timeline = [...(d.leadership[i].timeline ?? []), { period: { en: '', fr: '' }, role: { en: '', fr: '' }, text: { en: '', fr: '' } }]))
                  }
                >
                  <span className="flex items-center gap-1.5">
                    <HiOutlinePlus size={13} /> Add a step
                  </span>
                </Button>
              </div>
            </Field>

            {/* ------------------------------ key figures ------------------------------ */}
            <Field label="Key figures" hint="small number tiles under the story — value + what it means">
              <div className="space-y-2">
                {(e.kpis ?? []).map((k, ki) => (
                  <div key={ki} className="grid gap-2 sm:grid-cols-[9rem_1fr_auto]">
                    <Input
                      value={k.value}
                      placeholder="150 000 MAD"
                      onChange={(ev) => set((d) => void (d.leadership[i].kpis![ki].value = ev.target.value))}
                    />
                    <LocField
                      label=""
                      value={k.label}
                      onChange={(v) => set((d) => void (d.leadership[i].kpis![ki].label = v))}
                      placeholder="sponsoring secured"
                    />
                    <button
                      onClick={() => set((d) => void d.leadership[i].kpis!.splice(ki, 1))}
                      className="grid h-9 w-9 place-items-center self-end rounded-lg border border-line text-zinc-500 hover:text-red-400"
                      title="Remove"
                    >
                      <HiOutlineTrash size={14} />
                    </button>
                  </div>
                ))}
                <Button onClick={() => set((d) => void (d.leadership[i].kpis = [...(d.leadership[i].kpis ?? []), { value: '', label: { en: '', fr: '' } }]))}>
                  <span className="flex items-center gap-1.5">
                    <HiOutlinePlus size={13} /> Add a figure
                  </span>
                </Button>
              </div>
            </Field>

            {/* ------------------------------ events ------------------------------ */}
            <Field label="Big events" hint="one expandable box in the journal; each event gets its own card with photos">
              <div className="space-y-3">
                {(e.events ?? []).map((ev, evi) => (
                  <div key={ev.id} className="space-y-3 rounded-xl border border-line bg-ink-950/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-zinc-600">event {evi + 1} · {ev.id}</span>
                      <Button variant="danger" onClick={() => set((d) => void d.leadership[i].events!.splice(evi, 1))}>
                        Remove event
                      </Button>
                    </div>
                    <LocField label="Title" value={ev.title} onChange={(v) => set((d) => void (d.leadership[i].events![evi].title = v))} placeholder="WEI — Taghazout" />
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem]">
                      <LocField label="Place" value={ev.place} onChange={(v) => set((d) => void (d.leadership[i].events![evi].place = v))} placeholder="Taghazout · Agadir" />
                      <LocField label="Date" value={ev.date} onChange={(v) => set((d) => void (d.leadership[i].events![evi].date = v))} placeholder="Sept. 2024 · 3 days" />
                      <Field label="People">
                        <Input value={ev.people ?? ''} placeholder="95" onChange={(x) => set((d) => void (d.leadership[i].events![evi].people = x.target.value))} />
                      </Field>
                    </div>
                    <Field label="Link" hint="optional — a post or page about this event">
                      <Input value={ev.url ?? ''} placeholder="https://www.instagram.com/p/…" onChange={(x) => set((d) => void (d.leadership[i].events![evi].url = x.target.value))} />
                    </Field>
                    <LocField label="What we did" multiline value={ev.description} onChange={(v) => set((d) => void (d.leadership[i].events![evi].description = v))} />
                    <Field label="Highlights" hint="short chips">
                      <TagsInput value={ev.highlights ?? []} onChange={(v) => set((d) => void (d.leadership[i].events![evi].highlights = v))} placeholder="Surf, Hiking, Sandboarding" />
                    </Field>
                    <Field label="Photos" hint="the first is the event cover; click one to reframe">
                      <ImageDrop
                        images={ev.images ?? []}
                        onChange={(v) => set((d) => void (d.leadership[i].events![evi].images = v))}
                        itemCrops={{
                          get: (url) => resolveCrop({ imageCrop: cfg.crops?.[url] }),
                          set: (url, c) => set((d) => void ((d.crops ??= {})[url] = c)),
                          aspect: 4 / 3,
                        }}
                      />
                    </Field>
                  </div>
                ))}
                <Button onClick={() => set((d) => void (d.leadership[i].events = [...(d.leadership[i].events ?? []), blankEvent()]))}>
                  <span className="flex items-center gap-1.5">
                    <HiOutlinePlus size={13} /> Add an event
                  </span>
                </Button>
              </div>
            </Field>
          </Card>
        ))}

        {!cfg.leadership.length && (
          <p className="rounded-xl border border-dashed border-line py-10 text-center text-xs text-zinc-600">
            Nothing here yet — start with the 🏀 Basketball preset.
          </p>
        )}
      </div>
    </div>
  );
}
