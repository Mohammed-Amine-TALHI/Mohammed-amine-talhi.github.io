import { useCallback, useEffect, useState } from 'react';
import { HiOutlineRefresh, HiOutlineLightningBolt, HiOutlinePhotograph, HiOutlineDocumentText, HiOutlineFilm } from 'react-icons/hi';
import { Button, Card } from '../ui';

/* ---------------------------------------------------------------------------
   Site weight dashboard.

   The dev server measures every upload (GET /__admin/weight) and says who
   uses it. Photos painted on the page (covers, portrait, graduation, visits)
   are what a visitor waits for; gallery photos are warmed up in the background
   on idle; documents and videos are only fetched on a click. The verdict
   (fast / ok / slow) is driven by the on-page total, and each file over its budget is flagged with a
   Compress button that rewrites it in place.
--------------------------------------------------------------------------- */

export interface WeightFile {
  url: string;
  kind: 'image' | 'pdf' | 'video';
  bytes: number;
  eager: boolean;
  heavy: boolean;
  over: number;
  usedBy: string[];
  compressible: boolean;
}
export interface WeightReport {
  status: 'fast' | 'ok' | 'slow';
  total: number;
  eager: number;
  background: number;
  onDemand: number;
  bundle: number;
  heavy: number;
  byKind: Record<'image' | 'pdf' | 'video', number>;
  files: WeightFile[];
}

export const size = (n: number) =>
  n >= 1024 * 1024 ? (n / 1024 / 1024).toFixed(n >= 10 * 1024 * 1024 ? 0 : 1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';

/** Seconds to download `bytes` at a given connection speed (megabits per second). */
const seconds = (bytes: number, mbps: number) => (bytes * 8) / (mbps * 1_000_000);

export const STATUS = {
  fast: { label: 'Fast', tone: 'text-emerald-300 border-emerald-800/70 bg-emerald-950/40', dot: 'bg-emerald-400', note: 'The page stays light — nothing to do.' },
  ok: { label: 'Acceptable', tone: 'text-amber-200 border-amber-800/60 bg-amber-950/40', dot: 'bg-amber-400', note: 'Fine on Wi-Fi, noticeable on mobile data. Compress the heaviest photos.' },
  slow: { label: 'Slow', tone: 'text-red-300 border-red-900/70 bg-red-950/40', dot: 'bg-red-400', note: 'Visitors on mobile will wait. Compress the flagged files below.' },
} as const;

export function useWeight() {
  const [report, setReport] = useState<WeightReport | null>(null);
  const refresh = useCallback(() => {
    fetch('/__admin/weight')
      .then((r) => r.json())
      .then((j) => j?.files && setReport(j))
      .catch(() => {});
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { report, refresh };
}

const KIND_ICON = { image: HiOutlinePhotograph, pdf: HiOutlineDocumentText, video: HiOutlineFilm };

export default function PerformancePanel({ report, refresh }: { report: WeightReport | null; refresh: () => void }) {
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'heavy' | 'all' | 'image' | 'pdf' | 'video'>('heavy');
  const [running, setRunning] = useState(false);

  const compress = async (url: string) => {
    setBusy((b) => ({ ...b, [url]: true }));
    try {
      const resp = await fetch('/__admin/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await resp.json();
      setResult((r) => ({
        ...r,
        [url]: json.error
          ? 'failed: ' + json.error
          : json.saved > 0
            ? `−${size(json.saved)} (${Math.round((json.saved / json.before) * 100)} %)`
            : 'already optimal',
      }));
    } catch (e) {
      setResult((r) => ({ ...r, [url]: 'failed: ' + (e as Error).message }));
    } finally {
      setBusy((b) => ({ ...b, [url]: false }));
      refresh();
    }
  };

  /** One after the other — parallel encodes would only fight for the CPU. */
  const compressAll = async (list: WeightFile[]) => {
    setRunning(true);
    for (const f of list) await compress(f.url);
    setRunning(false);
  };

  if (!report) return <p className="text-xs text-zinc-500">Measuring…</p>;

  const st = STATUS[report.status];
  const first = report.bundle + report.eager;
  const shown = report.files.filter((f) => (filter === 'all' ? true : filter === 'heavy' ? f.heavy : f.kind === filter));
  const heavyImages = report.files.filter((f) => f.heavy && f.kind === 'image' && f.compressible);

  return (
    <div className="space-y-8">
      {/* ------------------------------ verdict ------------------------------ */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-100">Site speed</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              What a visitor downloads, and which files weigh the page down.
            </p>
          </div>
          <Button onClick={refresh}>
            <span className="flex items-center gap-1.5">
              <HiOutlineRefresh size={13} /> Measure again
            </span>
          </Button>
        </div>

        <div className={'rounded-xl border p-4 ' + st.tone}>
          <div className="flex flex-wrap items-center gap-3">
            <span className={'h-2.5 w-2.5 rounded-full ' + st.dot} />
            <span className="font-display text-base font-semibold">{st.label}</span>
            <span className="text-xs opacity-80">{st.note}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              { k: 'The page itself', v: size(first), s: `app ${size(report.bundle)} + photos on the page ${size(report.eager)}` },
              { k: 'On a 4G phone (10 Mbit/s)', v: seconds(first, 10).toFixed(1) + ' s', s: 'until every visible photo is in' },
              { k: 'On slow 3G (1.6 Mbit/s)', v: Math.round(seconds(first, 1.6)) + ' s', s: 'worst realistic case' },
              { k: 'Whole site', v: size(report.total + report.bundle), s: `${report.files.length} files · ${report.heavy} over budget` },
            ].map((x) => (
              <div key={x.k} className="rounded-lg border border-line bg-ink-950/70 px-3 py-2.5">
                <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">{x.k}</div>
                <div className="mt-1 font-display text-xl font-bold text-zinc-100">{x.v}</div>
                <div className="mt-0.5 text-[10.5px] text-zinc-500">{x.s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* weight by type */}
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {(['image', 'pdf', 'video'] as const).map((k) => {
            const Icon = KIND_ICON[k];
            const share = report.total ? (report.byKind[k] / report.total) * 100 : 0;
            return (
              <Card key={k}>
                <div className="flex items-center gap-2 text-sm text-zinc-200">
                  <Icon size={15} className="text-accent-400" />
                  {k === 'image' ? 'Photos' : k === 'pdf' ? 'Documents' : 'Videos'}
                  <span className="ml-auto font-mono text-xs text-zinc-400">{size(report.byKind[k])}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-800">
                  <div className="h-full rounded-full bg-accent-500" style={{ width: share + '%' }} />
                </div>
                <div className="mt-1.5 text-[10.5px] text-zinc-500">
                  {k === 'image'
                    ? `${size(report.eager)} on the page · ${size(report.background)} gallery photos preloaded quietly`
                    : 'only when the visitor opens one'}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ------------------------------ files ------------------------------ */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-2 font-display text-lg font-semibold text-zinc-100">Files</h2>
          {(
            [
              ['heavy', `Over budget · ${report.heavy}`],
              ['image', 'Photos'],
              ['pdf', 'Documents'],
              ['video', 'Videos'],
              ['all', `All · ${report.files.length}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={
                'rounded-full border px-3 py-1 text-[11px] transition-colors ' +
                (filter === id ? 'border-accent-500/60 bg-accent-500/[0.1] text-accent-300' : 'border-line text-zinc-500 hover:text-zinc-300')
              }
            >
              {label}
            </button>
          ))}
          {heavyImages.length > 0 && (
            <span className="ml-auto">
              <Button variant="primary" onClick={() => compressAll(heavyImages)} disabled={running}>
                <span className="flex items-center gap-1.5">
                  <HiOutlineLightningBolt size={13} />
                  {running ? 'Compressing…' : `Compress ${heavyImages.length} heavy photo${heavyImages.length === 1 ? '' : 's'}`}
                </span>
              </Button>
            </span>
          )}
        </div>

        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line py-10 text-center text-xs text-zinc-600">
            {filter === 'heavy' ? 'No file is over its budget.' : 'Nothing here.'}
          </p>
        ) : (
          <div className="space-y-1.5">
            {shown.map((f) => {
              const Icon = KIND_ICON[f.kind];
              const name = f.url.split('/').pop();
              return (
                <div key={f.url} className="flex items-center gap-3 rounded-lg border border-line bg-ink-900 px-3 py-2">
                  {f.kind === 'image' ? (
                    <img src={f.url} alt="" className="h-9 w-12 shrink-0 rounded border border-line object-cover" />
                  ) : (
                    <span className="grid h-9 w-12 shrink-0 place-items-center rounded border border-line text-zinc-500">
                      <Icon size={16} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-[11px] text-zinc-300">{name}</div>
                    <div className="truncate text-[10.5px] text-zinc-600">
                      {f.usedBy.length ? f.usedBy.slice(0, 2).join(' · ') + (f.usedBy.length > 2 ? ` +${f.usedBy.length - 2}` : '') : 'not used'}
                    </div>
                  </div>
                  {result[f.url] && <span className="shrink-0 font-mono text-[10px] text-emerald-400">{result[f.url]}</span>}
                  <span className={'w-16 shrink-0 text-right font-mono text-xs ' + (f.heavy ? 'text-red-300' : 'text-zinc-400')}>
                    {size(f.bytes)}
                  </span>
                  {f.heavy && (
                    <span className="hidden shrink-0 rounded-full border border-red-900/60 px-2 py-0.5 font-mono text-[9px] uppercase text-red-300 sm:inline">
                      +{size(f.over)}
                    </span>
                  )}
                  {f.compressible && (
                    <Button onClick={() => compress(f.url)} disabled={busy[f.url] || running}>
                      {busy[f.url] ? 'Working…' : 'Compress'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 rounded-xl border border-line bg-ink-900 p-4 text-[11px] leading-relaxed text-zinc-500">
          <strong className="text-zinc-400">How compression keeps quality.</strong> Photos are capped at 2000 px and
          re-encoded at high quality; documents get only their embedded pictures recompressed — text and vector
          drawings are untouched, so pages stay sharp; videos are re-encoded at 720p. A file is only replaced when the
          result is at least 5 % smaller, so pressing Compress twice never degrades it further.
        </p>
      </section>
    </div>
  );
}
