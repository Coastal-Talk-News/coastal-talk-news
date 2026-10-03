import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { estimateReadMinutes } from '@coastal-talk-news/types';
import { ArticleView } from '../../../components/news/ArticleView';
import { ViewTracker } from '../../../components/news/ViewTracker';
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
  const [{ settings }, locale, origin] = await Promise.all([
    getSite(),
    getLocale(),
    getOrigin(),
  ]);
  const article = await getArticle(id, settings.articleCacheMinutes);
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
  const [{ settings }, locale] = await Promise.all([getSite(), getLocale()]);
  const article = await getArticle(id, settings.articleCacheMinutes);
  if (!article) notFound();

  // Half the read time the CMS shows: the reader has to stay past this for
  // the visit to count as a read. Not rendered on the preview page — a draft
  // being looked at in the CMS should never count as a real reader visit.
  const readThresholdSeconds = estimateReadMinutes(article.content) * 30;

  return (
    <>
      <ViewTracker
        articleId={article.id}
        thresholdSeconds={readThresholdSeconds}
      />
      <ArticleView
        article={article}
        settings={settings}
        locale={locale}
        shareUrl={`${await getOrigin()}/article/${article.id}`}
      />
    </>
  );
}
