import type { UpdateSiteSettingsRequest } from '@coastal-talk-news/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsApi } from '../../api/settings.js';
import { ApiError } from '../../api/client.js';
import { queryKeys } from '../../api/queryKeys.js';

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

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
