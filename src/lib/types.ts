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
  /** channels switched off in the admin without clearing their value */
  hidden?: Partial<Record<ContactChannel, boolean>>;
}

export type ContactChannel = 'email' | 'emailAlt' | 'phone' | 'phoneAlt' | 'linkedin' | 'github';

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

/** A demo video attached to a project, played in a pop-up. */
export interface ProjectVideo {
  id: string;
  /** an MP4 under /videos/ */
  url: string;
  /** still frame shown behind the play button */
  poster?: string;
  label: Loc;
  /** open with the sound off */
  muted?: boolean;
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
  /** demo videos, shown above the photo gallery */
  videos?: ProjectVideo[];
}

/** A headline number for a leadership role, e.g. "150 000 MAD" / "sponsoring secured". */
export interface LeadershipKpi {
  value: string;
  label: Loc;
}

/** One organised event inside a leadership role — a trip, a competition, a party. */
export interface LeadershipEvent {
  id: string;
  title: Loc;
  place: Loc;
  date: Loc;
  /** headcount, kept as a string so "95" and "~100" both work */
  people?: string;
  description: Loc;
  /** short chips: "Surf", "Hiking", "3 days" */
  highlights: string[];
  images: string[];
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
  /** headline numbers shown under the story */
  kpis?: LeadershipKpi[];
  /** the big events, shown as one expandable box in the journal */
  events?: LeadershipEvent[];
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
  /** hand-drawn supply-chain / ERP schemas floating behind the page */
  sketches: boolean;
  /** slow drift of the sketches (off = they sit still) */
  sketchDrift: boolean;
  /** how visible the sketches are, 0.2 (barely there) .. 1.5 (bold) */
  sketchOpacity: number;
  /** which schemas are drawn — missing keys default to on */
  sketchSet: Partial<Record<SketchId, boolean>>;
}

/** The pencil sketches available for the background. */
export type SketchId = 'vsm' | 'ishikawa' | 'erp' | 'process' | 'dmaic' | 'gantt' | 'kanban' | 'network';

/** Headings the admin can re-word, in page order. */
export type SectionKey = 'hero' | 'about' | 'visits' | 'projects' | 'skills' | 'graduation' | 'leadership' | 'contact';

export type TitleSize = 'sm' | 'md' | 'lg' | 'xl';

/** Override for one section's texts; empty fields fall back to the built-in wording. */
export interface SectionText {
  eyebrow?: Loc;
  title?: Loc;
  /** intro line / paragraph, where the section has one */
  blurb?: Loc;
  size?: TitleSize;
  /** shrink the title to fit rather than wrapping */
  oneLine?: boolean;
}

/** Named colour palettes; `custom` uses the two hexes below. */
export type PaletteId = 'brand' | 'classic' | 'custom';

/** Light (default) or dark, plus whether visitors get the switch at all. */
export interface ThemeSettings {
  default: 'light' | 'dark';
  /** show the sun/moon toggle at the bottom-right of the site */
  toggle: boolean;
  /** which colours: brand = UM6P orange + EMINES navy, classic = the original amber on black */
  palette?: PaletteId;
  /** the two hues used when palette is `custom` */
  accent?: string;
  brand?: string;
  /** dark-background family for a custom palette (legacy — `tint` supersedes it) */
  ink?: 'navy' | 'neutral';
  /** how strongly the dark theme is tinted with the brand colour, 0 (neutral black) .. 1 (full) */
  tint?: number;
}

/** The graduation block: photos, a caption and the LinkedIn post link. */
export interface GraduationConfig {
  enabled: boolean;
  title: Loc;
  caption: Loc;
  /** e.g. "September 2026" */
  date: Loc;
  images: string[];
  /** the LinkedIn post about the graduation — empty until it is published */
  postUrl: string;
  postLabel: Loc;
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
    /** the school logo shown in the hero, under /logos/ */
    schoolLogo?: string;
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
  theme: ThemeSettings;
  graduation: GraduationConfig;
  /** per-section heading overrides, edited in the admin's Sections tab */
  sections?: Partial<Record<SectionKey, SectionText>>;
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
  /**
   * Framing for individual photos, keyed by their URL. Galleries are arrays of
   * URLs with no per-item record of their own, so the crop lives here and
   * applies wherever that photo is shown.
   */
  crops: Record<string, { x: number; y: number; zoom: number }>;
}
