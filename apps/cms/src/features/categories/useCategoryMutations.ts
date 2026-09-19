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

  /**
   * One drag lands as at most two calls, in this order: the parent change
   * first, because the reorder endpoint validates the ids against the group
   * they now belong to and would reject them while the move is still
   * uncommitted.
   */
  const move = useMutation({
    mutationFn: async ({
      id,
      parentId,
      parentChanged,
      siblingIds,
    }: {
      id: string;
      parentId: string | null;
      parentChanged: boolean;
      siblingIds: string[];
    }) => {
      if (parentChanged) await categoriesApi.update(id, { parentId });
      if (siblingIds.length > 0) {
        await categoriesApi.reorder(parentId, siblingIds);
      }
    },
    onMutate: async ({ id, parentId, siblingIds }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<CategoryList>(listKey);

      // The row is already where the drag left it — this makes parentId and
      // displayOrder agree, or the tree, which is built from those two
      // fields, would snap straight back until the request round-trips.
      queryClient.setQueryData<CategoryList>(listKey, (current) => {
        if (!current) return current;
        const positionById = new Map(
          siblingIds.map((siblingId, index) => [siblingId, index]),
        );
        return {
          ...current,
          data: current.data.map((category) => {
            const position = positionById.get(category.id);
            if (category.id === id) {
              return {
                ...category,
                parentId,
                displayOrder: position ?? category.displayOrder,
              };
            }
            return position === undefined
              ? category
              : { ...category, displayOrder: position };
          }),
        };
      });

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(listKey, context.previous);
      toast.error(messageFor(error, 'Could not move this category.'));
    },
    onSettled: invalidate,
  });

  return { create, update, setActive, remove, move };
}
