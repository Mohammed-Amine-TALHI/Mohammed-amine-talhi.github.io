import { Card, Field, Input, LocField, ImageDrop } from '../ui';
import { industrialVisits, splitVisit } from '../../lib/data';
import type { PortfolioConfig } from '../../lib/types';

/**
 * Industrial visits.
 *
 * The visit list itself comes from ResumeApp and is read-only here — this panel
 * attaches the extras the CV can't hold: trip photos, the EMINES write-up link,
 * and per-visit images.
 */
export default function VisitsAdminPanel({
  cfg,
  set,
}: {
  cfg: PortfolioConfig;
  set: (fn: (draft: PortfolioConfig) => void) => void;
}) {
  const { items } = industrialVisits();
  const v = cfg.visits;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-zinc-100">Industrial visits</h2>
        <p className="mb-4 text-xs text-zinc-500">
          {items.length} visits synced from ResumeApp. The names and descriptions live in your CV — edit them there
          and re-run <code className="text-accent-500">npm run sync</code>.
        </p>

        <Card className="space-y-5">
          <Field label="EMINES post" hint="linked from the section header">
            <Input
              value={v.postUrl}
              placeholder="https://www.linkedin.com/posts/emines-…"
              onChange={(e) => set((d) => void (d.visits.postUrl = e.target.value))}
            />
          </Field>

          <LocField
            label="Link label"
            hint="leave empty for the default wording"
            value={v.postLabel}
            onChange={(val) => set((d) => void (d.visits.postLabel = val))}
            placeholder="Read the EMINES post"
          />

          <Field label="Trip photos" hint="shown as a scrolling strip above the visit list">
            <ImageDrop
              folder="visits"
              images={v.images ?? []}
              onChange={(imgs) => set((d) => void (d.visits.images = imgs))}
            />
          </Field>
        </Card>
      </section>

      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-zinc-100">Per-visit extras</h2>
        <p className="mb-4 text-xs text-zinc-500">Optional — photos and a link for a specific site.</p>

        <div className="space-y-2">
          {items.map((it) => {
            const { org } = splitVisit(it.text.en);
            const meta = v.perVisit?.[it.id] ?? {};
            return (
              <Card key={it.id} className="space-y-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-sm font-semibold text-zinc-100">{org}</span>
                  <span className="text-[11px] text-accent-500/90">{it.location?.en}</span>
                  <span className="ml-auto font-mono text-[10px] text-zinc-700">{it.id}</span>
                </div>

                <Field label="Link" hint="optional — a page about this site">
                  <Input
                    value={meta.url ?? ''}
                    placeholder="https://…"
                    onChange={(e) =>
                      set((d) => {
                        d.visits.perVisit[it.id] = { ...meta, url: e.target.value };
                      })
                    }
                  />
                </Field>

                <Field label="Photos">
                  <ImageDrop
                    folder="visits"
                    images={meta.images ?? []}
                    onChange={(imgs) =>
                      set((d) => {
                        d.visits.perVisit[it.id] = { ...meta, images: imgs };
                      })
                    }
                  />
                </Field>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
