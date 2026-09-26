'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { PublicNavCategoryDto } from '@coastal-talk-news/types';
import { categoryName } from '../../lib/category-name';
import type { Locale } from '../../lib/i18n/types';

export function containsActive(
  category: PublicNavCategoryDto,
  activeCategoryId: string | undefined,
): boolean {
  if (category.id === activeCategoryId) return true;
  return category.children.some((child) =>
    containsActive(child, activeCategoryId),
  );
}

interface CategoryFlyoutListProps {
  categories: PublicNavCategoryDto[];
  activeCategoryId: string | undefined;
  categoryHref: (id: string) => string;
  locale: Locale;
}

/**
 * One level of a category dropdown. A category with children opens a nested
 * flyout to the side instead of linking anywhere — like the top-level nav
 * button, a group is never itself a page, only a way to reach what's under
 * it. Grouping can nest to any depth, so this recurses to match, one open
 * flyout per level.
 */
export function CategoryFlyoutList({
  categories,
  activeCategoryId,
  categoryHref,
  locale,
}: CategoryFlyoutListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="border-rule bg-paper w-52 rounded-sm border py-1 shadow-lg">
      {categories.map((category) => {
        const hasChildren = category.children.length > 0;
        const active = category.id === activeCategoryId;
        const highlighted =
          active || containsActive(category, activeCategoryId);

        if (!hasChildren) {
          return (
            <li key={category.id}>
              <Link
                href={categoryHref(category.id)}
                aria-current={active ? 'page' : undefined}
                className={`hover:bg-paper-sunken block px-4 py-2 text-sm font-semibold transition-colors ${
                  highlighted ? 'bg-brand-soft text-brand' : 'hover:text-brand'
                }`}
              >
                {categoryName(category, locale)}
              </Link>
            </li>
          );
        }

        const flyoutOpen = openId === category.id;
        return (
          <li key={category.id} className="relative">
            <button
              type="button"
              onClick={() => setOpenId(flyoutOpen ? null : category.id)}
              onMouseEnter={() => setOpenId(category.id)}
              aria-expanded={flyoutOpen}
              aria-haspopup="true"
              className={`hover:bg-paper-sunken flex w-full items-center justify-between gap-2 px-4 py-2 text-sm font-semibold transition-colors ${
                highlighted ? 'bg-brand-soft text-brand' : 'hover:text-brand'
              }`}
            >
              {categoryName(category, locale)}
              <span aria-hidden className="text-ink-subtle text-xs">
                ›
              </span>
            </button>

            {flyoutOpen && (
              <div className="absolute top-0 left-full z-40 pl-1">
                <CategoryFlyoutList
                  categories={category.children}
                  activeCategoryId={activeCategoryId}
                  categoryHref={categoryHref}
                  locale={locale}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
