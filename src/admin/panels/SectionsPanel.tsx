import { Card, Field, LocField, Select, Toggle } from '../ui';
import { SECTION_LIST, TITLE_SIZES } from '../../lib/sections';
import type { PortfolioConfig, SectionKey, SectionText } from '../../lib/types';

/**
 * Section texts — every heading on the page, editable in both languages.
 *
 * Boxes left empty fall back to the built-in wording, so nothing has to be
 * filled in; edit only what you want to change. Size and "keep on one line"
 * apply to the big title of that section.
 */
export default function SectionsPanel({
  cfg,
  set,
}: {
  cfg: PortfolioConfig;
  set: (fn: (draft: PortfolioConfig) => void) => void;
}) {
  const update = (key: SectionKey, patch: Partial<SectionText>) =>
    set((d) => {
      d.sections = d.sections ?? {};
      d.sections[key] = { ...(d.sections[key] ?? {}), ...patch };
    });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-zinc-100">Section titles & texts</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Leave a box empty to keep the built-in wording. Everything here is bilingual — the site shows the EN or FR
          version depending on the visitor's language switch.
        </p>

        <div className="space-y-3">
          {SECTION_LIST.map(({ key, label, hasBlurb, hint }) => {
            const s = cfg.sections?.[key] ?? {};
            const isHero = key === 'hero';
            return (
              <Card key={key} className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-sm font-semibold text-zinc-100">{label}</span>
                  <span className="text-[11px] text-zinc-500">{hint}</span>
                </div>

                <LocField
                  label={isHero ? 'Line under the logo' : 'Eyebrow (small label above the title)'}
                  value={s.eyebrow ?? { en: '', fr: '' }}
                  onChange={(v) => update(key, { eyebrow: v })}
                  placeholder={isHero ? 'Supply Chain Engineer · EMINES – UM6P graduate' : 'default wording'}
                />

                {!isHero && (
                  <>
                    <LocField
                      label="Title"
                      value={s.title ?? { en: '', fr: '' }}
                      onChange={(v) => update(key, { title: v })}
                      placeholder="default wording"
                    />
                    {key !== 'visits' && (
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <Field label="Title size">
                          <Select
                            value={s.size ?? 'lg'}
                            onChange={(v) => update(key, { size: v as SectionText['size'] })}
                            options={TITLE_SIZES.map((t) => ({ value: t.value, label: t.label }))}
                          />
                        </Field>
                        <Field label="Keep on one line" hint="shrinks to fit instead of wrapping">
                          <div className="flex h-9 items-center">
                            <Toggle on={s.oneLine === true} onChange={(v) => update(key, { oneLine: v })} />
                          </div>
                        </Field>
                      </div>
                    )}
                  </>
                )}

                {hasBlurb && (
                  <LocField
                    label={isHero ? 'Tagline under your name' : 'Intro paragraph'}
                    multiline
                    value={s.blurb ?? { en: '', fr: '' }}
                    onChange={(v) => update(key, { blurb: v })}
                    placeholder={isHero ? 'edit in Profile → Headline, or override here' : 'default wording'}
                  />
                )}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
