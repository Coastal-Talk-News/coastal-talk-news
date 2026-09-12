'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { PublicNavCategoryDto } from '@coastal-talk-news/types';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

export function MobileNav({
  categories,
  locale,
}: {
  categories: PublicNavCategoryDto[];
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const dictionary = getDictionary(locale);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dictionary.header.openMenu}
        className="hover:bg-paper-sunken grid size-10 place-items-center rounded-sm transition-colors"
      >
        <span aria-hidden className="flex flex-col gap-1">
          <span className="bg-ink block h-0.5 w-5 rounded-full" />
          <span className="bg-ink block h-0.5 w-5 rounded-full" />
          <span className="bg-ink block h-0.5 w-3.5 rounded-full" />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label={dictionary.header.closeMenu}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <nav
            aria-label={dictionary.header.sections}
            className="bg-paper relative flex h-full w-72 max-w-[80vw] flex-col overflow-y-auto p-5"
          >
            <p className="text-ink-subtle mb-3 text-[11px] font-semibold tracking-[0.12em] uppercase">
              {dictionary.header.sections}
            </p>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="border-rule hover:text-brand border-b py-3 font-semibold transition-colors"
            >
              {dictionary.common.home}
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                onClick={() => setOpen(false)}
                className="border-rule hover:text-brand flex items-center justify-between border-b py-3 font-semibold transition-colors"
              >
                {category.name}
                <span className="text-ink-subtle text-xs font-normal">
                  {category.articleCount}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
