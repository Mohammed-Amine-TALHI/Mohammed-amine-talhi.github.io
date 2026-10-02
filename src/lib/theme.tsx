import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { config } from './data';
import type { PaletteId, ThemeSettings } from './types';

/* ---------------------------------------------------------------------------
   Light / dark theme.

   The palette itself lives in index.css as CSS variables keyed on
   `html[data-theme]`; this module only decides which value that attribute
   holds. Order of precedence: the visitor's own choice (localStorage), then
   the default picked in the admin panel, then light.

   index.html sets the attribute in an inline script before React loads, so
   the first paint is already the right colour — no white flash on a dark
   preference, and vice versa.
--------------------------------------------------------------------------- */
export type Theme = 'light' | 'dark';

/* ---------------------------------------------------------------------------
   Palettes. Each is just two hues plus the dark-background family; index.css
   derives every shade from them. `classic` is the site's original look.
--------------------------------------------------------------------------- */
export interface Palette {
  accent: string;
  brand: string;
  ink: 'navy' | 'neutral';
  /** 0 = neutral near-black, 1 = fully tinted with the brand hue */
  tint: number;
}

export const PALETTES: Record<Exclude<PaletteId, 'custom'>, Palette & { name: string; hint: string }> = {
  brand: {
    name: 'EMINES – UM6P',
    hint: 'UM6P orange with EMINES navy. Dark theme is deep navy.',
    accent: '#e8412a',
    brand: '#1d2b5a',
    ink: 'navy',
    tint: 1,
  },
  classic: {
    name: 'Classic amber',
    hint: 'The original look: amber on near-black, neutral greys on white.',
    accent: '#f59e0b',
    brand: '#3f3f46',
    ink: 'neutral',
    tint: 0,
  },
};

/** The palette the config asks for, resolved to concrete values. */
export function resolvePalette(t: ThemeSettings | undefined): Palette {
  const id = t?.palette ?? 'brand';
  const base = id === 'custom'
    ? { accent: t?.accent || PALETTES.brand.accent, brand: t?.brand || PALETTES.brand.brand, ink: t?.ink ?? 'navy', tint: t?.ink === 'neutral' ? 0 : 1 }
    : { ...PALETTES[id] };
  // the slider wins over the preset's default tint when it has been touched
  if (typeof t?.tint === 'number') base.tint = Math.min(1, Math.max(0, t.tint));
  return base;
}

/* ---------------------------------------------------------------------------
   Contrast guards.

   A custom palette can be anything — white, black, neon. The CSS derives
   its shades with color-mix(), which cannot know whether "a bit darker than
   the accent" is still readable on paper. So alongside the raw hues we also
   publish a few *safe* variants: one dark enough for text on white, one
   light enough for text on navy, and the right ink (black or white) to put
   on top of a button filled with the hue.
--------------------------------------------------------------------------- */
function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (c: [number, number, number]) =>
  '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');

/** WCAG relative luminance, 0 (black) .. 1 (white). */
function luminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Blend towards black or white until the luminance crosses `target`. */
function clampLuminance(hex: string, target: number, direction: 'darker' | 'lighter'): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const to: [number, number, number] = direction === 'darker' ? [0, 0, 0] : [255, 255, 255];
  let c = rgb;
  for (let i = 0; i < 40; i++) {
    const l = luminance(c);
    if (direction === 'darker' ? l <= target : l >= target) break;
    c = [0, 1, 2].map((k) => c[k] + (to[k] - c[k]) * 0.08) as [number, number, number];
  }
  return toHex(c);
}

/** Greys, white and black have no hue to keep — treat them as "monochrome". */
function achromatic(hex: string): boolean {
  const rgb = hexToRgb(hex);
  return !!rgb && Math.max(...rgb) - Math.min(...rgb) < 24;
}

/** Black or white, whichever reads better on the given fill. */
function onColor(hex: string): string {
  const rgb = hexToRgb(hex);
  return rgb && luminance(rgb) > 0.45 ? '#0b0f1f' : '#ffffff';
}

/** Push a palette onto <html>; the CSS does the rest. */
export function applyPalette(p: Palette) {
  const el = document.documentElement;
  el.style.setProperty('--accent', p.accent);
  el.style.setProperty('--brand', p.brand);
  // safe variants (see the note above). A monochrome choice — white, black,
  // grey — means "no colour": text goes fully black on paper and fully white
  // on the dark theme, rather than the muddy mid-grey a luminance clamp gives.
  const mono = (hex: string, deep: string) => (achromatic(hex) ? deep : null);
  el.style.setProperty('--accent-deep', mono(p.accent, '#111116') ?? clampLuminance(p.accent, 0.25, 'darker'));
  el.style.setProperty('--accent-lit', mono(p.accent, '#f4f4f7') ?? clampLuminance(p.accent, 0.35, 'lighter'));
  el.style.setProperty('--brand-deep', mono(p.brand, '#111116') ?? clampLuminance(p.brand, 0.08, 'darker'));
  el.style.setProperty('--brand-lit', mono(p.brand, '#e4e4ec') ?? clampLuminance(p.brand, 0.35, 'lighter'));
  // the fill colour itself, per theme: a white accent is a white button on
  // navy but would vanish on paper, so on paper it becomes black (and vice
  // versa for a black accent on the dark theme)
  const lum = (h: string) => { const c = hexToRgb(h); return c ? luminance(c) : 0.5; };
  el.style.setProperty('--accent-paper', achromatic(p.accent) && lum(p.accent) > 0.5 ? '#111116' : p.accent);
  el.style.setProperty('--accent-night', achromatic(p.accent) && lum(p.accent) < 0.2 ? '#f4f4f7' : p.accent);
  el.style.setProperty('--on-accent-paper', onColor(achromatic(p.accent) && lum(p.accent) > 0.5 ? '#111116' : p.accent));
  el.style.setProperty('--on-accent-night', onColor(achromatic(p.accent) && lum(p.accent) < 0.2 ? '#f4f4f7' : p.accent));
  el.style.setProperty('--on-brand', onColor(p.brand));
  el.style.setProperty('--tint', String(p.tint));
  // the neutral grey family only when the tint is fully off
  el.dataset.ink = p.tint <= 0.02 ? 'neutral' : 'navy';
}

const STORAGE_KEY = 'portfolio.theme';

/** What the visitor (or the admin default) asked for; `auto` follows the sun. */
export type ThemeMode = Theme | 'auto';

export const defaultMode: ThemeMode =
  config.theme?.default === 'dark' ? 'dark' : config.theme?.default === 'auto' ? 'auto' : 'light';

export function readStoredMode(): ThemeMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' || v === 'auto' ? v : null;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------------------
   Sunrise / sunset.

   Automatic mode shows the light theme while the sun is up where the visitor
   is, and the dark one at night. No location permission is asked for: the
   browser's time zone is enough to place the visitor to within an hour of
   sun time. A handful of zones carry real coordinates; any other falls back
   to a longitude derived from its UTC offset and a mid latitude.
--------------------------------------------------------------------------- */
const ZONES: Record<string, [number, number]> = {
  'Africa/Casablanca': [33.6, -7.6],
  'Africa/El_Aaiun': [27.1, -13.2],
  'Europe/Paris': [48.9, 2.3],
  'Europe/Brussels': [50.8, 4.4],
  'Europe/Madrid': [40.4, -3.7],
  'Europe/London': [51.5, -0.1],
  'Europe/Berlin': [52.5, 13.4],
  'Europe/Zurich': [47.4, 8.5],
  'Europe/Amsterdam': [52.4, 4.9],
  'Europe/Rome': [41.9, 12.5],
  'Africa/Algiers': [36.8, 3.1],
  'Africa/Tunis': [36.8, 10.2],
  'Africa/Cairo': [30.0, 31.2],
  'Asia/Dubai': [25.2, 55.3],
  'Asia/Riyadh': [24.7, 46.7],
  'America/New_York': [40.7, -74.0],
  'America/Toronto': [43.7, -79.4],
  'America/Sao_Paulo': [-23.5, -46.6],
  'America/Los_Angeles': [34.1, -118.2],
};

/** Approximate coordinates of the visitor, from the time zone alone. */
export function approxLocation(now = new Date()): { lat: number; lng: number; zone: string } {
  let zone = '';
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    /* very old browser */
  }
  if (ZONES[zone]) return { lat: ZONES[zone][0], lng: ZONES[zone][1], zone };
  // standard (non-DST) offset: the larger of January's and July's
  const y = now.getFullYear();
  const std = Math.max(new Date(y, 0, 1).getTimezoneOffset(), new Date(y, 6, 1).getTimezoneOffset());
  return { lat: 35, lng: (-std / 60) * 15, zone };
}

/**
 * Today's sunrise and sunset at a place (the standard sunrise equation, good
 * to a couple of minutes). Returns null during polar day or night.
 */
export function sunTimes(date: Date, lat: number, lng: number): { sunrise: Date; sunset: Date } | null {
  const rad = Math.PI / 180;
  const dayMs = 86_400_000;
  const J1970 = 2440588;
  const J2000 = 2451545;
  const toJulian = (d: Date) => d.valueOf() / dayMs - 0.5 + J1970;
  const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * dayMs);

  const lw = -lng * rad;
  const phi = lat * rad;
  const n = Math.round(toJulian(date) - J2000 - 0.0009 - lw / (2 * Math.PI));
  const ds = 0.0009 + lw / (2 * Math.PI) + n;
  const M = rad * (357.5291 + 0.98560028 * ds);
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + rad * 102.9372 + Math.PI;
  const dec = Math.asin(Math.sin(L) * Math.sin(rad * 23.4397));
  const noon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  // -0.833°: the sun's upper edge on the horizon, with refraction
  const cosH = (Math.sin(-0.833 * rad) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (cosH < -1 || cosH > 1) return null;
  const H = Math.acos(cosH);
  const set = J2000 + 0.0009 + (H + lw) / (2 * Math.PI) + n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  return { sunrise: fromJulian(noon - (set - noon)), sunset: fromJulian(set) };
}

/** Light while the sun is up, dark otherwise. */
export function themeForNow(now = new Date()): Theme {
  const { lat, lng } = approxLocation(now);
  const sun = sunTimes(now, lat, lng);
  if (!sun) {
    const h = now.getHours();
    return h >= 7 && h < 19 ? 'light' : 'dark';
  }
  return now >= sun.sunrise && now < sun.sunset ? 'light' : 'dark';
}

export const resolveMode = (mode: ThemeMode): Theme => (mode === 'auto' ? themeForNow() : mode);

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-ink-950').trim();
    meta.setAttribute('content', theme === 'dark' ? bg || '#0a0f1f' : '#ffffff');
  }
}

interface Ctx {
  /** the theme on screen right now */
  theme: Theme;
  /** what was asked for: light, dark, or auto */
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  /** cycle auto → light → dark → auto */
  toggle: () => void;
}

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode() ?? defaultMode);
  const [theme, setTheme] = useState<Theme>(() => resolveMode(mode));

  // in auto mode, follow the sun: re-check every minute and when the tab comes back
  useEffect(() => {
    setTheme(resolveMode(mode));
    if (mode !== 'auto') return;
    const tick = () => setTheme(themeForNow());
    const timer = window.setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [mode]);

  useEffect(() => {
    applyPalette(resolvePalette(config.theme));
    applyTheme(theme);
  }, [theme]);

  const value = useMemo<Ctx>(() => {
    const setMode = (m: ThemeMode) => {
      try {
        localStorage.setItem(STORAGE_KEY, m);
      } catch {
        /* private mode — the choice just doesn't persist */
      }
      setModeState(m);
    };
    return {
      theme,
      mode,
      setMode,
      toggle: () => setMode(mode === 'auto' ? 'light' : mode === 'light' ? 'dark' : 'auto'),
    };
  }, [theme, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
