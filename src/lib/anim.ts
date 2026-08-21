import { config } from './data';
import type { AnimationPreset, AnimationSettings } from './types';

/* ---------------------------------------------------------------------------
   Animation settings.

   Every animated component reads from here instead of hard-coding durations,
   so the Animations tab in the admin panel can retune or switch off the whole
   site without touching component code.
--------------------------------------------------------------------------- */

/** Presets shown in the admin. `speed` multiplies every duration. */
export const PRESETS: Record<AnimationPreset, Omit<AnimationSettings, 'preset' | 'nameEffect'>> = {
  subtle: {
    speed: 1.25,
    backgroundBlooms: true,
    liquidEther: true,
    etherIntensity: 0.65,
    orbitDots: false,
    flowConsole: true,
    timelinePulse: false,
    hoverLift: true,
    scrollReveal: true,
  },
  balanced: {
    speed: 1,
    backgroundBlooms: true,
    liquidEther: true,
    etherIntensity: 1,
    orbitDots: true,
    flowConsole: true,
    timelinePulse: true,
    hoverLift: true,
    scrollReveal: true,
  },
  showcase: {
    speed: 0.75,
    backgroundBlooms: true,
    liquidEther: true,
    etherIntensity: 1.45,
    orbitDots: true,
    flowConsole: true,
    timelinePulse: true,
    hoverLift: true,
    scrollReveal: true,
  },
  off: {
    speed: 1,
    backgroundBlooms: false,
    liquidEther: false,
    etherIntensity: 1,
    orbitDots: false,
    flowConsole: false,
    timelinePulse: false,
    hoverLift: false,
    scrollReveal: false,
  },
};

export const PRESET_LABEL: Record<AnimationPreset, { en: string; fr: string; hint: string }> = {
  subtle: { en: 'Subtle', fr: 'Sobre', hint: 'Slower, fewer moving parts. Safest for recruiters.' },
  balanced: { en: 'Balanced', fr: 'Équilibré', hint: 'The default. Everything on, sensible speeds.' },
  showcase: { en: 'Showcase', fr: 'Vitrine', hint: 'Faster and busier. Maximum first-glance impact.' },
  off: { en: 'Static', fr: 'Statique', hint: 'No motion at all. Content only.' },
};

export const anim: AnimationSettings = config.animation ?? {
  ...PRESETS.balanced,
  preset: 'balanced',
  nameEffect: 'stroke',
};

/** True when the visitor asked the OS to reduce motion. */
export const reduced =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------------------
   Device budget.

   The WebGL background samples five octaves of noise five times per pixel; on a
   laptop that is nothing, on a mid-range phone at devicePixelRatio 3 it is the
   difference between 60fps and a slideshow. Rather than switching effects off
   for phones — the logic stays identical everywhere — we scale what they cost:
   fewer octaves, fewer pixels, a lower frame cap, and no backdrop blur.
--------------------------------------------------------------------------- */
export type PerfTier = 'high' | 'low';

export const perfTier: PerfTier = (() => {
  if (typeof window === 'undefined') return 'high';
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const narrow = window.matchMedia?.('(max-width: 900px)').matches ?? false;
  const fewCores = (nav.hardwareConcurrency ?? 8) <= 4;
  const littleMemory = (nav.deviceMemory ?? 8) <= 4;
  // a touch device OR a small screen OR genuinely modest hardware
  return coarse || narrow || fewCores || littleMemory ? 'low' : 'high';
})();

export const isLowPower = perfTier === 'low';

/** Per-tier budget for the background shader. */
export const etherBudget = {
  octaves: isLowPower ? 3 : 5,
  maxDpr: isLowPower ? 1 : 1.5,
  fpsCap: isLowPower ? 30 : 60,
};

/**
 * Continuous loops that are pleasant on a desktop but not worth the battery on
 * a phone. Scroll reveals and hover states are unaffected — only the things
 * that animate forever.
 */
export function loopOn(key: Parameters<typeof on>[0]): boolean {
  if (!on(key)) return false;
  if (!isLowPower) return true;
  return key !== 'orbitDots' && key !== 'timelinePulse';
}

/** Scale a duration by the configured speed. Returns ~0 when motion is off. */
export function dur(seconds: number): number {
  if (reduced) return 0.001;
  return seconds * (anim.speed || 1);
}

/** Is a given animation channel enabled? */
export function on(key: keyof Omit<AnimationSettings, 'preset' | 'speed' | 'nameEffect' | 'etherIntensity'>): boolean {
  if (reduced) return false;
  return anim[key] !== false;
}

/**
 * Scroll-reveal props. When scrollReveal is off the element is simply visible,
 * which keeps the markup identical either way.
 */
export function reveal(y = 24, delay = 0) {
  if (!on('scrollReveal')) return {};
  return {
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-70px' },
    transition: { duration: dur(0.6), delay: dur(delay), ease: [0.22, 1, 0.36, 1] as const },
  };
}

/** Standard hover lift for cards, disabled by the hoverLift channel. */
export function lift(y = -4) {
  return on('hoverLift') ? { whileHover: { y } } : {};
}
