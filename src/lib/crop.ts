import type { CSSProperties } from 'react';
import { config } from './data';

/**
 * Non-destructive image framing.
 *
 * Rather than writing a cropped copy of the file, we store where to look and
 * how far in: `x`/`y` are the focal point in percent, `zoom` magnifies around
 * it. The original upload is never touched, so a crop can be re-adjusted (or
 * undone) at any time, and the same numbers drive both the admin preview and
 * the live card.
 */
export interface Crop {
  x: number; // 0 = left edge, 100 = right edge
  y: number; // 0 = top edge, 100 = bottom edge
  zoom: number; // 1 = fit the box, up to 4
}

export const DEFAULT_CROP: Crop = { x: 50, y: 50, zoom: 1 };

/** Legacy keyword positions, kept so older entries keep their framing. */
const FROM_KEYWORD: Record<string, { x: number; y: number }> = {
  center: { x: 50, y: 50 },
  top: { x: 50, y: 0 },
  bottom: { x: 50, y: 100 },
  left: { x: 0, y: 50 },
  right: { x: 100, y: 50 },
};

export function resolveCrop(source: { imageCrop?: Crop; imagePosition?: string }): Crop {
  if (source.imageCrop) {
    return {
      x: clamp(source.imageCrop.x),
      y: clamp(source.imageCrop.y),
      zoom: Math.min(4, Math.max(1, source.imageCrop.zoom || 1)),
    };
  }
  const legacy = FROM_KEYWORD[source.imagePosition ?? 'center'] ?? FROM_KEYWORD.center;
  return { ...legacy, zoom: 1 };
}

export const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Styles for the <img>. `object-position` chooses which part of an overflowing
 * image is visible; `scale` then magnifies about that same point, so the two
 * stay anchored together as you drag and zoom.
 */
export function cropStyle(crop: Crop, fit: 'cover' | 'contain' = 'cover'): CSSProperties {
  return {
    objectFit: fit,
    objectPosition: `${crop.x}% ${crop.y}%`,
    transform: crop.zoom === 1 ? undefined : `scale(${crop.zoom})`,
    transformOrigin: `${crop.x}% ${crop.y}%`,
  };
}

/** The stored framing for one photo, by URL. Defaults to centred, unzoomed. */
export function cropFor(url?: string | null): Crop {
  if (!url) return { ...DEFAULT_CROP };
  const stored = config.crops?.[url];
  return stored ? resolveCrop({ imageCrop: stored }) : { ...DEFAULT_CROP };
}
