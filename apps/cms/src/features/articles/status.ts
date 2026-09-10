import type { ArticleStatus } from '@coastal-talk-news/types';

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

export const STATUS_TONES: Record<ArticleStatus, 'green' | 'amber' | 'slate'> =
  {
    DRAFT: 'amber',
    PUBLISHED: 'green',
    ARCHIVED: 'slate',
  };
