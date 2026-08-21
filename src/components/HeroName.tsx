import { motion } from 'framer-motion';
import { anim, dur, reduced } from '../lib/anim';
import { SplitText, ShinyText, StrokeText } from './reactbits';

/**
 * The name in the hero, always on a single line.
 *
 * `whitespace-nowrap` plus a viewport-scaled clamp keeps all 20 characters on
 * one row from 320px up to ultra-wide, and the effect is picked in the admin
 * panel's Animations tab.
 */
export default function HeroName({ name }: { name: string }) {
  const chars = [...name];
  const effect = reduced ? 'none' : anim.nameEffect;

  const base =
    'block whitespace-nowrap text-center font-display text-[clamp(1.55rem,6.4vw,5.5rem)] font-extrabold leading-[1.05] tracking-[-0.045em]';

  /* ---- React Bits StrokeText: outlined letters, filled by a sweeping band ---- */
  if (effect === 'stroke') {
    return (
      <h1 className={base} aria-label={name}>
        <StrokeText text={name} className="align-top" />
      </h1>
    );
  }

  /* ---- React Bits SplitText: per-letter slide up out of a mask ---- */
  if (effect === 'reveal') {
    return <SplitText as="h1" text={name} className={base + ' text-zinc-100'} splitBy="chars" delay={0.15} />;
  }

  /* ---- characters typed in sequence, with a blinking caret ---- */
  if (effect === 'typewriter') {
    return (
      <h1 className={base + ' text-zinc-100'} aria-label={name}>
        {chars.map((c, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="inline-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.01, delay: dur(0.3 + i * 0.06) }}
          >
            {c === ' ' ? ' ' : c}
          </motion.span>
        ))}
        <motion.span
          aria-hidden
          className="ml-1 inline-block w-[0.06em] self-stretch bg-accent-500 align-middle"
          style={{ height: '0.8em' }}
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{ duration: dur(1.1), repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
        />
      </h1>
    );
  }

  /* ---- static ---- */
  if (effect === 'none') {
    return (
      <h1 className={base}>
        <span className="text-zinc-100">{name.replace(/\s+\S+$/, '')} </span>
        <span className="text-gradient">{name.split(' ').pop()}</span>
      </h1>
    );
  }

  /* ---- default: React Bits ShinyText — blur in, then a highlight sweeps ---- */
  return (
    <motion.h1
      className={'relative ' + base}
      initial={{ opacity: 0, y: 26, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: dur(0.9), ease: [0.22, 1, 0.36, 1] }}
      aria-label={name}
    >
      <ShinyText text={name} />
    </motion.h1>
  );
}
