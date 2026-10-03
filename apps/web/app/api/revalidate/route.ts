import { revalidateTag } from 'next/cache';

/** Called server-to-server by the API to drop a cache tag on demand. */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return new Response(null, { status: 503 });

  if (request.headers.get('x-revalidate-secret') !== secret) {
    return new Response(null, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    tag?: unknown;
  } | null;
  const tag = typeof body?.tag === 'string' ? body.tag : null;
  if (!tag) return new Response(null, { status: 400 });

  // { expire: 0 } purges immediately; this app has no named cacheLife profiles.
  revalidateTag(tag, { expire: 0 });
  return new Response(null, { status: 204 });
}
