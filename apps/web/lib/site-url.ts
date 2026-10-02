import { headers } from 'next/headers';

/**
 * PUBLIC_SITE_URL pins every absolute URL the site hands out — canonical
 * tags, Open Graph, structured data, the sitemap, share links — to one host,
 * so a copy served under another name (a Vercel preview, the bare domain)
 * still points search engines at the real one. Read once; a malformed value
 * is ignored rather than allowed to produce invalid tags.
 */
const CONFIGURED_SITE_URL = parseSiteUrl(process.env.PUBLIC_SITE_URL);

function parseSiteUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * The absolute origin every public URL is built on: the configured canonical
 * site URL when set, otherwise the host this request came in on (local
 * development, where there is no single right answer).
 */
export async function getOrigin(): Promise<string> {
  if (CONFIGURED_SITE_URL) return CONFIGURED_SITE_URL;

  const headerList = await headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const protocol =
    headerList.get('x-forwarded-proto') ??
    (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}
