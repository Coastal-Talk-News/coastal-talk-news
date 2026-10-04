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
