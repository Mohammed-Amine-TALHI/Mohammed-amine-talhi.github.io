import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { asset } from '../lib/asset';

/**
 * An <img> that disappears instead of breaking.
 *
 * Paths live in portfolio.config.json while the files live in public/, so the
 * two can drift: delete an upload and the config still asks for it. The browser
 * then paints its broken-image icon, which looks worse than showing nothing.
 *
 * On a load failure this renders `fallback` — or nothing at all — so a card with
 * a missing photo degrades to exactly the state it would have had if no photo
 * were attached. `npm run check-assets` catches the same drift before publish;
 * this is the safety net for anything already live.
 */
export default function SafeImage({
  src,
  fallback = null,
  alt = '',
  className,
  style,
  onLoaded,
}: {
  src?: string | null;
  fallback?: ReactNode;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  onLoaded?: (ok: boolean) => void;
}) {
  const [failed, setFailed] = useState(false);

  // a changed src deserves a fresh attempt
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) return <>{fallback}</>;

  return (
    <img
      src={asset(src)}
      alt={alt}
      className={className}
      style={style}
      onError={() => {
        setFailed(true);
        onLoaded?.(false);
      }}
      onLoad={() => onLoaded?.(true)}
    />
  );
}
