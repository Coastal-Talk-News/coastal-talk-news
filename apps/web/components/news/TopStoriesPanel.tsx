import type { PublicArticleCardDto } from '@coastal-talk-news/types';
import type { Locale } from '../../lib/i18n/types';
import { StoryCard } from './StoryCard';

/**
 * The last 24 hours, set as a tinted wire-feed panel rather than another row
 * of picture cards — it is the one section on the page defined by time, not
 * by editorial weight, and reads better scanned than browsed.
 */
export function TopStoriesPanel({
  articles,
  locale = 'en',
}: {
  articles: PublicArticleCardDto[];
  locale?: Locale;
}) {
  if (articles.length === 0) return null;

  // Rules separate a single stacked column; side by side the gap does it,
  // and a rule between grid siblings lands in the wrong place anyway.
  const columns =
    articles.length > 1
      ? 'sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4 sm:divide-y-0'
      : '';

  return (
    <div className="border-rule bg-paper-sunken rounded-card border p-4 sm:p-5">
      <ul className={`divide-rule grid divide-y ${columns}`}>
        {articles.map((article) => (
          <li key={article.id} className="py-3 first:pt-0 last:pb-0 sm:py-0">
            <StoryCard
              article={article}
              layout="row"
              showCategory
              locale={locale}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
