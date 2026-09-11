import type { ReactNode } from 'react';
import { cn } from './cn.js';

type Tone = 'green' | 'amber' | 'slate' | 'red' | 'blue';

const TONES: Record<Tone, string> = {
  green: 'bg-success-soft text-success-text',
  amber: 'bg-warn-soft text-warn-text',
  slate: 'bg-surface-sunken text-ink-muted',
  red: 'bg-danger-soft text-danger-text',
  blue: 'bg-accent-soft text-accent-text',
};

const DOTS: Record<Tone, string> = {
  green: 'bg-success-text',
  amber: 'bg-warn-text',
  slate: 'bg-ink-subtle',
  red: 'bg-danger-text',
  blue: 'bg-accent-text',
};

export function Badge({
  tone = 'slate',
  dot = false,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
      )}
    >
      {dot && (
        <span
          aria-hidden
          className={cn('size-1.5 shrink-0 rounded-full', DOTS[tone])}
        />
      )}
      {children}
    </span>
  );
}
