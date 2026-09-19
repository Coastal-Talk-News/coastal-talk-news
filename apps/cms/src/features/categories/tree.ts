import type { CmsCategoryDto } from '@coastal-talk-news/types';

/** Pixels of indentation per level — also the horizontal drag distance that
 * moves a dragged category one level in or out. */
export const INDENT_WIDTH = 32;

export interface FlatCategory {
  category: CmsCategoryDto;
  parentId: string | null;
  depth: number;
}

export interface Projection {
  depth: number;
  parentId: string | null;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item) next.splice(to, 0, item);
  return next;
}

export function sortByDisplayOrder(
  categories: CmsCategoryDto[],
): CmsCategoryDto[] {
  return [...categories].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
  );
}

/** Ids of every category that has at least one child, at any depth. */
export function categoriesWithChildrenIds(
  categories: CmsCategoryDto[],
): Set<string> {
  return new Set(
    categories.flatMap((category) =>
      category.parentId ? [category.parentId] : [],
    ),
  );
}

/** Only leaf categories — the ones an article can actually be assigned to. */
export function leafCategories(categories: CmsCategoryDto[]): CmsCategoryDto[] {
  const withChildren = categoriesWithChildrenIds(categories);
  return categories.filter((category) => !withChildren.has(category.id));
}

/** "Grandparent › Parent › Category" — the full chain from the root down. */
export function categoryPathLabel(
  category: CmsCategoryDto,
  categories: CmsCategoryDto[],
): string {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const segments = [category.name];
  let current = category;
  while (current.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent) break;
    segments.unshift(parent.name);
    current = parent;
  }
  return segments.join(' › ');
}

/** Every descendant of `id`, any number of levels down. */
export function descendantIds(
  categories: CmsCategoryDto[],
  id: string,
): Set<string> {
  const descendants = new Set<string>();
  let frontier = [id];
  while (frontier.length > 0) {
    const children = categories.filter((category) =>
      frontier.includes(category.parentId ?? ''),
    );
    frontier = children.map((category) => category.id);
    for (const childId of frontier) descendants.add(childId);
  }
  return descendants;
}

/**
 * The tree as the single top-to-bottom list the screen actually shows, which
 * is also what drag-and-drop sorts: one position per visible row, so a drag
 * is a move within one list rather than between nested ones.
 */
export function flattenTree(
  categories: CmsCategoryDto[],
  collapsed: Set<string>,
): FlatCategory[] {
  const present = new Set(categories.map((category) => category.id));
  const childrenByParent = new Map<string, CmsCategoryDto[]>();
  const roots: CmsCategoryDto[] = [];

  for (const category of categories) {
    const parentId = category.parentId;
    // A category whose parent the current filter hides still has to appear
    // somewhere, so it stands in as a root rather than vanishing.
    if (parentId && present.has(parentId)) {
      childrenByParent.set(parentId, [
        ...(childrenByParent.get(parentId) ?? []),
        category,
      ]);
    } else {
      roots.push(category);
    }
  }

  const flat: FlatCategory[] = [];
  const walk = (
    siblings: CmsCategoryDto[],
    parentId: string | null,
    depth: number,
  ) => {
    for (const category of sortByDisplayOrder(siblings)) {
      flat.push({ category, parentId, depth });
      if (!collapsed.has(category.id)) {
        walk(childrenByParent.get(category.id) ?? [], category.id, depth + 1);
      }
    }
  };
  walk(roots, null, 0);
  return flat;
}

/**
 * Where a drag would actually drop: the row order gives the position, the
 * horizontal offset gives the depth. Depth is clamped to what the
 * surrounding rows allow — one level deeper than the row above at most, and
 * never shallower than the row below, which would orphan it above its own
 * parent. A category that holds articles directly can't take children at
 * all, so the row below it is capped at its level too; the drag simply
 * won't go deeper rather than failing on drop.
 */
export function getProjection(
  rows: FlatCategory[],
  activeId: string,
  overId: string,
  dragOffsetX: number,
): Projection | null {
  const overIndex = rows.findIndex((row) => row.category.id === overId);
  const activeIndex = rows.findIndex((row) => row.category.id === activeId);
  const activeRow = rows[activeIndex];
  if (overIndex === -1 || activeIndex === -1 || !activeRow) return null;

  const moved = moveItem(rows, activeIndex, overIndex);
  const previous = moved[overIndex - 1];
  const next = moved[overIndex + 1];

  const maxDepth = previous
    ? previous.category.articleCount > 0
      ? previous.depth
      : previous.depth + 1
    : 0;
  const minDepth = next ? next.depth : 0;
  const requested = activeRow.depth + Math.trunc(dragOffsetX / INDENT_WIDTH);
  const depth = Math.min(Math.max(requested, minDepth), maxDepth);

  if (depth === 0 || !previous) return { depth: 0, parentId: null };
  if (depth > previous.depth) {
    return { depth, parentId: previous.category.id };
  }
  if (depth === previous.depth) {
    return { depth, parentId: previous.parentId };
  }
  const shallower = moved
    .slice(0, overIndex)
    .reverse()
    .find((row) => row.depth === depth);
  return { depth, parentId: shallower?.parentId ?? null };
}

/**
 * The full id order for the destination group after the drop — the reorder
 * endpoint requires every category in that group, including any the current
 * screen doesn't show.
 */
export function siblingOrderAfterMove(
  rows: FlatCategory[],
  categories: CmsCategoryDto[],
  activeId: string,
  overId: string,
  parentId: string | null,
  parentIsExpanded: boolean,
): string[] {
  const overIndex = rows.findIndex((row) => row.category.id === overId);
  const activeIndex = rows.findIndex((row) => row.category.id === activeId);
  if (overIndex === -1 || activeIndex === -1) return [];

  const moved = moveItem(rows, activeIndex, overIndex);
  const existing = sortByDisplayOrder(
    categories.filter(
      (category) =>
        (category.parentId ?? null) === parentId && category.id !== activeId,
    ),
  ).map((category) => category.id);

  // Dropping into a collapsed group gives no visible siblings to sit
  // between, so the category joins them at the end.
  const index = parentIsExpanded
    ? Math.min(
        moved
          .slice(0, overIndex)
          .filter(
            (row) => row.parentId === parentId && row.category.id !== activeId,
          ).length,
        existing.length,
      )
    : existing.length;

  return [...existing.slice(0, index), activeId, ...existing.slice(index)];
}
