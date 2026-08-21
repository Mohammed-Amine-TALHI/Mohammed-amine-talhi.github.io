import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { useLang } from '../lib/i18n';

/* Order matches the document, so the scroll-spy highlight moves forwards as
   the visitor scrolls rather than jumping around. */
const LINKS = [
  { href: '#experience', key: 'nav.experience' },
  { href: '#education', key: 'nav.education' },
  { href: '#projects', key: 'nav.projects' },
  { href: '#skills', key: 'nav.skills' },
  { href: '#leadership', key: 'nav.leadership' },
  { href: '#contact', key: 'nav.contact' },
] as const;

export default function Nav() {
  const { ui, lang, toggle } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('#experience');

  // thin progress bar across the very top of the viewport
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // highlight the section currently in the middle of the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(`#${e.target.id}`);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    LINKS.forEach(({ href }) => {
      const el = document.querySelector(href);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-accent-300 via-accent-500 to-accent-700"
      />

      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
          scrolled ? 'border-b border-line/70 bg-ink-950/80 backdrop-blur-xl' : 'border-b border-transparent'
        }`}
      >
        <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="#top" className="group flex items-center gap-2.5" aria-label="Home">
            <span className="relative inline-grid place-items-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-700 px-3 py-2 font-display text-sm font-bold text-ink-950">
              Portfolio
            <span className="absolute inset-0 rounded-xl bg-accent-500/40 blur-md transition-opacity duration-300 group-hover:opacity-100 md:opacity-0" />
            </span>
          </a>

          <div className="hidden items-center gap-0.5 lg:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`relative rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                  active === l.href ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {active === l.href && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-white/[0.06] ring-1 ring-white/[0.07]"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{ui(l.key)}</span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* FR / EN switch — the pill slides between the two labels */}
            <button
              onClick={toggle}
              className="relative flex h-9 items-center rounded-lg border border-line bg-ink-850/80 p-0.5 text-xs font-medium"
              aria-label="Toggle language"
            >
              {(['en', 'fr'] as const).map((l) => (
                <span key={l} className="relative z-10 w-9 text-center uppercase tracking-wide">
                  <span className={lang === l ? 'text-ink-950' : 'text-zinc-500'}>{l}</span>
                </span>
              ))}
              <motion.span
                className="absolute top-0.5 h-[30px] w-9 rounded-[7px] bg-gradient-to-br from-accent-300 to-accent-600"
                animate={{ x: lang === 'en' ? 2 : 38 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            </button>

            <button
              className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-ink-850/80 text-zinc-300 lg:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
            >
              {open ? <HiOutlineX size={18} /> : <HiOutlineMenu size={18} />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-line bg-ink-950/95 backdrop-blur-xl lg:hidden"
            >
              <div className="flex flex-col p-3">
                {LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-accent-400"
                  >
                    {ui(l.key)}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
