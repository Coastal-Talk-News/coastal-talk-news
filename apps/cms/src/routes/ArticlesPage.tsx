import type { ArticleDto, ArticleListParams } from '@coastal-talk-news/types';
import { ConfirmDialog } from '@coastal-talk-news/ui/confirm-dialog';
import { EmptyState, ErrorState } from '@coastal-talk-news/ui/states';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { articlesApi } from '../api/articles.js';
import { ApiError } from '../api/client.js';
import { categoriesApi } from '../api/categories.js';
import { queryKeys } from '../api/queryKeys.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { ArticleRow } from '../features/articles/ArticleRow.js';
import { ArticlesTableSkeleton } from '../features/articles/ArticlesTableSkeleton.js';
import { useArticleMutations } from '../features/articles/useArticleMutations.js';

type StatusTab = 'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type SortOrder = 'newest' | 'oldest';

const TABS: Array<{ value: StatusTab; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const COUNT_KEY = {
  all: 'all',
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

const PAGE_LIMIT = 20;

const selectClass =
  'ring-hairline text-ink h-10 rounded-lg bg-surface px-3 text-sm ring-1 transition-shadow hover:ring-ink-subtle/40 focus:ring-2 focus:ring-accent focus:outline-none';

// Button has no asChild/Slot support, and a <Link> can't nest inside a
// <button> — this mirrors Button's primary/md classes for a real nav link.
const primaryLinkClass =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-action px-4 text-sm font-medium text-action-fg shadow-sm transition-[background-color,box-shadow,transform,color] duration-150 hover:bg-action-hover active:scale-[0.98]';

export function ArticlesPage() {
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [categoryId, setCategoryId] = useState('');
  const [language, setLanguage] = useState<'' | 'ENGLISH' | 'KANNADA'>('');
  const [priority, setPriority] = useState<
    '' | 'LEAD_STORY' | 'FEATURED' | 'NORMAL'
  >('');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [pendingDelete, setPendingDelete] = useState<ArticleDto | null>(null);

  function withReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categoryList({ limit: 100 }),
    queryFn: () => categoriesApi.list({ limit: 100 }),
  });

  const baseFilters: Omit<ArticleListParams, 'page' | 'limit' | 'status'> = {
    categoryId: categoryId || undefined,
    language: language || undefined,
    priority: priority || undefined,
  };

  const countsQuery = useQuery({
    queryKey: queryKeys.articleCounts({ ...baseFilters }),
    queryFn: () => articlesApi.counts(baseFilters),
  });

  const listParams: ArticleListParams = {
    ...baseFilters,
    page,
    limit: PAGE_LIMIT,
    status: statusTab === 'all' ? undefined : statusTab,
    sort,
  };

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.articleList({ ...listParams }),
    queryFn: ({ signal }) => articlesApi.list(listParams, signal),
    placeholderData: keepPreviousData,
  });

  const mutations = useArticleMutations();
  const counts = countsQuery.data ?? {
    all: 0,
    draft: 0,
    published: 0,
    archived: 0,
  };
  const articles = data?.data ?? [];
  const meta = data?.meta;
  const isFiltered = Boolean(categoryId || language || priority);

  return (
    <>
      <PageHeader
        eyebrow="News"
        title="All Articles"
        description="Manage and organize your news articles."
        actions={
          <Link to="/articles/new" className={primaryLinkClass}>
            <Plus className="size-4" aria-hidden />
            Create Article
          </Link>
        }
      />

      <section className="border-hairline overflow-hidden rounded-card border bg-surface shadow-sm">
        <div className="border-hairline flex flex-wrap items-center gap-3 border-b p-4">
          <select
            value={categoryId}
            onChange={(event) => withReset(setCategoryId)(event.target.value)}
            className={selectClass}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categoriesQuery.data?.data.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={language}
            onChange={(event) =>
              withReset(setLanguage)(event.target.value as typeof language)
            }
            className={selectClass}
            aria-label="Filter by language"
          >
            <option value="">All Languages</option>
            <option value="ENGLISH">English</option>
            <option value="KANNADA">Kannada</option>
          </select>

          <select
            value={priority}
            onChange={(event) =>
              withReset(setPriority)(event.target.value as typeof priority)
            }
            className={selectClass}
            aria-label="Filter by priority"
          >
            <option value="">All Priority</option>
            <option value="LEAD_STORY">Lead Story</option>
            <option value="FEATURED">Featured</option>
            <option value="NORMAL">Normal</option>
          </select>

          <div className="relative ml-auto">
            <ArrowUpDown
              className="text-ink-subtle pointer-events-none absolute inset-y-0 left-3 my-auto size-3.5"
              aria-hidden
            />
            <select
              value={sort}
              onChange={(event) =>
                withReset(setSort)(event.target.value as SortOrder)
              }
              className={`${selectClass} appearance-none pl-9`}
              aria-label="Sort by"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Filter by status"
          className="flex flex-wrap items-center gap-1 px-4 py-3"
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={statusTab === tab.value}
              onClick={() => withReset(setStatusTab)(tab.value)}
              className={
                statusTab === tab.value
                  ? 'text-accent-text bg-accent-soft flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors'
                  : 'text-ink-muted flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-sunken hover:text-ink'
              }
            >
              {tab.label}
              <span className="text-ink-subtle bg-surface-sunken rounded-full px-1.5 text-xs tabular-nums">
                {counts[COUNT_KEY[tab.value]]}
              </span>
            </button>
          ))}
        </div>

        {isPending ? (
          <ArticlesTableSkeleton />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : 'Could not load articles.'
            }
            onRetry={() => void refetch()}
          />
        ) : articles.length === 0 ? (
          <EmptyState
            icon={<Newspaper className="size-5" aria-hidden />}
            title={
              isFiltered || statusTab !== 'all'
                ? 'No matching articles'
                : 'No articles yet'
            }
            description={
              isFiltered || statusTab !== 'all'
                ? 'Try a different filter or tab.'
                : 'Create your first article to get started.'
            }
            action={
              !isFiltered && statusTab === 'all' ? (
                <Link
                  to="/articles/new"
                  className={`${primaryLinkClass} h-9 px-3 text-sm`}
                >
                  <Plus className="size-4" aria-hidden />
                  Create Article
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-240 text-left">
                <thead>
                  <tr className="text-ink-subtle border-hairline border-b bg-surface-sunken text-xs font-semibold tracking-wide uppercase">
                    <th className="py-2.5 pr-4 pl-4">Article</th>
                    <th className="py-2.5 pr-4">Category</th>
                    <th className="py-2.5 pr-4">Status</th>
                    <th className="py-2.5 pr-4">Priority</th>
                    <th className="py-2.5 pr-4">Published At</th>
                    <th className="py-2.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-hairline divide-y">
                  {articles.map((article) => (
                    <ArticleRow
                      key={article.id}
                      article={article}
                      onDelete={setPendingDelete}
                      onArchive={(target) => mutations.archive.mutate(target)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-hairline text-ink-muted flex items-center justify-between border-t px-4 py-3 text-xs">
              <span>
                Showing {(page - 1) * PAGE_LIMIT + 1}–
                {(page - 1) * PAGE_LIMIT + articles.length} of{' '}
                {meta?.total ?? 0} articles
                {isFetching && ' · Syncing…'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!meta?.hasPreviousPage}
                  onClick={() => setPage((current) => current - 1)}
                  aria-label="Previous page"
                  className="ring-hairline grid size-8 place-items-center rounded-lg ring-1 transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <span className="tabular-nums">
                  Page {meta?.page ?? 1} of {meta?.totalPages ?? 1}
                </span>
                <button
                  type="button"
                  disabled={!meta?.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                  aria-label="Next page"
                  className="ring-hairline grid size-8 place-items-center rounded-lg ring-1 transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.headline}"?`}
        description="This permanently removes the article. It cannot be undone — Archive instead to keep it."
        confirmLabel="Delete article"
        loading={mutations.remove.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          mutations.remove.mutate(pendingDelete, {
            onSettled: () => setPendingDelete(null),
          });
        }}
      />
    </>
  );
}
