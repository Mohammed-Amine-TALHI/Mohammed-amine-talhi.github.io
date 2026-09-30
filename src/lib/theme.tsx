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
}

export const PALETTES: Record<Exclude<PaletteId, 'custom'>, Palette & { name: string; hint: string }> = {
  brand: {
    name: 'EMINES – UM6P',
    hint: 'UM6P orange with EMINES navy. Dark theme is deep navy.',
    accent: '#e8412a',
    brand: '#1d2b5a',
    ink: 'navy',
  },
  classic: {
    name: 'Classic amber',
    hint: 'The original look: amber on near-black, neutral greys on white.',
    accent: '#f59e0b',
    brand: '#3f3f46',
    ink: 'neutral',
  },
};

/** The palette the config asks for, resolved to concrete values. */
export function resolvePalette(t: ThemeSettings | undefined): Palette {
  const id = t?.palette ?? 'brand';
  if (id === 'custom') {
    return {
      accent: t?.accent || PALETTES.brand.accent,
      brand: t?.brand || PALETTES.brand.brand,
      ink: t?.ink ?? 'navy',
    };
  }
  return PALETTES[id];
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
  // safe variants (see the note above)
  el.style.setProperty('--accent-deep', clampLuminance(p.accent, 0.25, 'darker')); // text on paper
  el.style.setProperty('--accent-lit', clampLuminance(p.accent, 0.35, 'lighter')); // text on navy
  el.style.setProperty('--brand-deep', clampLuminance(p.brand, 0.08, 'darker')); // headings on paper
  el.style.setProperty('--brand-lit', clampLuminance(p.brand, 0.35, 'lighter')); // brand text on navy
  el.style.setProperty('--on-accent', onColor(p.accent));
  el.style.setProperty('--on-brand', onColor(p.brand));
  el.dataset.ink = p.ink;
}

const STORAGE_KEY = 'portfolio.theme';

export const defaultTheme: Theme = config.theme?.default === 'dark' ? 'dark' : 'light';

export function readStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

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
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? defaultTheme);

  useEffect(() => {
    applyPalette(resolvePalette(config.theme));
    applyTheme(theme);
  }, [theme]);

  const value = useMemo<Ctx>(
    () => ({
      theme,
      setTheme: (t) => {
        try {
          localStorage.setItem(STORAGE_KEY, t);
        } catch {
          /* private mode — the choice just doesn't persist */
        }
        setTheme(t);
      },
      toggle: () => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          /* ignore */
        }
        setTheme(next);
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
