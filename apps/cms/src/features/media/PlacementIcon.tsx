import type { ImagePlacement } from '@coastal-talk-news/types';

/** Each icon is a tiny page: the filled block is the picture, the lines are text. */
const PICTURE = { y: 2.5, width: 9, height: 8 } as const;
const FULL_LINES = [14, 17.5];

interface Layout {
  x: number;
  /** Text lines running beside the picture, as [x, width]. */
  beside?: Array<[number, number]>;
}

const LAYOUTS: Record<ImagePlacement, Layout> = {
  left: { x: 2 },
  center: { x: 5.5 },
  right: { x: 9 },
  'float-left': {
    x: 2,
    beside: [
      [12.5, 5.5],
      [12.5, 5.5],
    ],
  },
  'float-right': {
    x: 9,
    beside: [
      [2, 5.5],
      [2, 5.5],
    ],
  },
};

export function PlacementIcon({ placement }: { placement: ImagePlacement }) {
  const { x, beside } = LAYOUTS[placement];

  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      className="size-5"
      aria-hidden
    >
      <rect
        x={x}
        y={PICTURE.y}
        width={PICTURE.width}
        height={PICTURE.height}
        rx="1.4"
        fill="currentColor"
        stroke="none"
      />
      {beside?.map(([lineX, width], index) => (
        <path
          key={index}
          d={`M${lineX} ${PICTURE.y + 2 + index * 4}h${width}`}
          opacity="0.6"
        />
      ))}
      {FULL_LINES.map((y) => (
        <path key={y} d={`M2 ${y}h16`} opacity="0.6" />
      ))}
    </svg>
  );
}
