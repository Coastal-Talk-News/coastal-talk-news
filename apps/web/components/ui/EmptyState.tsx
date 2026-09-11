import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  /** 'inline' sits inside a section, 'page' fills a route. */
  variant?: 'inline' | 'page';
}

export function EmptyState({
  title,
  description,
  action,
  variant = 'inline',
}: EmptyStateProps) {
  return (
    <div
      className={`border-rule flex flex-col items-center rounded-card border border-dashed text-center ${
        variant === 'page' ? 'px-6 py-20' : 'px-6 py-12'
      }`}
    >
      <span
        aria-hidden
        className="bg-paper-sunken text-ink-subtle mb-4 grid size-12 place-items-center rounded-full font-serif text-xl"
      >
        N
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-ink-muted mt-1.5 max-w-md text-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
