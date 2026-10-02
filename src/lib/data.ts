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

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, fev: 2, mar: 3, apr: 4, avr: 4, may: 5, mai: 5, jun: 6, juin: 6,
  jul: 7, juil: 7, aug: 8, aou: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * "Feb. 2025 – May 2025" → { start: 202502, end: 202505 } (year × 100 + month).
 * A period with a single date uses it for both; no date at all gives zeros.
 */
export function periodRange(period?: { en: string; fr: string }): { start: number; end: number } {
  const text = (period?.en || period?.fr || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  const found: number[] = [];
  for (const m of text.matchAll(/([a-z]+)?\.?\s*(\d{4})/g)) {
    const word = m[1] ?? '';
    const key = Object.keys(MONTHS).sort((x, y) => y.length - x.length).find((k) => word.startsWith(k));
    found.push(Number(m[2]) * 100 + (key ? MONTHS[key] : 0));
  }
  if (!found.length) return { start: 0, end: 0 };
  return { start: found[0], end: found[found.length - 1] };
}

/**
 * Every project (CV + portfolio-only) in display order.
 *
 * `manual` follows `order.projects`, with anything missing from that list at
 * the end. `newest` / `oldest` sort by end date, then start date; undated
 * projects always go last, and ties keep their manual order.
 */
export function orderedProjects(cfg: PortfolioConfig = config): Project[] {
  const custom = (cfg.customProjects ?? []).map((p) => ({ ...p, custom: true }));
  const all = [...resume.projects, ...custom];
  const byId = new Map(all.map((p) => [p.id, p]));
  const manual = (cfg.order?.projects ?? []).map((id) => byId.get(id)).filter((p): p is Project => Boolean(p));
  for (const p of all) if (!manual.some((o) => o.id === p.id)) manual.push(p);

  const mode = cfg.order?.mode ?? 'manual';
  if (mode === 'manual') return manual;

  const dir = mode === 'newest' ? -1 : 1;
  return manual
    .map((p, i) => ({ p, i, r: periodRange(p.period) }))
    .sort((a, b) => {
      if (!a.r.end !== !b.r.end) return a.r.end ? -1 : 1; // undated last
      return dir * (a.r.end - b.r.end) || dir * (a.r.start - b.r.start) || a.i - b.i;
    })
    .map((x) => x.p);
}

/** Projects the admin panel has switched ON, in display order. */
export function visibleProjects(): Project[] {
  return orderedProjects().filter((p) => config.visibility?.projects?.[p.id] !== false);
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

/** Stable key for a language, derived from its English name. */
export const languageKey = (enName: string) =>
  enName.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');

/**
 * Languages in the display language, each carrying the stable key its
 * certificate is filed under — the FR and EN lists are parsed from different
 * strings, so position alone would not survive a language switch.
 */
export function languageEntries(lang: 'en' | 'fr') {
  const english = languages('en');
  return languages(lang).map((l, i) => ({
    ...l,
    key: languageKey(english[i]?.name ?? l.name),
    proof: config.languageProof?.[languageKey(english[i]?.name ?? l.name)],
  }));
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
