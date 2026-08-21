import { Card, Field, Input, LocField, Toggle, ImageDrop } from '../ui';
import { resolveCrop } from '../../lib/crop';
import { resume } from '../../lib/data';
import type { PortfolioConfig } from '../../lib/types';

export default function ProfilePanel({
  cfg,
  set,
}: {
  cfg: PortfolioConfig;
  set: (fn: (draft: PortfolioConfig) => void) => void;
}) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-zinc-100">Profile</h2>

        <Card className="space-y-5">
          <Field label="Photo" hint="upload one and the crop frame appears straight away">
            <ImageDrop
              folder=""
              single
              images={cfg.profile.photo ? [cfg.profile.photo] : []}
              onChange={(imgs) => set((d) => void (d.profile.photo = imgs[0] ?? '/profile.jpg'))}
              aspect={1}
              crop={resolveCrop({ imageCrop: cfg.profile.photoCrop })}
              onCrop={(c) => set((d) => void (d.profile.photoCrop = c))}
            />
          </Field>

          <LocField
            label="Headline (shown under your name in the hero)"
            value={cfg.profile.headline}
            onChange={(v) => set((d) => void (d.profile.headline = v))}
          />

          <LocField
            label="Introduction — blank line between paragraphs"
            multiline
            value={cfg.profile.intro}
            onChange={(v) => set((d) => void (d.profile.intro = v))}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="CV link (leave empty to hide the button)">
              <Input
                value={cfg.profile.resumeUrl}
                placeholder="/cv.pdf or a Drive link"
                onChange={(e) => set((d) => void (d.profile.resumeUrl = e.target.value))}
              />
            </Field>
            <Field label="GitHub URL">
              <Input
                value={cfg.profile.githubUrl}
                onChange={(e) => set((d) => void (d.profile.githubUrl = e.target.value))}
              />
            </Field>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-zinc-100">Experience visibility</h2>
        <p className="mb-4 text-xs text-zinc-500">Which roles appear in the About timeline.</p>

        <div className="space-y-2">
          {resume.experiences.map((e) => (
            <Card key={e.id}>
              <div className="flex items-center gap-3">
                <Toggle
                  on={cfg.visibility.experiences[e.id] !== false}
                  onChange={(v) => set((d) => void (d.visibility.experiences[e.id] = v))}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-zinc-200">{e.role.en}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-zinc-600">
                    {e.org.en} · {e.period.en}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
