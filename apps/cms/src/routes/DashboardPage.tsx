import type { ArticleStatus } from '@coastal-talk-news/types';
import { Badge } from '@coastal-talk-news/ui/badge';
import { Button } from '@coastal-talk-news/ui/button';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@coastal-talk-news/ui/states';
import { useQuery } from '@tanstack/react-query';
import {
  Archive,
  Bell,
  FileText,
  Image as ImageIcon,
  Megaphone,
  Plus,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard.js';
import { queryKeys } from '../api/queryKeys.js';
import { StatCard } from '../features/dashboard/StatCard.js';
import { formatDate, formatRelative } from '../lib/format.js';

const STATUS_TONE: Record<ArticleStatus, 'green' | 'amber' | 'slate'> = {
  PUBLISHED: 'green',
  DRAFT: 'amber',
  ARCHIVED: 'slate',
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function Panel({
  title,
  actionLabel,
  actionTo,
  children,
}: {
  title: string;
  actionLabel: string;
  actionTo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-hairline rounded-card border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-hairline border-b px-5 py-4">
        <h2 className="font-semibold text-ink">{title}</h2>
        <Link
          to={actionTo}
          className="text-accent-text hover:text-accent-text text-sm font-medium"
        >
          {actionLabel}
        </Link>
      </div>
      {children}
    </section>
  );
}

export function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => dashboardApi.get(signal),
  });

  if (isPending) return <LoadingState label="Loading your newsroom…" />;
  if (isError) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : 'Could not load the dashboard.'
        }
        onRetry={() => void refetch()}
      />
    );
  }

  const { stats, recentArticles, breakingNews, advertisements } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {greeting()}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Here&rsquo;s what&rsquo;s happening in your newsroom today.
          </p>
        </div>
        <p className="text-right text-sm text-ink-muted">
          {formatDate(new Date().toISOString())}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Articles"
          value={stats.totalArticles}
          icon={FileText}
          tone="blue"
          to="/articles"
        />
        <StatCard
          label="Published Today"
          value={stats.publishedToday}
          icon={Zap}
          tone="green"
          to="/articles?status=PUBLISHED"
        />
        <StatCard
          label="Drafts"
          value={stats.drafts}
          icon={FileText}
          tone="amber"
          to="/articles?status=DRAFT"
        />
        <StatCard
          label="Archived"
          value={stats.archived}
          icon={Archive}
          tone="slate"
          to="/articles?status=ARCHIVED"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Active Breaking News"
          value={stats.activeBreakingNews}
          icon={Bell}
          tone="red"
          to="/breaking-news"
        />
        <StatCard
          label="Active Advertisements"
          value={stats.activeAdvertisements}
          icon={Megaphone}
          tone="violet"
          to="/advertisements"
        />

        <div className="border-accent-soft bg-accent-soft rounded-card border p-5">
          <p className="mb-3 flex items-center gap-2 font-semibold text-ink">
            <Zap className="text-accent-text size-4" aria-hidden />
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/articles/new">
              <Button size="sm">
                <Plus className="size-4" aria-hidden />
                Create Article
              </Button>
            </Link>
            <Link to="/breaking-news">
              <Button size="sm" variant="secondary">
                <Bell className="size-4" aria-hidden />
                Breaking News
              </Button>
            </Link>
            <Link to="/media">
              <Button size="sm" variant="secondary">
                <ImageIcon className="size-4" aria-hidden />
                Upload Media
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Recent Articles"
            actionLabel="View all"
            actionTo="/articles"
          >
            {recentArticles.length === 0 ? (
              <EmptyState
                icon={<FileText className="size-5" aria-hidden />}
                title="No articles yet"
                description="Articles you create will appear here."
                action={
                  <Link to="/articles/new">
                    <Button size="sm">Create your first article</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-hairline divide-y">
                {recentArticles.map((article) => (
                  <li
                    key={article.id}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    {article.coverImage ? (
                      <img
                        src={article.coverImage.url}
                        alt=""
                        width={56}
                        height={40}
                        className="size-14 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-surface-sunken text-ink-subtle">
                        <ImageIcon className="size-5" aria-hidden />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {article.headline}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">
                        {article.categoryName} &middot;{' '}
                        {formatRelative(
                          article.publicationDate ?? article.updatedAt,
                        )}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[article.status]}>
                      {article.status.charAt(0) +
                        article.status.slice(1).toLowerCase()}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel
            title="Breaking News"
            actionLabel="Manage"
            actionTo="/breaking-news"
          >
            {breakingNews.length === 0 ? (
              <EmptyState
                icon={<Bell className="size-5" aria-hidden />}
                title="Nothing breaking"
                description="Scheduled breaking news will show up here."
              />
            ) : (
              <ul className="divide-hairline divide-y">
                {breakingNews.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 px-5 py-3.5"
                  >
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${item.isActive ? 'bg-danger' : 'bg-ink-subtle/40'}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {item.headline}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {item.isActive
                          ? item.endAt
                            ? `Ends ${formatRelative(item.endAt)}`
                            : 'No end date'
                          : new Date(item.startAt) > new Date()
                            ? `Starts ${formatRelative(item.startAt)}`
                            : `Ended ${formatRelative(item.endAt)}`}
                      </p>
                    </div>
                    <Badge tone={item.isActive ? 'green' : 'slate'}>
                      {item.isActive ? 'Live' : 'Expired'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Advertisements"
            actionLabel="Manage"
            actionTo="/advertisements"
          >
            {advertisements.length === 0 ? (
              <EmptyState
                icon={<Megaphone className="size-5" aria-hidden />}
                title="No advertisements"
                description="Scheduled ads will show up here."
              />
            ) : (
              <ul className="divide-hairline divide-y">
                {advertisements.map((ad) => (
                  <li
                    key={ad.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    {ad.image ? (
                      <img
                        src={ad.image.url}
                        alt=""
                        width={48}
                        height={32}
                        className="h-8 w-12 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="grid h-8 w-12 shrink-0 place-items-center rounded bg-surface-sunken text-ink-subtle">
                        <ImageIcon className="size-4" aria-hidden />
                      </span>
                    )}
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                      {ad.advertiserName}
                    </p>
                    <Badge tone={ad.isActive ? 'green' : 'slate'}>
                      {ad.isActive ? 'Active' : 'Expired'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
