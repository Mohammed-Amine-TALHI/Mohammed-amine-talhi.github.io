import { motion } from 'framer-motion';
import { HiOutlineDocumentText, HiOutlineDownload } from 'react-icons/hi';
import { useLang } from '../lib/i18n';
import { config } from '../lib/data';
import { dur, on } from '../lib/anim';
import { asset } from '../lib/asset';

const FLAG = { en: '🇬🇧', fr: '🇫🇷' } as const;
const LANG_NAME = {
  en: { en: 'English', fr: 'Anglais' },
  fr: { en: 'French', fr: 'Français' },
} as const;

/**
 * CV download.
 *
 * Only the CV matching the language the site is currently displayed in is
 * offered — a visitor reading in French gets the French CV and nothing else,
 * and switching the site to English swaps the button over. If that language's
 * file hasn't been uploaded yet, nothing renders.
 *
 * `variant="inline"` is the compact button under the About intro;
 * `variant="panel"` is the framed block in the contact section.
 */
export default function CvDownload({ variant = 'inline' }: { variant?: 'inline' | 'panel' }) {
  const { lang, t, ui } = useLang();
  const file = config.cv?.[lang];

  if (!file?.url) return null;

  if (variant === 'inline') {
    return (
      <div className="mt-7">
        <a
          href={asset(file.url)}
          download
          className="group inline-flex items-center gap-2.5 rounded-xl border border-accent-500/30 bg-accent-500/[0.07] px-5 py-3 text-sm font-medium text-accent-300 transition-colors hover:bg-accent-500/[0.15]"
        >
          <HiOutlineDownload size={16} className="transition-transform group-hover:translate-y-0.5" />
          {ui('about.downloadCv')}
        </a>
      </div>
    );
  }

  return (
    <motion.div
      {...(on('scrollReveal')
        ? {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: '-60px' },
            transition: { duration: dur(0.6), ease: [0.22, 1, 0.36, 1] as const },
          }
        : {})}
      className="rounded-2xl border border-line bg-ink-900/60 p-5 backdrop-blur-sm sm:p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-accent-500/20 bg-accent-500/[0.07] text-accent-500">
          <HiOutlineDocumentText size={19} />
        </span>
        <div>
          <h3 className="font-display text-[15px] font-semibold text-zinc-100">{ui('cv.title')}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{t(LANG_NAME[lang])}</p>
        </div>
      </div>

      <a
        href={asset(file.url)}
        download
        className="group flex items-center gap-3 rounded-xl border border-line bg-ink-850/60 px-4 py-3 transition-colors hover:border-accent-500/40 hover:bg-accent-500/[0.06]"
      >
        <span className="text-lg leading-none">{FLAG[lang]}</span>
        <span className="min-w-0 flex-1 text-sm text-zinc-200 transition-colors group-hover:text-accent-300">
          {ui('about.downloadCv')}
        </span>
        <HiOutlineDownload
          size={16}
          className="shrink-0 text-zinc-600 transition-all group-hover:translate-y-0.5 group-hover:text-accent-500"
        />
      </a>
    </motion.div>
  );
}
