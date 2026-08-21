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
