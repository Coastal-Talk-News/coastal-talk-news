import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-accent-text mb-1.5 text-xs font-semibold tracking-[0.14em] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-ink text-[28px] leading-tight font-bold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-ink-muted mt-1.5 text-sm">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
