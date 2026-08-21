import { motion } from 'framer-motion';
import { anim, dur, on } from '../lib/anim';
import { LiquidEther } from './reactbits';

/**
 * Fixed ambient layer behind the whole page.
 *
 * With `liquidEther` on, a WebGL ether flows behind everything and reacts to the
 * cursor. The CSS blooms sit underneath it as the fallback for browsers without
 * WebGL — and as the whole background when the effect is switched off in the
 * admin panel. A scrim above the canvas keeps foreground text legible.
 */
export default function Background() {
  const drift = on('backgroundBlooms');
  const ether = on('liquidEther');

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* --- CSS blooms: fallback layer, and the full effect when ether is off --- */}
      <motion.div
        className="absolute -left-40 -top-40 h-[38rem] w-[38rem] rounded-full bg-accent-600/12 blur-[130px]"
        animate={drift ? { x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.12, 1] } : undefined}
        transition={{ duration: dur(22), repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-52 -right-40 h-[42rem] w-[42rem] rounded-full bg-accent-700/10 blur-[150px]"
        animate={drift ? { x: [0, -70, 0], y: [0, -30, 0], scale: [1, 1.18, 1] } : undefined}
        transition={{ duration: dur(28), repeat: Infinity, ease: 'easeInOut', delay: dur(3) }}
      />

      {/* --- liquid ether --- */}
      {ether && (
        <div className="absolute inset-0">
          <LiquidEther intensity={anim.etherIntensity ?? 1} speed={1 / (anim.speed || 1)} />
          {/* scrim: the ether is atmosphere, not the subject */}
          <div
            className="absolute inset-0 bg-ink-950"
            style={{ opacity: Math.min(0.82, Math.max(0.25, 0.78 - (anim.etherIntensity ?? 1) * 0.24)) }}
          />
        </div>
      )}

      {/* faint grid reads on top of the ether */}
      <div className="bg-grid absolute inset-0 opacity-[0.4]" />

      {/* vignette keeps the page edges dark and the centre readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(8,8,11,0.88)_100%)]" />
    </div>
  );
}
