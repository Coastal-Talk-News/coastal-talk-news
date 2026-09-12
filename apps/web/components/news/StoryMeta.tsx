import { formatTimeAgo } from '../../lib/format';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

interface StoryMetaProps {
  publicationDate: string;
  tone?: 'default' | 'inverse';
  locale?: Locale;
}

export function StoryMeta({
  publicationDate,
  tone = 'default',
  locale = 'en',
}: StoryMetaProps) {
  const color = tone === 'inverse' ? 'text-white/80' : 'text-ink-subtle';
  const justNow = getDictionary(locale).common.justNow;

  return (
    <p className={`${color} flex flex-wrap items-center gap-x-2 text-xs`}>
      <time dateTime={publicationDate}>
        {formatTimeAgo(publicationDate, locale, justNow)}
      </time>
    </p>
  );
}
