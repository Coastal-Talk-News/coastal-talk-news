import type { PublicCategorySectionDto } from '@coastal-talk-news/types';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';
import { gridColumnsFor } from '../../lib/layout';
import { SectionHeading } from '../ui/SectionHeading';
import { StoryCard } from './StoryCard';

interface CategoryPreviewRowProps {
  section: PublicCategorySectionDto;
  locale?: Locale;
  /** Sections alternate which side the lead card sits on, so a column of
   * them doesn't read as the same block repeated down the page. */
  flip?: boolean;
}

export function CategoryPreviewRow({
  section,
  locale = 'en',
  flip = false,
}: CategoryPreviewRowProps) {
  const { category, articles } = section;
  if (articles.length === 0) return null;

  const dictionary = getDictionary(locale);
  const hasMore = category.articleCount > articles.length;
  const heading = (
    <SectionHeading
      title={category.name}
      href={hasMore ? `/category/${category.id}` : undefined}
      linkLabel={dictionary.home.viewAllIn(category.name)}
    />
  );

  if (articles.length === 1) {
    return (
      <section aria-label={category.name}>
        {heading}
        <StoryCard
          article={articles[0]!}
          layout="wide"
          reverse={flip}
          showSummary
          locale={locale}
        />
      </section>
    );
  }

  // Two or three go in an even row. A lead card beside a list this short
  // would stand a good deal taller than it, and the difference reads as a
  // half-empty column.
  if (articles.length <= 3) {
    return (
      <section aria-label={category.name}>
        {heading}
        <div className={`grid gap-5 ${gridColumnsFor(articles.length)}`}>
          {articles.map((article) => (
            <StoryCard
              key={article.id}
              article={article}
              showSummary
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
              locale={locale}
            />
          ))}
        </div>
      </section>
    );
  }

  const [lead, ...rest] = articles;

  return (
    <section aria-label={category.name}>
      {heading}
      {/* Both columns sit at their own height. Stretching either one only
          opens a gap inside it — the card's dateline drifts away from the
          text, which is the space that shows. */}
      <div className="grid items-start gap-5 lg:grid-cols-12">
        <div className={`lg:col-span-7 ${flip ? 'lg:order-2' : ''}`}>
          <StoryCard
            article={lead!}
            showSummary
            sizes="(min-width: 1024px) 45vw, 90vw"
            locale={locale}
          />
        </div>

        <ul
          className={`divide-rule flex flex-col divide-y lg:col-span-5 ${
            flip ? 'lg:order-1' : ''
          }`}
        >
          {rest.map((article) => (
            <li key={article.id} className="py-4 first:pt-0 last:pb-0">
              <StoryCard
                article={article}
                layout="row"
                roomy
                showSummary
                locale={locale}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
