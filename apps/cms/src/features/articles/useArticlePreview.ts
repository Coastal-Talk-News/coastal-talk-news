import type { ArticlePreviewRequest } from '@coastal-talk-news/types';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { articlesApi } from '../../api/articles.js';
import { ApiError } from '../../api/client.js';
import { WEB_URL } from '../../config.js';

/**
 * Opens the draft as the reader page in a new tab. The tab is opened before the
 * request goes out: browsers only allow a window to open in direct response to
 * a click, and by the time the answer comes back that moment has passed.
 */
export function useArticlePreview() {
  const mutation = useMutation({ mutationFn: articlesApi.preview });

  async function open(request: ArticlePreviewRequest) {
    if (!WEB_URL) return;
    const tab = window.open('', '_blank');
    try {
      const { token } = await mutation.mutateAsync(request);
      const url = `${WEB_URL}/preview/${token}`;
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        toast('Your preview is ready', {
          action: { label: 'Open', onClick: () => window.open(url, '_blank') },
        });
      }
    } catch (error) {
      tab?.close();
      toast.error('Could not open the preview', {
        description:
          error instanceof ApiError ? error.message : 'Please try again.',
      });
    }
  }

  return { open, pending: mutation.isPending, available: Boolean(WEB_URL) };
}
