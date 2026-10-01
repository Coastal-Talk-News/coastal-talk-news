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
  Calendar,
  CalendarDays,
  CalendarRange,
  Cloud,
  Database,
  Eye,
  FileText,
  Megaphone,
  PencilLine,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../api/analytics.js';
import { dashboardApi } from '../api/dashboard.js';
import { queryKeys } from '../api/queryKeys.js';
import { Pagination } from '../components/Pagination.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { STATUS_LABELS, STATUS_TONES } from '../features/articles/status.js';
import { SortHeader } from '../features/dashboard/SortHeader.js';
import { StatCard } from '../features/dashboard/StatCard.js';
import { UsageMeter } from '../features/dashboard/UsageMeter.js';
import {
  ViewsDetailSheet,
  type ViewsDetailKind,
} from '../features/dashboard/ViewsDetailSheet.js';
import { formatBytes, formatDate } from '../lib/format.js';
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
  const [viewsDetail, setViewsDetail] = useState<ViewsDetailKind>(null);
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
  // Shared with the Dashboard's query key, so visiting both pages makes one
  // Cloudinary/Supabase call between them rather than one each.
  const usageQuery = useQuery({
    queryKey: queryKeys.dashboardUsage,
    queryFn: ({ signal }) => dashboardApi.usage(signal),
    staleTime: 5 * 60_000,
  });
  const usage = usageQuery.data;
  const articles = useQuery({
    queryKey: queryKeys.analyticsArticles({ page, limit, ...sorting }),
    queryFn: ({ signal }) =>
      analyticsApi.articles({ page, limit, ...sorting }, signal),
    placeholderData: keepPreviousData,
  });
  // The figures barely move minute to minute, so a page left open shouldn't
  // refetch every time it's focused.
  const storage = useQuery({
    queryKey: queryKeys.analyticsStorage,
    queryFn: ({ signal }) => analyticsApi.storage(signal),
    staleTime: 5 * 60_000,
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        {/* Shown as unavailable rather than left out while loading or on
            failure: the page is worth opening without them. */}
        <UsageMeter
          label="Cloudinary credits"
          icon={Cloud}
          usage={usage ? usage.cloudinary : null}
          unit="credits"
          pending={usageQuery.isPending}
        />
        <UsageMeter
          label="Storage"
          icon={Database}
          usage={usage ? usage.supabase : null}
          unit="MB"
          pending={usageQuery.isPending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Views Today"
          value={counts.viewsToday}
          icon={Eye}
          tone="blue"
        />
        <StatCard
          label="Views This Week"
          value={counts.viewsThisWeek}
          icon={Calendar}
          tone="green"
          caption="Last 7 days · click for the daily breakdown"
          onClick={() => setViewsDetail('week')}
        />
        <StatCard
          label="Views This Month"
          value={counts.viewsThisMonth}
          icon={CalendarDays}
          tone="violet"
          caption="Last 30 days · click for the weekly breakdown"
          onClick={() => setViewsDetail('month')}
        />
        <StatCard
          label="Views This Year"
          value={counts.viewsThisYear}
          icon={CalendarRange}
          tone="amber"
          caption="Last 365 days · click for the monthly breakdown"
          onClick={() => setViewsDetail('year')}
        />
      </div>

      <ViewsDetailSheet
        kind={viewsDetail}
        onClose={() => setViewsDetail(null)}
      />

      <section className="border-hairline rounded-card border bg-surface shadow-sm">
        <div className="border-hairline border-b px-5 py-4">
          <h2 className="font-semibold text-ink">Database Storage</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            What the total on the Dashboard is made up of.
          </p>
        </div>

        {storage.isError ? (
          <ErrorState
            message="Could not load database storage."
            onRetry={() => void storage.refetch()}
          />
        ) : (
          <div className="p-5">
            <UsageMeter
              label="Database size"
              icon={Database}
              usage={storage.data?.total ?? null}
              unit="MB"
              pending={storage.isPending}
            />
          </div>
        )}

        {storage.data && (
          <div className="overflow-x-auto border-hairline border-t">
            <table className="w-full min-w-176 text-left">
              <thead>
                <tr className="text-ink-subtle border-hairline bg-surface-sunken border-b text-[11px] font-semibold tracking-[0.08em] uppercase">
                  <th className="py-3 pr-4 pl-4">Table</th>
                  <th className="py-3 pr-4 text-right">Rows</th>
                  <th className="py-3 pr-4 text-right">Size</th>
                  <th className="py-3 pr-5 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-hairline divide-y text-sm">
                {storage.data.tables.map((table) => (
                  <tr key={table.table}>
                    <td className="py-2.5 pr-4 pl-4 font-mono text-xs text-ink">
                      {table.table}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-ink-muted tabular-nums">
                      {table.rowEstimate.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-ink tabular-nums">
                      {formatBytes(table.bytes)}
                    </td>
                    <td className="py-2.5 pr-5 text-right text-ink-subtle tabular-nums">
                      {table.percent}%
                    </td>
                  </tr>
                ))}
                {storage.data.otherBytes > 0 && (
                  <tr>
                    <td className="py-2.5 pr-4 pl-4 text-ink-subtle italic">
                      Other (Supabase platform tables, other databases)
                    </td>
                    <td className="py-2.5 pr-4 text-right text-ink-subtle">
                      —
                    </td>
                    <td className="py-2.5 pr-4 text-right text-ink-subtle tabular-nums">
                      {formatBytes(storage.data.otherBytes)}
                    </td>
                    <td className="py-2.5 pr-5 text-right text-ink-subtle">
                      —
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border-hairline rounded-card border bg-surface shadow-sm">
        <div className="border-hairline border-b px-5 py-4">
          <h2 className="font-semibold text-ink">Views per article</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            A read is counted once per visit, when the reader stays on the
            article for more than half of its read time.
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
