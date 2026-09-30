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
  { href: '#graduation', key: 'nav.graduation' },
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
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-accent-500"
      />

      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
          scrolled ? 'border-b border-line bg-ink-950/85 shadow-[0_1px_0_0_var(--color-line)] backdrop-blur-xl' : 'border-b border-transparent'
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          {/* plain wordmark — navy on the white theme, orange on the dark one */}
          <a href="#top" className="group flex items-baseline gap-2" aria-label="Home">
            <span className="brand-name font-display text-[15px] font-bold tracking-[-0.02em]">
              TALHI Mohammed Amine
            </span>
            <span className="h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-accent-500 transition-transform duration-300 group-hover:scale-125" />
          </a>

          <div className="hidden items-center gap-0.5 lg:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`relative px-3 py-2 text-[13px] font-medium transition-colors ${
                  active === l.href ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                <span className="relative">{ui(l.key)}</span>
                {active === l.href && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-accent-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* FR / EN switch — the pill slides between the two labels */}
            <button
              onClick={toggle}
              className="relative flex h-8 items-center rounded-full border border-line bg-ink-900/70 p-0.5 text-[11px] font-semibold"
              aria-label="Toggle language"
            >
              {(['en', 'fr'] as const).map((l) => (
                <span key={l} className="relative z-10 w-8 text-center uppercase tracking-wide">
                  <span className={lang === l ? 'text-[color:var(--on-accent)]' : 'text-zinc-500'}>{l}</span>
                </span>
              ))}
              <motion.span
                className="absolute top-0.5 h-[26px] w-8 rounded-full bg-accent-500"
                animate={{ x: lang === 'en' ? 2 : 34 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            </button>

            <button
              className="grid h-8 w-8 place-items-center rounded-full border border-line bg-ink-900/70 text-zinc-300 lg:hidden"
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
