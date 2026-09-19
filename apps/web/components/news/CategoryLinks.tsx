import Link from 'next/link';
import type { PublicNavCategoryDto } from '@coastal-talk-news/types';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

/**
 * A group's sections. A group holds no articles of its own, so its page is
 * this rather than an empty archive — the nested groups among them carry
 * their own sections' totals, which a reader can't see from the name alone.
 */
export function SubcategoryGrid({
  categories,
  locale = 'en',
}: {
  categories: PublicNavCategoryDto[];
  locale?: Locale;
}) {
  const dictionary = getDictionary(locale);

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => {
        const total = totalArticles(category);
        const summary =
          category.children.length > 0
            ? [
                dictionary.category.sectionCount(category.children.length),
                total > 0 ? dictionary.category.storyCount(total) : null,
              ]
                .filter(Boolean)
                .join(' · ')
            : dictionary.category.storyCount(total);
        return (
          <li key={category.id}>
            <Link
              href={`/category/${category.id}`}
              className="group border-rule bg-paper rounded-card hover:border-brand flex h-full items-center gap-4 border p-4 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="group-hover:text-brand font-semibold transition-colors">
                  {category.name}
                </p>
                <p className="text-ink-muted mt-1 text-sm">{summary}</p>
              </div>
              <span
                aria-hidden
                className="text-ink-subtle group-hover:text-brand transition-colors"
              >
                →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Lateral moves: the other sections sharing this one's group. */
export function SiblingLinks({
  label,
  categories,
}: {
  label: string;
  categories: PublicNavCategoryDto[];
}) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label={label} className="border-rule mt-10 border-t pt-6">
      <p className="text-ink-subtle mb-3 text-xs font-semibold tracking-[0.12em] uppercase">
        {label}
      </p>
      <ul className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/category/${category.id}`}
              className="border-rule bg-paper hover:border-brand hover:text-brand block rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function totalArticles(category: PublicNavCategoryDto): number {
  return category.children.reduce(
    (sum, child) => sum + totalArticles(child),
    category.articleCount,
  );
}
