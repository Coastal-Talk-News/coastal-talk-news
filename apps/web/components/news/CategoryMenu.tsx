import Image from 'next/image';
import Link from 'next/link';
import type { PublicNavCategoryDto } from '@coastal-talk-news/types';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

/**
 * A quick-jump grid to every section, distinct from the header's text nav —
 * mirrors the active category list one-for-one so it never drifts from what
 * the CMS publishes.
 */
export function CategoryMenu({
  categories,
  locale = 'en',
}: {
  categories: PublicNavCategoryDto[];
  locale?: Locale;
}) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label={getDictionary(locale).category.browseByCategory}>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/category/${category.id}`}
              className="border-rule bg-paper-sunken hover:border-brand hover:bg-brand-soft group flex flex-col items-center gap-2 rounded-card border px-3 py-4 text-center transition-colors"
            >
              {category.image ? (
                <Image
                  src={category.image.url}
                  alt=""
                  width={40}
                  height={40}
                  sizes="40px"
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="bg-brand-soft text-brand group-hover:bg-brand grid size-10 shrink-0 place-items-center rounded-full font-serif text-base font-bold transition-colors group-hover:text-white"
                >
                  {category.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="group-hover:text-brand clamp-2 text-xs font-semibold transition-colors sm:text-sm">
                {category.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
