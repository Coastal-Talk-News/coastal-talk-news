import Link from 'next/link';
import { AdBand } from '../components/news/AdBand';
import { HeroStory } from '../components/news/HeroStory';
import { StoryCard } from '../components/news/StoryCard';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeading } from '../components/ui/SectionHeading';
import { adsForZone } from '../lib/ads';
import { getHome, getSite } from '../lib/api';

const HERO_SECONDARY = 3;

/**
 * A four-column grid holding two cards reads as two empty columns, so the track
 * count follows however many cards the newsroom actually published.
 */
function gridColumns(count: number): string {
  if (count <= 1) return '';
  if (count === 2) return 'sm:grid-cols-2';
  if (count === 3) return 'sm:grid-cols-2 lg:grid-cols-3';
  return 'sm:grid-cols-2 lg:grid-cols-4';
}

export default async function HomePage() {
  const [home, site] = await Promise.all([getHome(), getSite()]);
  const { leadStory, topStories, latestNews, categorySections } = home;
  const { advertisements } = site;

  const hasAnyStory =
    leadStory !== null ||
    topStories.length > 0 ||
    latestNews.length > 0 ||
    categorySections.length > 0;

  if (!hasAnyStory) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <EmptyState
          variant="page"
          title="No stories published yet"
          description="Once the newsroom publishes its first article it will appear right here."
        />
      </div>
    );
  }

  const hero = leadStory ?? topStories[0] ?? null;
  const withoutHero = topStories.filter((article) => article.id !== hero?.id);
  const remaining = withoutHero.slice(HERO_SECONDARY);
  const topPicks = withoutHero.slice(0, HERO_SECONDARY);

  // On a light news day there aren't enough top stories to fill the column
  // beside the hero, so it borrows from the latest list rather than sitting
  // blank — and the rail then shows only what wasn't borrowed.
  const spare = latestNews.filter(
    (article) =>
      article.id !== hero?.id &&
      !topPicks.some((picked) => picked.id === article.id),
  );
  const secondary = [
    ...topPicks,
    ...spare.slice(0, HERO_SECONDARY - topPicks.length),
  ];
  const railLatest = spare.slice(HERO_SECONDARY - topPicks.length, 5);

  // The hero widens into whatever the secondary list doesn't need, so a slow
  // news day doesn't leave a half-empty column beside it.
  const heroSpan =
    secondary.length === 0
      ? 'lg:col-span-9'
      : secondary.length === 1
        ? 'lg:col-span-6'
        : 'lg:col-span-5';
  const secondarySpan =
    secondary.length === 1 ? 'lg:col-span-3' : 'lg:col-span-4';

  return (
    <div className="py-6 sm:py-8">
      <section
        aria-label="Top stories"
        className="grid gap-6 lg:grid-cols-12 lg:gap-8"
      >
        <div className={heroSpan}>{hero && <HeroStory article={hero} />}</div>

        {secondary.length > 0 && (
          <ul className={`divide-rule flex flex-col divide-y ${secondarySpan}`}>
            {secondary.map((article) => (
              <li key={article.id} className="py-4 first:pt-0 last:pb-0">
                <StoryCard article={article} layout="row" showCategory />
              </li>
            ))}
          </ul>
        )}

        {railLatest.length > 0 && (
          <div className="lg:col-span-3">
            <SectionHeading title="Latest News" />
            <ul className="divide-rule flex flex-col divide-y">
              {railLatest.map((article) => (
                <li key={article.id} className="py-3 first:pt-0 last:pb-0">
                  <StoryCard article={article} layout="row" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {remaining.length > 0 && (
        <section aria-label="More top stories" className="mt-12">
          <SectionHeading title="Top Stories" />
          <div
            className={`grid gap-x-6 gap-y-8 ${gridColumns(remaining.length)}`}
          >
            {remaining.map((article) => (
              <StoryCard
                key={article.id}
                article={article}
                showSummary
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
              />
            ))}
          </div>
        </section>
      )}

      {categorySections.length > 0 && (
        <>
          <AdBand
            advertisements={adsForZone(advertisements, 'midBand')}
            variant="leaderboard"
            className="mt-12"
          />

          <section aria-label="News by category" className="mt-12">
            <SectionHeading title="News by Category" />
            <div
              className={`grid gap-x-6 gap-y-10 ${gridColumns(categorySections.length)}`}
            >
              {categorySections.map(({ category, articles }) => {
                const [lead, ...rest] = articles;
                return (
                  <div key={category.id}>
                    <div className="border-rule mb-4 flex items-baseline justify-between border-b pb-2">
                      <h3 className="text-brand text-base font-bold">
                        {category.name}
                      </h3>
                      <Link
                        href={`/category/${category.id}`}
                        className="text-ink-subtle hover:text-brand text-xs font-semibold transition-colors"
                      >
                        View all
                      </Link>
                    </div>

                    {lead && (
                      <StoryCard
                        article={lead}
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                      />
                    )}

                    {rest.length > 0 && (
                      <ul className="border-rule divide-rule mt-4 divide-y border-t">
                        {rest.map((article) => (
                          <li key={article.id} className="py-3">
                            <StoryCard article={article} layout="row" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
