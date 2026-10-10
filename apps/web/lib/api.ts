import type {
  ApiListSuccess,
  ApiSuccess,
  CategoryDto,
  PaginationMeta,
  PublicAdvertisementDetailDto,
  PublicArticleCardDto,
  PublicArticleDto,
  PublicHomeDto,
  PublicPageDto,
  PublicSiteDto,
  PublicSitemapDto,
} from '@coastal-talk-news/types';
import { isUuid } from '@coastal-talk-news/validation/slug';
import type { Locale } from './i18n/types';

/** Maps the UI-language toggle to the article-content language it now filters to. */
const ARTICLE_LANGUAGE_BY_LOCALE: Record<Locale, string> = {
  en: 'ENGLISH',
  kn: 'KANNADA',
};

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

/** Content changes on a publish, so a short window keeps pages fresh but cheap. */
const REVALIDATE_SECONDS = 60;

/** For content that changes rarely (an editor updating copy or a category's
 *  name, not a newsroom publishing) - a long backstop is fine, since saving
 *  it in the CMS invalidates its tag immediately regardless. Shared by the
 *  standalone pages and category metadata (not a category's article list,
 *  which still needs to reflect a fresh publish right away). */
const SLOW_CHANGING_REVALIDATE_SECONDS = 60 * 60;

export class ApiUnavailableError extends Error {
  constructor(path: string, cause?: unknown) {
    super(`Could not load ${path} from the news API.`);
    this.name = 'ApiUnavailableError';
    this.cause = cause;
  }
}

/**
 * A 4xx is an answer, not an outage — an unpublished article, an unknown or
 * deactivated category, or a malformed id should reach the not-found page
 * immediately instead of being retried for twenty seconds and then
 * surfacing as a server error.
 */
export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    path: string,
  ) {
    super(`${path} returned ${status}.`);
    this.name = 'ApiClientError';
  }
}

/**
 * A free-tier API sleeps when idle and can take half a minute to wake, which
 * would otherwise fail the whole build. Backs off across attempts to cover it.
 */
const RETRY_DELAYS_MS = [2_000, 6_000, 12_000];

interface CacheOptions {
  revalidate?: number;
  tags?: string[];
}

async function fetchPublicJson<T>(
  path: string,
  cache?: CacheOptions,
  attempt = 0,
): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/public${path}`, {
      next: {
        revalidate: cache?.revalidate ?? REVALIDATE_SECONDS,
        tags: cache?.tags,
      },
    });
    // A 4xx is a real answer (missing/deactivated resource, bad input) —
    // retrying it on a backoff would just delay a page that should resolve
    // (usually to not-found) right now.
    if (response.status >= 400 && response.status < 500) {
      throw new ApiClientError(response.status, path);
    }
    if (!response.ok) {
      throw new ApiUnavailableError(path);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    const delay = RETRY_DELAYS_MS[attempt];
    if (delay === undefined) {
      throw error instanceof ApiUnavailableError
        ? error
        : new ApiUnavailableError(path, error);
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchPublicJson<T>(path, cache, attempt + 1);
  }
}

async function fetchPublic<T>(path: string, cache?: CacheOptions): Promise<T> {
  const payload = await fetchPublicJson<ApiSuccess<T>>(path, cache);
  return payload.data;
}

async function fetchPublicList<T>(
  path: string,
): Promise<{ data: T[]; meta: PaginationMeta }> {
  const payload = await fetchPublicJson<ApiListSuccess<T>>(path);
  return { data: list(payload.data), meta: payload.meta };
}

/**
 * The site and the API deploy separately, so a running site can be newer than
 * the API it talks to. Missing collections become empty rather than crashing
 * a page over a section that simply isn't there yet.
 */
function list<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

/** Matches SiteSettings.articleCacheMinutes's own column default, for a
 *  settings row saved before that column existed. */
const DEFAULT_ARTICLE_CACHE_MINUTES = 60;

export async function getSite(): Promise<PublicSiteDto> {
  const site = await fetchPublic<PublicSiteDto>('/site');
  return {
    ...site,
    settings: {
      ...site.settings,
      articleCacheMinutes:
        site.settings.articleCacheMinutes ?? DEFAULT_ARTICLE_CACHE_MINUTES,
    },
    categories: list(site.categories),
    breakingNews: list(site.breakingNews),
    advertisements: list(site.advertisements),
  };
}

/** The newsroom's own copy for About, Contact or Advertise. Its own call
 * rather than part of /site, because only this page needs the body.
 * `locale` only matters to About, which can carry a separate Kannada body —
 * the API ignores it for Contact and Advertise. */
export async function getPage(
  page: 'about' | 'contact' | 'advertise' | 'privacy' | 'terms',
  locale?: Locale,
): Promise<PublicPageDto> {
  const language = locale ? ARTICLE_LANGUAGE_BY_LOCALE[locale] : undefined;
  return fetchPublic<PublicPageDto>(
    `/pages/${page}${language ? `?language=${language}` : ''}`,
    { revalidate: SLOW_CHANGING_REVALIDATE_SECONDS, tags: ['pages'] },
  );
}

export async function getHome(locale: Locale): Promise<PublicHomeDto> {
  const language = ARTICLE_LANGUAGE_BY_LOCALE[locale];
  const home = await fetchPublic<PublicHomeDto>(`/home?language=${language}`);
  return {
    leadStories: list(home.leadStories),
    featured: list(home.featured),
    topStories: list(home.topStories),
    hasMoreLeadStories: home.hasMoreLeadStories ?? false,
    hasMoreFeatured: home.hasMoreFeatured ?? false,
    categorySections: list(home.categorySections),
  };
}

/** Best effort: a failed count must never reach the reader. */
export async function recordArticleView(
  id: string,
  forwardedFor: string | null,
): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/v1/public/articles/${id}/view`, {
      method: 'POST',
      headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : {},
    });
  } catch {
    // See above.
  }
}

/** 404 and 400 both mean "no such page" to a reader following a link. */
async function orNull<T>(load: Promise<T>): Promise<T | null> {
  try {
    return await load;
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.status === 404 || error.status === 400)
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * A published article by slug (current or former) or by id — one request
 * either way; the result carries the current slug. Null for a draft, an
 * archived or deleted article, or a key that matches nothing. Called by both
 * generateMetadata and the page: the identical fetch is made once per render
 * and then served from the data cache, so the article is never requested
 * twice.
 *
 * `cacheMinutes` is Settings → Advanced's configurable cache window - a
 * backstop only, since saving the article invalidates both its id tag and
 * its slug tag immediately (see webRevalidate.ts on the API side) - whichever
 * one a reader's cached page actually used.
 */
export function getArticle(
  key: string,
  cacheMinutes: number,
): Promise<PublicArticleDto | null> {
  return orNull(
    fetchPublic<PublicArticleDto>(`/articles/${encodeURIComponent(key)}`, {
      revalidate: cacheMinutes * 60,
      tags: ['articles', `article:${key}`],
    }),
  );
}

/** An active category by slug, or by the id that old links still carry. */
export function findCategory(key: string): Promise<CategoryDto | null> {
  return orNull(
    fetchPublic<CategoryDto>(
      isUuid(key)
        ? `/categories/${key}`
        : `/categories/by-slug/${encodeURIComponent(key)}`,
      {
        revalidate: SLOW_CHANGING_REVALIDATE_SECONDS,
        tags: ['categories', `category:${key}`],
      },
    ),
  );
}

/** `revalidate` matches sitemap.ts's own: a shorter fetch window would
 * shorten the route's, rebuilding the sitemap every minute. */
export async function getSitemap(
  revalidate: number,
): Promise<PublicSitemapDto> {
  const sitemap = await fetchPublic<PublicSitemapDto>('/sitemap', {
    revalidate,
  });
  return {
    articles: list(sitemap.articles),
    categories: list(sitemap.categories),
  };
}

/**
 * Null when no advertisement with this id is currently running - it never
 * started, its run is over, or the id is malformed. All of them mean the same
 * thing to a reader following a link: there is no page here.
 */
export async function getAdvertisement(
  id: string,
): Promise<PublicAdvertisementDetailDto | null> {
  try {
    return await fetchPublic<PublicAdvertisementDetailDto>(
      `/advertisements/${id}`,
    );
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.status === 404 || error.status === 400)
    ) {
      return null;
    }
    throw error;
  }
}

export interface CategoryArticlesPage {
  articles: PublicArticleCardDto[];
  meta: PaginationMeta;
}

/** Throws ApiClientError (404) for an unknown or deactivated category id. */
export async function getCategoryArticles(
  id: string,
  { page, limit, locale }: { page: number; limit: number; locale: Locale },
): Promise<CategoryArticlesPage> {
  const language = ARTICLE_LANGUAGE_BY_LOCALE[locale];
  // The category archive has a seven-article first page and a different size
  // afterwards. Fetching page N with the API's normal page/limit offset would
  // skip or duplicate articles because that offset assumes one fixed size.
  const requestLimit = page === 1 ? limit : 7 + (page - 1) * 9;
  const { data, meta } = await fetchPublicList<PublicArticleCardDto>(
    `/categories/${id}/articles?page=1&limit=${requestLimit}&language=${language}`,
  );
  const start = page === 1 ? 0 : 7 + (page - 2) * 9;
  return {
    articles: data.slice(start, start + limit),
    meta: { ...meta, page, limit },
  };
}

export interface ArticlesByPriorityPage {
  articles: PublicArticleCardDto[];
  meta: PaginationMeta;
}

export async function getRecentArticles(
  excludeId: string,
  { page, limit, locale }: { page: number; limit: number; locale: Locale },
): Promise<ArticlesByPriorityPage> {
  const language = ARTICLE_LANGUAGE_BY_LOCALE[locale];
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    language,
    excludeId,
  });
  try {
    const { data, meta } = await fetchPublicList<PublicArticleCardDto>(
      `/articles/recent?${params.toString()}`,
    );
    return { articles: data, meta };
  } catch (error) {
    // Keep the article page compatible while the API and web deployments
    // roll out independently. Older APIs treat "recent" as an article key.
    if (!(error instanceof ApiClientError) || error.status !== 404) {
      throw error;
    }

    const home = await getHome(locale);
    const seen = new Set<string>();
    const articles = [...home.topStories, ...home.leadStories, ...home.featured]
      .filter(
        (article) =>
          article.id !== excludeId &&
          !seen.has(article.id) &&
          seen.add(article.id),
      )
      .slice(0, limit);
    return {
      articles,
      meta: {
        page,
        limit,
        total: articles.length,
        totalPages: articles.length > 0 ? 1 : 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }
}

export async function getArticlesByPriority(
  priority: 'LEAD_STORY' | 'FEATURED',
  { page, limit, locale }: { page: number; limit: number; locale: Locale },
): Promise<ArticlesByPriorityPage> {
  const language = ARTICLE_LANGUAGE_BY_LOCALE[locale];
  const { data, meta } = await fetchPublicList<PublicArticleCardDto>(
    `/articles?priority=${priority}&page=${page}&limit=${limit}&language=${language}`,
  );
  return { articles: data, meta };
}

/** The content-language filter — 'all' means both, mixed together. */
export type SearchLanguage = 'all' | 'en' | 'kn';

export interface SearchResultsPage {
  articles: PublicArticleCardDto[];
  meta: PaginationMeta;
}

const SEARCH_LANGUAGE_PARAM: Record<
  Exclude<SearchLanguage, 'all'>,
  string
> = ARTICLE_LANGUAGE_BY_LOCALE;

export async function getSearchResults(
  query: string,
  {
    language,
    page,
    limit,
  }: { language: SearchLanguage; page: number; limit: number },
): Promise<SearchResultsPage> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
  });
  if (language !== 'all') {
    params.set('language', SEARCH_LANGUAGE_PARAM[language]);
  }
  const { data, meta } = await fetchPublicList<PublicArticleCardDto>(
    `/search?${params.toString()}`,
  );
  return { articles: data, meta };
}
