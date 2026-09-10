import type { ArticleDto } from '@coastal-talk-news/types';
import { Badge } from '@coastal-talk-news/ui/badge';
import { Tooltip } from '@coastal-talk-news/ui/tooltip';
import { Archive, ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, formatTime } from '../../lib/format.js';
import { PRIORITY_LABELS, PRIORITY_TONES } from './priority.js';
import { estimateReadMinutes } from './readTime.js';
import { STATUS_LABELS, STATUS_TONES } from './status.js';

const LANGUAGE_LABELS = { ENGLISH: 'English', KANNADA: 'Kannada' } as const;

interface ArticleRowProps {
  article: ArticleDto;
  onDelete: (article: ArticleDto) => void;
  onArchive: (article: ArticleDto) => void;
}

export function ArticleRow({ article, onDelete, onArchive }: ArticleRowProps) {
  const readMinutes = estimateReadMinutes(article.content);
  const canArchive = article.status !== 'ARCHIVED';

  return (
    <tr className="hover:bg-surface-sunken transition-colors">
      <td className="py-3 pr-4 pl-4">
        <div className="flex items-start gap-3">
          {article.featuredImage ? (
            <img
              src={article.featuredImage.url}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-lg object-cover ring-1 ring-black/5"
            />
          ) : (
            <span className="text-ink-subtle grid size-14 shrink-0 place-items-center rounded-lg bg-surface-sunken">
              <ImageIcon className="size-5" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <Link
              to={`/articles/${article.id}/edit`}
              className="text-ink line-clamp-1 font-medium hover:underline"
            >
              {article.headline}
            </Link>
            <p className="text-ink-muted mt-0.5 line-clamp-1 max-w-md text-xs">
              {article.summary}
            </p>
            <p className="text-ink-subtle mt-1 text-xs">
              {LANGUAGE_LABELS[article.language]} · {readMinutes} min read
            </p>
          </div>
        </div>
      </td>

      <td className="py-3 pr-4 text-sm">
        {article.categoryName ? (
          <span className="text-ink-muted">{article.categoryName}</span>
        ) : (
          <span className="text-ink-subtle italic">No category</span>
        )}
      </td>

      <td className="py-3 pr-4">
        <Badge tone={STATUS_TONES[article.status]}>
          {STATUS_LABELS[article.status]}
        </Badge>
      </td>

      <td className="py-3 pr-4">
        <Badge tone={PRIORITY_TONES[article.priority]}>
          {PRIORITY_LABELS[article.priority]}
        </Badge>
      </td>

      <td className="py-3 pr-4 text-sm">
        {article.publicationDate ? (
          <>
            <p className="text-ink">{formatDate(article.publicationDate)}</p>
            <p className="text-ink-subtle text-xs">
              {formatTime(article.publicationDate)}
            </p>
          </>
        ) : (
          <span className="text-ink-subtle">—</span>
        )}
      </td>

      <td className="py-3 pr-4">
        <div className="flex items-center justify-end gap-1.5">
          <Tooltip label="Edit">
            <Link
              to={`/articles/${article.id}/edit`}
              aria-label={`Edit ${article.headline}`}
              className="text-ink-muted ring-hairline rounded-lg p-2 ring-1 transition-colors hover:bg-surface hover:text-ink-muted"
            >
              <Pencil className="size-4" aria-hidden />
            </Link>
          </Tooltip>

          <Tooltip label={canArchive ? 'Archive' : 'Already archived'}>
            <span className="inline-flex">
              <button
                type="button"
                onClick={() => onArchive(article)}
                disabled={!canArchive}
                aria-label={`Archive ${article.headline}`}
                className="text-ink-muted ring-hairline rounded-lg p-2 ring-1 transition-colors hover:bg-surface hover:text-ink-muted disabled:cursor-not-allowed disabled:text-ink-subtle disabled:hover:bg-transparent"
              >
                <Archive className="size-4" aria-hidden />
              </button>
            </span>
          </Tooltip>

          <Tooltip label="Delete">
            <button
              type="button"
              onClick={() => onDelete(article)}
              aria-label={`Delete ${article.headline}`}
              className="rounded-lg p-2 text-danger-text ring-1 ring-danger/25 transition-colors hover:bg-danger-soft"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}
