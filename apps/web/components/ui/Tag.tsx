import Link from 'next/link';
import type { ReactNode } from 'react';

interface TagProps {
  href: string;
  tone?: 'solid' | 'quiet';
  children: ReactNode;
}

/** The small uppercase label above a headline. */
export function Tag({ href, tone = 'quiet', children }: TagProps) {
  const toneClass =
    tone === 'solid'
      ? 'bg-brand text-white'
      : 'bg-brand-soft text-brand hover:bg-brand hover:text-white';

  return (
    <Link
      href={href}
      className={`${toneClass} inline-flex w-fit items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors`}
    >
      {children}
    </Link>
  );
}
