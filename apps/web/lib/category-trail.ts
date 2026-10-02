import type { PublicNavCategoryDto } from '@coastal-talk-news/types';

/**
 * The groups a category sits under, outermost first, read from the site's
 * flat category list. Shared by the section page's visible breadcrumb and
 * the breadcrumb data both section and article pages give search engines, so
 * the two can never describe different hierarchies.
 */
export function ancestorsOf(
  id: string,
  categories: PublicNavCategoryDto[],
): PublicNavCategoryDto[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const trail: PublicNavCategoryDto[] = [];
  let parentId = byId.get(id)?.parentId ?? null;
  while (parentId) {
    const parent = byId.get(parentId);
    if (!parent) break;
    trail.unshift(parent);
    parentId = parent.parentId;
  }
  return trail;
}
