import type {
  ArticleDto,
  CreateArticleRequest,
  UpdateArticleRequest,
} from '@coastal-talk-news/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { articlesApi } from '../../api/articles.js';
import { ApiError } from '../../api/client.js';
import { queryKeys } from '../../api/queryKeys.js';

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useArticleMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.articles });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };

  const create = useMutation({
    mutationFn: (body: CreateArticleRequest) => articlesApi.create(body),
    onSuccess: () => {
      invalidate();
      toast.success('Article saved.');
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateArticleRequest }) =>
      articlesApi.update(id, body),
    onSuccess: (article) => {
      invalidate();
      queryClient.setQueryData(queryKeys.article(article.id), article);
      toast.success('Article saved.');
    },
  });

  const remove = useMutation({
    mutationFn: (article: ArticleDto) => articlesApi.remove(article.id),
    onSuccess: () => {
      invalidate();
      toast.success('Article deleted.');
    },
    onError: (error) =>
      toast.error(messageFor(error, 'Could not delete this article.')),
  });

  const archive = useMutation({
    mutationFn: (article: ArticleDto) =>
      articlesApi.update(article.id, { status: 'ARCHIVED' }),
    onSuccess: () => {
      invalidate();
      toast.success('Article archived.');
    },
    onError: (error) =>
      toast.error(messageFor(error, 'Could not archive this article.')),
  });

  return { create, update, remove, archive };
}
