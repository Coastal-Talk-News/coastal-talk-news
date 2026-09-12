import Link from 'next/link';
import type { PublicArticleCardDto } from '@coastal-talk-news/types';
import type { Locale } from '../../lib/i18n/types';
import { CategoryTag } from './CategoryTag';
import { StoryImage } from './StoryImage';
import { StoryMeta } from './StoryMeta';

interface StoryCardProps {
  article: PublicArticleCardDto;
  /** 'stacked' for grids, 'row' for sidebar and section lists. */
  layout?: 'stacked' | 'row';
  showSummary?: boolean;
  showCategory?: boolean;
  sizes?: string;
  locale?: Locale;
}

export function StoryCard({
  article,
  layout = 'stacked',
  showSummary = false,
  showCategory = false,
  sizes = '(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 90vw',
  locale = 'en',
}: StoryCardProps) {
  const href = `/article/${article.id}`;

  if (layout === 'row') {
    return (
      <article className="group flex gap-3">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden
          className="shrink-0 overflow-hidden rounded-sm"
        >
          <StoryImage
            image={article.image}
            alt=""
            sizes="96px"
            className="h-16 w-24 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        <div className="min-w-0 flex-1">
          {showCategory && (
            <div className="mb-1.5">
              <CategoryTag category={article.category} tone="solid" />
            </div>
          )}
          <h3 className="text-[15px] leading-snug font-semibold">
            <Link
              href={href}
              className="clamp-2 group-hover:text-brand transition-colors"
            >
              {article.headline}
            </Link>
          </h3>
          <div className="mt-1">
            <StoryMeta
              publicationDate={article.publicationDate}
              locale={locale}
            />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className="overflow-hidden rounded-sm"
      >
        <StoryImage
          image={article.image}
          alt=""
          sizes={sizes}
          className="aspect-[16/10] max-h-64 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <CategoryTag category={article.category} />
        <h3 className="mt-2 text-lg leading-snug font-semibold">
          <Link
            href={href}
            className="clamp-3 group-hover:text-brand transition-colors"
          >
            {article.headline}
          </Link>
        </h3>
        {showSummary && (
          <p className="text-ink-muted clamp-2 mt-2 text-sm leading-relaxed">
            {article.summary}
          </p>
        )}
        <div className="mt-auto pt-3">
          <StoryMeta
            publicationDate={article.publicationDate}
            locale={locale}
          />
        </div>
      </div>
    </article>
  );
}
