import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HeroStory } from '../../../components/news/HeroStory';
import { StoryCard } from '../../../components/news/StoryCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import {
  ApiClientError,
  getCategory,
  getCategoryArticles,
} from '../../../lib/api';
import { getDictionary } from '../../../lib/i18n/dictionaries';
import { getLocale } from '../../../lib/i18n/server';

// One big lead card plus two rows of three — matches the grid the rest of
// the site already uses for a "cards" section (see the homepage's Top
// Stories grid).
const ARTICLES_PER_PAGE = 7;

interface CategoryPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const category = await getCategory(id);
    return {
      title: category.name,
      description: category.description ?? undefined,
    };
  } catch {
    return {};
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { id } = await params;
  const page = parsePage((await searchParams).page);
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  let category;
  try {
    category = await getCategory(id);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) notFound();
    throw error;
  }

  const { articles, meta } = await getCategoryArticles(id, {
    page,
    limit: ARTICLES_PER_PAGE,
  });

  // A page number past the end (a stale link, or someone editing the URL)
  // is a real 404, not an empty grid sitting under working pagination.
  if (page > 1 && articles.length === 0) {
    notFound();
  }

  // Only the very front of the section gets the lead-story treatment — page
  // 2 onward is a plain archive of older articles, same as the homepage only
  // gives its "first" category slot a hero, not every page of it.
  const isFirstPage = meta.page === 1;
  const [lead, ...rest] = articles;
  const gridArticles = isFirstPage ? rest : articles;

  return (
    <div className="py-6 sm:py-8">
      <nav
        aria-label="Breadcrumb"
        className="text-ink-subtle mb-4 flex items-center gap-1.5 text-sm"
      >
        <Link href="/" className="hover:text-brand transition-colors">
          {dictionary.common.home}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink font-medium">{category.name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">{category.name}</h1>
        {category.description && (
          <p className="text-ink-muted mt-2 max-w-2xl leading-relaxed">
            {category.description}
          </p>
        )}
      </header>

      {articles.length === 0 ? (
        <EmptyState
          variant="page"
          title={dictionary.category.noStoriesTitle}
          description={dictionary.category.noStoriesDescription(category.name)}
        />
      ) : (
        <>
          {isFirstPage && lead && (
            <div className="mb-10">
              <HeroStory article={lead} locale={locale} />
            </div>
          )}

          {gridArticles.length > 0 && (
            <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {gridArticles.map((article) => (
                <StoryCard
                  key={article.id}
                  article={article}
                  showSummary
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
              target <= 1 ? `/category/${id}` : `/category/${id}?page=${target}`
            }
            locale={locale}
          />
        </>
      )}
    </div>
  );
}
