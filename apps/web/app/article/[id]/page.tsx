import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleBody } from '../../../components/news/ArticleBody';
import { CategoryTag } from '../../../components/news/CategoryTag';
import { ViewTracker } from '../../../components/news/ViewTracker';
import { ShareLinks } from '../../../components/news/ShareLinks';
import { StoryImage } from '../../../components/news/StoryImage';
import { YoutubeEmbed } from '../../../components/news/YoutubeEmbed';
import { estimateReadMinutes } from '@coastal-talk-news/types';
import { formatDateTime } from '../../../lib/format';
import { getArticle, getSite } from '../../../lib/api';
import { getDictionary } from '../../../lib/i18n/dictionaries';
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
  const [article, { settings }, locale] = await Promise.all([
    getArticle(id),
    getSite(),
    getLocale(),
  ]);
  if (!article) notFound();

  const dictionary = getDictionary(locale);
  const shareUrl = `${await getOrigin()}/article/${article.id}`;
  // Half the read time the CMS shows: the reader has to stay past this for
  // the visit to count as a read.
  const readThresholdSeconds = estimateReadMinutes(article.content) * 30;

  return (
    // A news column is capped by line length rather than by the grid: past
    // roughly 70 characters a reader starts losing their place between lines.
    <article className="text-ink [--color-ink-muted:#000000] [--color-ink:#000000] max-w-[44rem] min-[1120px]:max-w-[52rem] py-6 sm:py-8">
      <ViewTracker
        articleId={article.id}
        thresholdSeconds={readThresholdSeconds}
      />

      <header>
        <CategoryTag category={article.category} locale={locale} />

        {/* Never larger than the masthead: these track Brand's NAME_SIZE.lg
            breakpoint for breakpoint. */}
        <h1 className="headline-xl mt-3 font-serif leading-tight font-bold text-balance">
          {article.headline}
        </h1>

        {/* The standfirst. A handful of articles open the body with this same
            sentence, in which case it reads twice — but that is an authoring
            habit, and dropping it would cost every other article its summary. */}
        {/* Set at the body's size: the standfirst is the article's opening
            paragraph, so anything larger reads as a second headline. */}
        <p className="text-ink-muted font-article mt-3 text-[1rem] leading-relaxed text-justify sm:text-[1.125rem]">
          {article.summary}
        </p>

        <div className="border-rule mt-5 flex flex-wrap items-center justify-between gap-4 border-y py-3">
          <time
            dateTime={article.publicationDate}
            className="text-ink-subtle text-sm"
          >
            {formatDateTime(article.publicationDate)}
          </time>
          <ShareLinks
            url={shareUrl}
            headline={article.headline}
            locale={locale}
            whatsappEnglishUrl={settings.whatsappEnglishUrl}
            whatsappKannadaUrl={settings.whatsappKannadaUrl}
          />
        </div>
      </header>

      {article.image && (
        <figure className="mt-6">
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

      <footer className="border-rule bg-paper-sunken rounded-card mt-8 border p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div>
            <h2 className="font-serif text-lg font-bold">
              {dictionary.article.shareHeading}
            </h2>
            <p className="text-ink-subtle mt-1 text-sm">
              {dictionary.article.shareDescription}
            </p>
          </div>
          <ShareLinks
            url={shareUrl}
            headline={article.headline}
            locale={locale}
            variant="panel"
            whatsappEnglishUrl={settings.whatsappEnglishUrl}
            whatsappKannadaUrl={settings.whatsappKannadaUrl}
          />
        </div>
      </footer>
    </article>
  );
}
