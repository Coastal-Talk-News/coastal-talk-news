import Link from 'next/link';
import type { ReactNode } from 'react';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** The page owns its own URL shape (query string, path segment, …). */
  href: (page: number) => string;
  locale?: Locale;
}

type PageItem = number | 'ellipsis';

/** Always shows the first and last page, plus a window around the current one. */
function buildPageList(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items: PageItem[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push('ellipsis');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push('ellipsis');
  items.push(total);

  return items;
}

function PageLink({
  page,
  href,
  active = false,
  disabled = false,
  label,
  children,
}: {
  page: number;
  href: (page: number) => string;
  active?: boolean;
  disabled?: boolean;
  label?: string;
  children: ReactNode;
}) {
  const baseClass =
    'grid size-9 shrink-0 place-items-center rounded-sm text-sm font-semibold transition-colors';

  if (disabled) {
    return (
      <span aria-hidden className={`${baseClass} text-ink-subtle/40`}>
        {children}
      </span>
    );
  }

  if (active) {
    return (
      <span aria-current="page" className={`${baseClass} bg-brand text-white`}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href(page)}
      aria-label={label}
      className={`${baseClass} border-rule hover:border-brand hover:text-brand border`}
    >
      {children}
    </Link>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  href,
  locale = 'en',
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const dictionary = getDictionary(locale).pagination;

  return (
    <nav
      aria-label={dictionary.navLabel}
      className="mt-12 flex items-center justify-center gap-1.5"
    >
      <PageLink
        page={currentPage - 1}
        href={href}
        disabled={currentPage <= 1}
        label={dictionary.previousPage}
      >
        <span aria-hidden>‹</span>
      </PageLink>

      {buildPageList(currentPage, totalPages).map((item, index) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden
            className="text-ink-subtle px-1 text-sm"
          >
            …
          </span>
        ) : (
          <PageLink
            key={item}
            page={item}
            href={href}
            active={item === currentPage}
          >
            {item}
          </PageLink>
        ),
      )}

      <PageLink
        page={currentPage + 1}
        href={href}
        disabled={currentPage >= totalPages}
        label={dictionary.nextPage}
      >
        <span aria-hidden>›</span>
      </PageLink>
    </nav>
  );
}
