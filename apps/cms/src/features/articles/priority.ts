import type { ArticlePriority } from '@coastal-talk-news/types';

export const PRIORITY_LABELS: Record<ArticlePriority, string> = {
  LEAD_STORY: 'High',
  FEATURED: 'Medium',
  NORMAL: 'Low',
};

export const PRIORITY_TONES: Record<
  ArticlePriority,
  'red' | 'amber' | 'slate'
> = {
  LEAD_STORY: 'red',
  FEATURED: 'amber',
  NORMAL: 'slate',
};

export const PRIORITY_OPTIONS: Array<{
  value: ArticlePriority;
  label: string;
  description: string;
}> = [
  {
    value: 'LEAD_STORY',
    label: 'Lead Story',
    description: 'Top hero placement on the homepage.',
  },
  {
    value: 'FEATURED',
    label: 'Featured',
    description: 'Highlighted in featured sections.',
  },
  {
    value: 'NORMAL',
    label: 'Normal',
    description: 'Standard listing placement.',
  },
];
