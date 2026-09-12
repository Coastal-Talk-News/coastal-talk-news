import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArticleBody } from '../../../components/news/ArticleBody';
import { CategoryTag } from '../../../components/news/CategoryTag';
import { ShareLinks } from '../../../components/news/ShareLinks';
import { StoryImage } from '../../../components/news/StoryImage';
import { YoutubeEmbed } from '../../../components/news/YoutubeEmbed';
import { formatDateTime } from '../../../lib/format';
import { getArticle } from '../../../lib/api';

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Share intents need an absolute URL, and the site runs on a different host in
 * every environment. Reading the request host keeps that out of the config.
 */
async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const protocol =
    headerList.get('x-forwarded-proto') ??
    (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: 'Article not found' };

  const description = article.metaDescription ?? article.summary;
  const image = article.ogImage ?? article.image;

  return {
    title: article.seoTitle ?? article.headline,
    description,
    openGraph: {
      type: 'article',
      title: article.seoTitle ?? article.headline,
      description,
      publishedTime: article.publicationDate,
      ...(image ? { images: [{ url: image.url }] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const shareUrl = `${await requestOrigin()}/article/${article.id}`;

  return (
    // A news column is capped by line length rather than by the grid: past
    // roughly 70 characters a reader starts losing their place between lines.
    <article className="mx-auto max-w-[44rem] py-8 sm:py-12">
      <header>
        <CategoryTag category={article.category} />

        <h1 className="mt-4 font-serif text-3xl leading-tight font-bold text-balance sm:text-4xl lg:text-[2.75rem]">
          {article.headline}
        </h1>

        {/* The summary is deliberately not repeated here: docs/PROJECT-SCOPE.md
            scopes it to listings and social previews, and in practice authors
            open the body with the same sentence. */}
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
