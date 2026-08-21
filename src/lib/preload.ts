import { useEffect } from 'react';
import { asset } from './asset';

const done = new Set<string>();

/**
 * Warm the browser cache for images that are not on screen yet.
 *
 * The leadership journal only mounts its gallery when a card is opened, so the
 * photos started downloading at click time and appeared blank for a moment.
 * Fetching them ahead of time means the gallery is already painted when it
 * opens.
 *
 * Scheduled on idle so it never competes with the first render, and each URL is
 * fetched once per session however many components ask for it.
 */
export function usePreloadImages(urls: string[], enabled = true) {
  const key = urls.join('|');

  useEffect(() => {
    if (!enabled || !urls.length) return;

    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      for (const url of urls) {
        const src = asset(url);
        if (!src || done.has(src)) continue;
        done.add(src);
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
      }
    };

    // requestIdleCallback isn't in older Safari; a short timeout stands in
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    const idle = typeof w.requestIdleCallback === 'function';
    const handle = idle ? w.requestIdleCallback!(warm) : window.setTimeout(warm, 1200);

    return () => {
      cancelled = true;
      if (idle && typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
}
