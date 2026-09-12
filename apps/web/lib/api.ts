import type {
  ApiSuccess,
  PublicArticleDto,
  PublicHomeDto,
  PublicSiteDto,
} from '@coastal-talk-news/types';

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
 * A 4xx is an answer, not an outage — an unpublished article or a malformed id
 * should reach the not-found page immediately instead of being retried for
 * twenty seconds and then surfacing as a server error.
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

async function fetchPublic<T>(path: string, attempt = 0): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/public${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (response.status >= 400 && response.status < 500) {
      throw new ApiClientError(response.status, path);
    }
    if (!response.ok) {
      throw new ApiUnavailableError(path);
    }
    const payload = (await response.json()) as ApiSuccess<T>;
    return payload.data;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    const delay = RETRY_DELAYS_MS[attempt];
    if (delay === undefined) {
      throw error instanceof ApiUnavailableError
        ? error
        : new ApiUnavailableError(path, error);
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchPublic<T>(path, attempt + 1);
  }
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

export async function getHome(): Promise<PublicHomeDto> {
  const home = await fetchPublic<PublicHomeDto>('/home');
  return {
    ...home,
    categorySections: list(home.categorySections),
  };
}

/**
 * Null when there is no such published article — either the id doesn't resolve
 * (404) or it isn't a well-formed id at all (400, from the route's uuid check).
 * Both mean the same thing to a reader following a stale link.
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
