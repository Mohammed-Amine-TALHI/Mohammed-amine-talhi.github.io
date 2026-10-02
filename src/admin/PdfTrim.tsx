import { useEffect, useState } from 'react';
import { HiOutlineScissors } from 'react-icons/hi';
import { Button } from './ui';

/**
 * Keep only a page range of an uploaded PDF.
 *
 * For documents where only part should be public — a report shared up to its
 * acknowledgements, a deck without its appendix. Like the privacy blur this
 * writes a NEW file holding just the kept pages and swaps it in; the full
 * original is removed from public/ on the next save, so the hidden pages are
 * not downloadable from the site.
 */
export default function PdfTrim({ url, onReplaced }: { url: string; onReplaced: (next: string) => void }) {
  const local = url.startsWith('/') && /\.pdf$/i.test(url);
  const [pages, setPages] = useState<number | null>(null);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(1);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setPages(null);
    if (!local) return;
    let cancelled = false;
    fetch('/__admin/pdf-info?url=' + encodeURIComponent(url))
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j.pages) return;
        setPages(j.pages);
        setFrom(1);
        setTo(j.pages);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url, local]);

  if (!local || !pages) return null;

  const valid = from >= 1 && to <= pages && from <= to && !(from === 1 && to === pages);

  const trim = async () => {
    setBusy(true);
    try {
      const resp = await fetch('/__admin/split-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, from, to }),
      });
      const json = await resp.json();
      if (!json.url) {
        alert('Trim failed: ' + (json.error ?? 'unknown'));
        return;
      }
      onReplaced(json.url);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const num =
    'w-16 rounded-md border border-line bg-ink-950 px-2 py-1 text-center font-mono text-xs text-zinc-200 outline-none focus:border-accent-500/60';

  return (
    <div className="mt-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500 underline decoration-dotted transition-colors hover:text-accent-400"
        >
          <HiOutlineScissors size={11} /> {pages} pages — keep only a range…
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-accent-500/30 bg-ink-950/60 px-3 py-2">
          <HiOutlineScissors size={13} className="text-accent-400" />
          <span className="text-[11px] text-zinc-400">Keep pages</span>
          <input type="number" min={1} max={pages} value={from} onChange={(e) => setFrom(Number(e.target.value))} className={num} />
          <span className="text-[11px] text-zinc-500">to</span>
          <input type="number" min={1} max={pages} value={to} onChange={(e) => setTo(Number(e.target.value))} className={num} />
          <span className="font-mono text-[10px] text-zinc-600">of {pages}</span>
          <span className="ml-auto flex gap-2">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={trim} disabled={!valid || busy}>
              {busy ? 'Trimming…' : `Keep ${valid ? to - from + 1 : '…'} page${to - from === 0 ? '' : 's'}`}
            </Button>
          </span>
          <p className="w-full text-[10.5px] leading-relaxed text-zinc-600">
            Writes a new PDF with just these pages. The full original is removed from <code>public/</code> on your next
            save.
          </p>
        </div>
      )}
    </div>
  );
}
