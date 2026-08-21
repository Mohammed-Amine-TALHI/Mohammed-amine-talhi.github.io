import { useEffect } from 'react';

/**
 * Jumping to a project from elsewhere on the page.
 *
 * The Projects grid only renders its first six cards until "show all" is
 * clicked, and a tag filter can hide more. So a skill linking to the eighth
 * project cannot simply call `getElementById` — the card is not in the DOM, the
 * lookup returns null, and the click appears to do nothing.
 *
 * Instead the request is announced, and the Projects section reacts by clearing
 * whatever is hiding the card, then scrolling to it once it has rendered. A DOM
 * event rather than a context because the two sections are siblings with no
 * shared state, and this needs no provider plumbing.
 */
const EVENT = 'portfolio:focus-project';

export function focusProject(id: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
}

export function useProjectFocusRequest(handler: (id: string) => void) {
  useEffect(() => {
    const onFocus = (e: Event) => handler((e as CustomEvent<string>).detail);
    window.addEventListener(EVENT, onFocus);
    return () => window.removeEventListener(EVENT, onFocus);
  }, [handler]);
}

/** Scroll a project card into view and pulse it. */
export function revealProjectCard(id: string): boolean {
  const el = document.getElementById('project-' + id);
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('flash-target');
  window.setTimeout(() => el.classList.remove('flash-target'), 1800);
  return true;
}
