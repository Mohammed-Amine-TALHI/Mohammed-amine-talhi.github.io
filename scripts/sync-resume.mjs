/**
 * sync-resume.mjs
 * ----------------
 * Pulls the canonical CV data out of ResumeApp (data/master.json) and writes a
 * trimmed, portfolio-ready copy to src/data/resume.json.
 *
 * It also RECONCILES src/data/portfolio.config.json: any project / experience id
 * that appears in the resume but not yet in the config gets a default visibility
 * entry, and ids that no longer exist are pruned. Your admin choices are kept.
 *
 * Usage:  npm run sync
 *         RESUME_MASTER=/some/other/master.json npm run sync
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const MASTER =
  process.env.RESUME_MASTER || resolve(ROOT, '..', 'ResumeApp', 'data', 'master.json');
const RESUME_OUT = resolve(ROOT, 'src', 'data', 'resume.json');
const CONFIG_OUT = resolve(ROOT, 'src', 'data', 'portfolio.config.json');

if (!existsSync(MASTER)) {
  console.error(`\n  ✗ Could not find master.json at:\n    ${MASTER}\n`);
  console.error('  Point at it explicitly:  RESUME_MASTER="C:/path/to/master.json" npm run sync\n');
  process.exit(1);
}

const master = JSON.parse(readFileSync(MASTER, 'utf8'));

// Only carry over what the public site needs. letterTemplate / interviewScript
// are private job-hunting assets and are deliberately left behind.
const payload = {
  personal: master.personal,
  experiences: master.experiences ?? [],
  projects: master.projects ?? [],
  education: master.education ?? [],
  skills: master.skills ?? [],
};

// Keep the previous timestamp when nothing else moved. Stamping the clock on
// every run made `npm run publish` produce a commit even when there was nothing
// to publish.
let syncedAt = new Date().toISOString();
if (existsSync(RESUME_OUT)) {
  const previous = JSON.parse(readFileSync(RESUME_OUT, 'utf8'));
  const { syncedAt: previousStamp, ...previousPayload } = previous;
  if (JSON.stringify(previousPayload) === JSON.stringify(payload)) {
    syncedAt = previousStamp ?? syncedAt;
  }
}

const resume = { syncedAt, ...payload };
writeFileSync(RESUME_OUT, JSON.stringify(resume, null, 2) + '\n', 'utf8');

// ---- reconcile the admin config -------------------------------------------
const blankConfig = {
  profile: {
    photo: '/profile.jpg',
    resumeUrl: '',
    githubUrl: 'https://github.com/mohammed-amine-talhi',
    headline: { en: '', fr: '' },
    intro: { en: '', fr: '' },
  },
  contact: {
    displayName: '',
    email: '',
    emailAlt: '',
    phone: '',
    phoneAlt: '',
    location: { en: '', fr: '' },
    linkedinUrl: '',
    linkedinLabel: '',
    githubUrl: 'https://github.com/mohammed-amine-talhi',
    githubLabel: '@mohammed-amine-talhi',
  },
  cv: { en: null, fr: null },
  visits: { postUrl: '', postLabel: { en: '', fr: '' }, images: [], perVisit: {} },
  animation: {
    preset: 'balanced',
    speed: 1,
    nameEffect: 'stroke',
    backgroundBlooms: true,
    liquidEther: true,
    etherIntensity: 1,
    orbitDots: true,
    flowConsole: true,
    timelinePulse: true,
    hoverLift: true,
    scrollReveal: true,
  },
  visibility: { projects: {}, experiences: {} },
  order: { projects: [] },
  projectMeta: {},
  customProjects: [],
  leadership: [],
  skills: [],
  languageProof: {},
};

/** Seeded once, then owned by the admin panel's Skills tab. */
const DEFAULT_SKILLS = [
  ['Python', 'python', 'data'],
  ['SAP S/4HANA', 'sap', 'scm'],
  ['Power BI', 'powerbi', 'data'],
  ['Advanced Excel', 'excel', 'data'],
  ['MS Project', 'msproject', 'scm'],
  ['Power Automate', 'automation', 'scm'],
  ['Simul8', 'simulation', 'scm'],
  ['@Risk', 'chartarea', 'data'],
  ['MySQL', 'mysql', 'dev'],
  ['MATLAB', 'matlab', 'data'],
  ['SolidWorks', 'solidworks', 'cad'],
  ['VBA', 'filecode', 'dev'],
  ['Java', 'java', 'dev'],
  ['React', 'react', 'dev'],
  ['Laravel', 'laravel', 'dev'],
  ['Illustrator', 'illustrator', 'cad'],
  ['Arduino', 'arduino', 'cad'],
  ['Lean / VSM', 'lean', 'scm'],
  ['MILP / OR', 'milp', 'scm'],
  ['Machine Learning', 'ml', 'data'],
].map(([name, icon, family], i) => ({ id: `sk-${i}-${icon}`, name, icon, family }));

const config = existsSync(CONFIG_OUT)
  ? { ...blankConfig, ...JSON.parse(readFileSync(CONFIG_OUT, 'utf8')) }
  : blankConfig;

config.visibility ??= { projects: {}, experiences: {} };
config.visibility.projects ??= {};
config.visibility.experiences ??= {};
config.order ??= { projects: [] };
config.order.projects ??= [];

// fill in any block added by a later version of this script, without
// disturbing values the admin panel has already written
config.contact = { ...blankConfig.contact, ...(config.contact ?? {}) };
config.cv = { ...blankConfig.cv, ...(config.cv ?? {}) };
config.visits = { ...blankConfig.visits, ...(config.visits ?? {}) };
config.visits.perVisit ??= {};
config.visits.images ??= [];
config.animation = { ...blankConfig.animation, ...(config.animation ?? {}) };

// seed the toolbox the first time; afterwards the admin owns it
if (!Array.isArray(config.skills) || config.skills.length === 0) config.skills = DEFAULT_SKILLS;
config.languageProof ??= {};

// seed contact details from the CV the first time round
const p = resume.personal;
config.contact.displayName ||= p.name;
config.contact.email ||= p.emails?.[0] ?? p.email ?? '';
config.contact.emailAlt ||= p.emails?.[1] ?? '';
config.contact.phone ||= p.phones?.[0] ?? '';
config.contact.phoneAlt ||= p.phones?.[1] ?? '';
config.contact.linkedinUrl ||= p.linkedinUrl ?? '';
config.contact.linkedinLabel ||= p.linkedin ?? '';
if (!config.contact.location.en) config.contact.location = { en: 'Ben Guerir, Morocco', fr: 'Ben Guerir, Maroc' };

// migrate the old flat `links` array on a project into typed assets
for (const [id, meta] of Object.entries(config.projectMeta ?? {})) {
  if (Array.isArray(meta.links) && meta.links.length && !meta.assets) {
    meta.assets = meta.links.map((l, i) => ({
      id: `asset-${id}-${i}`,
      kind: 'link',
      label: { en: l.label ?? '', fr: l.label ?? '' },
      url: l.url ?? '',
    }));
  }
  delete meta.links;
}

let added = 0;
let pruned = 0;

const reconcile = (items, map) => {
  const ids = new Set(items.map((i) => i.id));
  for (const id of ids) {
    if (!(id in map)) {
      map[id] = true; // new entries are visible by default
      added++;
    }
  }
  for (const id of Object.keys(map)) {
    if (!ids.has(id)) {
      delete map[id];
      pruned++;
    }
  }
  return ids;
};

const projectIds = reconcile(resume.projects, config.visibility.projects);
reconcile(resume.experiences, config.visibility.experiences);

// keep the manual ordering list clean: drop dead ids, append new ones
config.order.projects = config.order.projects.filter((id) => projectIds.has(id));
for (const p of resume.projects) {
  if (!config.order.projects.includes(p.id)) config.order.projects.push(p.id);
}

writeFileSync(CONFIG_OUT, JSON.stringify(config, null, 2) + '\n', 'utf8');

console.log(`
  ✓ resume.json   ${resume.projects.length} projects · ${resume.experiences.length} experiences · ${resume.education.length} education · ${resume.skills.length} skill groups
  ✓ config        ${added} new id(s) added, ${pruned} stale id(s) pruned
    source: ${MASTER}
`);
