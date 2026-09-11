import Link from 'next/link';
import type { PublicArticleCardDto } from '@coastal-talk-news/types';
import { CategoryTag } from './CategoryTag';
import { StoryImage } from './StoryImage';
import { StoryMeta } from './StoryMeta';

export function HeroStory({ article }: { article: PublicArticleCardDto }) {
  return (
    <article className="group relative isolate overflow-hidden rounded-card">
      <StoryImage
        image={article.image}
        alt=""
        priority
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="aspect-[4/3] w-full object-cover sm:aspect-[16/10] lg:aspect-[16/11]"
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <CategoryTag category={article.category} tone="solid" />
        <h2 className="mt-3 text-2xl leading-tight font-bold text-white sm:text-3xl lg:text-[2.1rem]">
          <Link href={`/article/${article.id}`}>
            <span className="absolute inset-0" />
            {article.headline}
          </Link>
        </h2>
        <p className="clamp-2 mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
          {article.summary}
        </p>
        <div className="mt-3">
          <StoryMeta publicationDate={article.publicationDate} tone="inverse" />
        </div>
      </div>
    </article>
  );
}
