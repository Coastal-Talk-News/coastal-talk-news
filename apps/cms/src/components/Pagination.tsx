import type { PaginationMeta } from '@coastal-talk-news/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageSizeSelect } from './PageSizeSelect.js';

interface PaginationProps {
  meta: PaginationMeta | undefined;
  /** Rows actually on this page, for the "Showing X–Y" range's end. */
  itemCount: number;
  itemLabel: string;
  limit: number;
  onLimitChange: (limit: number) => void;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}

/**
 * The footer under every paginated table: what's showing, how many rows per
 * page, and prev/next. One shared component so all of them behave and look
 * alike, and so a page-size fix only has to be made in one place.
 */
export function Pagination({
  meta,
  itemCount,
  itemLabel,
  limit,
  onLimitChange,
  onPageChange,
  isFetching = false,
}: PaginationProps) {
  const page = meta?.page ?? 1;
  const start = itemCount === 0 ? 0 : (page - 1) * limit + 1;
  const end = (page - 1) * limit + itemCount;

  return (
    <div className="border-hairline text-ink-muted flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs">
      <span>
        {itemCount === 0
          ? `0 ${itemLabel}`
          : `Showing ${start}–${end} of ${meta?.total ?? 0} ${itemLabel}`}
        {isFetching && ' · Syncing…'}
      </span>

      <div className="flex flex-wrap items-center gap-4">
        <PageSizeSelect
          value={limit}
          onChange={(next) => {
            onLimitChange(next);
            // A size that leaves the current page number past the end would
            // show an empty table until Next/Previous was pressed.
            onPageChange(1);
          }}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!meta?.hasPreviousPage}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
            className="ring-hairline grid size-8 place-items-center rounded-lg ring-1 transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="tabular-nums">
            Page {page} of {meta?.totalPages ?? 1}
          </span>
          <button
            type="button"
            disabled={!meta?.hasNextPage}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
            className="ring-hairline grid size-8 place-items-center rounded-lg ring-1 transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
