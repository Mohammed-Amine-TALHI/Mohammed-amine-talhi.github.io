import { lazy, Suspense, useEffect, useState } from 'react';
import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import SkillsSection from './components/SkillsSection';
import Leadership from './components/Leadership';
import Contact from './components/Contact';
import Background from './components/Background';

/**
 * The admin panel is imported lazily AND behind `import.meta.env.DEV`.
 * In a production build Vite statically resolves DEV to `false`, so the whole
 * admin chunk is tree-shaken away — it never reaches GitHub Pages.
 */
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

  if (AdminApp && hash.startsWith('#/admin')) {
    return (
      <Suspense fallback={<div className="grid min-h-screen place-items-center text-zinc-500">Loading admin…</div>}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Background />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <About />
        <Projects />
        <SkillsSection />
        <Leadership />
        <Contact />
      </main>
    </div>
  );
}
