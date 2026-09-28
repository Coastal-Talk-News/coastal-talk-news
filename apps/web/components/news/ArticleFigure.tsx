import type { CSSProperties, ReactNode } from 'react';

const PLACEMENTS = [
  'left',
  'center',
  'right',
  'float-left',
  'float-right',
] as const;
type Placement = (typeof PLACEMENTS)[number];

const WIDTH_MIN = 10;
const WIDTH_MAX = 100;

/**
 * A stored document is untrusted input, so the placement is matched against
 * the known names and the width is clamped to a plain number before either
 * reaches the page. Anything else falls back to a full-width, centred figure.
 */
function placementOf(value: unknown): Placement {
  return PLACEMENTS.find((placement) => placement === value) ?? 'center';
}

function widthOf(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, Math.round(value)))
    : WIDTH_MAX;
}

interface ArticleFigureProps {
  placement: unknown;
  widthPercent: unknown;
  children: ReactNode;
}

/** Sizes and places a picture; `.article-figure` in globals.css does the layout. */
export function ArticleFigure({
  placement,
  widthPercent,
  children,
}: ArticleFigureProps) {
  const style = {
    '--frame-width': `${widthOf(widthPercent)}%`,
  } as CSSProperties;

  return (
    <figure
      className="article-figure"
      data-placement={placementOf(placement)}
      style={style}
    >
      {children}
    </figure>
  );
}
