import type { AdvertisementDto } from '@coastal-talk-news/types';
import { Badge } from '@coastal-talk-news/ui/badge';
import { Toggle } from '@coastal-talk-news/ui/toggle';
import { Tooltip } from '@coastal-talk-news/ui/tooltip';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { formatDate, formatTime } from '../../lib/format.js';
import { advertisementStatus } from './status.js';

interface AdvertisementRowProps {
  item: AdvertisementDto;
  position: number;
  now: Date;
  onEdit: (item: AdvertisementDto) => void;
  onDelete: (item: AdvertisementDto) => void;
}

export function AdvertisementRow({
  item,
  position,
  now,
  onEdit,
  onDelete,
}: AdvertisementRowProps) {
  const status = advertisementStatus(item, now);
  const isLive = status.value === 'active';

  return (
    <tr className="hover:bg-surface-sunken transition-colors">
      <td className="text-ink-subtle w-9 py-3 pl-4 text-sm tabular-nums">
        {position}
      </td>

      <td className="py-3 pr-4">
        <img
          src={item.image.url}
          alt=""
          width={64}
          height={40}
          className="h-10 w-16 rounded-md object-cover ring-1 ring-black/5"
        />
      </td>

      <td className="py-3 pr-4">
        <div className="flex max-w-xs items-center gap-1.5">
          <p className="text-ink truncate font-medium">{item.advertiserName}</p>
          <a
            href={item.destinationUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open link for ${item.advertiserName}`}
            className="text-ink-subtle shrink-0 transition-colors hover:text-accent-text"
          >
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      </td>

      <td className="py-3 pr-4 text-sm">
        <p className="text-ink">
          {formatDate(item.startAt)} · {formatTime(item.startAt)}
        </p>
        <p className="text-ink-subtle text-xs">
          to {formatDate(item.endAt)} · {formatTime(item.endAt)}
        </p>
      </td>

      <td className="py-3 pr-4">
        <Badge tone={status.tone}>{status.label}</Badge>
      </td>

      <td className="py-3 pr-4">
        <div className="flex items-center justify-end gap-1.5">
          <Tooltip
            label={
              isLive
                ? 'Live now — turns off automatically at End'
                : 'Not live — follows the schedule above'
            }
          >
            <span className="inline-flex">
              <Toggle
                checked={isLive}
                disabled
                onCheckedChange={() => {}}
                aria-label={`${item.advertiserName} is ${isLive ? 'live' : 'not live'}`}
              />
            </span>
          </Tooltip>

          <Tooltip label="Edit">
            <button
              type="button"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.advertiserName}`}
              className="text-ink-muted ring-hairline ml-1 rounded-lg p-2 ring-1 transition-colors hover:bg-surface hover:text-ink-muted"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          </Tooltip>

          <Tooltip label="Delete">
            <button
              type="button"
              onClick={() => onDelete(item)}
              aria-label={`Delete ${item.advertiserName}`}
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
