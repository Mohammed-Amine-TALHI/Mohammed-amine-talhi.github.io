/**
 * React Bits components
 * ---------------------
 * React Bits (reactbits.dev) is distributed the way shadcn/ui is: you copy the
 * component source into your project and own it, rather than installing a
 * runtime package. (The `reactbits` name on npm is unrelated, and the
 * third-party mirror pulls in three.js, GSAP, Chakra and matter-js as peers —
 * far too much weight for a portfolio.)
 *
 * These are the React Bits patterns this site uses, adapted to our amber/ink
 * palette and wired into the admin's Animations tab. Each keeps the original
 * component's API shape so it stays recognisable.
 *
 *   StrokeText       outlined type with a sweep that fills the letters
 *   LiquidEther      cursor-reactive flowing background (separate file)
 *   SplitText        headings that animate per character or word
 *   BlurText         words that blur and drift into place
 *   ShinyText        a highlight that sweeps across the text
 *   GradientText     animated gradient fill
 *   CountUp          numbers that roll up when scrolled into view
 *   AnimatedContent  scroll-triggered reveal wrapper
 *   SpotlightCard    a card with a cursor-following radial spotlight
 *   Magnet           an element that leans toward the cursor
 *   ClickSpark       particle burst on click
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { animate, motion, useInView, type Variants } from 'framer-motion';
import { dur, on, reduced } from '../../lib/anim';

export { default as LiquidEther } from './LiquidEther';

/* -------------------------------------------------------------------------- */
/*  StrokeText                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Outlined type whose letters fill with light as a band sweeps through.
 *
 * The glyphs exist once in the DOM: the element itself is stroke-only, and the
 * fill is a `::after` pseudo element that copies the string via
 * `content: attr(data-text)` (see `.stroke-text` in index.css). Stacking two
 * real spans instead would duplicate the name for crawlers and screen readers.
 */
export function StrokeText({
  text,
  className = '',
  strokeColor,
  strokeWidth,
  sweep = true,
  as: Tag = 'span',
}: {
  text: string;
  className?: string;
  strokeColor?: string;
  strokeWidth?: string;
  sweep?: boolean;
  as?: 'span' | 'h1' | 'h2';
}) {
  const still = reduced || !sweep;

  return (
    <Tag
      className={'stroke-text ' + className}
      data-text={text}
      data-sweep={still ? 'off' : 'on'}
      style={
        {
          '--sweep-dur': dur(6.3) + 's',
          ...(strokeWidth ? { '--stroke-w': strokeWidth } : {}),
          ...(strokeColor ? { '--stroke-c': strokeColor } : {}),
        } as CSSProperties
      }
    >
      {text}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/*  SplitText                                                                 */
/* -------------------------------------------------------------------------- */

export function SplitText({
  text,
  className = '',
  splitBy = 'chars',
  delay = 0,
  stagger = 0.035,
  as: Tag = 'span',
}: {
  text: string;
  className?: string;
  splitBy?: 'chars' | 'words';
  delay?: number;
  stagger?: number;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
}) {
  const pieces = splitBy === 'words' ? text.split(/(\s+)/) : [...text];

  if (reduced) return <Tag className={className}>{text}</Tag>;

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: dur(stagger), delayChildren: dur(delay) } },
  };
  const piece: Variants = {
    hidden: { y: '110%' },
    show: { y: 0, transition: { duration: dur(0.75), ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <Tag className={className} aria-label={text}>
      <motion.span variants={container} initial="hidden" animate="show" className="inline" aria-hidden>
        {pieces.map((p, i) =>
          /^\s+$/.test(p) ? (
            <span key={i}> </span>
          ) : (
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <motion.span variants={piece} className="inline-block">
                {p}
              </motion.span>
            </span>
          ),
        )}
      </motion.span>
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/*  BlurText                                                                  */
/* -------------------------------------------------------------------------- */

export function BlurText({
  text,
  className = '',
  delay = 0,
  stagger = 0.06,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  if (reduced) return <span className={className}>{text}</span>;

  const words = text.split(' ');
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: dur(0.55), delay: dur(delay + i * stagger), ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  ShinyText                                                                 */
/* -------------------------------------------------------------------------- */

export function ShinyText({
  text,
  className = '',
  speed = 5.5,
  disabled,
}: {
  text: string;
  className?: string;
  speed?: number;
  disabled?: boolean;
}) {
  const still = disabled || reduced || !on('backgroundBlooms');

  return (
    <motion.span
      className={'inline-block bg-clip-text text-transparent ' + className}
      style={{
        backgroundImage:
          'linear-gradient(100deg, #e4e4e7 0%, #e4e4e7 32%, var(--color-accent-300) 44%, var(--color-accent-500) 52%, var(--color-accent-600) 60%, #e4e4e7 74%, #e4e4e7 100%)',
        backgroundSize: '260% 100%',
      }}
      animate={still ? { backgroundPosition: '50% 0%' } : { backgroundPosition: ['160% 0%', '-60% 0%'] }}
      transition={{ duration: dur(speed), repeat: still ? 0 : Infinity, repeatDelay: dur(2.2), ease: [0.4, 0, 0.2, 1] }}
    >
      {text}
    </motion.span>
  );
}

/* -------------------------------------------------------------------------- */
/*  GradientText                                                              */
/* -------------------------------------------------------------------------- */

export function GradientText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.span
      className={'inline-block bg-clip-text text-transparent ' + className}
      style={{
        backgroundImage:
          'linear-gradient(120deg, var(--color-accent-300), var(--color-accent-600), var(--color-accent-300))',
        backgroundSize: '200% 100%',
      }}
      animate={reduced ? undefined : { backgroundPosition: ['0% 50%', '200% 50%'] }}
      transition={{ duration: dur(8), repeat: Infinity, ease: 'linear' }}
    >
      {children}
    </motion.span>
  );
}

/* -------------------------------------------------------------------------- */
/*  CountUp                                                                   */
/* -------------------------------------------------------------------------- */

export function CountUp({
  to,
  from = 0,
  duration = 1.8,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setValue(to);
      return;
    }
    const controls = animate(from, to, {
      duration: dur(duration),
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setValue,
    });
    return () => controls.stop();
  }, [inView, from, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  AnimatedContent                                                           */
/* -------------------------------------------------------------------------- */

export function AnimatedContent({
  children,
  distance = 24,
  direction = 'vertical',
  delay = 0,
  duration = 0.6,
  scale = 1,
  className = '',
}: {
  children: ReactNode;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  delay?: number;
  duration?: number;
  scale?: number;
  className?: string;
}) {
  if (!on('scrollReveal')) return <div className={className}>{children}</div>;

  const axis = direction === 'horizontal' ? 'x' : 'y';
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, [axis]: distance, scale }}
      whileInView={{ opacity: 1, [axis]: 0, scale: 1 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: dur(duration), delay: dur(delay), ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  SpotlightCard                                                             */
/* -------------------------------------------------------------------------- */

export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(245, 158, 11, 0.14)',
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [active, setActive] = useState(false);
  const enabled = on('hoverLift');

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        if (!enabled || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={'relative overflow-hidden ' + className}
    >
      {enabled && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={
            {
              opacity: active ? 1 : 0,
              background: `radial-gradient(340px circle at ${pos.x}% ${pos.y}%, ${spotlightColor}, transparent 70%)`,
            } as CSSProperties
          }
        />
      )}
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Magnet                                                                    */
/* -------------------------------------------------------------------------- */

export function Magnet({
  children,
  strength = 0.28,
  className = '',
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const enabled = on('hoverLift');

  return (
    <motion.div
      ref={ref}
      className={'inline-block ' + className}
      onMouseMove={(e) => {
        if (!enabled || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setOffset({
          x: (e.clientX - (r.left + r.width / 2)) * strength,
          y: (e.clientY - (r.top + r.height / 2)) * strength,
        });
      }}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      animate={offset}
      transition={{ type: 'spring', stiffness: 260, damping: 18, mass: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ClickSpark                                                                */
/* -------------------------------------------------------------------------- */

interface Spark {
  id: number;
  x: number;
  y: number;
}

export function ClickSpark({
  children,
  className = '',
  color = 'var(--color-accent-400)',
  count = 8,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  count?: number;
}) {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const seq = useRef(0);
  const enabled = on('hoverLift');

  return (
    <span
      className={'relative inline-block ' + className}
      onClick={(e) => {
        if (!enabled) return;
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const id = ++seq.current;
        setSparks((s) => [...s, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
        window.setTimeout(() => setSparks((s) => s.filter((k) => k.id !== id)), 700);
      }}
    >
      {children}

      {sparks.map((s) => (
        <span key={s.id} className="pointer-events-none absolute" style={{ left: s.x, top: s.y }}>
          {Array.from({ length: count }).map((_, i) => {
            const angle = (i / count) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                className="absolute block h-1 w-1 rounded-full"
                style={{ background: color }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: Math.cos(angle) * 26, y: Math.sin(angle) * 26, opacity: 0, scale: 0.3 }}
                transition={{ duration: dur(0.55), ease: 'easeOut' }}
              />
            );
          })}
        </span>
      ))}
    </span>
  );
}
