import type { UpdateSiteSettingsRequest } from '@coastal-talk-news/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsApi } from '../../api/settings.js';
import { ApiError } from '../../api/client.js';
import { queryKeys } from '../../api/queryKeys.js';

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/**
 * One mutation shared by both tabs. The singleton has a single cache entry, so
 * a successful PATCH writes the response straight into it instead of
 * refetching — each tab's `onSuccess` (passed at call time) picks its own
 * toast copy.
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateSiteSettingsRequest) => settingsApi.update(body),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings, settings);
    },
    onError: (error) =>
      toast.error(messageFor(error, 'Could not save these settings.')),
  });
}
