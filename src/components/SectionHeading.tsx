import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { SplitText } from './reactbits';
import { dur, on } from '../lib/anim';

/** Shared eyebrow + big title + animated rule used by every top-level section. */
export default function SectionHeading({
  eyebrow,
  title,
  index,
  children,
}: {
  eyebrow: string;
  title: string;
  index: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-14">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-3"
      >
        <span className="font-mono text-xs text-accent-500">{index}</span>
        <span className="font-mono text-xs uppercase tracking-[0.28em] text-zinc-500">{eyebrow}</span>
      </motion.div>

      {/* React Bits SplitText — the title assembles word by word */}
      <motion.div
        initial={on('scrollReveal') ? { opacity: 0 } : false}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: dur(0.3) }}
        className="mt-3 max-w-3xl"
      >
        <SplitText
          as="h2"
          text={title}
          splitBy="words"
          stagger={0.055}
          delay={0.08}
          className="font-display text-[clamp(1.9rem,4.5vw,3.2rem)] font-bold leading-[1.08] tracking-[-0.03em] text-zinc-100"
        />
      </motion.div>

      {/* rule that draws itself in from the left */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 h-px w-full origin-left bg-gradient-to-r from-accent-500/70 via-line to-transparent"
      />

      {children}
    </div>
  );
}
