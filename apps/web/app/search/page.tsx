import type { Metadata } from 'next';
import { StoryCard } from '../../components/news/StoryCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LanguageFilter } from '../../components/ui/LanguageFilter';
import { Pagination } from '../../components/ui/Pagination';
import { getSearchResults, type SearchLanguage } from '../../lib/api';
import { getDictionary } from '../../lib/i18n/dictionaries';
import { getLocale } from '../../lib/i18n/server';

// A denser grid than the category page's — search results skew toward
// scanning many candidates rather than a curated front-of-section layout.
const RESULTS_PER_PAGE = 12;

export const metadata: Metadata = { title: 'Search' };

interface SearchPageProps {
  searchParams: Promise<{ q?: string; lang?: string; page?: string }>;
}

function parseLanguage(value: string | undefined): SearchLanguage {
  return value === 'en' || value === 'kn' ? value : 'all';
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q ?? '').trim();
  const language = parseLanguage(params.lang);
  const page = parsePage(params.page);
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  // The query owns `q` and carries the current filter/page unless a link
  // overrides one — e.g. switching language always jumps back to page 1.
  function buildHref(overrides: { lang?: SearchLanguage; page?: number }) {
    const next = new URLSearchParams({ q: query });
    const lang = overrides.lang ?? language;
    if (lang !== 'all') next.set('lang', lang);
    const targetPage = overrides.page ?? page;
    if (targetPage > 1) next.set('page', String(targetPage));
    return `/search?${next.toString()}`;
  }

  // No query yet — a neutral prompt, not a "no results" state, since no
  // search has actually been attempted.
  if (!query) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          variant="page"
          title={dictionary.search.promptTitle}
          description={dictionary.search.promptDescription}
        />
      </div>
    );
  }

  const { articles, meta } = await getSearchResults(query, {
    language,
    page,
    limit: RESULTS_PER_PAGE,
  });

  return (
    <div className="py-6 sm:py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="min-w-0 text-2xl font-bold break-words sm:text-3xl">
          {dictionary.search.resultsFor(query)}
        </h1>
        <LanguageFilter
          active={language}
          locale={locale}
          href={(lang) => buildHref({ lang, page: 1 })}
        />
      </header>

      {articles.length === 0 ? (
        <EmptyState
          variant="page"
          title={dictionary.search.noResultsTitle}
          description={dictionary.search.noResultsDescription(query)}
        />
      ) : (
        <>
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
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

          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            href={(target) => buildHref({ page: target })}
            locale={locale}
          />
        </>
      )}
    </div>
  );
}
