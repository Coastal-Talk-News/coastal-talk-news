import type { BreakingNewsDto } from '@coastal-talk-news/types';
import { Badge } from '@coastal-talk-news/ui/badge';
import { Toggle } from '@coastal-talk-news/ui/toggle';
import { Tooltip } from '@coastal-talk-news/ui/tooltip';
import { iconButtonClass } from '@coastal-talk-news/ui/icon-button';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { formatDate, formatTime } from '../../lib/format.js';
import { breakingNewsStatus } from './status.js';

interface BreakingNewsRowProps {
  item: BreakingNewsDto;
  position: number;
  now: Date;
  onEdit: (item: BreakingNewsDto) => void;
  onDelete: (item: BreakingNewsDto) => void;
}

export function BreakingNewsRow({
  item,
  position,
  now,
  onEdit,
  onDelete,
}: BreakingNewsRowProps) {
  const status = breakingNewsStatus(item, now);
  const isLive = status.value === 'active';

  return (
    <tr className="group hover:bg-surface-sunken align-middle transition-colors">
      <td className="text-ink-subtle w-9 py-3 pl-4 text-sm tabular-nums">
        {position}
      </td>

      <td className="py-3 pr-4">
        <div className="flex max-w-md items-center gap-1.5">
          <p className="text-ink truncate font-medium">{item.headline}</p>
          {item.articleUrl && (
            <a
              href={item.articleUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open link for ${item.headline}`}
              className="text-ink-subtle shrink-0 transition-colors hover:text-accent-text"
            >
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </div>
      </td>

      <td className="py-3 pr-4">
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
      </td>

      <td className="py-3 pr-4 text-sm">
        <p className="text-ink">{formatDate(item.startAt)}</p>
        <p className="text-ink-subtle text-xs">{formatTime(item.startAt)}</p>
      </td>

      <td className="py-3 pr-4 text-sm">
        {item.endAt ? (
          <>
            <p className="text-ink">{formatDate(item.endAt)}</p>
            <p className="text-ink-subtle text-xs">{formatTime(item.endAt)}</p>
          </>
        ) : (
          <p className="text-ink-subtle italic">Until deleted</p>
        )}
      </td>

      <td className="py-3 pr-4">
        <div className="flex items-center justify-end gap-1.5 opacity-65 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Tooltip
            label={
              isLive
                ? item.endAt
                  ? 'Live now — turns off automatically at End'
                  : 'Live now — no end time set, runs until deleted'
                : 'Not live — follows the schedule above'
            }
          >
            <span className="inline-flex">
              <Toggle
                checked={isLive}
                disabled
                onCheckedChange={() => {}}
                aria-label={`${item.headline} is ${isLive ? 'live' : 'not live'}`}
              />
            </span>
          </Tooltip>

          <Tooltip label="Edit">
            <button
              type="button"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.headline}`}
              className={iconButtonClass()}
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          </Tooltip>

          <Tooltip label="Delete">
            <button
              type="button"
              onClick={() => onDelete(item)}
              aria-label={`Delete ${item.headline}`}
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
