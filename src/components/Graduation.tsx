import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineAcademicCap, HiOutlineExternalLink, HiOutlineCalendar, HiOutlinePhotograph } from 'react-icons/hi';
import { FaLinkedinIn } from 'react-icons/fa6';
import SectionHeading from './SectionHeading';
import Lightbox from './Lightbox';
import SafeImage from './SafeImage';
import { useLang } from '../lib/i18n';
import { config } from '../lib/data';
import { dur, on, lift } from '../lib/anim';
import { cropFor, cropStyle } from '../lib/crop';
import { usePreloadImages } from '../lib/preload';

/**
 * Graduation — the engineering degree from EMINES – UM6P.
 *
 * A photo mosaic (the first picture is the hero shot, the rest tile beside it)
 * next to a card carrying the date, the school logo and the LinkedIn post.
 * Until the post is published the button shows "coming soon" so the section
 * can go live with the photos alone.
 */
export default function Graduation() {
  const { ui, t } = useLang();
  const g = config.graduation;
  const [shot, setShot] = useState<number | null>(null);
  const images = g?.images ?? [];
  usePreloadImages(images);

  if (!g || g.enabled === false) return null;

  const [hero, ...rest] = images;
  const title = t(g.title)?.trim() || ui('graduation.title');
  const reveal = on('scrollReveal');

  return (
    <section id="graduation" className="relative scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading index="04" section="graduation" eyebrow={ui('graduation.eyebrow')} title={title} />

        <div className={'grid gap-6 ' + (images.length ? 'lg:grid-cols-[1.35fr_1fr]' : 'lg:grid-cols-[1fr_1.2fr]')}>
          {/* until photos are uploaded the logo tile stands in for the mosaic */}
          {!images.length && config.profile.schoolLogo && (
            <div className="grid min-h-[16rem] place-items-center rounded-2xl card-pop border border-line">
              <span className="logo-plate max-w-[85%]">
                <SafeImage src={config.profile.schoolLogo} alt="EMINES – UM6P" className="h-20 w-auto object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.12)] sm:h-24" />
              </span>
            </div>
          )}
          {/* ---------------------------- photos ---------------------------- */}
          {images.length > 0 && (
            <motion.div
              initial={reveal ? { opacity: 0, y: 24 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-70px' }}
              transition={{ duration: dur(0.7), ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-3 sm:grid-cols-3"
            >
              <motion.button
                {...lift(-3)}
                onClick={() => setShot(0)}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-ink-900 sm:col-span-2 sm:row-span-2 sm:aspect-auto"
              >
                <SafeImage
                  src={hero}
                  style={cropStyle(cropFor(hero))}
                  className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/50 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-line bg-ink-950/80 px-2.5 py-1 font-mono text-[10px] text-zinc-400 backdrop-blur">
                  <HiOutlinePhotograph size={12} /> {images.length} {ui('graduation.photos')}
                </span>
              </motion.button>

              {/* 3-column grid: the hero takes a 2×2 block, five tiles fill the rest */}
              {rest.slice(0, 5).map((src, i) => (
                <motion.button
                  key={src + i}
                  {...lift(-3)}
                  onClick={() => setShot(i + 1)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-ink-900"
                >
                  <SafeImage
                    src={src}
                    style={cropStyle(cropFor(src))}
                    className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {/* the last tile carries the overflow count */}
                  {i === 4 && rest.length > 5 && (
                    <span className="absolute inset-0 grid place-items-center bg-ink-950/60 font-display text-xl font-bold text-zinc-100 backdrop-blur-[2px]">
                      +{rest.length - 5}
                    </span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* ----------------------------- card ----------------------------- */}
          <motion.div
            initial={reveal ? { opacity: 0, y: 24 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-70px' }}
            transition={{ duration: dur(0.7), delay: dur(0.1), ease: [0.22, 1, 0.36, 1] }}
            className="card-pop relative flex flex-col overflow-hidden rounded-2xl border border-line p-6 backdrop-blur-sm sm:p-8"
          >
            <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-500/10 blur-3xl" />

            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-[color:var(--on-brand)]">
                <HiOutlineAcademicCap size={22} />
              </span>
              <div>
                <div className="font-display text-base font-semibold text-zinc-100">
                  {ui('hero.role')}
                </div>
                {t(g.date) && (
                  <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
                    <HiOutlineCalendar size={12} /> {t(g.date)}
                  </div>
                )}
              </div>
            </div>

            {config.profile.schoolLogo && (
              <span className="logo-plate mt-6 self-start">
                <SafeImage src={config.profile.schoolLogo} alt="EMINES – UM6P" className="h-12 w-auto object-contain" />
              </span>
            )}

            {t(g.caption) && (
              <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-zinc-400">{t(g.caption)}</p>
            )}

            <div className="mt-auto pt-8">
              {g.postUrl ? (
                <a
                  href={g.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-[#0a66c2] px-5 py-3 text-sm font-semibold text-[#fff] shadow-[0_10px_30px_-12px_#0a66c2] transition-all hover:-translate-y-0.5 hover:brightness-110"
                >
                  <FaLinkedinIn size={15} />
                  {t(g.postLabel)?.trim() || ui('graduation.post')}
                  <HiOutlineExternalLink size={14} className="transition-transform group-hover:translate-x-0.5" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-2.5 rounded-xl border border-dashed border-line px-5 py-3 text-sm text-zinc-500">
                  <FaLinkedinIn size={14} className="text-[#0a66c2]" />
                  {ui('graduation.soon')}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <Lightbox images={images} index={shot} onClose={() => setShot(null)} onIndex={setShot} />
    </section>
  );
}
