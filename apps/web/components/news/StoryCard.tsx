import Link from 'next/link';
import type { PublicArticleCardDto } from '@coastal-talk-news/types';
import { highlightMatches } from '../../lib/highlight';
import type { Locale } from '../../lib/i18n/types';
import { CategoryTag } from './CategoryTag';
import { StoryImage } from './StoryImage';
import { StoryMeta } from './StoryMeta';

interface StoryCardProps {
  article: PublicArticleCardDto;
  /** 'stacked' for grids, 'row' for sidebar and section lists, 'wide' for a
   * story that has a full-width row to itself — a stacked card stretched
   * that far becomes a banner, and a sidebar row leaves half the width
   * empty. */
  layout?: 'stacked' | 'row' | 'wide';
  /** 'row' only: a roomier thumbnail and headline, for a list carrying a
   * column on its own rather than sitting in a sidebar. */
  roomy?: boolean;
  showSummary?: boolean;
  showCategory?: boolean;
  sizes?: string;
  locale?: Locale;
  /** Set only on search results — highlights matches in the headline/summary. */
  highlightQuery?: string;
}

export function StoryCard({
  article,
  layout = 'stacked',
  roomy = false,
  showSummary = false,
  showCategory = false,
  sizes = '(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 90vw',
  locale = 'en',
  highlightQuery,
}: StoryCardProps) {
  const href = `/article/${article.id}`;
  const headline = highlightQuery
    ? highlightMatches(article.headline, highlightQuery)
    : article.headline;
  const summary = highlightQuery
    ? highlightMatches(article.summary, highlightQuery)
    : article.summary;
  // A card with no picture gives the space to the words instead of framing
  // an empty placeholder.
  const hasImage = Boolean(article.image);

  if (layout === 'wide') {
    return (
      <article className="group border-rule bg-paper rounded-card flex flex-col overflow-hidden border transition-shadow hover:shadow-lg sm:flex-row">
        {hasImage && (
          <Link
            href={href}
            tabIndex={-1}
            aria-hidden
            className="block overflow-hidden sm:w-72 sm:shrink-0"
          >
            <StoryImage
              image={article.image}
              alt=""
              sizes="(min-width: 640px) 288px, 90vw"
              className="bg-paper-sunken aspect-[16/10] w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </Link>
        )}

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          {showCategory && <CategoryTag category={article.category} />}
          <h3 className="mt-2 text-lg leading-snug font-semibold sm:text-xl">
            <Link
              href={href}
              className="clamp-2 group-hover:text-brand transition-colors"
            >
              {headline}
            </Link>
          </h3>
          {showSummary && (
            <p className="text-ink-muted clamp-2 mt-2 text-sm leading-relaxed">
              {summary}
            </p>
          )}
          <div className="mt-3">
            <StoryMeta
              publicationDate={article.publicationDate}
              locale={locale}
            />
          </div>
        </div>
      </article>
    );
  }

  if (layout === 'row') {
    return (
      <article className="group flex gap-3">
        {hasImage && (
          <Link
            href={href}
            tabIndex={-1}
            aria-hidden
            className="shrink-0 overflow-hidden rounded-sm"
          >
            <StoryImage
              image={article.image}
              alt=""
              sizes={roomy ? '144px' : '96px'}
              className={`bg-paper-sunken object-contain transition-transform duration-300 group-hover:scale-105 ${
                roomy ? 'h-24 w-36' : 'h-16 w-24'
              }`}
            />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          {showCategory && (
            <div className="mb-1.5">
              <CategoryTag category={article.category} tone="solid" />
            </div>
          )}
          <h3
            className={`leading-snug font-semibold ${roomy ? 'text-base' : 'text-[15px]'}`}
          >
            <Link
              href={href}
              className="clamp-2 group-hover:text-brand transition-colors"
            >
              {headline}
            </Link>
          </h3>
          {roomy && showSummary && (
            <p className="text-ink-muted clamp-2 mt-1.5 text-sm leading-relaxed">
              {summary}
            </p>
          )}
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
    <article className="group border-rule bg-paper rounded-card flex h-full flex-col overflow-hidden border transition-shadow hover:shadow-lg">
      {hasImage && (
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden
          className="block overflow-hidden"
        >
          <StoryImage
            image={article.image}
            alt=""
            sizes={sizes}
            className="bg-paper-sunken aspect-[16/10] max-h-64 w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>
      )}

      <div className="flex flex-1 flex-col p-4">
        <CategoryTag category={article.category} />
        <h3
          className={`mt-2 leading-snug font-semibold ${hasImage ? 'text-lg' : 'text-xl sm:text-2xl'}`}
        >
          <Link
            href={href}
            className="clamp-3 group-hover:text-brand transition-colors"
          >
            {headline}
          </Link>
        </h3>
        {showSummary && (
          <p
            className={`text-ink-muted mt-2 text-sm leading-relaxed ${hasImage ? 'clamp-2' : 'clamp-5'}`}
          >
            {summary}
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
