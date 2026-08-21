import { motion } from 'framer-motion';
import { HiOutlineDocumentText, HiOutlineDownload, HiOutlineEye } from 'react-icons/hi';
import { useLang } from '../lib/i18n';
import { config, contact } from '../lib/data';
import { dur, on } from '../lib/anim';
import { asset, downloadName } from '../lib/asset';
import { useDocViewer } from './DocViewer';

const LANG_NAME = {
  en: { en: 'English', fr: 'Anglais' },
  fr: { en: 'French', fr: 'Français' },
} as const;

/**
 * CV download.
 *
 * Only the CV matching the language the site is displayed in is offered — a
 * visitor reading in French gets the French CV and nothing else. If that
 * language's file hasn't been uploaded, nothing renders.
 *
 * The primary action *shows* the CV in the in-page viewer; saving it is a
 * second, deliberate click from inside that viewer. A recruiter skimming the
 * page should be able to read it without a file landing in their Downloads.
 *
 * `variant="inline"` is the compact button under the About intro;
 * `variant="panel"` is the framed block in the contact section.
 */
export default function CvDownload({ variant = 'inline' }: { variant?: 'inline' | 'panel' }) {
  const { lang, t, ui } = useLang();
  const { open: openDoc } = useDocViewer();

  const file = config.cv?.[lang];
  if (!file?.url) return null;

  const saveAs = downloadName('CV', contact.displayName, lang.toUpperCase(), file.url);
  const view = () => openDoc({ url: file.url, title: 'CV — ' + contact.displayName, downloadAs: saveAs });

  if (variant === 'inline') {
    return (
      <div className="mt-7 flex flex-wrap items-center gap-2.5">
        <button
          onClick={view}
          className="group inline-flex items-center gap-2.5 rounded-xl border border-accent-500/30 bg-accent-500/[0.07] px-5 py-3 text-sm font-medium text-accent-300 transition-colors hover:bg-accent-500/[0.15]"
        >
          <HiOutlineEye size={16} />
          {ui('cv.view')}
        </button>

        {/* the quiet second action, for anyone who just wants the file */}
        <a
          href={asset(file.url)}
          download={saveAs}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-zinc-400 transition-colors hover:border-accent-500/40 hover:text-accent-300"
        >
          <HiOutlineDownload size={15} />
          {ui('doc.download')}
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

      <div className="flex flex-wrap gap-2">
        <button
          onClick={view}
          className="group flex flex-1 items-center gap-3 rounded-xl border border-accent-500/30 bg-accent-500/[0.07] px-4 py-3 text-left transition-colors hover:bg-accent-500/[0.15]"
        >
          <HiOutlineEye size={17} className="shrink-0 text-accent-400" />
          <span className="min-w-0 flex-1 text-sm font-medium text-accent-300">{ui('cv.view')}</span>
        </button>

        <a
          href={asset(file.url)}
          download={saveAs}
          title={saveAs}
          className="group flex items-center gap-2 rounded-xl border border-line bg-ink-850/60 px-4 py-3 text-sm text-zinc-400 transition-colors hover:border-accent-500/40 hover:text-accent-300"
        >
          <HiOutlineDownload size={16} />
          {ui('doc.download')}
        </a>
      </div>
    </motion.div>
  );
}
