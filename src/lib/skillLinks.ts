import { visibleProjects, config } from './data';
import type { Project, SkillItem } from './types';

/**
 * Which projects used a given skill.
 *
 * Two sources, unioned:
 *   1. explicit ids curated in the admin panel (`skill.projects`)
 *   2. keyword matches against each project's title, tag, bullets and stack
 *
 * The auto-match means the links are useful the moment a skill is added, and
 * the explicit list covers everything the wording doesn't say out loud — a
 * project can use SAP without the word "SAP" appearing in its description.
 *
 * The aliases are deliberately conservative: this section makes factual claims
 * about the work, so "simulation" is not taken to mean Simul8, SQLite is not
 * MySQL, and Scilab is not MATLAB. Anything under-matched is one tick away in
 * the admin's Projects picker.
 */

/** Search terms per skill, keyed by the icon key, which is already semantic. */
const ALIASES: Record<string, string[]> = {
  python: ['python', 'optuna', 'pandas', 'numpy', 'scikit', 'tkinter', 'flet'],
  sap: ['sap', 's/4hana', 'erp'],
  powerbi: ['power bi', 'powerbi'],
  excel: ['excel', 'power query', 'tcd', 'pivot table'],
  msproject: ['ms project', 'gantt'],
  automation: ['power automate', 'rpa'],
  simulation: ['simul8', 'discrete event'],
  chartarea: ['@risk', 'monte carlo', 'monte-carlo'],
  mysql: ['mysql'],
  matlab: ['matlab'],
  solidworks: ['solidworks'],
  filecode: ['vba', 'macro'],
  java: ['java'],
  react: ['react'],
  laravel: ['laravel'],
  illustrator: ['illustrator'],
  arduino: ['arduino', 'processing'],
  lean: ['lean', 'vsm', 'ishikawa', 'sipoc', '5 whys', '5 pourquoi', 'value stream', 'kaizen', 'pce'],
  milp: [
    'milp',
    'mixed-integer',
    'nombres entiers',
    'linear programming',
    'programmation linéaire',
    'ordonnancement',
    'sequencing',
    'séquencement',
  ],
  ml: [
    'machine learning',
    'apprentissage',
    'random forest',
    'gradient boosting',
    'regression',
    'régression',
    'k-means',
    'classification',
    'svr',
    'clustering',
  ],
};

/** Everything searchable about a project, in both languages, lower-cased. */
function haystack(p: Project): string {
  const meta = config.projectMeta?.[p.id];
  const parts: string[] = [
    p.title?.en ?? '',
    p.title?.fr ?? '',
    p.tag?.en ?? '',
    p.tag?.fr ?? '',
    ...(meta?.stack ?? []),
    ...(p.bullets ?? []).flatMap((b) => [b.text?.en ?? '', b.text?.fr ?? '']),
  ];
  return parts.join(' \n ').toLowerCase();
}

/** Word-boundary test, so "java" never matches "javascript". */
function mentions(hay: string, term: string): boolean {
  const t = term.toLowerCase();
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // \b is unreliable next to symbols like "@risk" or "s/4hana"
  const pattern = /^[a-z0-9]+$/.test(t) ? `\\b${escaped}\\b` : escaped;
  return new RegExp(pattern, 'i').test(hay);
}

/** Terms to search for a skill: its icon aliases plus its own name. */
export function termsFor(skill: Pick<SkillItem, 'icon' | 'name'>): string[] {
  const own = (skill.name ?? '')
    .split(/[/,]/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 2);
  return [...new Set([...(ALIASES[skill.icon] ?? []), ...own])];
}

/** Project ids the text actually mentions this skill in. */
export function autoMatch(skill: Pick<SkillItem, 'icon' | 'name'>, projects = visibleProjects()): string[] {
  const terms = termsFor(skill);
  if (!terms.length) return [];
  return projects.filter((p) => terms.some((t) => mentions(haystack(p), t))).map((p) => p.id);
}

/** Explicit links ∪ auto-matched, in the site's project order. */
export function projectsForSkill(skill: SkillItem): Project[] {
  const projects = visibleProjects();
  const ids = new Set([...(skill.projects ?? []), ...autoMatch(skill, projects)]);
  return projects.filter((p) => ids.has(p.id));
}

/** How many projects each skill links to — used to hide dead-end skills. */
export function linkCounts(skills: SkillItem[]): Record<string, number> {
  const projects = visibleProjects();
  const out: Record<string, number> = {};
  for (const s of skills) {
    const ids = new Set([...(s.projects ?? []), ...autoMatch(s, projects)]);
    out[s.id] = ids.size;
  }
  return out;
}
