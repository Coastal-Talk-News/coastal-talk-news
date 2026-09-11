import { formatTimeAgo } from '../../lib/format';

interface StoryMetaProps {
  publicationDate: string;
  tone?: 'default' | 'inverse';
}

export function StoryMeta({
  publicationDate,
  tone = 'default',
}: StoryMetaProps) {
  const color = tone === 'inverse' ? 'text-white/80' : 'text-ink-subtle';

  return (
    <p className={`${color} flex flex-wrap items-center gap-x-2 text-xs`}>
      <time dateTime={publicationDate}>{formatTimeAgo(publicationDate)}</time>
    </p>
  );
}
