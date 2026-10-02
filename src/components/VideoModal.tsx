import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineX, HiOutlineVolumeUp, HiOutlineVolumeOff } from 'react-icons/hi';
import Portal from './Portal';
import { asset } from '../lib/asset';
import { dur } from '../lib/anim';

export interface PlayableVideo {
  url: string;
  poster?: string;
  title?: string;
  /** start with the sound off (the visitor can switch it on) */
  muted?: boolean;
}

/**
 * Pop-up video player.
 *
 * A plain HTML5 <video> in a portalled overlay (see the Portal note in
 * ARCHITECTURE.md): native controls for seeking and fullscreen, plus a large
 * mute button of our own — the native volume control is tiny and hidden on
 * phones. The file is only requested once the pop-up opens, so a demo video
 * costs nothing on the initial page load.
 */
export default function VideoModal({ video, onClose }: { video: PlayableVideo | null; onClose: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  // each video opens with its own default
  useEffect(() => {
    if (video) setMuted(video.muted === true);
  }, [video]);

  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted, video]);

  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key.toLowerCase() === 'm') setMuted((m) => !m);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [video, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {video && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur(0.2) }}
            onClick={onClose}
            className="fixed inset-0 z-[70] grid place-items-center bg-ink-950/92 p-4 backdrop-blur-md sm:p-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: dur(0.3), ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-ink-900 shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-zinc-100">
                  {video.title}
                </span>
                <button
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                  title={muted ? 'Unmute (M)' : 'Mute (M)'}
                  className={
                    'flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ' +
                    (muted
                      ? 'border-accent-500/50 bg-accent-500/[0.12] text-accent-400'
                      : 'border-line text-zinc-300 hover:border-accent-500/50 hover:text-accent-400')
                  }
                >
                  {muted ? <HiOutlineVolumeOff size={16} /> : <HiOutlineVolumeUp size={16} />}
                  <span className="hidden sm:inline">{muted ? 'Muted' : 'Sound on'}</span>
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-zinc-300 transition-all hover:scale-105 hover:border-accent-500/60 hover:bg-accent-500 hover:text-[color:var(--on-accent)]"
                >
                  <HiOutlineX size={17} />
                </button>
              </div>

              <video
                ref={ref}
                key={video.url}
                src={asset(video.url)}
                poster={video.poster ? asset(video.poster) : undefined}
                controls
                autoPlay
                playsInline
                muted={muted}
                onVolumeChange={(e) => setMuted((e.target as HTMLVideoElement).muted)}
                className="block max-h-[76vh] w-full bg-[#000]"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
