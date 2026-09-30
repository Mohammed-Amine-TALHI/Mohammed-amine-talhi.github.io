import { Card, Field, Input, LocField, Toggle, ImageDrop } from '../ui';
import { cropFor } from '../../lib/crop';
import type { PortfolioConfig } from '../../lib/types';

/**
 * Graduation section: photos, a caption, the date and the LinkedIn post.
 *
 * The post link can stay empty — the section then shows a "coming soon"
 * badge instead of the button, so the photos can go live before the post.
 */
export default function GraduationPanel({
  cfg,
  set,
}: {
  cfg: PortfolioConfig;
  set: (fn: (draft: PortfolioConfig) => void) => void;
}) {
  const g = cfg.graduation;

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center gap-3">
          <Toggle on={g.enabled !== false} onChange={(v) => set((d) => void (d.graduation.enabled = v))} />
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-100">Graduation</h2>
            <p className="text-xs text-zinc-500">Shown between Skills and Leadership. Switch it off to hide the whole section.</p>
          </div>
        </div>

        <Card className="space-y-5">
          <Field label="Photos" hint="the first one is the big picture; click a photo to reframe it">
            <ImageDrop
              folder="graduation"
              images={g.images ?? []}
              onChange={(imgs) => set((d) => void (d.graduation.images = imgs))}
              itemCrops={{
                get: (url) => cropFor(url),
                set: (url, c) => set((d) => void (d.crops[url] = c)),
                aspect: 4 / 3,
              }}
            />
          </Field>

          <LocField
            label="Title"
            hint="leave empty for the default wording"
            value={g.title}
            onChange={(v) => set((d) => void (d.graduation.title = v))}
            placeholder="Graduation — Engineer, EMINES – UM6P"
          />

          <LocField
            label="Date"
            value={g.date}
            onChange={(v) => set((d) => void (d.graduation.date = v))}
            placeholder="September 2026"
          />

          <LocField
            label="Caption"
            hint="a few lines next to the photos — blank line between paragraphs"
            multiline
            value={g.caption}
            onChange={(v) => set((d) => void (d.graduation.caption = v))}
          />

          <Field label="LinkedIn post" hint="empty = a 'coming soon' badge until you publish it">
            <Input
              value={g.postUrl}
              placeholder="https://www.linkedin.com/posts/…"
              onChange={(e) => set((d) => void (d.graduation.postUrl = e.target.value))}
            />
          </Field>

          <LocField
            label="Button label"
            hint="leave empty for the default wording"
            value={g.postLabel}
            onChange={(v) => set((d) => void (d.graduation.postLabel = v))}
            placeholder="Read the LinkedIn post"
          />
        </Card>
      </section>
    </div>
  );
}
