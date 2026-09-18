/**
 * Tailwind needs whole class names at build time, so these are spelled out
 * rather than assembled from a number.
 */
const COLUMN_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Picks the column count that divides a section's cards evenly, so a row of
 * three doesn't sit in a four-column grid with a hole at the end. Counts with
 * no clean divisor (5, 7) fall back to three, which leaves the smallest
 * remainder of the sensible options.
 */
export function gridColumnsFor(count: number): string {
  if (count <= 1) return COLUMN_CLASS[1]!;
  const columns =
    [4, 3, 2].find((candidate) => count % candidate === 0) ??
    (count > 3 ? 3 : count);
  return COLUMN_CLASS[columns] ?? COLUMN_CLASS[3]!;
}
