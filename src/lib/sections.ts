import { config } from './data';
import type { Loc, SectionKey, SectionText, TitleSize } from './types';

/* ---------------------------------------------------------------------------
   Section texts.

   Every top-level heading (eyebrow + title + optional intro line) has a
   built-in bilingual default in i18n.tsx, and an optional override in
   `config.sections` written by the admin's Sections tab. The override wins
   field by field, so clearing a box in the admin falls back to the default.
--------------------------------------------------------------------------- */

/** The headings the admin can edit, in page order, with a label for the panel. */
export const SECTION_LIST: { key: SectionKey; label: string; hasBlurb: boolean; hint: string }[] = [
  { key: 'hero', label: 'Hero', hasBlurb: true, hint: 'the line under the logo (eyebrow) and the tagline under your name (intro)' },
  { key: 'about', label: 'About', hasBlurb: false, hint: 'section 01' },
  { key: 'visits', label: 'Industrial visits', hasBlurb: true, hint: 'inside About · title and the line under it' },
  { key: 'projects', label: 'Projects', hasBlurb: false, hint: 'section 02' },
  { key: 'skills', label: 'Skills & languages', hasBlurb: false, hint: 'section 03' },
  { key: 'graduation', label: 'Graduation', hasBlurb: false, hint: 'section 04' },
  { key: 'leadership', label: 'Leadership', hasBlurb: false, hint: 'section 05' },
  { key: 'contact', label: 'Contact', hasBlurb: true, hint: 'section 06 · title and the paragraph next to the channels' },
];

export const TITLE_SIZES: { value: TitleSize; label: string; cls: string }[] = [
  { value: 'sm', label: 'Small', cls: 'text-[clamp(1.4rem,3vw,2.1rem)]' },
  { value: 'md', label: 'Medium', cls: 'text-[clamp(1.7rem,3.8vw,2.6rem)]' },
  { value: 'lg', label: 'Large (default)', cls: 'text-[clamp(1.9rem,4.5vw,3.2rem)]' },
  { value: 'xl', label: 'Extra large', cls: 'text-[clamp(2.2rem,5.5vw,4rem)]' },
];

export function titleSizeClass(size?: TitleSize): string {
  return (TITLE_SIZES.find((s) => s.value === size) ?? TITLE_SIZES[2]).cls;
}

/** The stored override for a section, or an empty object. */
export function sectionText(key: SectionKey): SectionText {
  return config.sections?.[key] ?? {};
}

/** First non-empty translation wins: override → default. */
export function pick(lang: 'en' | 'fr', override: Loc | undefined, fallback: string): string {
  const v = override?.[lang]?.trim() || override?.en?.trim() || override?.fr?.trim();
  return v || fallback;
}
