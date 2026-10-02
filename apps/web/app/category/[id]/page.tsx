import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { PublicNavCategoryDto } from '@coastal-talk-news/types';
import {
  SiblingLinks,
  SubcategoryGrid,
} from '../../../components/news/CategoryLinks';
import { HeroStory } from '../../../components/news/HeroStory';
import { StoryCard } from '../../../components/news/StoryCard';
import { StoryImage } from '../../../components/news/StoryImage';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import {
  ApiClientError,
  getCategory,
  getCategoryArticles,
  getSite,
} from '../../../lib/api';
import { categoryName } from '../../../lib/category-name';
import { getDictionary } from '../../../lib/i18n/dictionaries';
import { getLocale } from '../../../lib/i18n/server';
import { buildMetadata } from '../../../lib/seo';
import { getOrigin } from '../../../lib/site-url';

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

/** The groups this category sits under, outermost first. */
function ancestorsOf(
  id: string,
  categories: PublicNavCategoryDto[],
): PublicNavCategoryDto[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const trail: PublicNavCategoryDto[] = [];
  let parentId = byId.get(id)?.parentId ?? null;
  while (parentId) {
    const parent = byId.get(parentId);
    if (!parent) break;
    trail.unshift(parent);
    parentId = parent.parentId;
  }
  return trail;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const [category, { settings }, locale, origin] = await Promise.all([
      getCategory(id),
      getSite(),
      getLocale(),
      getOrigin(),
    ]);
    return buildMetadata({
      settings,
      locale,
      origin,
      title: categoryName(category, locale),
      description: category.description,
      image: category.coverImage,
      path: `/category/${category.id}`,
    });
  } catch {
    // An unknown id renders the not-found page; it needs no tags of its own.
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

  const { categories: navCategories } = await getSite();
  const self = navCategories.find((entry) => entry.id === id);
  const subcategories = self?.children ?? [];
  const isGroup = subcategories.length > 0;
  const ancestors = ancestorsOf(id, navCategories);
  const parent = ancestors.at(-1);
  const siblings = (parent?.children ?? []).filter(
    (sibling) => sibling.id !== id,
  );

  // A group never holds articles of its own, so its page lists its sections
  // instead and the archive query is skipped rather than fetched empty.
  const { articles, meta } = isGroup
    ? { articles: [], meta: { page: 1, totalPages: 1 } }
    : await getCategoryArticles(id, {
        page,
        limit: ARTICLES_PER_PAGE,
        locale,
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
    <div className="py-5 sm:py-6">
      <nav
        aria-label="Breadcrumb"
        className="text-ink-subtle mb-4 flex flex-wrap items-center gap-1.5 text-sm"
      >
        <Link href="/" className="hover:text-brand transition-colors">
          {dictionary.common.home}
        </Link>
        {ancestors.map((ancestor) => (
          <span key={ancestor.id} className="flex items-center gap-1.5">
            <span aria-hidden>/</span>
            <Link
              href={`/category/${ancestor.id}`}
              className="hover:text-brand transition-colors"
            >
              {categoryName(ancestor, locale)}
            </Link>
          </span>
        ))}
        <span aria-hidden>/</span>
        <span className="text-ink font-medium">
          {categoryName(category, locale)}
        </span>
      </nav>

      <header className="border-ink mb-6 flex flex-col gap-5 border-b-2 pb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {categoryName(category, locale)}
          </h1>
          {category.description ? (
            <p className="text-ink-muted mt-2 max-w-2xl leading-relaxed">
              {category.description}
            </p>
          ) : (
            // A group has no archive of its own, so without a description of
            // its own it says what it is instead of sitting under a bare name.
            isGroup && (
              <p className="text-ink-muted mt-2 max-w-2xl leading-relaxed">
                {dictionary.category.sectionsDescription}
              </p>
            )
          )}
        </div>

        {/* Drawn at its own proportions, never cropped, and never larger than
            the uploaded file. */}
        {category.coverImage && (
          <StoryImage
            image={category.coverImage}
            alt=""
            priority
            sizes="(min-width: 640px) 288px, 100vw"
            className="rounded-card h-auto w-full shrink-0 sm:w-72"
            style={{ maxWidth: category.coverImage.width }}
          />
        )}
      </header>

      {isGroup ? (
        <SubcategoryGrid categories={subcategories} locale={locale} />
      ) : articles.length === 0 ? (
        <EmptyState
          variant="page"
          title={dictionary.category.noStoriesTitle}
          description={dictionary.category.noStoriesDescription(
            categoryName(category, locale),
          )}
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

      {parent && (
        <SiblingLinks
          label={dictionary.category.moreIn(categoryName(parent, locale))}
          categories={siblings}
          locale={locale}
        />
      )}
    </div>
  );
}
