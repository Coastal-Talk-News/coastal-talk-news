import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { estimateReadMinutes } from '@coastal-talk-news/types';
import { ArticleView } from '../../../components/news/ArticleView';
import { ViewTracker } from '../../../components/news/ViewTracker';
import { getArticle, getSite } from '../../../lib/api';
import { categoryName } from '../../../lib/category-name';
import { ancestorsOf } from '../../../lib/category-trail';
import { getDictionary } from '../../../lib/i18n/dictionaries';
import { getLocale } from '../../../lib/i18n/server';
import {
  articleKey,
  articleKeyFrom,
  articlePath,
  categoryPath,
  decodeParam,
} from '../../../lib/routes';
import { buildMetadata } from '../../../lib/seo';
import { getOrigin } from '../../../lib/site-url';
import {
  JsonLd,
  breadcrumbJsonLd,
  newsArticleJsonLd,
} from '../../../lib/structured-data';

interface ArticlePageProps {
  /** The article's slug — or, on links shared before slugs, its id. */
  params: Promise<{ slug: string }>;
}

/**
 * One lookup per request, shared by generateMetadata and the page (the same
 * fetch is made once and cached): the segment as typed, its tidy key, and
 * the article that key finds, if any. `cacheMinutes` is Settings →
 * Advanced's configurable article cache window - needs settings loaded
 * first, so this can't run in the same Promise.all as getSite() below.
 */
async function loadArticle(
  params: ArticlePageProps['params'],
  cacheMinutes: number,
) {
  const segment = decodeParam((await params).slug);
  const key = articleKeyFrom(segment);
  return {
    segment,
    article: key ? await getArticle(key, cacheMinutes) : null,
  };
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const [{ settings }, locale, origin] = await Promise.all([
    getSite(),
    getLocale(),
    getOrigin(),
  ]);
  const { segment, article } = await loadArticle(
    params,
    settings.articleCacheMinutes,
  );
  if (!article) return { title: 'Article not found' };
  // Any other address is redirected by the page; nothing to describe here.
  if (articleKey(article) !== segment) return {};

  return buildMetadata({
    settings,
    locale,
    origin,
    // An SEO title the newsroom wrote is used exactly; otherwise the headline
    // gets the site's name appended.
    absoluteTitle: article.seoTitle ?? undefined,
    title: article.headline,
    description: article.metaDescription ?? article.summary,
    image: article.ogImage ?? article.image,
    path: articlePath(article),
    type: 'article',
    publishedTime: article.publicationDate,
    modifiedTime: article.updatedAt,
    section: article.category?.name,
    tags: article.tags,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const [{ settings, categories }, locale, origin] = await Promise.all([
    getSite(),
    getLocale(),
    getOrigin(),
  ]);
  const { segment, article } = await loadArticle(
    params,
    settings.articleCacheMinutes,
  );
  if (!article) notFound();

  // One address per article. An old id link, a slug the editor has since
  // changed, or a link a chat app damaged all arrive here with the article
  // already loaded, and go to its current address in a single permanent hop.
  const path = articlePath(article);
  if (articleKey(article) !== segment) permanentRedirect(path);

  const dictionary = getDictionary(locale);
  // Only sections that are live: a hidden category's page 404s, and the
  // breadcrumb must not send search engines there.
  const section = categories.find(
    (category) => category.id === article.category?.id,
  );
  const trail = section
    ? [...ancestorsOf(section.id, categories), section]
    : [];
  const breadcrumb = [
    { name: dictionary.common.home, path: '/' },
    ...trail.map((category) => ({
      name: categoryName(category, locale),
      path: categoryPath(category),
    })),
    { name: article.headline, path },
  ];

  // Half the read time the CMS shows: the reader has to stay past this for
  // the visit to count as a read. Not rendered on the preview page — a draft
  // being looked at in the CMS should never count as a real reader visit.
  const readThresholdSeconds = estimateReadMinutes(article.content) * 30;

  return (
    <>
      <JsonLd
        data={[
          newsArticleJsonLd(article, settings, origin, path),
          breadcrumbJsonLd(breadcrumb, origin),
        ]}
      />
      <ViewTracker
        articleId={article.id}
        thresholdSeconds={readThresholdSeconds}
      />
      <ArticleView
        article={article}
        settings={settings}
        locale={locale}
        shareUrl={`${origin}${path}`}
      />
    </>
  );
}
