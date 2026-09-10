import type {
  AdvertisementDto,
  CreateAdvertisementRequest,
  UpdateAdvertisementRequest,
} from '@coastal-talk-news/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { advertisementsApi } from '../../api/advertisements.js';
import { ApiError } from '../../api/client.js';
import { queryKeys } from '../../api/queryKeys.js';

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useAdvertisementMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.advertisements });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };

  const create = useMutation({
    mutationFn: (body: CreateAdvertisementRequest) =>
      advertisementsApi.create(body),
    onSuccess: () => {
      invalidate();
      toast.success('Advertisement added.');
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateAdvertisementRequest;
    }) => advertisementsApi.update(id, body),
    onSuccess: () => {
      invalidate();
      toast.success('Advertisement updated.');
    },
  });

  const remove = useMutation({
    mutationFn: (item: AdvertisementDto) => advertisementsApi.remove(item.id),
    onSuccess: () => {
      invalidate();
      toast.success('Advertisement deleted.');
    },
    onError: (error) =>
      toast.error(messageFor(error, 'Could not delete this advertisement.')),
  });

  return { create, update, remove };
}
