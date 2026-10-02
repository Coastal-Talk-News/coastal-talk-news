import type { AnalyticsSort, SortOrder } from '@coastal-talk-news/types';
import { Badge } from '@coastal-talk-news/ui/badge';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@coastal-talk-news/ui/states';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Archive,
  Bell,
  Eye,
  FileText,
  Megaphone,
  PencilLine,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../api/analytics.js';
import { queryKeys } from '../api/queryKeys.js';
import { Pagination } from '../components/Pagination.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { STATUS_LABELS, STATUS_TONES } from '../features/articles/status.js';
import { SortHeader } from '../features/dashboard/SortHeader.js';
import { StatCard } from '../features/dashboard/StatCard.js';
import { ViewsOverview } from '../features/dashboard/ViewsOverview.js';
import { formatDate } from '../lib/format.js';
import { usePageSize } from '../lib/usePageSize.js';

const DEFAULT_PAGE_LIMIT = 5;

// Where a column starts when first chosen: most viewed and newest first, and
// categories from A. Within a category the articles are most viewed first.
const DEFAULT_ORDER: Record<AnalyticsSort, SortOrder> = {
  views: 'desc',
  published: 'desc',
  category: 'asc',
};

export function AnalyticsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = usePageSize('analytics-reads', DEFAULT_PAGE_LIMIT);
  const [sorting, setSorting] = useState<{
    sort: AnalyticsSort;
    order: SortOrder;
  }>({ sort: 'views', order: 'desc' });

  // A second click on the same column flips it; a different column starts at
  // its own default. Either way the list goes back to its first page.
  function sortBy(sort: AnalyticsSort) {
    setSorting((current) => ({
      sort,
      order:
        current.sort === sort
          ? current.order === 'asc'
            ? 'desc'
            : 'asc'
          : DEFAULT_ORDER[sort],
    }));
    setPage(1);
  }

  const stats = useQuery({
    queryKey: queryKeys.analytics,
    queryFn: ({ signal }) => analyticsApi.stats(signal),
  });
  const articles = useQuery({
    queryKey: queryKeys.analyticsArticles({ page, limit, ...sorting }),
    queryFn: ({ signal }) =>
      analyticsApi.articles({ page, limit, ...sorting }, signal),
    placeholderData: keepPreviousData,
  });

  if (stats.isPending) return <LoadingState label="Loading analytics…" />;
  if (stats.isError) {
    return (
      <ErrorState
        message={
          stats.error instanceof Error
            ? stats.error.message
            : 'Could not load analytics.'
        }
        onRetry={() => void stats.refetch()}
      />
    );
  }

  const counts = stats.data;
  const rows = articles.data?.data ?? [];
  const meta = articles.data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Newsroom totals and how often each article is read."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Articles"
          value={counts.totalArticles}
          icon={FileText}
          tone="blue"
          to="/articles"
        />
        <StatCard
          label="Published Today"
          value={counts.publishedToday}
          icon={Zap}
          tone="green"
          to="/articles?status=PUBLISHED"
        />
        <StatCard
          label="Drafts"
          value={counts.drafts}
          icon={PencilLine}
          tone="amber"
          to="/articles?status=DRAFT"
        />
        <StatCard
          label="Archived"
          value={counts.archived}
          icon={Archive}
          tone="slate"
          to="/articles?status=ARCHIVED"
        />
        <StatCard
          label="Active Latest News"
          value={counts.activeBreakingNews}
          icon={Bell}
          tone="red"
          to="/latest-news"
        />
        <StatCard
          label="Active Advertisements"
          value={counts.activeAdvertisements}
          icon={Megaphone}
          tone="violet"
          to="/advertisements"
        />
      </div>

      <ViewsOverview viewsToday={counts.viewsToday} />

      <section className="border-hairline rounded-card border bg-surface shadow-sm">
        <div className="border-hairline border-b px-5 py-4">
          <h2 className="font-semibold text-ink">Views per article</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            All-time reads for every article, most viewed first.
          </p>
        </div>

        {articles.isError ? (
          <ErrorState
            message="Could not load the article list."
            onRetry={() => void articles.refetch()}
          />
        ) : articles.isPending ? (
          <LoadingState label="Loading articles…" />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Eye className="size-5" aria-hidden />}
            title="No articles yet"
            description="Reads will show up here once articles are published."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-176 text-left">
                <thead>
                  <tr className="text-ink-subtle border-hairline bg-surface-sunken border-b text-[11px] font-semibold tracking-[0.08em] uppercase">
                    <th className="py-3 pr-4 pl-4">Article</th>
                    <SortHeader
                      label="Category"
                      active={sorting.sort === 'category'}
                      order={sorting.order}
                      onSort={() => sortBy('category')}
                    />
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Read time</th>
                    <SortHeader
                      label="Published At"
                      active={sorting.sort === 'published'}
                      order={sorting.order}
                      onSort={() => sortBy('published')}
                    />
                    <SortHeader
                      label="Views"
                      align="right"
                      active={sorting.sort === 'views'}
                      order={sorting.order}
                      onSort={() => sortBy('views')}
                    />
                  </tr>
                </thead>
                <tbody className="divide-hairline divide-y text-sm">
                  {rows.map((article) => (
                    <tr key={article.id}>
                      <td className="max-w-md py-3 pr-4 pl-4">
                        <Link
                          to={`/articles/${article.id}/edit`}
                          className="line-clamp-2 font-medium text-ink hover:underline"
                        >
                          {article.headline}
                        </Link>
                      </td>
                      <td className="text-ink-muted py-3 pr-4">
                        {article.categoryName ?? '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone={STATUS_TONES[article.status]} dot>
                          {STATUS_LABELS[article.status]}
                        </Badge>
                      </td>
                      <td className="text-ink-muted py-3 pr-4 whitespace-nowrap">
                        {article.readMinutes} min
                      </td>
                      <td className="text-ink-muted py-3 pr-4 whitespace-nowrap">
                        {formatDate(article.publicationDate)}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold text-ink tabular-nums">
                        {article.viewCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              meta={meta}
              itemCount={rows.length}
              itemLabel="articles"
              limit={limit}
              onLimitChange={setLimit}
              onPageChange={setPage}
              isFetching={articles.isFetching}
            />
          </>
        )}
      </section>
    </div>
  );
}
