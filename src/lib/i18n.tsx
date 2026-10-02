import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Lang, Loc } from './types';

/* ---------------------------------------------------------------------------
   UI chrome strings. Everything that is NOT resume data lives here.
   Resume data is already bilingual and is resolved with `t(loc)`.
--------------------------------------------------------------------------- */
const UI = {
  'nav.about': { en: 'About', fr: 'À propos' },
  'nav.experience': { en: 'Experience', fr: 'Expérience' },
  'nav.education': { en: 'Education', fr: 'Formation' },
  'nav.projects': { en: 'Projects', fr: 'Projets' },
  'nav.skills': { en: 'Skills', fr: 'Compétences' },
  'nav.languages': { en: 'Languages', fr: 'Langues' },
  'nav.graduation': { en: 'Ceremony', fr: 'Cérémonie' },
  'nav.leadership': { en: 'Leadership', fr: 'Engagement' },
  'nav.contact': { en: 'Contact', fr: 'Contact' },

  'hero.role': { en: 'Supply Chain Engineer', fr: 'Ingénieur Supply Chain' },
  'hero.school': { en: 'EMINES – UM6P graduate', fr: 'Diplômé EMINES – UM6P' },
  'hero.cta.work': { en: 'See my work', fr: 'Voir mes travaux' },
  'hero.cta.contact': { en: 'Get in touch', fr: 'Me contacter' },
  'hero.scroll': { en: 'Scroll', fr: 'Défiler' },

  'about.eyebrow': { en: 'About me', fr: 'À propos de moi' },
  'about.title': { en: 'From shop-floor data to decision', fr: 'De la donnée terrain à la décision' },
  'skills.eyebrow': { en: 'What I work with', fr: 'Mes outils' },
  'skills.title': { en: 'Toolbox & Languages', fr: 'Compétences & Langues' },

  'countries.hint': { en: 'Hover to explore', fr: 'Survolez pour explorer' },
  'countries.morocco': { en: 'Morocco', fr: 'Maroc' },
  'countries.brazil': { en: 'Brazil', fr: 'Brésil' },
  'countries.france': { en: 'France', fr: 'France' },
  'countries.moroccoWhere': { en: 'OCP Group · EMINES — Ben Guerir', fr: 'OCP Group · EMINES — Ben Guerir' },
  'countries.brazilWhere': { en: 'LAMMOC — Rio de Janeiro', fr: 'LAMMOC — Rio de Janeiro' },
  'countries.franceWhere': { en: '6 industrial sites visited', fr: '6 sites industriels visités' },
  'about.skills': { en: 'Toolbox', fr: 'Boîte à outils' },
  'about.skillsHint': { en: 'Click an icon', fr: 'Cliquez une icône' },
  'skills.usedIn': { en: 'projects', fr: 'projets' },
  'skills.noProjects': {
    en: 'No project references this one yet.',
    fr: 'Aucun projet ne référence encore cette compétence.',
  },
  'about.experience': { en: 'Experience', fr: 'Expérience' },
  'about.education': { en: 'Education', fr: 'Formation' },
  'about.languages': { en: 'Languages', fr: 'Langues' },
  'languages.certificate': { en: 'Certificate', fr: 'Attestation' },
  'about.downloadCv': { en: 'Download CV', fr: 'Télécharger le CV' },

  'projects.eyebrow': { en: 'Selected work', fr: 'Travaux sélectionnés' },
  'projects.title': { en: 'Projects', fr: 'Projets' },
  'projects.all': { en: 'All', fr: 'Tous' },
  'projects.empty': { en: 'No projects match this filter.', fr: 'Aucun projet ne correspond à ce filtre.' },
  'projects.count': { en: 'projects', fr: 'projets' },
  'projects.showMore': { en: 'Show all projects', fr: 'Voir tous les projets' },
  'projects.showLess': { en: 'Show fewer', fr: 'Réduire' },

  'leadership.eyebrow': { en: 'Beyond the desk', fr: 'Au-delà du bureau' },
  'leadership.title': { en: 'Leadership & Student Life', fr: 'Engagement & Vie associative' },
  'leadership.empty': {
    en: 'Add your clubs, basketball and student-life photos from the local admin panel.',
    fr: 'Ajoutez vos clubs, le basketball et vos photos de vie associative depuis le panneau admin local.',
  },

  'graduation.eyebrow': { en: 'Graduation ceremony', fr: 'Cérémonie de remise des diplômes' },
  'graduation.title': { en: 'Graduation — Engineer, EMINES – UM6P', fr: 'Diplôme — Ingénieur, EMINES – UM6P' },
  'graduation.post': { en: 'Read the LinkedIn post', fr: 'Lire le post LinkedIn' },
  'graduation.soon': { en: 'LinkedIn post coming soon', fr: 'Post LinkedIn à venir' },
  'graduation.photos': { en: 'photos', fr: 'photos' },

  'contact.eyebrow': { en: 'Contact', fr: 'Contact' },
  'contact.title': { en: "Let's talk", fr: 'Discutons' },
  'contact.blurb': {
    en: 'Open to supply chain, planning and operational excellence roles with real impact on the ground. Always happy to talk about optimization, Lean or a good basketball game.',
    fr: "Ouvert aux postes en supply chain, planification et excellence opérationnelle à fort impact terrain. Toujours partant pour parler optimisation, Lean ou d'un bon match de basket.",
  },
  'contact.email': { en: 'Email me', fr: 'M’écrire' },
  'cv.title': { en: 'Curriculum Vitae', fr: 'Curriculum Vitae' },
  'cv.blurb': { en: 'Download in your language', fr: 'Téléchargez dans votre langue' },
  'cv.updated': { en: 'updated', fr: 'mis à jour le' },

  'visits.title': { en: 'Industrial Visits', fr: 'Visites Industrielles' },
  'visits.blurb': {
    en: 'A week across French logistics sites with EMINES.',
    fr: 'Une semaine sur les sites logistiques français avec EMINES.',
  },
  'visits.post': { en: 'Read the EMINES post', fr: 'Lire le post EMINES' },
  'visits.courses': { en: 'Relevant courses', fr: 'Cours pertinents' },

  'assets.open': { en: 'Open', fr: 'Ouvrir' },
  'doc.download': { en: 'Download', fr: 'Télécharger' },
  'doc.openTab': { en: 'Open in a tab', fr: 'Ouvrir dans un onglet' },
  'doc.noPreview': {
    en: 'This format can’t be previewed in the browser. Download it to open it.',
    fr: 'Ce format ne peut pas être prévisualisé dans le navigateur. Téléchargez-le pour l’ouvrir.',
  },
  'cv.view': { en: 'View CV', fr: 'Voir le CV' },

  'footer.built': { en: 'Built with React, Tailwind & Framer Motion', fr: 'Conçu avec React, Tailwind & Framer Motion' },
} satisfies Record<string, Loc>;

type UIKey = keyof typeof UI;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  /** resolve a bilingual resume field */
  t: (loc?: Loc | null) => string;
  /** resolve a UI chrome string */
  ui: (key: UIKey) => string;
}

/** Any of the browser's preferred languages starts with "fr". */
function browserIsFrench(): boolean {
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  return list.some((l) => (l || '').toLowerCase().startsWith('fr'));
}

const LangContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'portfolio.lang';

export function LangProvider({ children }: { children: ReactNode }) {
  /** Did the visitor pick a language themselves (now or on an earlier visit)? */
  const chosen = useRef<boolean>(false);

  const [lang, setLangState] = useState<Lang>(() => {
    // 1. a visitor who already used the switch keeps their choice
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'fr') {
      chosen.current = true;
      return saved;
    }
    // 2. otherwise a French browser gets French, any other gets English
    return browserIsFrench() ? 'fr' : 'en';
  });

  /** An explicit choice: remember it, and stop auto-detecting from then on. */
  const setLang = (next: Lang | ((l: Lang) => Lang)) => {
    chosen.current = true;
    setLangState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      localStorage.setItem(STORAGE_KEY, value);
      return value;
    });
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang((l) => (l === 'en' ? 'fr' : 'en')),
      t: (loc) => (loc ? (loc[lang] || loc.en || loc.fr || '') : ''),
      ui: (key) => UI[key][lang],
    }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
