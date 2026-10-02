import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE, type Locale } from './lib/i18n/types';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';
const ARTICLE_PATH = /^\/article\/([\w-]+)\/?$/;

/** The language an article is written in, so a shared link opens to match. */
async function articleLocale(id: string): Promise<Locale> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/public/articles/${id}`,
      // The page is waiting on this, so a slow API must not hold it up.
      { signal: AbortSignal.timeout(2500) },
    );
    if (!response.ok) return 'en';
    const body = (await response.json()) as { data?: { language?: string } };
    return body.data?.language === 'KANNADA' ? 'kn' : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Every visit starts in English. A visit begins when someone arrives from
 * outside the site — a typed address, a bookmark, a search result or a shared
 * link — as opposed to clicking around inside it. Arriving resets the
 * language (dropping whatever an earlier visit left behind), except on an
 * article link, which opens in the language the article is written in. Moving
 * around inside the site keeps whichever language the reader has picked since.
 *
 * Browsers that don't send the Sec-Fetch headers are treated as mid-visit, so
 * for them the choice simply lasts until the browser is closed.
 */
export async function proxy(request: NextRequest) {
  const isDocumentNavigation =
    request.headers.get('sec-fetch-mode') === 'navigate' &&
    request.headers.get('sec-fetch-dest') === 'document';
  const isFromInsideSite =
    request.headers.get('sec-fetch-site') === 'same-origin';

  if (!isDocumentNavigation || isFromInsideSite) return NextResponse.next();

  const article = ARTICLE_PATH.exec(request.nextUrl.pathname);
  const locale = article ? await articleLocale(article[1]!) : 'en';

  const response = NextResponse.next();
  // No max-age: a session cookie, gone when the browser is closed.
  response.cookies.set(LOCALE_COOKIE, locale, { path: '/', sameSite: 'lax' });
  return response;
}

export const config = {
  // Pages only — not assets, images or the framework's own files.
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
};
