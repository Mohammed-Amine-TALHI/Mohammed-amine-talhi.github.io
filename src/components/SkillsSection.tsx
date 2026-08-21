import SectionHeading from './SectionHeading';
import SkillsPanel from './about/SkillsPanel';
import LanguagesPanel from './about/LanguagesPanel';
import { Anchor } from './About';
import { useLang } from '../lib/i18n';

/**
 * Toolbox and languages.
 *
 * Deliberately placed *after* Projects so the document order matches the
 * navbar: Experience → Education → Projects → Skills → Languages.
 */
export default function SkillsSection() {
  const { ui } = useLang();

  return (
    <section id="skills" className="relative scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading index="03" eyebrow={ui('skills.eyebrow')} title={ui('skills.title')} />

        <div className="space-y-24 sm:space-y-28">
          <SkillsPanel />

          <Anchor id="languages">
            <LanguagesPanel />
          </Anchor>
        </div>
      </div>
    </section>
  );
}
