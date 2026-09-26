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
} from '@coastal-talk-news/types';
import type { Locale } from './i18n/types';

/** Maps the UI-language toggle to the article-content language it now filters to. */
const ARTICLE_LANGUAGE_BY_LOCALE: Record<Locale, string> = {
  en: 'ENGLISH',
  kn: 'KANNADA',
};

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

/** Content changes on a publish, so a short window keeps pages fresh but cheap. */
const REVALIDATE_SECONDS = 60;

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

async function fetchPublicJson<T>(path: string, attempt = 0): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/public${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
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
    return fetchPublicJson<T>(path, attempt + 1);
  }
}

async function fetchPublic<T>(path: string): Promise<T> {
  const payload = await fetchPublicJson<ApiSuccess<T>>(path);
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

export async function getSite(): Promise<PublicSiteDto> {
  const site = await fetchPublic<PublicSiteDto>('/site');
  return {
    ...site,
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
  page: 'about' | 'contact' | 'advertise' | 'privacy',
  locale?: Locale,
): Promise<PublicPageDto> {
  const language = locale ? ARTICLE_LANGUAGE_BY_LOCALE[locale] : undefined;
  return fetchPublic<PublicPageDto>(
    `/pages/${page}${language ? `?language=${language}` : ''}`,
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

/**
 * Null when there is no such published article — either the id doesn't
 * resolve (404) or it isn't a well-formed id at all (400, from the route's
 * uuid check). Both mean the same thing to a reader following a stale link.
 */
export async function getArticle(id: string): Promise<PublicArticleDto | null> {
  try {
    return await fetchPublic<PublicArticleDto>(`/articles/${id}`);
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

/** Throws ApiClientError (404) for an unknown or deactivated category id. */
export async function getCategory(id: string): Promise<CategoryDto> {
  return fetchPublic<CategoryDto>(`/categories/${id}`);
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
  const { data, meta } = await fetchPublicList<PublicArticleCardDto>(
    `/categories/${id}/articles?page=${page}&limit=${limit}&language=${language}`,
  );
  return { articles: data, meta };
}

export interface ArticlesByPriorityPage {
  articles: PublicArticleCardDto[];
  meta: PaginationMeta;
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
