import Link from 'next/link';
import type { ReactNode } from 'react';

interface SectionHeadingProps {
  title: string;
  href?: string;
  linkLabel?: string;
  as?: 'h2' | 'h3';
  children?: ReactNode;
}

export function SectionHeading({
  title,
  href,
  linkLabel = 'View all',
  as: Tag = 'h2',
  children,
}: SectionHeadingProps) {
  return (
    <div className="border-ink mb-5 flex items-end justify-between gap-4 border-b-2 pb-2">
      <Tag className="text-xl font-bold sm:text-2xl">{title}</Tag>
      {children}
      {href && (
        <Link
          href={href}
          className="text-brand hover:text-brand-hover shrink-0 text-sm font-semibold transition-colors"
        >
          {linkLabel} <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}
