import { useEffect } from 'react';
import { asset } from './asset';

/* ---------------------------------------------------------------------------
   Background image warm-up.

   Galleries only mount when a card is opened, so without help their photos
   would start downloading at click time and pop in late. They are fetched
   ahead of time instead — but carefully, so the visitor never pays for it:

   - nothing starts until the page has finished loading and is idle;
   - a section's photos are only queued once the visitor has scrolled near
     that section (`anchor`), so someone who stops at the hero downloads none
     of the project or leadership galleries;
   - the queue drains two at a time at low priority, pauses while the tab is
     hidden, and is skipped altogether on data-saver / 2G connections.

   On-page photos are handled separately by the browser: every <img> is
   `loading="lazy"`, so those load as they scroll into view.
--------------------------------------------------------------------------- */

const seen = new Set<string>();
const queue: string[] = [];
let active = 0;
const CONCURRENCY = 2;

type Conn = { saveData?: boolean; effectiveType?: string };
const conn = (navigator as Navigator & { connection?: Conn }).connection;
/** Visitors who asked to save data, or are on a very slow link, get no warm-up. */
const frugal = Boolean(conn?.saveData) || /(^|-)2g$/.test(conn?.effectiveType ?? '');

function pump() {
  if (document.hidden) return; // resumed by the visibilitychange listener below
  while (active < CONCURRENCY && queue.length) {
    const src = queue.shift()!;
    active++;
    const img = new Image();
    img.decoding = 'async';
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'low';
    const next = () => {
      active--;
      pump();
    };
    img.onload = next;
    img.onerror = next;
    img.src = src;
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) pump();
  });
}

function enqueue(urls: string[]) {
  for (const url of urls) {
    const src = asset(url);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    queue.push(src);
  }
  pump();
}

/** Run `fn` once the page has loaded and the main thread is idle. */
function whenIdle(fn: () => void): () => void {
  let cancelled = false;
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  const go = () => {
    if (cancelled) return;
    if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(() => !cancelled && fn(), { timeout: 3000 });
    else window.setTimeout(() => !cancelled && fn(), 800);
  };
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener('load', go);
  };
}

/**
 * Warm the cache for images that are not on screen yet.
 *
 * `anchor` is the id of the section they belong to: the warm-up waits until
 * that section is within about one and a half screens of the viewport.
 */
export function usePreloadImages(urls: string[], anchor?: string, enabled = true) {
  const key = urls.join('|');

  useEffect(() => {
    if (!enabled || !urls.length || frugal) return;

    let observer: IntersectionObserver | null = null;
    const cancelIdle = whenIdle(() => {
      const el = anchor ? document.getElementById(anchor) : null;
      if (!el || typeof IntersectionObserver === 'undefined') {
        enqueue(urls);
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer?.disconnect();
            enqueue(urls);
          }
        },
        { rootMargin: '150% 0px' },
      );
      observer.observe(el);
    });

    return () => {
      cancelIdle();
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, anchor, enabled]);
}
