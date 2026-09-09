import type {
  BreakingNewsDto,
  CreateBreakingNewsRequest,
  UpdateBreakingNewsRequest,
} from '@coastal-talk-news/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { breakingNewsApi } from '../../api/breaking-news.js';
import { ApiError } from '../../api/client.js';
import { queryKeys } from '../../api/queryKeys.js';

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useBreakingNewsMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.breakingNews });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };

  const create = useMutation({
    mutationFn: (body: CreateBreakingNewsRequest) =>
      breakingNewsApi.create(body),
    onSuccess: () => {
      invalidate();
      toast.success('Breaking news added.');
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateBreakingNewsRequest;
    }) => breakingNewsApi.update(id, body),
    onSuccess: () => {
      invalidate();
      toast.success('Breaking news updated.');
    },
  });

  const remove = useMutation({
    mutationFn: (item: BreakingNewsDto) => breakingNewsApi.remove(item.id),
    onSuccess: () => {
      invalidate();
      toast.success('Breaking news deleted.');
    },
    onError: (error) =>
      toast.error(messageFor(error, 'Could not delete this item.')),
  });

  return { create, update, remove };
}
