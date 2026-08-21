import { useState } from 'react';
import { motion } from 'framer-motion';
import { TbLanguage, TbCertificate, TbFileTypePdf } from 'react-icons/tb';
import { useLang } from '../../lib/i18n';
import { languageEntries, ASSET_LABEL } from '../../lib/data';
import { dur, on } from '../../lib/anim';
import { asset } from '../../lib/asset';
import { usePreloadImages } from '../../lib/preload';
import Lightbox from '../Lightbox';

/** Rough proficiency weight per level keyword, for the meters. */
function levelPct(level: string): number {
  const l = level.toLowerCase();
  if (/native|maternelle/.test(l)) return 100;
  if (/fluent|courant/.test(l)) return 92;
  if (/professional|professionnel/.test(l)) return 85;
  if (/basic|notions/.test(l)) return 32;
  return 60;
}

/**
 * Sits directly under the industrial visits.
 *
 * Each language can carry proof — a scanned TOEIC or DELF/DALF certificate, or
 * a PDF. Scans open in the shared lightbox; PDFs open in a new tab.
 */
export default function LanguagesPanel() {
  const { t, ui, lang } = useLang();
  const langs = languageEntries(lang);

  // every certificate scan, flattened, so one lightbox can page through them
  const gallery = langs.flatMap((l) => l.proof?.images ?? []);
  const [shot, setShot] = useState<number | null>(null);

  // warm them so a certificate opens instantly
  usePreloadImages(gallery);

  if (!langs.length) return null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent-500/20 bg-accent-500/[0.07] text-accent-500">
          <TbLanguage size={19} />
        </span>
        <h3 className="font-display text-xl font-semibold text-zinc-200">{ui('about.languages')}</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {langs.map((l, i) => {
          const scans = l.proof?.images ?? [];
          const docs = (l.proof?.assets ?? []).filter((a) => a.url);
          const badge = l.proof?.label?.trim();

          return (
            <motion.div
              key={l.key}
              {...(on('scrollReveal')
                ? {
                    initial: { opacity: 0, y: 20 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, margin: '-60px' },
                    transition: { duration: dur(0.5), delay: dur(i * 0.08), ease: [0.22, 1, 0.36, 1] as const },
                  }
                : {})}
              className="flex flex-col rounded-2xl border border-line bg-ink-900/60 p-4 backdrop-blur-sm transition-colors hover:border-accent-500/30"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-zinc-200">{l.name}</span>
                {badge && (
                  <span className="shrink-0 rounded-md border border-accent-500/25 bg-accent-500/[0.08] px-1.5 py-0.5 font-mono text-[9.5px] text-accent-400">
                    {badge}
                  </span>
                )}
              </div>

              <div className="mb-3 font-mono text-[10px] leading-tight text-zinc-600">{l.level}</div>

              <div className="h-1 overflow-hidden rounded-full bg-ink-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-300"
                  initial={on('scrollReveal') ? { width: 0 } : false}
                  whileInView={{ width: levelPct(l.level) + '%' }}
                  viewport={{ once: true }}
                  transition={{ duration: dur(1.1), delay: dur(0.15 + i * 0.1), ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              {/* proof: certificate scans and/or PDFs */}
              {(scans.length > 0 || docs.length > 0) && (
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {scans.map((src) => (
                    <button
                      key={src}
                      onClick={() => setShot(gallery.indexOf(src))}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-white/[0.02] px-2 py-1 text-[10.5px] font-medium text-emerald-300/90 transition-colors hover:bg-emerald-500/10"
                    >
                      <TbCertificate size={12} />
                      {ui('languages.certificate')}
                    </button>
                  ))}
                  {docs.map((d) => (
                    <a
                      key={d.id}
                      href={asset(d.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-white/[0.02] px-2 py-1 text-[10.5px] font-medium text-rose-300/90 transition-colors hover:bg-rose-500/10"
                    >
                      <TbFileTypePdf size={12} />
                      {t(d.label)?.trim() || t(ASSET_LABEL[d.kind])}
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <Lightbox images={gallery} index={shot} onClose={() => setShot(null)} onIndex={setShot} />
    </div>
  );
}
