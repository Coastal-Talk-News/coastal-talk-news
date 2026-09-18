import Link from 'next/link';
import { CategoryPreviewRow } from '../components/news/CategoryPreviewRow';
import { HeroStory } from '../components/news/HeroStory';
import { StoryCard } from '../components/news/StoryCard';
import { TopStoriesPanel } from '../components/news/TopStoriesPanel';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeading } from '../components/ui/SectionHeading';
import { getHome } from '../lib/api';
import { getDictionary } from '../lib/i18n/dictionaries';
import { getLocale } from '../lib/i18n/server';
import { gridColumnsFor } from '../lib/layout';

// Below this, a sidebar column would run out of stories long before the hero
// beside it runs out of height, so the few there are go under it at full
// width instead of leaving a tall empty gutter.
const MIN_SIDEBAR_STORIES = 3;

export default async function HomePage() {
  const locale = await getLocale();
  const home = await getHome(locale);
  const { leadStories, featured, topStories, categorySections } = home;
  const dictionary = getDictionary(locale);

  if (
    leadStories.length === 0 &&
    featured.length === 0 &&
    topStories.length === 0 &&
    categorySections.length === 0
  ) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <EmptyState
          variant="page"
          title={dictionary.home.noStoriesTitle}
          description={dictionary.home.noStoriesDescription}
        />
      </div>
    );
  }

  const [hero, ...strip] = leadStories;
  const asSidebar = strip.length >= MIN_SIDEBAR_STORIES;

  return (
    <div className="flex flex-col gap-10 py-5 sm:gap-12 sm:py-6">
      {hero && (
        <section aria-label={dictionary.home.leadStories}>
          <div
            className={
              asSidebar ? 'grid items-start gap-5 lg:grid-cols-12 lg:gap-6' : ''
            }
          >
            <div className={asSidebar ? 'lg:col-span-8' : ''}>
              <HeroStory article={hero} locale={locale} />
            </div>

            {strip.length > 0 &&
              (asSidebar ? (
                <ul className="divide-rule flex flex-col divide-y lg:col-span-4">
                  {strip.map((article) => (
                    <li key={article.id} className="py-3 first:pt-0 last:pb-0">
                      <StoryCard
                        article={article}
                        layout="row"
                        showCategory
                        locale={locale}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <ul
                  className={`mt-6 grid gap-x-5 gap-y-5 ${gridColumnsFor(strip.length)}`}
                >
                  {strip.map((article) => (
                    <li key={article.id}>
                      <StoryCard
                        article={article}
                        layout={strip.length === 1 ? 'wide' : 'row'}
                        showSummary={strip.length === 1}
                        showCategory
                        locale={locale}
                      />
                    </li>
                  ))}
                </ul>
              ))}
          </div>

          {home.hasMoreLeadStories && (
            <div className="mt-4 flex justify-end">
              <Link
                href="/lead-stories"
                className="text-brand hover:text-brand-hover text-sm font-semibold transition-colors"
              >
                {dictionary.home.viewAllLeadStories} <span aria-hidden>→</span>
              </Link>
            </div>
          )}
        </section>
      )}

      {topStories.length > 0 && (
        <section aria-label={dictionary.home.topStories}>
          <SectionHeading title={dictionary.home.topStories} />
          <TopStoriesPanel articles={topStories} locale={locale} />
        </section>
      )}

      {featured.length > 0 && (
        <section aria-label={dictionary.home.featured}>
          <SectionHeading
            title={dictionary.home.featured}
            href={home.hasMoreFeatured ? '/featured' : undefined}
            linkLabel={dictionary.home.viewAllFeatured}
          />
          <div
            className={`grid gap-x-5 gap-y-7 ${gridColumnsFor(featured.length)}`}
          >
            {featured.map((article) => (
              <StoryCard
                key={article.id}
                article={article}
                layout={featured.length === 1 ? 'wide' : 'stacked'}
                showSummary
                showCategory={featured.length === 1}
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      {categorySections.map((section, index) => (
        <CategoryPreviewRow
          key={section.category.id}
          section={section}
          locale={locale}
          flip={index % 2 === 1}
        />
      ))}
    </div>
  );
}
