import type { IconType } from 'react-icons';
import { config } from './data';
import { resolveIcon } from './iconRegistry';
import type { SkillFamily, SkillItem } from './types';

export interface Skill {
  id: string;
  name: string;
  Icon: IconType;
  family: SkillFamily;
}

/* ---------------------------------------------------------------------------
   The toolbox is owned by the admin panel's Skills tab and stored in
   portfolio.config.json. Icons are referenced by a stable string key so the
   JSON stays serialisable; `resolveIcon` turns that back into a component.

   The icons render monochrome (zinc → amber on hover) so brand logos and
   generic glyphs read as one consistent set. Names appear only in the tooltip.
--------------------------------------------------------------------------- */
export function skills(): Skill[] {
  const list: SkillItem[] = config.skills ?? [];
  return list
    .filter((s) => s.name?.trim())
    .map((s) => ({ id: s.id, name: s.name, Icon: resolveIcon(s.icon), family: s.family ?? 'dev' }));
}

export const FAMILY_DOT: Record<SkillFamily, string> = {
  data: 'bg-sky-400',
  scm: 'bg-accent-400',
  dev: 'bg-violet-400',
  cad: 'bg-emerald-400',
};

export const FAMILY_LABEL: Record<SkillFamily, { en: string; fr: string }> = {
  data: { en: 'Data & Analytics', fr: 'Data & Analyse' },
  scm: { en: 'Supply Chain', fr: 'Supply Chain' },
  dev: { en: 'Development', fr: 'Développement' },
  cad: { en: 'Design & Hardware', fr: 'Conception & Matériel' },
};

export const FAMILIES = Object.keys(FAMILY_LABEL) as SkillFamily[];
