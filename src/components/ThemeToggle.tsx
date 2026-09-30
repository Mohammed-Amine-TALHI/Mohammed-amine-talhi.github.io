import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import { useTheme } from '../lib/theme';
import { config } from '../lib/data';
import { useLang } from '../lib/i18n';

/**
 * Sun / moon switch pinned to the bottom-right corner.
 *
 * Fixed at z-40 alongside the navbar so it stays above section content but
 * below the portalled overlays (lightbox, document viewer), which would
 * otherwise have a stray button floating over them.
 */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { lang } = useLang();
  if (config.theme?.toggle === false) return null;

  const dark = theme === 'dark';
  const label = dark
    ? lang === 'fr' ? 'Passer en thème clair' : 'Switch to light theme'
    : lang === 'fr' ? 'Passer en thème sombre' : 'Switch to dark theme';

  return (
    <motion.button
      onClick={toggle}
      aria-label={label}
      title={label}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      whileTap={{ scale: 0.92 }}
      className="btn-secondary fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full text-zinc-300 backdrop-blur-md hover:text-accent-500 sm:bottom-6 sm:right-6"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="grid place-items-center"
        >
          {dark ? <HiOutlineSun size={20} /> : <HiOutlineMoon size={19} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
