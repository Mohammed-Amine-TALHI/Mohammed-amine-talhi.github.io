import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Portal from './Portal';
import { HiOutlineX, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { asset } from '../lib/asset';

/**
 * Full-screen image viewer shared by the leadership cards and the visits strip.
 * Arrow keys and Escape work; clicking the backdrop closes it.
 */
export default function Lightbox({
  images,
  index,
  onClose,
  onIndex,
}: {
  images: string[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index! + 1) % images.length);
      if (e.key === 'ArrowLeft') onIndex((index! - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, images.length, onClose, onIndex]);

  return (
    <Portal>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] grid place-items-center bg-ink-950/92 p-6 backdrop-blur-sm"
        >
          <motion.img
            key={images[index!]}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            src={asset(images[index!])}
            alt=""
            className="max-h-[85vh] max-w-full rounded-xl border border-line object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onIndex((index! - 1 + images.length) % images.length);
                }}
                aria-label="Previous"
                className="absolute left-6 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl border border-line bg-ink-900/80 text-zinc-400 transition-colors hover:text-accent-400"
              >
                <HiChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onIndex((index! + 1) % images.length);
                }}
                aria-label="Next"
                className="absolute right-6 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl border border-line bg-ink-900/80 text-zinc-400 transition-colors hover:text-accent-400"
              >
                <HiChevronRight size={20} />
              </button>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-line bg-ink-900/80 px-3 py-1 font-mono text-[11px] text-zinc-500">
                {index! + 1} / {images.length}
              </span>
            </>
          )}

          {/* the primary way out — deliberately large and high-contrast */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-ink-950/85 text-zinc-200 shadow-lg backdrop-blur transition-all hover:scale-105 hover:border-accent-500/60 hover:bg-accent-500 hover:text-ink-950 sm:right-6 sm:top-6"
          >
            <HiOutlineX size={22} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
}
