import type {
  ApiListSuccess,
  CmsCategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@coastal-talk-news/types';
import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { categoriesApi } from '../../api/categories.js';
import { ApiError } from '../../api/client.js';
import { queryKeys } from '../../api/queryKeys.js';

type CategoryList = ApiListSuccess<CmsCategoryDto>;

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useCategoryMutations(listKey: QueryKey) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };

  const create = useMutation({
    mutationFn: (body: CreateCategoryRequest) => categoriesApi.create(body),
    onSuccess: (category) => {
      invalidate();
      toast.success(`“${category.name}” created.`);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCategoryRequest }) =>
      categoriesApi.update(id, body),
    onSuccess: (category) => {
      invalidate();
      toast.success(`“${category.name}” updated.`);
    },
  });

  const setActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoriesApi.update(id, { isActive }),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<CategoryList>(listKey);

      queryClient.setQueryData<CategoryList>(listKey, (current) =>
        current
          ? {
              ...current,
              data: current.data.map((category) =>
                category.id === id ? { ...category, isActive } : category,
              ),
            }
          : current,
      );

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(listKey, context.previous);
      toast.error(messageFor(error, 'Could not change the status.'));
    },
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: (category: CmsCategoryDto) => categoriesApi.remove(category.id),
    onSuccess: (_result, category) => {
      invalidate();
      toast.success(`“${category.name}” deleted.`);
    },
    onError: (error) =>
      toast.error(messageFor(error, 'Could not delete this category.')),
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => categoriesApi.reorder(ids),
    onSuccess: () => {
      invalidate();
      toast.success('Order saved.');
    },
    onError: (error) => {
      invalidate();
      toast.error(messageFor(error, 'Could not save the new order.'));
    },
  });

  return { create, update, setActive, remove, reorder };
}
