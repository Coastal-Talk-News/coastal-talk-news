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

  function savedMessage(status: ArticleDto['status']): string {
    if (status === 'PUBLISHED') return 'Published — it is live now.';
    if (status === 'ARCHIVED') return 'Archived — it is off the website.';
    return 'Draft saved.';
  }

  const create = useMutation({
    mutationFn: (body: CreateArticleRequest) => articlesApi.create(body),
    onSuccess: (article) => {
      invalidate();
      queryClient.setQueryData(queryKeys.article(article.id), article);
      toast.success(savedMessage(article.status));
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateArticleRequest }) =>
      articlesApi.update(id, body),
    onSuccess: (article) => {
      invalidate();
      queryClient.setQueryData(queryKeys.article(article.id), article);
      toast.success(savedMessage(article.status));
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
      toast.success('Article archived — it is off the website now.');
    },
    onError: (error) =>
      toast.error(messageFor(error, 'Could not archive this article.')),
  });

  const restore = useMutation({
    mutationFn: (article: ArticleDto) =>
      articlesApi.update(article.id, { status: 'DRAFT' }),
    onSuccess: (article) => {
      invalidate();
      queryClient.setQueryData(queryKeys.article(article.id), article);
      toast.success('Restored to drafts.');
    },
    onError: (error) =>
      toast.error(messageFor(error, 'Could not restore this article.')),
  });

  const publish = useMutation({
    mutationFn: (article: ArticleDto) =>
      articlesApi.update(article.id, { status: 'PUBLISHED' }),
    onSuccess: (article) => {
      invalidate();
      queryClient.setQueryData(queryKeys.article(article.id), article);
      toast.success('Published — it is live now.');
    },
    onError: (error) =>
      toast.error(messageFor(error, 'Could not publish this article.')),
  });

  const unpublish = useMutation({
    mutationFn: (article: ArticleDto) =>
      articlesApi.update(article.id, { status: 'DRAFT' }),
    onSuccess: (article) => {
      invalidate();
      queryClient.setQueryData(queryKeys.article(article.id), article);
      toast.success('Moved back to drafts — it is off the website.');
    },
    onError: (error) =>
      toast.error(messageFor(error, 'Could not unpublish this article.')),
  });

  return { create, update, remove, archive, restore, publish, unpublish };
}
