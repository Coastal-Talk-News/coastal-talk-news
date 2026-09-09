import type {
  BreakingNewsDto,
  CreateBreakingNewsRequest,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { ConfirmDialog } from '@coastal-talk-news/ui/confirm-dialog';
import { EmptyState, ErrorState } from '@coastal-talk-news/ui/states';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, Bell, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { breakingNewsApi } from '../api/breaking-news.js';
import { ApiError } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { BreakingNewsRow } from '../features/breaking-news/BreakingNewsRow.js';
import { BreakingNewsSheet } from '../features/breaking-news/BreakingNewsSheet.js';
import { BreakingNewsTableSkeleton } from '../features/breaking-news/BreakingNewsTableSkeleton.js';
import {
  breakingNewsStatusValue,
  type BreakingNewsStatus,
} from '../features/breaking-news/status.js';
import { useBreakingNewsMutations } from '../features/breaking-news/useBreakingNewsMutations.js';

type TabValue = 'all' | BreakingNewsStatus;
type SortOrder = 'newest' | 'oldest';

const TABS: Array<{ value: TabValue; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
];

// One page covers the whole list — same generous cap the Categories page
// uses — then tabs/sort are applied client-side against the single fetch.
const LIST_PARAMS = { limit: 100 };

// Ticks the clock this page filters/labels items against, so a row crosses
// from Scheduled to Active (and Active to Expired) on screen at its actual
// start/end time — no manual refresh needed. 15s keeps that within a
// reasonable margin without re-rendering the table needlessly often.
const CLOCK_TICK_MS = 15_000;

export function BreakingNewsPage() {
  const [tab, setTab] = useState<TabValue>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BreakingNewsDto | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BreakingNewsDto | null>(
    null,
  );
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const listKey = queryKeys.breakingNewsList(LIST_PARAMS);
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: listKey,
    queryFn: ({ signal }) => breakingNewsApi.list(LIST_PARAMS, signal),
  });

  const mutations = useBreakingNewsMutations();
  const items = data?.data ?? [];

  const counts = useMemo(() => {
    const result: Record<TabValue, number> = {
      all: items.length,
      active: 0,
      scheduled: 0,
      expired: 0,
    };
    for (const item of items) {
      result[breakingNewsStatusValue(item, now)] += 1;
    }
    return result;
  }, [items, now]);

  const visible = useMemo(() => {
    const filtered =
      tab === 'all'
        ? items
        : items.filter((item) => breakingNewsStatusValue(item, now) === tab);
    return [...filtered].sort((a, b) => {
      const delta =
        new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
      return sort === 'newest' ? delta : -delta;
    });
  }, [items, tab, sort, now]);

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(item: BreakingNewsDto) {
    setEditing(item);
    setSheetOpen(true);
  }

  const saveError = editing ? mutations.update.error : mutations.create.error;

  return (
    <>
      <PageHeader
        eyebrow="News"
        title="Breaking News"
        description="Manage live breaking news updates. These appear in the breaking news ticker on the website."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            Add Breaking News
          </Button>
        }
      />

      <section className="border-hairline overflow-hidden rounded-card border bg-surface shadow-sm">
        <div className="border-hairline flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div
            role="tablist"
            aria-label="Filter by status"
            className="border-hairline flex rounded-lg border bg-surface-sunken p-0.5"
          >
            {TABS.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={tab === item.value}
                onClick={() => setTab(item.value)}
                className={
                  tab === item.value
                    ? 'text-ink flex items-center gap-1.5 rounded-[7px] bg-surface px-3.5 py-1.5 text-sm font-medium shadow-sm transition-all'
                    : 'text-ink-muted flex items-center gap-1.5 rounded-[7px] px-3.5 py-1.5 text-sm font-medium transition-colors hover:text-ink-muted'
                }
              >
                {item.label}
                <span className="text-ink-subtle bg-surface-sunken rounded-full px-1.5 text-xs tabular-nums">
                  {counts[item.value]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <ArrowUpDown
              className="text-ink-subtle pointer-events-none absolute inset-y-0 left-3 my-auto size-3.5"
              aria-hidden
            />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOrder)}
              aria-label="Sort by"
              className="ring-hairline text-ink h-10 appearance-none rounded-lg bg-surface pr-8 pl-9 text-sm ring-1 transition-shadow hover:ring-ink-subtle/40 focus:ring-2 focus:ring-accent focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {isPending ? (
          <BreakingNewsTableSkeleton />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : 'Could not load breaking news.'
            }
            onRetry={() => void refetch()}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Bell className="size-5" aria-hidden />}
            title={tab === 'all' ? 'No breaking news yet' : `No ${tab} items`}
            description={
              tab === 'all'
                ? 'Add your first breaking news item to show it in the website ticker.'
                : 'Try a different tab.'
            }
            action={
              tab === 'all' ? (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-4" aria-hidden />
                  Add Breaking News
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-208 text-left">
                <thead>
                  <tr className="text-ink-subtle border-hairline border-b bg-surface-sunken text-xs font-semibold tracking-wide uppercase">
                    <th className="w-9 py-2.5 pl-4">#</th>
                    <th className="py-2.5 pr-4">News Item</th>
                    <th className="py-2.5 pr-4">Status</th>
                    <th className="py-2.5 pr-4">Start Time</th>
                    <th className="py-2.5 pr-4">End Time</th>
                    <th className="py-2.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-hairline divide-y">
                  {visible.map((item, index) => (
                    <BreakingNewsRow
                      key={item.id}
                      item={item}
                      position={index + 1}
                      now={now}
                      onEdit={openEdit}
                      onDelete={setPendingDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-hairline text-ink-muted flex items-center justify-between border-t px-4 py-3 text-xs">
              <span>
                Showing {visible.length} of {counts.all} breaking news{' '}
                {counts.all === 1 ? 'item' : 'items'}
              </span>
              <span
                className={
                  isFetching
                    ? 'opacity-100 transition-opacity'
                    : 'opacity-0 transition-opacity'
                }
              >
                Syncing…
              </span>
            </div>
          </>
        )}
      </section>

      <BreakingNewsSheet
        open={sheetOpen}
        editing={editing}
        saving={mutations.create.isPending || mutations.update.isPending}
        serverError={
          saveError instanceof ApiError
            ? saveError.message
            : saveError
              ? 'Could not save this item.'
              : null
        }
        onOpenChange={setSheetOpen}
        onSubmit={(values: CreateBreakingNewsRequest) => {
          const done = { onSuccess: () => setSheetOpen(false) };
          if (editing) {
            mutations.update.mutate({ id: editing.id, body: values }, done);
          } else {
            mutations.create.mutate(values, done);
          }
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.headline}"?`}
        description="This permanently removes the breaking news item. It cannot be undone."
        confirmLabel="Delete item"
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
