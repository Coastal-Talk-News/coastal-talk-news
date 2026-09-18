import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HeroStory } from '../../components/news/HeroStory';
import { StoryCard } from '../../components/news/StoryCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { getArticlesByPriority, getSite } from '../../lib/api';
import { getDictionary } from '../../lib/i18n/dictionaries';
import { getLocale } from '../../lib/i18n/server';
import { buildMetadata } from '../../lib/seo';
import { getOrigin } from '../../lib/site-url';

// One big lead card plus two rows of three — matches the grid the rest of
// the site already uses for a "cards" section (see the category page).
const ARTICLES_PER_PAGE = 7;

interface FeaturedPageProps {
  searchParams: Promise<{ page?: string }>;
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [{ settings }, locale, origin] = await Promise.all([
      getSite(),
      getLocale(),
      getOrigin(),
    ]);
    const dictionary = getDictionary(locale);
    return buildMetadata({
      settings,
      locale,
      origin,
      title: dictionary.featured.title,
      description: dictionary.featured.description,
      path: '/featured',
    });
  } catch {
    return {};
  }
}

export default async function FeaturedPage({
  searchParams,
}: FeaturedPageProps) {
  const page = parsePage((await searchParams).page);
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  const { articles, meta } = await getArticlesByPriority('FEATURED', {
    page,
    limit: ARTICLES_PER_PAGE,
    locale,
  });

  // A page number past the end (a stale link, or someone editing the URL)
  // is a real 404, not an empty grid sitting under working pagination.
  if (page > 1 && articles.length === 0) {
    notFound();
  }

  const isFirstPage = meta.page === 1;
  const [lead, ...rest] = articles;
  const gridArticles = isFirstPage ? rest : articles;

  return (
    <div className="py-5 sm:py-6">
      <nav
        aria-label="Breadcrumb"
        className="text-ink-subtle mb-4 flex items-center gap-1.5 text-sm"
      >
        <Link href="/" className="hover:text-brand transition-colors">
          {dictionary.common.home}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink font-medium">
          {dictionary.featured.title}
        </span>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl font-bold sm:text-4xl">
          {dictionary.featured.title}
        </h1>
        <p className="text-ink-muted mt-2 max-w-2xl leading-relaxed">
          {dictionary.featured.description}
        </p>
      </header>

      {articles.length === 0 ? (
        <EmptyState
          variant="page"
          title={dictionary.featured.noStoriesTitle}
          description={dictionary.featured.noStoriesDescription}
        />
      ) : (
        <>
          {isFirstPage && lead && (
            <div className="mb-8">
              <HeroStory article={lead} locale={locale} />
            </div>
          )}

          {gridArticles.length > 0 && (
            <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              {gridArticles.map((article) => (
                <StoryCard
                  key={article.id}
                  article={article}
                  showSummary
                  showCategory
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  locale={locale}
                />
              ))}
            </div>
          )}

          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            href={(target) =>
              target <= 1 ? '/featured' : `/featured?page=${target}`
            }
            locale={locale}
          />
        </>
      )}
    </div>
  );
}
