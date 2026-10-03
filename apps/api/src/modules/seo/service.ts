import type { Database } from '@coastal-talk-news/db';
import type {
  SeoArticleIssueDto,
  SeoHealthDto,
} from '@coastal-talk-news/types';
import { NotFoundError } from '../../lib/errors.js';
import type { PaginationParams } from '../../lib/pagination.js';
import { toSkipTake } from '../../lib/pagination.js';
import * as repository from './repository.js';

const isBlank = (value: string | null) => !value?.trim();

export async function getHealth(db: Database): Promise<SeoHealthDto> {
  const [settings, articleCounts, categoryCounts, categoryItems] =
    await Promise.all([
      repository.findSiteSettings(db),
      repository.countArticleIssues(db),
      repository.countCategoryIssues(db),
      repository.findCategoriesWithIssues(db),
    ]);
  if (!settings || !articleCounts || !categoryCounts) {
    throw new NotFoundError('Site settings');
  }

  const socialProfiles = [
    settings.facebookUrl,
    settings.instagramUrl,
    settings.youtubeUrl,
    settings.xUrl,
  ].filter((url) => !isBlank(url)).length;

  return {
    site: {
      siteName: settings.siteName,
      defaultSeoTitle: settings.defaultSeoTitle,
      defaultMetaDescription: settings.defaultMetaDescription,
      hasLogo: settings.logoMediaId !== null,
      hasFavicon: settings.faviconMediaId !== null,
      hasDefaultOgImage: settings.defaultOgImageId !== null,
      hasGoogleSiteVerification: !isBlank(settings.googleSiteVerification),
      socialProfiles,
    },
    articles: articleCounts,
    categories: {
      ...categoryCounts,
      items: categoryItems.map((category) => ({
        id: category.id,
        name: category.name,
        parentName: category.parent?.name ?? null,
        missingSeoTitle: isBlank(category.seoTitle),
        missingMetaDescription: isBlank(category.metaDescription),
        missingSlug: category.slug === null,
      })),
    },
  };
}

/** Published articles missing something, most recent first, a page at a time:
 * the list grows with the archive, so it is never sent whole. */
export async function listArticleIssues(
  db: Database,
  pagination: PaginationParams,
): Promise<{ rows: SeoArticleIssueDto[]; total: number }> {
  const [rows, total] = await Promise.all([
    repository.findArticlesWithIssues(db, toSkipTake(pagination)),
    repository.countArticlesWithIssues(db),
  ]);
  return {
    rows: rows.map((article) => ({
      id: article.id,
      headline: article.headline,
      publicationDate: article.publicationDate?.toISOString() ?? null,
      missingSeoTitle: isBlank(article.seoTitle),
      missingMetaDescription: isBlank(article.metaDescription),
      missingSlug: article.slug === null,
      missingFeaturedImage: article.mediaId === null,
    })),
    total,
  };
}
