import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { SplitText } from './reactbits';
import { dur, on } from '../lib/anim';
import { useLang } from '../lib/i18n';
import { pick, sectionText, titleSizeClass } from '../lib/sections';
import type { SectionKey } from '../lib/types';

/**
 * Shared eyebrow + big title + animated rule used by every top-level section.
 *
 * `eyebrow` / `title` are the built-in defaults; when `section` is given, the
 * admin's Sections tab can override the wording, the size, and force the
 * title onto one line.
 */
export default function SectionHeading({
  eyebrow,
  title,
  index,
  section,
  children,
}: {
  eyebrow: string;
  title: string;
  index: string;
  section?: SectionKey;
  children?: ReactNode;
}) {
  const { lang } = useLang();
  const o = section ? sectionText(section) : {};
  const eyebrowText = pick(lang, o.eyebrow, eyebrow);
  const titleText = pick(lang, o.title, title);
  const sizeCls = titleSizeClass(o.size);

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
        <span className="font-mono text-xs uppercase tracking-[0.28em] text-zinc-500">{eyebrowText}</span>
      </motion.div>

      {/* React Bits SplitText — the title assembles word by word */}
      <motion.div
        initial={on('scrollReveal') ? { opacity: 0 } : false}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: dur(0.3) }}
        className={o.oneLine ? 'mt-3 max-w-full overflow-hidden' : 'mt-3 max-w-3xl'}
      >
        <SplitText
          as="h2"
          text={titleText}
          splitBy="words"
          stagger={0.055}
          delay={0.08}
          className={
            'font-display font-bold leading-[1.08] tracking-[-0.03em] text-zinc-100 ' +
            (o.oneLine ? 'whitespace-nowrap ' : '') +
            sizeCls
          }
        />
      </motion.div>

      {/* rule that draws itself in from the left */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 h-px w-full origin-left bg-gradient-to-r from-accent-500/80 via-brand-400/40 to-transparent"
      />

      {children}
    </div>
  );
}
