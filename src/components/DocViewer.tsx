import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineX, HiOutlineDownload, HiOutlineExternalLink } from 'react-icons/hi';
import { TbFileTypePdf, TbFileDescription } from 'react-icons/tb';
import Portal from './Portal';
import { asset, fileNameFromTitle } from '../lib/asset';
import { useLang } from '../lib/i18n';
import { dur } from '../lib/anim';

export interface Doc {
  url: string;
  title: string;
  /** filename offered when the visitor chooses to save it */
  downloadAs?: string;
}

const Ctx = createContext<{ open: (doc: Doc) => void }>({ open: () => {} });

/** Open a document in the in-page viewer from anywhere. */
export const useDocViewer = () => useContext(Ctx);

const isPdf = (url: string) => /\.pdf($|\?)/i.test(url);

/**
 * In-page document viewer.
 *
 * Clicking a report, poster, deck or CV shows it here rather than firing a
 * download the visitor did not ask for — saving is a deliberate second click.
 *
 * PDFs render in an iframe, which every desktop browser handles natively. Other
 * formats (pptx, docx) have no in-browser renderer, so those get an honest
 * "no preview" panel with the download and open-in-tab actions instead of a
 * blank frame. Both actions are always present, because iOS Safari sometimes
 * refuses to paint a PDF iframe and the visitor needs a way out.
 */
export function DocViewerProvider({ children }: { children: ReactNode }) {
  const { ui } = useLang();
  const [doc, setDoc] = useState<Doc | null>(null);

  const open = useCallback((d: Doc) => setDoc(d), []);
  const close = useCallback(() => setDoc(null), []);

  // lock the page and let Escape close it
  useEffect(() => {
    if (!doc) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [doc, close]);

  const href = doc ? asset(doc.url) : '';
  const external = doc ? /^https?:/i.test(doc.url) : false;
  // fall back to the on-screen title so a saved file is recognisable
  const saveAs = doc ? (doc.downloadAs || fileNameFromTitle(doc.title, doc.url)) : '';

  return (
    <Ctx.Provider value={{ open }}>
      {children}

      <Portal>
        <AnimatePresence>
          {doc && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur(0.2) }}
              onClick={close}
              className="fixed inset-0 z-[65] flex flex-col bg-ink-950/92 p-3 backdrop-blur-md sm:p-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: dur(0.3), ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-line bg-ink-900 shadow-2xl"
              >
                {/* toolbar */}
                <header className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2.5 sm:gap-3 sm:px-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent-500/25 bg-accent-500/[0.08] text-accent-400">
                    {isPdf(doc.url) ? <TbFileTypePdf size={17} /> : <TbFileDescription size={17} />}
                  </span>

                  <span className="min-w-0 flex-1 truncate font-display text-[13px] font-semibold text-zinc-100 sm:text-sm">
                    {doc.title}
                  </span>

                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    title={ui('doc.openTab')}
                    className="hidden h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[11.5px] text-zinc-400 transition-colors hover:border-accent-500/40 hover:text-accent-300 sm:flex"
                  >
                    <HiOutlineExternalLink size={13} />
                    {ui('doc.openTab')}
                  </a>

                  {/* the only thing that saves the file */}
                  <a
                    href={href}
                    download={external ? undefined : saveAs}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent-400 to-accent-600 px-3 text-[11.5px] font-semibold text-ink-950 transition-transform hover:scale-[1.03] sm:px-4"
                  >
                    <HiOutlineDownload size={14} />
                    {ui('doc.download')}
                  </a>

                  <button
                    onClick={close}
                    aria-label="Close"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-zinc-400 transition-colors hover:border-accent-500/40 hover:text-accent-300"
                  >
                    <HiOutlineX size={17} />
                  </button>
                </header>

                {/* body */}
                <div className="min-h-0 flex-1 bg-ink-950">
                  {isPdf(doc.url) ? (
                    <iframe
                      src={href}
                      title={doc.title}
                      className="h-full w-full border-0"
                    />
                  ) : (
                    <div className="grid h-full place-items-center p-8 text-center">
                      <div className="max-w-sm">
                        <TbFileDescription className="mx-auto mb-3 text-zinc-700" size={40} />
                        <p className="text-sm text-zinc-400">{ui('doc.noPreview')}</p>
                        <a
                          href={href}
                          download={external ? undefined : saveAs}
                          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-accent-500/30 bg-accent-500/[0.08] px-5 py-3 text-sm font-medium text-accent-300 transition-colors hover:bg-accent-500/[0.16]"
                        >
                          <HiOutlineDownload size={16} />
                          {ui('doc.download')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </Ctx.Provider>
  );
}
