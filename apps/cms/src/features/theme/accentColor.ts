/** Fallback matching theme.css's `[data-palette='custom']` block. */
export const DEFAULT_CUSTOM_ACCENT = '#09090b';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

/**
 * White or near-black text on top of a solid accent fill (a button, an
 * active nav pill) - the one accent-derived value colour math can't settle
 * by itself, since it depends on how light or dark the chosen colour is,
 * not a fixed light/dark-mode direction. Plain relative luminance, not full
 * WCAG contrast: good enough to pick the readable side for any colour an
 * admin might choose.
 */
export function bestAccentForeground(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#09090b' : '#fafafa';
}

interface Hsl {
  h: number;
  /** 0-1 */
  s: number;
  /** 0-1 */
  l: number;
}

function hexToHsl(hex: string): Hsl {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) * 60
      : max === g
        ? ((b - r) / d + 2) * 60
        : ((r - g) / d + 4) * 60;
  return { h, s, l };
}

function hueToChannel(p: number, q: number, t: number): number {
  const wrapped = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
  if (wrapped < 1 / 6) return p + (q - p) * 6 * wrapped;
  if (wrapped < 1 / 2) return q;
  if (wrapped < 2 / 3) return p + (q - p) * (2 / 3 - wrapped) * 6;
  return p;
}

function toByteHex(value: number): string {
  return Math.round(Math.min(255, Math.max(0, value)) * 255)
    .toString(16)
    .padStart(2, '0');
}

function hslToHex({ h, s, l }: Hsl): string {
  if (s === 0) return `#${toByteHex(l)}${toByteHex(l)}${toByteHex(l)}`;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hh = h / 360;
  return `#${toByteHex(hueToChannel(p, q, hh + 1 / 3))}${toByteHex(hueToChannel(p, q, hh))}${toByteHex(hueToChannel(p, q, hh - 1 / 3))}`;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * The accent's own hue, with its lightness pulled into a band that always
 * reads as text and its saturation given a floor. Deriving straight from
 * the picked colour (plain `color-mix` toward black/white, which is what
 * theme.css's other palettes use since their accents are hand-picked to
 * already sit mid-range) breaks down for a colour an admin picks that is
 * already close to white or black itself: there's barely any lightness
 * left to push in the right direction, so the result stays washed-out and
 * grey - exactly what made a near-white custom accent's active nav item
 * unreadable. Used for text on a soft/plain background (nav items, links)
 * - the opposite direction from accent-fg, which is white-or-black text on
 * a *solid* accent fill, where plain luminance is already enough.
 */
export function accentTextShade(hex: string, mode: 'light' | 'dark'): string {
  const { h, s } = hexToHsl(hex);
  return hslToHex({
    h,
    s: Math.max(s, 0.4),
    l: mode === 'light' ? 0.34 : 0.72,
  });
}

/** Same reasoning as accentTextShade, for a pale background wash (a
 *  selected nav item, a soft badge) rather than text - needs to stay
 *  visibly tinted against the page itself, not fade into it. */
export function accentSoftShade(hex: string, mode: 'light' | 'dark'): string {
  const { h, s } = hexToHsl(hex);
  return hslToHex({
    h,
    s: Math.max(s, 0.5),
    l: mode === 'light' ? 0.95 : 0.24,
  });
}

/** A one-step darker/lighter version of the accent itself, for :hover.
 *  Nudging lightness by a fixed amount reads correctly regardless of how
 *  light or dark the picked colour already is, clamped so it can never
 *  invert past black or white. */
export function accentHoverShade(hex: string, mode: 'light' | 'dark'): string {
  const { h, s, l } = hexToHsl(hex);
  const delta = mode === 'light' ? -0.12 : 0.12;
  return hslToHex({ h, s, l: clamp01(l + delta) });
}
