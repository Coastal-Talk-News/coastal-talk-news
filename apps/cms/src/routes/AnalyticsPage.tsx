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
  ChevronLeft,
  ChevronRight,
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
import { PageHeader } from '../components/layout/PageHeader.js';
import { STATUS_LABELS, STATUS_TONES } from '../features/articles/status.js';
import { StatCard } from '../features/dashboard/StatCard.js';
import { formatDate } from '../lib/format.js';

const PAGE_LIMIT = 20;

export function AnalyticsPage() {
  const [page, setPage] = useState(1);

  const stats = useQuery({
    queryKey: queryKeys.analytics,
    queryFn: ({ signal }) => analyticsApi.stats(signal),
  });
  const articles = useQuery({
    queryKey: queryKeys.analyticsArticles(page),
    queryFn: ({ signal }) => analyticsApi.articles(page, PAGE_LIMIT, signal),
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
        <StatCard
          label="Total Reads"
          value={counts.totalViews}
          icon={Eye}
          tone="blue"
        />
      </div>

      <section className="border-hairline rounded-card border bg-surface shadow-sm">
        <div className="border-hairline border-b px-5 py-4">
          <h2 className="font-semibold text-ink">Reads per article</h2>
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
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Read time</th>
                    <th className="py-3 pr-4">Published At</th>
                    <th className="py-3 pr-4 text-right">Reads</th>
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

            <div className="border-hairline text-ink-muted flex items-center justify-between border-t px-4 py-3 text-xs">
              <span>
                {meta?.total ?? 0} articles
                {articles.isFetching && ' · Syncing…'}
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
    </div>
  );
}
