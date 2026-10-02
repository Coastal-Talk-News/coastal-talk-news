import { headers } from 'next/headers';

/**
 * The absolute origin this request came in on. Canonical URLs, Open Graph
 * tags and share links all need one, and the site answers on a different
 * host in every environment — reading it from the request keeps that out of
 * the build config entirely.
 */
export async function getOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const protocol =
    headerList.get('x-forwarded-proto') ??
    (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}
