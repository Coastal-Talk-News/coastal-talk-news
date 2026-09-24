import Link from 'next/link';
import type { PublicArticleCardDto } from '@coastal-talk-news/types';
import type { Locale } from '../../lib/i18n/types';
import { CategoryTag } from './CategoryTag';
import { StoryImage } from './StoryImage';
import { StoryMeta } from './StoryMeta';

export function HeroStory({
  article,
  locale = 'en',
}: {
  article: PublicArticleCardDto;
  locale?: Locale;
}) {
  return (
    <article className="group relative isolate overflow-hidden rounded-card">
      <StoryImage
        image={article.image}
        alt=""
        priority
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="bg-night aspect-[4/3] w-full object-contain sm:aspect-[16/10] lg:aspect-[16/11]"
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
        <CategoryTag category={article.category} tone="solid" />
        <h2 className="headline-xl mt-3 leading-tight font-bold text-white">
          <Link href={`/article/${article.id}`} className="clamp-3">
            <span className="absolute inset-0" />
            {article.headline}
          </Link>
        </h2>
        <p className="clamp-2 mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
          {article.summary}
        </p>
        <div className="mt-3">
          <StoryMeta
            publicationDate={article.publicationDate}
            tone="inverse"
            locale={locale}
          />
        </div>
      </div>
    </article>
  );
}
