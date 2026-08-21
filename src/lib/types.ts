/** Every user-facing string in the resume data is bilingual. */
export type Loc = { en: string; fr: string };

export type Lang = 'en' | 'fr';

export interface BulletItem {
  id: string;
  text: Loc;
  location?: Loc;
}

export interface Bullet {
  id: string;
  text: Loc;
  heading?: Loc;
  items?: BulletItem[];
  inline?: boolean;
}

export interface Experience {
  id: string;
  role: Loc;
  org: Loc;
  location: Loc;
  period: Loc;
  bullets: Bullet[];
}

export interface Project {
  id: string;
  title: Loc;
  tag: Loc;
  period: Loc;
  bullets: Bullet[];
  /** present only on projects created in the admin panel */
  custom?: boolean;
}

export interface Education {
  id: string;
  school: Loc;
  degree: Loc;
  location: Loc;
  period: Loc;
  bullets: Bullet[];
}

export interface SkillGroup {
  id: string;
  label: Loc;
  value: Loc;
}

export interface Resume {
  syncedAt: string;
  personal: {
    name: string;
    email: string;
    emails: string[];
    phone: Loc;
    phones: string[];
    linkedin: string;
    linkedinUrl: string;
    summaries: { id: string; label: string; text: Loc }[];
  };
  experiences: Experience[];
  projects: Project[];
  education: Education[];
  skills: SkillGroup[];
}

/* -------------------------------------------------------------------------- */
/*  Admin-owned configuration                                                 */
/* -------------------------------------------------------------------------- */

/** Contact details shown on the site. Seeded from the CV, editable in admin. */
export interface ContactInfo {
  displayName: string;
  email: string;
  emailAlt: string;
  phone: string;
  phoneAlt: string;
  location: Loc;
  linkedinUrl: string;
  linkedinLabel: string;
  githubUrl: string;
  githubLabel: string;
}

/** What kind of document is attached to a project — drives its icon and colour. */
export type AssetKind = 'report' | 'presentation' | 'poster' | 'code' | 'link';

export interface ProjectAsset {
  id: string;
  kind: AssetKind;
  /** optional custom label; falls back to the kind's default wording */
  label: Loc;
  /** either an uploaded file under /docs/ or an external URL */
  url: string;
}

export interface ProjectMeta {
  featured?: boolean;
  cover?: string;
  /** manual framing for the cover image */
  coverCrop?: { x: number; y: number; zoom: number };
  /** photos of the work itself, shown in the project's journal view */
  gallery?: string[];
  stack?: string[];
  assets?: ProjectAsset[];
}

export interface LeadershipEntry {
  id: string;
  title: Loc;
  role: Loc;
  period: Loc;
  description: Loc;
  images: string[];
  tags: string[];
  /** reports, posters, decks and links — same shape as a project's */
  assets?: ProjectAsset[];
  /** how the cover photo is framed on the card */
  imageFit?: 'cover' | 'contain';
  /** manual framing: focal point in percent plus a zoom factor */
  imageCrop?: { x: number; y: number; zoom: number };
  /** superseded by imageCrop; still read so older entries keep their framing */
  imagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  /** amber | sky | emerald | violet | rose — tints the card */
  accent?: string;
}

/** A downloadable CV, one per language. */
export interface CvFile {
  url: string;
  /** ISO date the file was uploaded, shown as "updated …" */
  updated: string;
}

/** Extra material attached to one industrial visit from the CV. */
export interface VisitMeta {
  images?: string[];
  url?: string;
}

export interface VisitsConfig {
  /** headline link — the EMINES post covering the visit week */
  postUrl: string;
  postLabel: Loc;
  /** photos from the trip, shown as a strip above the visit list */
  images: string[];
  /** per-visit extras, keyed by the bullet-item id from resume.json */
  perVisit: Record<string, VisitMeta>;
}

/** Named animation presets offered in the admin's Animations tab. */
export type AnimationPreset = 'subtle' | 'balanced' | 'showcase' | 'off';

/** How the name in the hero animates in. */
export type NameEffect = 'stroke' | 'shine' | 'reveal' | 'typewriter' | 'none';

export interface AnimationSettings {
  preset: AnimationPreset;
  /** global multiplier: 0.5 = twice as fast, 2 = half speed */
  speed: number;
  nameEffect: NameEffect;
  backgroundBlooms: boolean;
  liquidEther: boolean;
  /** brightness of the ether, 0.3 (barely there) .. 2 (vivid) */
  etherIntensity: number;
  orbitDots: boolean;
  flowConsole: boolean;
  timelinePulse: boolean;
  hoverLift: boolean;
  scrollReveal: boolean;
}

/** The four colour-coded families a skill can belong to. */
export type SkillFamily = 'data' | 'scm' | 'dev' | 'cad';

/** One icon in the About "toolbox" grid. `icon` is a key into iconRegistry. */
export interface SkillItem {
  id: string;
  name: string;
  icon: string;
  family: SkillFamily;
  /** project ids linked by hand in the admin, on top of the automatic matches */
  projects?: string[];
  /** a report, certificate or deck evidencing this skill */
  assets?: ProjectAsset[];
}

/** Proof attached to a language: a certificate scan and/or a PDF. */
export interface LanguageProof {
  images: string[];
  assets: ProjectAsset[];
  /** short badge shown on the card, e.g. "TOEIC 900" or "DELF B2" */
  label: string;
}

export interface PortfolioConfig {
  profile: {
    photo: string;
    /** manual framing for the portrait */
    photoCrop?: { x: number; y: number; zoom: number };
    /** legacy single-file CV link; the bilingual `cv` block supersedes it */
    resumeUrl: string;
    githubUrl: string;
    headline: Loc;
    intro: Loc;
  };
  contact: ContactInfo;
  cv: { en: CvFile | null; fr: CvFile | null };
  visits: VisitsConfig;
  animation: AnimationSettings;
  visibility: {
    projects: Record<string, boolean>;
    experiences: Record<string, boolean>;
  };
  order: { projects: string[] };
  projectMeta: Record<string, ProjectMeta>;
  customProjects: Project[];
  leadership: LeadershipEntry[];
  skills: SkillItem[];
  /** keyed by the English language name, so it survives the FR/EN switch */
  languageProof: Record<string, LanguageProof>;
}
