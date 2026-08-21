import type { ReactNode } from 'react';
import SectionHeading from './SectionHeading';
import ProfileCard from './about/ProfileCard';
import ExperienceTimeline from './about/ExperienceTimeline';
import EducationPanel from './about/EducationPanel';
import VisitsPanel from './about/VisitsPanel';
import { useLang } from '../lib/i18n';

/**
 * Anchor target for a nav link.
 *
 * `scroll-mt` clears the fixed navbar so a jumped-to block isn't hidden behind
 * it, and the id is what <Nav /> observes for the active-link highlight.
 */
export function Anchor({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24">
      {children}
    </div>
  );
}

/**
 * "About" — profile, experience, education and the industrial visits.
 *
 * Skills and languages live in <SkillsSection /> *after* Projects, so the
 * document order matches the navbar: Experience → Education → Projects →
 * Skills → Languages.
 */
export default function About() {
  const { ui } = useLang();

  return (
    <section id="about" className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading index="01" eyebrow={ui('about.eyebrow')} title={ui('about.title')} />

        <div className="space-y-24 sm:space-y-28">
          <ProfileCard />

          <Anchor id="experience">
            <ExperienceTimeline />
          </Anchor>

          <Anchor id="education">
            <EducationPanel />
          </Anchor>

          <Anchor id="visits">
            <VisitsPanel />
          </Anchor>
        </div>
      </div>
    </section>
  );
}
