import { motion, type Variants } from 'framer-motion';
import { HiArrowDown, HiOutlineMail, HiOutlineDownload } from 'react-icons/hi';
import { FaLinkedinIn, FaGithub } from 'react-icons/fa6';
import { useLang } from '../lib/i18n';
import { contact, config } from '../lib/data';
import { dur, on } from '../lib/anim';
import HeroName from './HeroName';
import { CountUp, Magnet, ClickSpark } from './reactbits';
import CountriesStat from './CountriesStat';
import { asset } from '../lib/asset';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function Hero() {
  const { ui, t, lang } = useLang();
  const reveal = on('scrollReveal');

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
        {/* availability pill with a live pulsing dot */}
        <motion.div
          variants={item}
          className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accent-500/25 bg-accent-500/[0.07] py-1.5 pl-2 pr-4"
        >
          <span className="relative flex h-2 w-2">
            {on('backgroundBlooms') && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-400" />
          </span>
          <span className="text-xs font-medium tracking-wide text-accent-300">{ui('hero.available')}</span>
        </motion.div>

        <motion.p variants={item} className="mb-3 font-mono text-sm text-zinc-500">
          {ui('hero.role')} · EMINES – UM6P
        </motion.p>

        {/* full name, single line, centred */}
        <div className="w-full">
          <HeroName name={contact.displayName} />
        </div>

        <motion.p variants={item} className="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          {t(config.profile.headline)}
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {/* React Bits Magnet + ClickSpark on the primary call to action */}
          <Magnet strength={0.2}>
            <ClickSpark>
              <a
                href="#projects"
                className="group relative block overflow-hidden rounded-xl bg-gradient-to-r from-accent-400 to-accent-600 px-6 py-3.5 text-sm font-semibold text-ink-950"
              >
                <span className="relative z-10">{ui('hero.cta.work')}</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </a>
            </ClickSpark>
          </Magnet>
          <a
            href="#contact"
            className="rounded-xl border border-line bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-accent-500/40 hover:text-accent-300"
          >
            {ui('hero.cta.contact')}
          </a>

          {/* CV in the current site language only */}
          {cvFile && (
            <a
              href={asset(cvFile.url)}
              download
              className="group flex items-center gap-2 rounded-xl border border-accent-500/30 bg-accent-500/[0.07] px-4 py-3.5 text-sm font-medium text-accent-300 transition-colors hover:bg-accent-500/[0.15]"
            >
              <HiOutlineDownload size={15} className="transition-transform group-hover:translate-y-0.5" />
              {ui('about.downloadCv')}
            </a>
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
                  className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white/[0.03] text-zinc-400 transition-all hover:-translate-y-0.5 hover:border-accent-500/40 hover:text-accent-400"
                >
                  <Icon size={16} />
                </a>
              ))}
          </div>
        </motion.div>

        {/* three headline numbers, pulled from the real CV */}
        <motion.div
          variants={item}
          className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-px rounded-2xl border border-line bg-line [&>*:first-child]:rounded-l-2xl [&>*:last-child]:rounded-r-2xl"
        >
          {/* projects */}
          <div className="bg-ink-900/80 px-4 py-5 backdrop-blur-sm">
            <CountUp to={13} duration={1.6} className="font-display text-2xl font-bold text-zinc-100 sm:text-3xl" />
            <div className="mt-1 text-xs text-zinc-500">{lang === 'fr' ? 'Projets' : 'Projects'}</div>
          </div>

          {/* countries — hover to list them, click to jump to the evidence */}
          <CountriesStat label={lang === 'fr' ? 'Pays' : 'Countries'} />

          {/* TOEIC */}
          <div className="bg-ink-900/80 px-4 py-5 backdrop-blur-sm">
            <CountUp to={900} duration={1.6} className="font-display text-2xl font-bold text-zinc-100 sm:text-3xl" />
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
