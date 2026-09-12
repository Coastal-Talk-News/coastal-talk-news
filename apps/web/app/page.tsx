import type { PublicArticleCardDto } from '@coastal-talk-news/types';
import { CategoryMenu } from '../components/news/CategoryMenu';
import { HeroStory } from '../components/news/HeroStory';
import { StoryCard } from '../components/news/StoryCard';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeading } from '../components/ui/SectionHeading';
import { getHome, getSite } from '../lib/api';
import { getDictionary } from '../lib/i18n/dictionaries';
import { getLocale } from '../lib/i18n/server';

// The hero banner is one category's lead article plus a sidebar of the next
// few categories' lead articles — HERO_CATEGORIES picks how many of those.
const HERO_CATEGORIES = 4;
// Top Stories then reuses the same section list at a second depth: the
// *second*-most-recent article from each of the first TOP_STORY_CATEGORIES,
// so it never repeats a headline the hero banner already showed.
const TOP_STORY_CATEGORIES = 6;

function isArticle(
  article: PublicArticleCardDto | undefined,
): article is PublicArticleCardDto {
  return Boolean(article);
}

export default async function HomePage() {
  const [home, site, locale] = await Promise.all([
    getHome(),
    getSite(),
    getLocale(),
  ]);
  const { categorySections } = home;
  const dictionary = getDictionary(locale);

  if (categorySections.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <EmptyState
          variant="page"
          title={dictionary.home.noStoriesTitle}
          description={dictionary.home.noStoriesDescription}
        />
      </div>
    );
  }

  const [heroSection, ...sideSections] = categorySections.slice(
    0,
    HERO_CATEGORIES,
  );
  const hero = heroSection?.articles[0] ?? null;
  const sideStories = sideSections
    .map((section) => section.articles[0])
    .filter(isArticle);

  const topStories = categorySections
    .slice(0, TOP_STORY_CATEGORIES)
    .map((section) => section.articles[1])
    .filter(isArticle);

  return (
    <div className="py-6 sm:py-8">
      <section
        aria-label="Featured categories"
        className="grid gap-6 lg:grid-cols-12 lg:gap-8"
      >
        <div className={sideStories.length > 0 ? 'lg:col-span-8' : ''}>
          {hero && <HeroStory article={hero} locale={locale} />}
        </div>

        {sideStories.length > 0 && (
          <ul className="divide-rule flex flex-col divide-y lg:col-span-4">
            {sideStories.map((article) => (
              <li key={article.id} className="py-4 first:pt-0 last:pb-0">
                <StoryCard
                  article={article}
                  layout="row"
                  showCategory
                  locale={locale}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {site.categories.length > 0 && (
        <section aria-label="Browse by category" className="mt-10 sm:mt-12">
          <CategoryMenu categories={site.categories} locale={locale} />
        </section>
      )}

      {topStories.length > 0 && (
        <section aria-label="Top stories" className="mt-12">
          <SectionHeading title={dictionary.home.topStories} />
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {topStories.map((article) => (
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
      )}
    </div>
  );
}
