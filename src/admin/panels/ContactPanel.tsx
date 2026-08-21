import { Card, Field, Input, LocField, FileDrop, Button } from '../ui';
import { resume } from '../../lib/data';
import type { PortfolioConfig } from '../../lib/types';

const CV_LANG = { en: '🇬🇧 English CV', fr: '🇫🇷 CV Français' } as const;

export default function ContactPanel({
  cfg,
  set,
}: {
  cfg: PortfolioConfig;
  set: (fn: (draft: PortfolioConfig) => void) => void;
}) {
  const c = cfg.contact;
  const p = resume.personal;

  /** Drop a value straight from the CV into a field. */
  const Suggest = ({ value, onPick }: { value?: string; onPick: () => void }) =>
    value && value !== '' ? (
      <button
        onClick={onPick}
        className="font-mono text-[10px] text-zinc-600 underline decoration-dotted transition-colors hover:text-accent-500"
        title="Use the value from your CV"
      >
        use “{value.length > 28 ? value.slice(0, 28) + '…' : value}”
      </button>
    ) : null;

  return (
    <div className="space-y-8">
      {/* ------------------------------ contact details ------------------------------ */}
      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-zinc-100">Contact details</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Shown in the hero, the About header and the Contact section. Leave a field empty to hide that row.
        </p>

        <Card className="space-y-5">
          <Field label="Display name" hint="used in the hero headline and the footer">
            <Input
              value={c.displayName}
              onChange={(e) => set((d) => void (d.contact.displayName = e.target.value))}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary email">
              <Input value={c.email} onChange={(e) => set((d) => void (d.contact.email = e.target.value))} />
              <div className="mt-1">
                <Suggest value={p.emails?.[0]} onPick={() => set((d) => void (d.contact.email = p.emails[0]))} />
              </div>
            </Field>

            <Field label="Secondary email" hint="optional">
              <Input value={c.emailAlt} onChange={(e) => set((d) => void (d.contact.emailAlt = e.target.value))} />
              <div className="mt-1">
                <Suggest value={p.emails?.[1]} onPick={() => set((d) => void (d.contact.emailAlt = p.emails[1]))} />
              </div>
            </Field>

            <Field label="Phone">
              <Input value={c.phone} onChange={(e) => set((d) => void (d.contact.phone = e.target.value))} />
              <div className="mt-1">
                <Suggest value={p.phones?.[0]} onPick={() => set((d) => void (d.contact.phone = p.phones[0]))} />
              </div>
            </Field>

            <Field label="Second phone" hint="e.g. your French number">
              <Input value={c.phoneAlt} onChange={(e) => set((d) => void (d.contact.phoneAlt = e.target.value))} />
              <div className="mt-1">
                <Suggest value={p.phones?.[1]} onPick={() => set((d) => void (d.contact.phoneAlt = p.phones[1]))} />
              </div>
            </Field>
          </div>

          <LocField
            label="Location"
            value={c.location}
            onChange={(v) => set((d) => void (d.contact.location = v))}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="LinkedIn URL">
              <Input
                value={c.linkedinUrl}
                onChange={(e) => set((d) => void (d.contact.linkedinUrl = e.target.value))}
              />
            </Field>
            <Field label="LinkedIn label" hint="what visitors see">
              <Input
                value={c.linkedinLabel}
                onChange={(e) => set((d) => void (d.contact.linkedinLabel = e.target.value))}
              />
            </Field>
            <Field label="GitHub URL">
              <Input value={c.githubUrl} onChange={(e) => set((d) => void (d.contact.githubUrl = e.target.value))} />
            </Field>
            <Field label="GitHub label">
              <Input
                value={c.githubLabel}
                onChange={(e) => set((d) => void (d.contact.githubLabel = e.target.value))}
              />
            </Field>
          </div>
        </Card>
      </section>

      {/* ------------------------------ CV downloads ------------------------------ */}
      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-zinc-100">CV downloads</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Upload one PDF per language. Visitors only ever see the CV for the language the site is currently in —
          reading in French shows the French CV only, and switching to English swaps it. A language with no file
          uploaded simply shows no download button.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {(['en', 'fr'] as const).map((l) => {
            const file = cfg.cv?.[l];
            return (
              <Card key={l} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-200">{CV_LANG[l]}</span>
                  {file?.url && <span className="font-mono text-[10px] text-emerald-500/80">uploaded</span>}
                </div>

                <FileDrop
                  folder="cv"
                  accept=".pdf"
                  url={file?.url ?? ''}
                  onChange={(url) =>
                    set((d) => {
                      d.cv[l] = url ? { url, updated: new Date().toISOString() } : null;
                    })
                  }
                />

                {file?.url && (
                  <Button
                    variant="danger"
                    onClick={() => set((d) => void (d.cv[l] = null))}
                  >
                    Remove {l.toUpperCase()} CV
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
