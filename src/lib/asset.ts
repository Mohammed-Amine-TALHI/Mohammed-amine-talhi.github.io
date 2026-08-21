/**
 * Resolve a path stored in portfolio.config.json against the deploy base.
 *
 * Uploads are recorded as site-absolute paths ("/leadership/foo.jpg"). That is
 * correct at a domain root, but a GitHub *project* page is served from a
 * subfolder — https://user.github.io/portfolio/ — where "/leadership/foo.jpg"
 * resolves to the wrong place and 404s.
 *
 * Vite rewrites paths it can see at build time (imports, index.html), but not
 * strings that only appear inside JSON data, so those go through here instead.
 * At a root deploy BASE_URL is "/" and this is a no-op.
 */
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export function asset(url?: string | null): string {
  if (!url) return '';
  // absolute URLs and non-http schemes are already final
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) return url;
  if (!url.startsWith('/')) return url; // relative paths are left alone
  return BASE + url;
}

/** Combining diacritics, stripped after an NFD normalise. */
const COMBINING = /[̀-ͯ]/g;

/**
 * The filename a download is saved under.
 *
 * Uploads are stored with a collision-proof suffix ("CV_...--5--mt2awe20.pdf"),
 * which is fine on disk but awful in someone's Downloads folder. The anchor's
 * `download` attribute lets us hand over a clean name instead.
 */
export function downloadName(prefix: string, displayName: string, kind: string, url: string): string {
  const ext = (url.match(/\.[a-z0-9]+$/i)?.[0] ?? '.pdf').toLowerCase();
  const slugify = (v: string) =>
    v
      .normalize('NFD')
      .replace(COMBINING, '')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  return [slugify(prefix), slugify(displayName), kind].filter(Boolean).join('-') + ext;
}

/**
 * A readable filename derived from whatever the document is called on screen.
 *
 * Without this a saved report keeps its stored name — "__preview-test.pdf" or
 * "rapport-mt2awe20.pdf" — which tells the visitor nothing once it is sitting
 * in their Downloads folder.
 */
export function fileNameFromTitle(title: string, url: string): string {
  const ext = (url.match(/\.[a-z0-9]+$/i)?.[0] ?? '.pdf').toLowerCase();
  const slug = title
    .normalize('NFD')
    .replace(COMBINING, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return (slug || 'document') + ext;
}
