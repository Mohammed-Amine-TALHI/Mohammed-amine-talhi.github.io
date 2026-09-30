import { motion, type Variants } from 'framer-motion';
import { HiArrowDown, HiOutlineMail, HiOutlineEye } from 'react-icons/hi';
import { FaLinkedinIn, FaGithub } from 'react-icons/fa6';
import { useLang } from '../lib/i18n';
import { contact, config } from '../lib/data';
import { dur, on } from '../lib/anim';
import HeroName from './HeroName';
import { CountUp, Magnet, ClickSpark } from './reactbits';
import CountriesStat from './CountriesStat';
import { downloadName } from '../lib/asset';
import { useDocViewer } from './DocViewer';
import SafeImage from './SafeImage';
import { pick, sectionText } from '../lib/sections';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function Hero() {
  const { ui, t, lang } = useLang();
  const reveal = on('scrollReveal');
  const { open: openDoc } = useDocViewer();

  // only the CV matching the language the site is currently displayed in
  const cvFile = config.cv?.[lang]?.url ? config.cv[lang] : null;

  return (
    <section id="top" className="relative flex min-h-screen items-center px-5 pt-24 sm:px-8">
      <motion.div
        variants={container}
        initial={reveal ? 'hidden' : false}
        animate="show"
        className="mx-auto flex w-full max-w-6xl flex-col items-center text-center"
      >
        {/* school lockup: the EMINES – UM6P logo on a paper plate, then the title */}
        <motion.div variants={item} className="mb-7 flex flex-col items-center gap-4">
          {config.profile.schoolLogo && (
            <a
              href="https://www.emines-ingenieur.org"
              target="_blank"
              rel="noreferrer"
              aria-label="EMINES – UM6P"
              className="logo-plate group transition-transform duration-300 hover:-translate-y-0.5"
            >
              <SafeImage
                src={config.profile.schoolLogo}
                alt="EMINES – School of Industrial Management, UM6P"
                className="h-14 w-auto max-w-[min(82vw,24rem)] object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.12)] sm:h-16"
              />
            </a>
          )}
          <p className="font-mono text-sm text-zinc-500">
            {pick(lang, sectionText('hero').eyebrow, `${ui('hero.role')} · ${ui('hero.school')}`)}
          </p>
        </motion.div>

        {/* full name, single line, centred */}
        <div className="w-full">
          <HeroName name={contact.displayName} />
        </div>

        <motion.p variants={item} className="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          {pick(lang, sectionText('hero').blurb, t(config.profile.headline))}
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {/* React Bits Magnet + ClickSpark on the primary call to action */}
          <Magnet strength={0.2}>
            <ClickSpark>
              <a
                href="#projects"
                className="btn-primary group block rounded-xl px-7 py-3.5 text-sm font-semibold"
              >
                <span className="relative z-10">{ui('hero.cta.work')}</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[color:var(--on-accent)]/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </a>
            </ClickSpark>
          </Magnet>
          <a
            href="#contact"
            className="btn-secondary rounded-xl px-6 py-3.5 text-sm font-semibold text-zinc-200 hover:text-accent-400"
          >
            {ui('hero.cta.contact')}
          </a>

          {/* CV in the current site language — opens the viewer rather than
              dropping a file into the visitor's Downloads unasked */}
          {cvFile && (
            <button
              onClick={() =>
                openDoc({
                  url: cvFile.url,
                  title: 'CV — ' + contact.displayName,
                  downloadAs: downloadName('CV', contact.displayName, lang.toUpperCase(), cvFile.url),
                })
              }
              className="btn-secondary group flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-accent-400 hover:text-accent-500"
            >
              <HiOutlineEye size={15} />
              {ui('cv.view')}
            </button>
          )}

          <div className="ml-1 flex items-center gap-2">
            {[
              { href: contact.linkedinUrl, Icon: FaLinkedinIn, label: 'LinkedIn' },
              { href: contact.githubUrl, Icon: FaGithub, label: 'GitHub' },
              { href: `mailto:${contact.email}`, Icon: HiOutlineMail, label: 'Email' },
            ]
              .filter((l) => l.href)
              .map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noreferrer"
                  aria-label={label}
                  className="btn-secondary grid h-12 w-12 place-items-center rounded-xl text-zinc-300 hover:text-accent-500"
                >
                  <Icon size={16} />
                </a>
              ))}
          </div>
        </motion.div>

        {/* three headline numbers, pulled from the real CV */}
        <motion.div
          variants={item}
          className="card-pop mt-16 grid w-full max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line [&>*:first-child]:rounded-l-2xl [&>*:last-child]:rounded-r-2xl"
        >
          {/* projects */}
          <div className="bg-ink-900/80 px-4 py-5 backdrop-blur-sm">
            <CountUp to={13} duration={1.6} className="text-gradient font-display text-3xl font-extrabold sm:text-4xl" />
            <div className="mt-1 text-xs text-zinc-500">{lang === 'fr' ? 'Projets' : 'Projects'}</div>
          </div>

          {/* countries — hover to list them, click to jump to the evidence */}
          <CountriesStat label={lang === 'fr' ? 'Pays' : 'Countries'} />

          {/* TOEIC */}
          <div className="bg-ink-900/80 px-4 py-5 backdrop-blur-sm">
            <CountUp to={900} duration={1.6} className="text-gradient font-display text-3xl font-extrabold sm:text-4xl" />
            <div className="mt-1 text-xs text-zinc-500">{lang === 'fr' ? 'Score TOEIC' : 'TOEIC score'}</div>
          </div>
        </motion.div>
      </motion.div>

      <motion.a
        href="#about"
        aria-label={ui('hero.scroll')}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-zinc-600 transition-colors hover:text-accent-500 [@media(min-height:820px)]:flex"
        animate={on('backgroundBlooms') ? { y: [0, 8, 0] } : undefined}
        transition={{ duration: dur(2), repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.25em]">{ui('hero.scroll')}</span>
        <HiArrowDown size={14} />
      </motion.a>
    </section>
  );
}
