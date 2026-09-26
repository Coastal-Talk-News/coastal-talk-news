import { after } from 'next/server';
import { recordArticleView } from '../../../lib/api';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The browser cannot reach the news API directly (its address is server-side
 * configuration), so the tracker beacons the article id here. The reply goes
 * out at once; the count is forwarded after it, so the reader never waits on
 * the API.
 */
export async function POST(request: Request) {
  const id = (await request.text()).trim();
  if (!UUID.test(id)) return new Response(null, { status: 400 });

  // Without the reader's address the API would see only this server, and its
  // per-client limit would be shared by every reader at once.
  const forwardedFor = request.headers.get('x-forwarded-for');
  after(() => recordArticleView(id, forwardedFor));
  return new Response(null, { status: 204 });
}
