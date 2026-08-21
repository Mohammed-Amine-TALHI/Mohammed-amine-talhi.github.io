import { HiOutlinePlus, HiChevronUp, HiChevronDown } from 'react-icons/hi';
import { Card, Button, LocField, TagsInput, ImageDrop, Field, Select } from '../ui';
import AssetEditor from '../AssetEditor';
import { resolveCrop } from '../../lib/crop';
import type { LeadershipEntry, PortfolioConfig } from '../../lib/types';

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
