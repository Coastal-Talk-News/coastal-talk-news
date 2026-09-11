import type { ArticleDto, ArticleListParams } from '@coastal-talk-news/types';
import { ConfirmDialog } from '@coastal-talk-news/ui/confirm-dialog';
import { Input } from '@coastal-talk-news/ui/input';
import { Select, type SelectOption } from '@coastal-talk-news/ui/select';
import { EmptyState, ErrorState } from '@coastal-talk-news/ui/states';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Plus,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { articlesApi } from '../api/articles.js';
import { ApiError } from '../api/client.js';
import { categoriesApi } from '../api/categories.js';
import { queryKeys } from '../api/queryKeys.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { ArticleRow } from '../features/articles/ArticleRow.js';
import { ArticlesTableSkeleton } from '../features/articles/ArticlesTableSkeleton.js';
import { useArticleMutations } from '../features/articles/useArticleMutations.js';
import { SEARCH_DEBOUNCE_MS, useDebounced } from '../lib/useDebounced.js';

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

function toStatusTab(raw: string | null): StatusTab {
  return TABS.some((tab) => tab.value === raw) ? (raw as StatusTab) : 'all';
}

type LanguageFilter = '' | 'ENGLISH' | 'KANNADA';
type PriorityFilter = '' | 'LEAD_STORY' | 'FEATURED' | 'NORMAL';

const LANGUAGE_OPTIONS: Array<SelectOption<LanguageFilter>> = [
  { value: '', label: 'All Languages' },
  { value: 'ENGLISH', label: 'English' },
  { value: 'KANNADA', label: 'ಕನ್ನಡ' },
];

const PRIORITY_OPTIONS: Array<SelectOption<PriorityFilter>> = [
  { value: '', label: 'All Priority' },
  { value: 'LEAD_STORY', label: 'Lead Story' },
  { value: 'FEATURED', label: 'Featured' },
  { value: 'NORMAL', label: 'Normal' },
];

const SORT_OPTIONS: Array<SelectOption<SortOrder>> = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

// Button has no asChild/Slot support, and a <Link> can't nest inside a
// <button> — this mirrors Button's primary/md classes for a real nav link.
const primaryLinkClass =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-action px-4 text-sm font-medium text-action-fg shadow-sm transition-[background-color,box-shadow,transform,color] duration-150 hover:bg-action-hover active:scale-[0.98]';

export function ArticlesPage() {
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const statusTab = toStatusTab(searchParams.get('status'));
  const [categoryId, setCategoryId] = useState('');
  const [language, setLanguage] = useState<LanguageFilter>('');
  const [priority, setPriority] = useState<PriorityFilter>('');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<ArticleDto | null>(null);
  const debouncedSearch = useDebounced(search, SEARCH_DEBOUNCE_MS);

  function selectStatusTab(next: StatusTab) {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next === 'all') params.delete('status');
        else params.set('status', next);
        return params;
      },
      { replace: true },
    );
    setPage(1);
  }

  function withReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categoryList({ limit: 100 }),
    queryFn: ({ signal }) => categoriesApi.list({ limit: 100 }, signal),
  });

  const categoryOptions: SelectOption[] = [
    { value: '', label: 'All Categories' },
    ...(categoriesQuery.data?.data ?? []).map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  const baseFilters: Omit<ArticleListParams, 'page' | 'limit' | 'status'> = {
    categoryId: categoryId || undefined,
    language: language || undefined,
    priority: priority || undefined,
    search: debouncedSearch || undefined,
  };

  const countsQuery = useQuery({
    queryKey: queryKeys.articleCounts({ ...baseFilters }),
    queryFn: ({ signal }) => articlesApi.counts(baseFilters, signal),
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
  const isFiltered = Boolean(
    categoryId || language || priority || debouncedSearch,
  );

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
          <div className="min-w-56 flex-1">
            <Input
              value={search}
              onChange={(event) => withReset(setSearch)(event.target.value)}
              placeholder="Search headlines and content…"
              aria-label="Search articles"
              icon={<Search className="size-4" aria-hidden />}
            />
          </div>

          <Select
            size="sm"
            className="w-44"
            value={categoryId}
            onValueChange={withReset(setCategoryId)}
            options={categoryOptions}
            aria-label="Filter by category"
          />

          <Select
            size="sm"
            className="w-40"
            value={language}
            onValueChange={withReset(setLanguage)}
            options={LANGUAGE_OPTIONS}
            aria-label="Filter by language"
          />

          <Select
            size="sm"
            className="w-40"
            value={priority}
            onValueChange={withReset(setPriority)}
            options={PRIORITY_OPTIONS}
            aria-label="Filter by priority"
          />

          <Select
            size="sm"
            className="w-40"
            value={sort}
            onValueChange={withReset(setSort)}
            options={SORT_OPTIONS}
            icon={<ArrowUpDown className="size-3.5" aria-hidden />}
            aria-label="Sort by"
          />
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
              onClick={() => selectStatusTab(tab.value)}
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
                  <tr className="text-ink-subtle border-hairline bg-surface-sunken border-b text-[11px] font-semibold tracking-[0.08em] uppercase">
                    <th className="py-3 pr-4 pl-4">Article</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Priority</th>
                    <th className="py-3 pr-4">Published At</th>
                    <th className="py-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-hairline divide-y">
                  {articles.map((article) => (
                    <ArticleRow
                      key={article.id}
                      article={article}
                      onDelete={setPendingDelete}
                      onArchive={(target) => mutations.archive.mutate(target)}
                      onRestore={(target) => mutations.restore.mutate(target)}
                      onPublish={(target) => mutations.publish.mutate(target)}
                      onUnpublish={(target) =>
                        mutations.unpublish.mutate(target)
                      }
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
