import resumeJson from '../data/resume.json';
import configJson from '../data/portfolio.config.json';
import type {
  PortfolioConfig,
  Project,
  Resume,
  Experience,
  ProjectAsset,
  BulletItem,
  Loc,
} from './types';

export const resume = resumeJson as unknown as Resume;
export const config = configJson as unknown as PortfolioConfig;

export const contact = config.contact;

/** Projects the admin panel has switched ON, in the configured order, plus custom ones. */
export function visibleProjects(): Project[] {
  const byId = new Map(resume.projects.map((p) => [p.id, p]));
  const ordered = (config.order?.projects ?? [])
    .map((id) => byId.get(id))
    .filter((p): p is Project => Boolean(p));

  // any synced project missing from the order list still shows up, at the end
  for (const p of resume.projects) {
    if (!ordered.some((o) => o.id === p.id)) ordered.push(p);
  }

  const custom = (config.customProjects ?? []).map((p) => ({ ...p, custom: true }));
  return [...ordered, ...custom].filter((p) => config.visibility?.projects?.[p.id] !== false);
}

/** Experiences the admin panel has switched ON. */
export function visibleExperiences(): Experience[] {
  return resume.experiences.filter((e) => config.visibility?.experiences?.[e.id] !== false);
}

/** Distinct project tags, for the filter row. */
export function projectTags(lang: 'en' | 'fr'): string[] {
  const seen = new Set<string>();
  for (const p of visibleProjects()) {
    const tag = (p.tag?.[lang] || p.tag?.en || '').trim();
    if (tag) seen.add(tag);
  }
  return [...seen].sort();
}

/** Parse "Feb. 2025 – May 2025" → 2025, used to group the projects timeline. */
export function endYear(period?: { en: string; fr: string }): number {
  const years = (period?.en ?? '').match(/\d{4}/g);
  return years?.length ? Number(years[years.length - 1]) : 0;
}

export const skillGroup = (id: string) => resume.skills.find((s) => s.id === id);

/** "Arabic (Native), French (Fluent), …" → [{ name, level }] */
export function languages(lang: 'en' | 'fr') {
  const raw = skillGroup('sk-lang')?.value?.[lang] ?? '';
  return raw
    .split(/,(?![^(]*\))/)
    .map((chunk) => chunk.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .map((chunk) => {
      const m = chunk.match(/^(.*?)\s*\((.*)\)$/);
      return m ? { name: m[1].trim(), level: m[2].trim() } : { name: chunk, level: '' };
    });
}

/** "Teamwork, Leadership, …" → ["Teamwork", "Leadership", …] */
export function softSkills(lang: 'en' | 'fr') {
  const raw = skillGroup('sk-soft')?.value?.[lang] ?? '';
  return raw.split(',').map((s) => s.trim().replace(/\.$/, '')).filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/*  Industrial visits                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The industrial-visit bullet lives inside the EMINES education entry as a
 * headed, non-inline bullet group. Pull it out so it can be rendered as its
 * own block instead of a nested list.
 */
export function industrialVisits(): { heading?: Loc; items: BulletItem[] } {
  for (const edu of resume.education) {
    const group = edu.bullets?.find((b) => b.inline === false && (b.items?.length ?? 0) > 0);
    if (group) return { heading: group.heading, items: group.items ?? [] };
  }
  return { items: [] };
}

/** Course chips — the inline bullet group on the same education entry. */
export function relevantCourses(): { heading?: Loc; items: BulletItem[] } {
  for (const edu of resume.education) {
    const group = edu.bullets?.find((b) => b.inline === true && (b.items?.length ?? 0) > 0);
    if (group) return { heading: group.heading, items: group.items ?? [] };
  }
  return { items: [] };
}

/**
 * "WELDOM : automated warehouse and flow management…" → { org, detail }
 * so the org name can be typeset differently from the description.
 */
export function splitVisit(text: string): { org: string; detail: string } {
  const m = text.match(/^\s*([^:]{1,40}?)\s*:\s*(.*)$/);
  return m ? { org: m[1].trim(), detail: m[2].trim() } : { org: text.trim(), detail: '' };
}

/* -------------------------------------------------------------------------- */
/*  Project documents                                                         */
/* -------------------------------------------------------------------------- */

export const ASSET_LABEL: Record<ProjectAsset['kind'], Loc> = {
  report: { en: 'Report', fr: 'Rapport' },
  presentation: { en: 'Presentation', fr: 'Présentation' },
  poster: { en: 'Poster', fr: 'Poster' },
  code: { en: 'Code', fr: 'Code' },
  link: { en: 'Link', fr: 'Lien' },
};

export function projectAssets(id: string): ProjectAsset[] {
  return (config.projectMeta?.[id]?.assets ?? []).filter((a) => a.url);
}
