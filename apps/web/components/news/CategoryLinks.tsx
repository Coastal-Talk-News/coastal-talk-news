import Link from 'next/link';
import type { PublicNavCategoryDto } from '@coastal-talk-news/types';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';
import { StoryImage } from './StoryImage';

/** Long enough for a sentence, short enough that no card's description runs
 * past the two lines every card reserves for one. */
const DESCRIPTION_MAX = 90;

function shorten(text: string): string {
  if (text.length <= DESCRIPTION_MAX) return text;
  const cut = text.slice(0, DESCRIPTION_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  // Only break on a word if one is near the end, so a long unbroken string
  // still gets cut rather than kept whole.
  const trimmed =
    lastSpace > DESCRIPTION_MAX * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.trimEnd()}…`;
}

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
              className="group border-rule bg-paper rounded-card hover:border-brand flex h-full flex-col overflow-hidden border transition-colors hover:shadow-md"
            >
              {category.image ? (
                <StoryImage
                  image={category.image}
                  alt=""
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  className="aspect-video w-full object-cover"
                />
              ) : (
                // A section with no cover still gets a card the same shape as
                // the rest, rather than a ragged grid or an empty grey frame.
                // Deliberately quiet: most sections have no cover yet, and a
                // wall of bold monograms would shout over the few that do.
                <span
                  aria-hidden
                  className="bg-paper-sunken text-ink-subtle/40 grain grid aspect-video w-full place-items-center font-serif text-4xl font-bold"
                >
                  {[...category.name][0]}
                </span>
              )}

              <div className="flex flex-1 flex-col p-4">
                <p className="group-hover:text-brand font-semibold transition-colors">
                  {category.name}
                </p>
                {/* Two lines are reserved whether or not there is a second
                    one, and the count is pushed to the bottom, so every card
                    in a row rules off at the same height. */}
                <p
                  className={`clamp-2 mt-1 min-h-12 text-sm leading-relaxed ${
                    category.description ? 'text-ink-muted' : 'text-ink-subtle'
                  }`}
                >
                  {category.description
                    ? shorten(category.description)
                    : dictionary.category.noDescription}
                </p>
                <p className="text-ink-subtle mt-auto flex items-center justify-between pt-2 text-xs font-semibold tracking-[0.08em] uppercase">
                  {summary}
                  <span
                    aria-hidden
                    className="group-hover:text-brand text-base transition-colors"
                  >
                    →
                  </span>
                </p>
              </div>
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
