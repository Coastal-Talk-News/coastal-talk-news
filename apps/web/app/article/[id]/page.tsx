import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleBody } from '../../../components/news/ArticleBody';
import { CategoryTag } from '../../../components/news/CategoryTag';
import { ShareLinks } from '../../../components/news/ShareLinks';
import { StoryImage } from '../../../components/news/StoryImage';
import { YoutubeEmbed } from '../../../components/news/YoutubeEmbed';
import { formatDateTime } from '../../../lib/format';
import { getArticle, getSite } from '../../../lib/api';
import { getLocale } from '../../../lib/i18n/server';
import { buildMetadata } from '../../../lib/seo';
import { getOrigin } from '../../../lib/site-url';

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const [article, { settings }, locale, origin] = await Promise.all([
    getArticle(id),
    getSite(),
    getLocale(),
    getOrigin(),
  ]);
  if (!article) return { title: 'Article not found' };

  // Each value falls back to the newsroom's default inside buildMetadata, so
  // an article with no SEO overrides still gets a full set of tags.
  return buildMetadata({
    settings,
    locale,
    origin,
    title: article.seoTitle ?? article.headline,
    description: article.metaDescription ?? article.summary,
    image: article.ogImage ?? article.image,
    path: `/article/${article.id}`,
    type: 'article',
    publishedTime: article.publicationDate,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const shareUrl = `${await getOrigin()}/article/${article.id}`;

  return (
    // A news column is capped by line length rather than by the grid: past
    // roughly 70 characters a reader starts losing their place between lines.
    <article className="max-w-[44rem] py-8 sm:py-12">
      <header>
        <CategoryTag category={article.category} />

        <h1 className="mt-4 font-serif text-3xl leading-tight font-bold text-balance sm:text-4xl lg:text-[2.75rem]">
          {article.headline}
        </h1>

        {/* The standfirst. A handful of articles open the body with this same
            sentence, in which case it reads twice — but that is an authoring
            habit, and dropping it would cost every other article its summary. */}
        <p className="text-ink-muted mt-4 text-lg leading-relaxed text-pretty">
          {article.summary}
        </p>

        <div className="border-rule mt-6 flex flex-wrap items-center justify-between gap-4 border-y py-3">
          <time
            dateTime={article.publicationDate}
            className="text-ink-subtle text-sm"
          >
            {formatDateTime(article.publicationDate)}
          </time>
          <ShareLinks url={shareUrl} headline={article.headline} />
        </div>
      </header>

      {article.image && (
        <figure className="mt-8">
          <StoryImage
            image={article.image}
            alt=""
            priority
            sizes="(min-width: 768px) 704px, 100vw"
            className="h-auto w-full rounded-card"
          />
        </figure>
      )}

      <ArticleBody content={article.content} />

      {article.youtubeUrl && (
        <YoutubeEmbed url={article.youtubeUrl} title={article.headline} />
      )}

      <footer className="border-rule mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <p className="text-ink-subtle text-sm">
          Share this story with your circle
        </p>
        <ShareLinks url={shareUrl} headline={article.headline} />
      </footer>
    </article>
  );
}
