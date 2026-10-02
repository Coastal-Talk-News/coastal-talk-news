'use client';

import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';

/**
 * The site's name in the masthead is the homepage's one heading and plain
 * text everywhere else, where the page has a heading of its own. Decided from
 * the path rather than by the layout, because the layout isn't re-rendered
 * when a reader moves between pages: the server still sends the right element
 * for every address, so crawlers see the same heading readers do.
 */
export function MastheadName({
  className,
  style,
  children,
}: {
  className: string;
  style: CSSProperties;
  children: ReactNode;
}) {
  const Element = usePathname() === '/' ? 'h1' : 'span';
  return (
    <Element className={className} style={style}>
      {children}
    </Element>
  );
}
