import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../lib/i18n';
import { dur, on } from '../lib/anim';

/**
 * The three countries, shown as flags directly inside the stat tile.
 *
 * An earlier version put a "3" here and revealed the list on hover, but the
 * pointer had to cross a gap to reach the popover and it closed on the way —
 * so the flags are now the control itself. Each is a real button: hovering
 * names the place, clicking jumps to the evidence for it.
 */
const COUNTRIES = [
  { key: 'morocco', flag: '🇲🇦', href: '#exp-pfe' },
  { key: 'brazil', flag: '🇧🇷', href: '#exp-uff' },
  { key: 'france', flag: '🇫🇷', href: '#visits' },
] as const;

/** Scroll to a target and pulse it, so the jump reads as an answer. */
function goTo(href: string) {
  const el = document.querySelector(href);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('flash-target');
  window.setTimeout(() => el.classList.remove('flash-target'), 1800);
}

export default function CountriesStat({ label }: { label: string }) {
  const { ui } = useLang();
  const [hovered, setHovered] = useState<string | null>(null);
  const active = COUNTRIES.find((c) => c.key === hovered);

  return (
    <div className="relative bg-ink-900/80 px-3 py-5 backdrop-blur-sm sm:px-4">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {COUNTRIES.map((c) => (
          <motion.button
            key={c.key}
            onClick={() => goTo(c.href)}
            onHoverStart={() => setHovered(c.key)}
            onHoverEnd={() => setHovered(null)}
            onFocus={() => setHovered(c.key)}
            onBlur={() => setHovered(null)}
            aria-label={ui(('countries.' + c.key) as 'countries.morocco')}
            {...(on('hoverLift') ? { whileHover: { y: -3, scale: 1.12 } } : {})}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-ink-850/70 text-lg leading-none transition-colors hover:border-accent-500/50 hover:bg-accent-500/[0.08] sm:h-10 sm:w-10 sm:text-xl"
          >
            {c.flag}
          </motion.button>
        ))}
      </div>

      {/* the label doubles as the readout for whichever flag is hovered */}
      <div className="mt-2 h-4 text-center text-xs">
        <AnimatePresence mode="wait" initial={false}>
          {active ? (
            <motion.span
              key={active.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: dur(0.16) }}
              className="block truncate text-accent-400"
            >
              {ui(('countries.' + active.key) as 'countries.morocco')}
            </motion.span>
          ) : (
            <motion.span
              key="label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur(0.16) }}
              className="block text-zinc-500"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
