import type { ArticlePreviewRequest } from '@coastal-talk-news/types';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { articlesApi } from '../../api/articles.js';
import { ApiError } from '../../api/client.js';
import { WEB_URL } from '../../config.js';

const WEB_ORIGIN = WEB_URL ? new URL(WEB_URL).origin : null;

const READY_MESSAGE = 'ctn-preview:ready';
const DATA_MESSAGE = 'ctn-preview:data';

// Generous: the tab has to load and run its own JS bundle before it can
// answer, which a cold cache or a slow connection can stretch out.
const HANDSHAKE_TIMEOUT_MS = 15_000;

/**
 * Opens the draft as the reader page in a new tab and hands it the built
 * page directly over `postMessage`. Nothing is ever written to the server:
 * the API only builds the page and returns it, and the tab only ever holds
 * it in memory.
 *
 * The tab is opened before the request goes out: browsers only allow a
 * window to open in direct response to a click, and by the time the answer
 * comes back that moment has passed. The listener for the tab's "ready" ping
 * is attached in that same synchronous moment too, so a ping sent while the
 * build is still in flight is never missed.
 */
export function useArticlePreview() {
  const mutation = useMutation({ mutationFn: articlesApi.preview });

  async function open(request: ArticlePreviewRequest) {
    if (!WEB_URL || !WEB_ORIGIN) return;

    const tab = window.open(
      `${WEB_URL}/preview#origin=${encodeURIComponent(window.location.origin)}`,
      '_blank',
    );
    if (!tab) {
      toast.error('Your browser blocked the preview tab', {
        description: 'Allow pop-ups for this site and try again.',
      });
      return;
    }

    const ready = waitForReady(tab);
    try {
      const [article] = await Promise.all([
        mutation.mutateAsync(request),
        ready,
      ]);
      if (tab.closed) {
        throw new Error('The preview tab was closed.');
      }
      tab.postMessage({ type: DATA_MESSAGE, article }, WEB_ORIGIN);
    } catch (error) {
      tab.close();
      toast.error('Could not open the preview', {
        description:
          error instanceof ApiError ? error.message : 'Please try again.',
      });
    }
  }

  return { open, pending: mutation.isPending, available: Boolean(WEB_URL) };
}

function waitForReady(tab: Window): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('The preview tab did not respond in time.'));
    }, HANDSHAKE_TIMEOUT_MS);

    function onMessage(event: MessageEvent) {
      if (event.source !== tab || event.origin !== WEB_ORIGIN) return;
      if ((event.data as { type?: unknown } | null)?.type !== READY_MESSAGE) {
        return;
      }
      cleanup();
      resolve();
    }

    function cleanup() {
      clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
    }

    window.addEventListener('message', onMessage);
  });
}
