import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children at the end of <body>.
 *
 * Overlays have to escape `<main className="relative z-10">`: that z-index
 * creates a stacking context, so anything inside it — however high its own
 * z-index — is still painted below the navbar's `z-40`. The lightbox's close
 * button ended up underneath the header and could not be clicked. Portalling to
 * the body puts overlays in the root stacking context, where their z-index
 * actually competes with the nav's.
 */
export default function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // portals need a DOM target, which doesn't exist during the first render
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
