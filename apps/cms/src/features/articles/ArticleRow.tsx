import type { ArticleDto } from '@coastal-talk-news/types';
import { Badge } from '@coastal-talk-news/ui/badge';
import { Tooltip } from '@coastal-talk-news/ui/tooltip';
import { iconButtonClass } from '@coastal-talk-news/ui/icon-button';
import {
  Archive,
  ArchiveRestore,
  Check,
  Copy,
  ExternalLink,
  ImageIcon,
  Pencil,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicArticleUrl } from '../../config.js';
import { formatDate, formatTime } from '../../lib/format.js';
import { PRIORITY_LABELS, PRIORITY_TONES } from './priority.js';
import { estimateReadMinutes } from './readTime.js';
import { STATUS_LABELS, STATUS_TONES } from './status.js';

const LANGUAGE_LABELS = { ENGLISH: 'English', KANNADA: 'Kannada' } as const;

interface ArticleRowProps {
  article: ArticleDto;
  onDelete: (article: ArticleDto) => void;
  onArchive: (article: ArticleDto) => void;
  onRestore: (article: ArticleDto) => void;
  onPublish: (article: ArticleDto) => void;
  onUnpublish: (article: ArticleDto) => void;
}

/** Copies its own url and shows a brief tick, matching CopyButton's timing. */
function CopyLinkAction({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <Tooltip label={copied ? 'Copied' : label}>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
          } catch {
            return;
          }
          setCopied(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 2000);
        }}
        aria-label={label}
        className={iconButtonClass()}
      >
        {copied ? (
          <Check className="text-success-text size-4" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
      </button>
    </Tooltip>
  );
}

export function ArticleRow({
  article,
  onDelete,
  onArchive,
  onRestore,
  onPublish,
  onUnpublish,
}: ArticleRowProps) {
  const readMinutes = estimateReadMinutes(article.content);
  const { status } = article;
  const liveUrl = status === 'PUBLISHED' ? publicArticleUrl(article.id) : null;

  return (
    <tr className="group hover:bg-surface-sunken align-middle transition-colors">
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
        <Badge tone={STATUS_TONES[article.status]} dot>
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
        <div className="flex items-center justify-end gap-1.5 opacity-65 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {liveUrl && (
            <>
              <Tooltip label="View the live article">
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${article.headline} on the website`}
                  className={iconButtonClass()}
                >
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              </Tooltip>
              <CopyLinkAction
                url={liveUrl}
                label={`Copy the link to ${article.headline}`}
              />
            </>
          )}

          <Tooltip label="Edit">
            <Link
              to={`/articles/${article.id}/edit`}
              aria-label={`Edit ${article.headline}`}
              className={iconButtonClass()}
            >
              <Pencil className="size-4" aria-hidden />
            </Link>
          </Tooltip>

          {status === 'DRAFT' && (
            <Tooltip label="Publish — puts it on the website">
              <button
                type="button"
                onClick={() => onPublish(article)}
                aria-label={`Publish ${article.headline}`}
                className={iconButtonClass('accent')}
              >
                <Send className="size-4" aria-hidden />
              </button>
            </Tooltip>
          )}

          {status === 'PUBLISHED' && (
            <Tooltip label="Move back to drafts — takes it off the website">
              <button
                type="button"
                onClick={() => onUnpublish(article)}
                aria-label={`Move ${article.headline} back to drafts`}
                className={iconButtonClass()}
              >
                <Undo2 className="size-4" aria-hidden />
              </button>
            </Tooltip>
          )}

          {status === 'ARCHIVED' ? (
            <Tooltip label="Restore to drafts">
              <button
                type="button"
                onClick={() => onRestore(article)}
                aria-label={`Restore ${article.headline} to drafts`}
                className={iconButtonClass()}
              >
                <ArchiveRestore className="size-4" aria-hidden />
              </button>
            </Tooltip>
          ) : (
            <Tooltip label="Archive — hides it from the website">
              <button
                type="button"
                onClick={() => onArchive(article)}
                aria-label={`Archive ${article.headline}`}
                className={iconButtonClass()}
              >
                <Archive className="size-4" aria-hidden />
              </button>
            </Tooltip>
          )}

          <Tooltip label="Delete">
            <button
              type="button"
              onClick={() => onDelete(article)}
              aria-label={`Delete ${article.headline}`}
              className={iconButtonClass('danger')}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}
