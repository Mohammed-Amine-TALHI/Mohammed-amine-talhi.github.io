import { lazy, Suspense, useEffect, useState } from 'react';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Background from './components/Background';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './lib/theme';
import { DocViewerProvider } from './components/DocViewer';

/**
 * The admin panel is imported lazily AND behind `import.meta.env.DEV`.
 * In a production build Vite statically resolves DEV to `false`, so the whole
 * admin chunk is tree-shaken away — it never reaches GitHub Pages.
 */
/* Everything below the hero lives in its own chunk. They all start downloading
   at the first render (not on scroll), in parallel with the hero painting, so
   the first screen needs far less JavaScript and the rest follows within a
   moment. Each keeps a tall placeholder so the page doesn't jump when it lands. */
const About = lazy(() => import('./components/About'));
const Projects = lazy(() => import('./components/Projects'));
const SkillsSection = lazy(() => import('./components/SkillsSection'));
const Graduation = lazy(() => import('./components/Graduation'));
const Leadership = lazy(() => import('./components/Leadership'));
const Contact = lazy(() => import('./components/Contact'));

const Hold = ({ id }: { id?: string }) => <div id={id} className="min-h-screen" aria-hidden />;

/** A link like /#projects must still land once that section's chunk has arrived. */
function useDeferredHashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id || id.startsWith('/')) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById(id);
      // wait for the real section, not its placeholder
      if (el && el.getAttribute('aria-hidden') !== 'true') {
        window.clearInterval(timer);
        el.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      } else if (++tries > 40) window.clearInterval(timer);
    }, 150);
    return () => window.clearInterval(timer);
  }, []);
}

const AdminApp = import.meta.env.DEV ? lazy(() => import('./admin/AdminApp')) : null;

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHashRoute();
  useDeferredHashScroll();

  if (AdminApp && hash.startsWith('#/admin')) {
    // the admin is always dark — it is a tool, not part of the site's look
    document.documentElement.dataset.theme = 'dark';
    return (
      <Suspense fallback={<div className="grid min-h-screen place-items-center text-zinc-500">Loading admin…</div>}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <ThemeProvider>
    <DocViewerProvider>
    <div className="relative min-h-screen overflow-x-hidden">
      <Background />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <Suspense fallback={<Hold id="about" />}>
          <About />
        </Suspense>
        <Suspense fallback={<Hold id="projects" />}>
          <Projects />
        </Suspense>
        <Suspense fallback={<Hold id="skills" />}>
          <SkillsSection />
        </Suspense>
        <Suspense fallback={null}>
          <Graduation />
        </Suspense>
        <Suspense fallback={<Hold id="leadership" />}>
          <Leadership />
        </Suspense>
        <Suspense fallback={<Hold id="contact" />}>
          <Contact />
        </Suspense>
      </main>
      <ThemeToggle />
    </div>
    </DocViewerProvider>
    </ThemeProvider>
  );
}
