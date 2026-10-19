import { useCallback, useEffect, useRef, useState } from 'react';
import { HiOutlineSave, HiOutlineExternalLink, HiOutlineRefresh, HiOutlineCloudUpload, HiOutlineLink, HiOutlineClipboardCopy } from 'react-icons/hi';
import { config as initialConfig } from '../lib/data';
import type { PortfolioConfig } from '../lib/types';
import { Button } from './ui';
import ProjectsPanel from './panels/ProjectsPanel';
import LeadershipPanel from './panels/LeadershipPanel';
import ProfilePanel from './panels/ProfilePanel';
import ContactPanel from './panels/ContactPanel';
import VisitsAdminPanel from './panels/VisitsPanel';
import AnimationsPanel from './panels/AnimationsPanel';
import SkillsAdminPanel from './panels/SkillsPanel';
import GraduationPanel from './panels/GraduationPanel';
import SectionsPanel from './panels/SectionsPanel';
import PerformancePanel, { useWeight, STATUS, size } from './panels/PerformancePanel';

const TABS = [
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'visits', label: 'Visits' },
  { id: 'graduation', label: 'Graduation' },
  { id: 'sections', label: 'Sections' },
  { id: 'profile', label: 'Profile' },
  { id: 'contact', label: 'Contact & CV' },
  { id: 'animations', label: 'Animations & Theme' },
  { id: 'performance', label: 'Speed & files' },
] as const;

type TabId = (typeof TABS)[number]['id'];

type PublishStatus = {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  output: string;
};

type RemoteStatus = {
  configured: boolean;
  httpsPort: number;
  localPort: number;
  origin: string;
  adminUrl: string;
  error?: string;
};

/** Replace every occurrence of one upload path in the config, in place. */
function replaceUrlDeep(node: unknown, from: string, to: string): void {
  if (Array.isArray(node)) {
    node.forEach((v, i) => {
      if (v === from) node[i] = to;
      else replaceUrlDeep(v, from, to);
    });
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    for (const k of Object.keys(obj)) {
      if (obj[k] === from) obj[k] = to;
      else replaceUrlDeep(obj[k], from, to);
    }
  }
}

/**
 * Local content manager.
 *
 * Runs ONLY under `npm run dev` (App.tsx gates it behind import.meta.env.DEV and
 * the vite plugin that backs it uses apply:'serve'). Saving writes straight to
 * src/data/portfolio.config.json on your machine — the deployed site is a plain
 * static build of whatever that file says, with no admin code in it at all.
 */
export default function AdminApp() {
  const [cfg, setCfg] = useState<PortfolioConfig>(() => structuredClone(initialConfig));
  const [tab, setTab] = useState<TabId>('projects');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(null);
  const [remoteStatus, setRemoteStatus] = useState<RemoteStatus | null>(null);
  const [fixingRemote, setFixingRemote] = useState(false);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
  const toastTimer = useRef<number>(0);
  /** mtime of the config file when this session loaded it — the write guard. */
  const baseMtime = useRef<number | null>(null);
  const [conflict, setConflict] = useState<{ config: PortfolioConfig; mtime: number } | null>(null);
  /** site weight, measured by the dev server — feeds the banner and the Speed tab */
  const weight = useWeight();

  // Load from disk rather than trusting the bundled import, which can lag
  // behind if the file was edited after the dev server started.
  useEffect(() => {
    let cancelled = false;
    fetch('/__admin/config')
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j?.config) return;
        baseMtime.current = j.mtime ?? null;
        setCfg(j.config);
        setDirty(false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const flash = useCallback((msg: string, err = false) => {
    setToast({ msg, err });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  // Give the private tool its own install metadata while preserving the public
  // portfolio metadata when the visitor returns to the landing page.
  useEffect(() => {
    const previousTitle = document.title;
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousTheme = theme?.content;
    const manifest = document.querySelector<HTMLLinkElement>('#app-manifest');
    const previousManifest = manifest?.getAttribute('href');
    const cleanups: Array<() => void> = [];
    const setMeta = (attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      const created = !element;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      const previous = element.content;
      element.content = content;
      cleanups.push(() => {
        if (created) element?.remove();
        else if (element) element.content = previous;
      });
    };

    const iconUrl = new URL('/icon-512.png', window.location.origin).href;
    setMeta('name', 'description', 'Private mobile control panel for Mohammed TALHI’s portfolio.');
    setMeta('name', 'application-name', 'Portfolio Admin');
    setMeta('name', 'apple-mobile-web-app-title', 'Portfolio Admin');
    setMeta('name', 'robots', 'noindex, nofollow');
    setMeta('name', 'twitter:card', 'summary');
    setMeta('name', 'twitter:title', 'Portfolio Admin — Mohammed TALHI');
    setMeta('name', 'twitter:description', 'Private Tailscale portfolio control panel.');
    setMeta('name', 'twitter:image', iconUrl);
    setMeta('property', 'og:title', 'Portfolio Admin — Mohammed TALHI');
    setMeta('property', 'og:description', 'Private Tailscale portfolio control panel.');
    setMeta('property', 'og:url', window.location.href);
    setMeta('property', 'og:image', iconUrl);
    setMeta('property', 'og:image:alt', 'Portrait of Mohammed Amine TALHI');

    if (manifest) manifest.href = '/admin.webmanifest';
    document.title = 'Portfolio Admin — Mohammed TALHI';
    if (theme) theme.content = '#0a0a0f';
    return () => {
      cleanups.reverse().forEach((cleanup) => cleanup());
      if (manifest && previousManifest) manifest.setAttribute('href', previousManifest);
      document.title = previousTitle;
      if (theme && previousTheme) theme.content = previousTheme;
    };
  }, []);

  // Publishing runs on the PC and can outlive a phone request. Polling makes
  // reconnects and screen-locks safe: the phone simply resumes showing status.
  useEffect(() => {
    let previousRunning = false;
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch('/__admin/publish');
        const next = (await response.json()) as PublishStatus;
        if (cancelled) return;
        setPublishStatus(next);
        if (previousRunning && !next.running && next.finishedAt) {
          flash(next.exitCode === 0 ? 'Published successfully' : 'Publish failed — check the log below', next.exitCode !== 0);
        }
        previousRunning = next.running;
      } catch {
        // The persistent server may be restarting; the next poll will recover.
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [flash]);

  const refreshRemote = useCallback(async () => {
    try {
      const response = await fetch('/__admin/remote');
      const json = await response.json();
      setRemoteStatus(json);
    } catch (error) {
      setRemoteStatus({ configured: false, httpsPort: 8445, localPort: 5173, origin: '', adminUrl: '', error: (error as Error).message });
    }
  }, []);

  useEffect(() => {
    refreshRemote();
  }, [refreshRemote]);

  const fixRemote = useCallback(async () => {
    setFixingRemote(true);
    try {
      const response = await fetch('/__admin/remote', { method: 'POST' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'could not configure Tailscale');
      setRemoteStatus(json);
      flash(`Tailscale link locked to port ${json.httpsPort}`);
    } catch (error) {
      flash((error as Error).message, true);
      await refreshRemote();
    } finally {
      setFixingRemote(false);
    }
  }, [flash, refreshRemote]);

  const copyRemoteLink = useCallback(async () => {
    if (!remoteStatus?.adminUrl) return;
    try {
      await navigator.clipboard.writeText(remoteStatus.adminUrl);
      flash('Private admin link copied');
    } catch {
      flash('Could not copy the link', true);
    }
  }, [flash, remoteStatus]);

  /** Mutate a draft copy, mark dirty. Keeps every panel's call-site terse. */
  const set = useCallback((fn: (draft: PortfolioConfig) => void) => {
    setCfg((prev) => {
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/__admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: cfg, baseMtime: baseMtime.current }),
      });
      const json = await res.json();

      // someone else wrote the file since we loaded it — never silently win
      if (res.status === 409) {
        setConflict({ config: json.config, mtime: json.mtime });
        flash('Not saved — the file changed on disk', true);
        return false;
      }
      if (!res.ok) throw new Error(json.error ?? 'save failed');

      baseMtime.current = json.mtime ?? baseMtime.current;
      setDirty(false);
      weight.refresh();
      const n = (json.pruned ?? []).length;
      flash('Saved to ' + json.path + (n ? ` · ${n} unused file${n > 1 ? 's' : ''} removed` : ''));
      return true;
    } catch (err) {
      flash((err as Error).message, true);
      return false;
    } finally {
      setSaving(false);
    }
  }, [cfg, flash, weight]);

  const publish = useCallback(async () => {
    if (dirty && !(await save())) return;
    setPublishStatus((current) => ({
      running: true,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      exitCode: null,
      output: current?.output ?? '',
    }));
    try {
      const response = await fetch('/__admin/publish', { method: 'POST' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'publish failed to start');
      setPublishStatus(json);
      flash('Publish started — you can keep editing while it runs');
    } catch (error) {
      setPublishStatus((current) => current ? { ...current, running: false } : null);
      flash((error as Error).message, true);
    }
  }, [dirty, flash, save]);

  // A photo was edited into a new file (privacy blur): point everything at the
  // new path, and carry its framing over. The old file is swept on save.
  useEffect(() => {
    const onReplace = (e: Event) => {
      const { from, to } = (e as CustomEvent<{ from: string; to: string }>).detail;
      set((d) => {
        replaceUrlDeep(d, from, to);
        if (d.crops?.[from]) {
          d.crops[to] = d.crops[from];
          delete d.crops[from];
        }
      });
      flash('Blur applied — save to remove the original file');
    };
    window.addEventListener('portfolio:replace-url', onReplace);
    return () => window.removeEventListener('portfolio:replace-url', onReplace);
  }, [set, flash]);

  // Ctrl/Cmd+S saves
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  // warn before losing unsaved edits
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);

  const counts = {
    projects: Object.values(cfg.visibility.projects).filter((v) => v !== false).length,
    leadership: cfg.leadership.length,
    docs: Object.values(cfg.projectMeta ?? {}).reduce(
      (n, m) => n + (m.assets ?? []).filter((a) => a.url).length,
      0,
    ),
    cv: (['en', 'fr'] as const).filter((l) => cfg.cv?.[l]?.url).length,
    skills: (cfg.skills ?? []).length,
  };

  return (
    <div className="min-h-screen bg-ink-950 text-zinc-300">
      <header className="sticky top-0 z-40 border-b border-line bg-ink-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-3 py-3.5 sm:px-5">
          <img src="/favicon.png" alt="" className="h-9 w-9 rounded-full" />
          <div className="mr-auto">
            <h1 className="font-display text-sm font-semibold text-zinc-100">Portfolio admin</h1>
            <p className="font-mono text-[10px] text-zinc-600">
              private via Tailscale · {counts.projects} projects · {counts.docs} docs · {counts.skills} skills ·{' '}
              {counts.leadership} leadership · {counts.cv}/2 CVs
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <a
              href="#/"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-xs text-zinc-400 transition-colors hover:text-zinc-100"
            >
              <HiOutlineExternalLink size={13} /> View site
            </a>
            <Button onClick={() => { setCfg(structuredClone(initialConfig)); setDirty(false); flash('Reverted to last saved file'); }}>
              <span className="flex items-center justify-center gap-1.5">
                <HiOutlineRefresh size={13} /> Revert
              </span>
            </Button>
            <Button variant="primary" onClick={save} disabled={!dirty || saving || publishStatus?.running}>
              <span className="flex items-center justify-center gap-1.5">
                <HiOutlineSave size={13} />
                {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
              </span>
            </Button>
            <Button variant="primary" onClick={publish} disabled={saving || publishStatus?.running}>
              <span className="flex items-center justify-center gap-1.5">
                <HiOutlineCloudUpload size={14} />
                {publishStatus?.running ? 'Publishing…' : 'Publish site'}
              </span>
            </Button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-2 sm:px-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                'shrink-0 rounded-lg px-3.5 py-2 text-xs transition-colors ' +
                (tab === t.id
                  ? 'bg-white/[0.07] text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300')
              }
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className={'border-b ' + (remoteStatus?.configured ? 'border-emerald-900/50 bg-emerald-950/20' : 'border-amber-900/50 bg-amber-950/20')}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-3 py-2 text-[11px] sm:px-5">
          <HiOutlineLink className={remoteStatus?.configured ? 'text-emerald-400' : 'text-amber-400'} size={14} />
          <span className="font-semibold text-zinc-300">
            {remoteStatus?.configured ? `Remote link fixed on port ${remoteStatus.httpsPort}` : 'Remote link needs repair'}
          </span>
          {remoteStatus?.adminUrl && (
            <a href={remoteStatus.adminUrl} className="min-w-0 truncate font-mono text-zinc-500 hover:text-zinc-300">
              {remoteStatus.adminUrl}
            </a>
          )}
          <div className="ml-auto flex gap-2">
            {remoteStatus?.adminUrl && (
              <button onClick={copyRemoteLink} className="flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-zinc-400 hover:text-zinc-100">
                <HiOutlineClipboardCopy size={12} /> Copy
              </button>
            )}
            <button onClick={fixRemote} disabled={fixingRemote} className="flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-zinc-300 hover:border-zinc-600 disabled:opacity-40">
              <HiOutlineRefresh size={12} className={fixingRemote ? 'animate-spin' : ''} />
              {fixingRemote ? 'Fixing…' : 'Lock fixed port'}
            </button>
          </div>
        </div>
      </div>

      {publishStatus?.finishedAt && (
        <details className={'border-b px-3 py-2 text-[11px] sm:px-5 ' + (publishStatus.exitCode === 0 ? 'border-emerald-900/50 bg-emerald-950/20' : 'border-red-900/50 bg-red-950/20')}>
          <summary className="mx-auto max-w-5xl cursor-pointer font-semibold">
            Last publish {publishStatus.exitCode === 0 ? 'succeeded' : 'failed'} · view log
          </summary>
          <pre className="mx-auto mt-2 max-h-48 max-w-5xl overflow-auto whitespace-pre-wrap font-mono text-[10px] text-zinc-400">{publishStatus.output}</pre>
        </details>
      )}

      {/* speed banner: is the site light, and what is weighing it down */}
      {weight.report && tab !== 'performance' && (
        <div className={'border-b ' + STATUS[weight.report.status].tone}>
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2 text-[11px]">
            <span className="flex items-center gap-2 font-semibold">
              <span className={'h-2 w-2 rounded-full ' + STATUS[weight.report.status].dot} />
              Site speed: {STATUS[weight.report.status].label}
            </span>
            <span className="opacity-80">
              page {size(weight.report.bundle + weight.report.eager)} · whole site{' '}
              {size(weight.report.total + weight.report.bundle)}
            </span>
            {weight.report.heavy > 0 && (
              <span className="min-w-0 truncate opacity-80">
                {weight.report.heavy} heavy file{weight.report.heavy === 1 ? '' : 's'}:{' '}
                {weight.report.files
                  .filter((f) => f.heavy)
                  .slice(0, 3)
                  .map((f) => `${f.url.split('/').pop()?.slice(0, 26)} (${size(f.bytes)})`)
                  .join(', ')}
                {weight.report.heavy > 3 ? '…' : ''}
              </span>
            )}
            <button onClick={() => setTab('performance')} className="ml-auto shrink-0 underline decoration-dotted">
              {weight.report.heavy > 0 ? 'Review & compress →' : 'Details →'}
            </button>
          </div>
        </div>
      )}

      {conflict && (
        <div className="border-b border-amber-800/60 bg-amber-950/40">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-5 py-3">
            <span className="text-xs text-amber-200">
              This file was changed elsewhere while you were editing. Your changes were <strong>not</strong> saved.
            </span>
            <div className="ml-auto flex gap-2">
              <Button
                onClick={() => {
                  setCfg(conflict.config);
                  baseMtime.current = conflict.mtime;
                  setConflict(null);
                  setDirty(false);
                  flash('Loaded the version from disk');
                }}
              >
                Load disk version
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  baseMtime.current = conflict.mtime;
                  setConflict(null);
                  flash('Press Save again to overwrite');
                }}
              >
                Keep mine
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-5 sm:py-8">
        {tab === 'projects' && <ProjectsPanel cfg={cfg} set={set} />}
        {tab === 'skills' && <SkillsAdminPanel cfg={cfg} set={set} />}
        {tab === 'leadership' && <LeadershipPanel cfg={cfg} set={set} />}
        {tab === 'visits' && <VisitsAdminPanel cfg={cfg} set={set} />}
        {tab === 'graduation' && <GraduationPanel cfg={cfg} set={set} />}
        {tab === 'sections' && <SectionsPanel cfg={cfg} set={set} />}
        {tab === 'profile' && <ProfilePanel cfg={cfg} set={set} />}
        {tab === 'contact' && <ContactPanel cfg={cfg} set={set} />}
        {tab === 'animations' && <AnimationsPanel cfg={cfg} set={set} />}
        {tab === 'performance' && <PerformancePanel report={weight.report} refresh={weight.refresh} />}

        <p className="mt-12 rounded-xl border border-line bg-ink-900 p-4 text-[11px] leading-relaxed text-zinc-500">
          <strong className="text-zinc-400">How this works.</strong> Saving writes{' '}
          <code className="text-accent-500">src/data/portfolio.config.json</code> and any uploaded images into{' '}
          <code className="text-accent-500">public/</code>. This admin UI itself is stripped out of{' '}
          <code className="text-accent-500">npm run build</code>, so it never reaches GitHub Pages — but you do need to
          tap <strong className="text-zinc-400">Publish site</strong> to build, commit, and push the saved changes.
        </p>
      </main>

      {toast && (
        <div
          className={
            'fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-4 py-2.5 text-xs shadow-2xl ' +
            (toast.err
              ? 'border-red-900 bg-red-950 text-red-300'
              : 'border-emerald-900 bg-emerald-950 text-emerald-300')
          }
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
