import type { AdFitMode, AdPlacement, Language } from '@coastal-talk-news/db';
import type {
  ArticleContent,
  PublicAdvertisementDetailDto,
  PublicAdvertisementDto,
  PublicArticleCardDto,
  PublicArticleDto,
  PublicNavCategoryDto,
  PublicSiteSettingsDto,
  RichTextContent,
} from '@coastal-talk-news/types';
import type {
  AdvertisementDetailRow,
  ArticleCardRow,
  ArticleDetailRow,
  NavCategoryRow,
} from './repository.js';

interface MediaRow {
  id: string;
  storageKey: string;
  width: number;
  height: number;
}

export type ToPublicUrl = (storageKey: string) => string;

/** Prisma widens a Json column to its own union; the response schema
 * re-checks the document's shape on the way out. */
export function toPageContent(value: unknown): ArticleContent | null {
  return value ? (value as ArticleContent) : null;
}

function toMedia(media: MediaRow | null, toPublicUrl: ToPublicUrl) {
  return media
    ? {
        id: media.id,
        url: toPublicUrl(media.storageKey),
        width: media.width,
        height: media.height,
      }
    : null;
}

export function toArticleCard(
  article: ArticleCardRow,
  toPublicUrl: ToPublicUrl,
): PublicArticleCardDto {
  return {
    id: article.id,
    // An article without a slug yet is still reachable by its id.
    slug: article.slug ?? article.id,
    headline: article.headline,
    summary: article.summary,
    language: article.language,
    category: article.category
      ? {
          ...article.category,
          slug: article.category.slug ?? article.category.id,
        }
      : null,
    image: toMedia(article.media, toPublicUrl),
    // Only published articles reach here, so the date is always set.
    publicationDate: (article.publicationDate ?? new Date()).toISOString(),
  };
}

/** An article page's source: a stored row, or a draft standing in for one. */
export type ArticleDetailSource = Omit<
  ArticleDetailRow,
  'content' | 'featuredImageLayout'
> & { content: unknown; featuredImageLayout: unknown };

export function toArticleDetail(
  article: ArticleDetailSource,
  toPublicUrl: ToPublicUrl,
  { content, coverImage }: Pick<PublicArticleDto, 'content' | 'coverImage'>,
): PublicArticleDto {
  return {
    ...toArticleCard(article, toPublicUrl),
    coverImage,
    content,
    youtubeUrl: article.youtubeUrl,
    tags: article.tags,
    seoTitle: article.seoTitle,
    metaDescription: article.metaDescription,
    ogImage: toMedia(article.ogImage, toPublicUrl),
    updatedAt: article.updatedAt.toISOString(),
  };
}

export function toNavCategory(
  category: NavCategoryRow,
  toPublicUrl: ToPublicUrl,
): PublicNavCategoryDto {
  return {
    id: category.id,
    // A category saved before slugs existed is still reachable by its id.
    slug: category.slug ?? category.id,
    name: category.name,
    nameKannada: category.nameKannada,
    description: category.description,
    articleCount: category._count.articles,
    image: toMedia(category.media, toPublicUrl),
    parentId: category.parentId,
    // Attached by the service layer, which sees the full flat list and can
    // group children under their parent — a single row has no view of its
    // siblings here.
    children: [],
  };
}

/**
 * Drops every category with nothing to read: no published article of its own
 * and no subcategory (at any depth) that has one. A section with an empty
 * page would only lead a reader nowhere. Run on the flat list, before it is
 * nested, so a hidden parent takes only empty children with it.
 */
export function withoutEmptyCategories(
  categories: PublicNavCategoryDto[],
): PublicNavCategoryDto[] {
  const byParent = new Map<string, PublicNavCategoryDto[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const siblings = byParent.get(category.parentId) ?? [];
    siblings.push(category);
    byParent.set(category.parentId, siblings);
  }
  const hasContent = (category: PublicNavCategoryDto): boolean =>
    category.articleCount > 0 ||
    (byParent.get(category.id) ?? []).some(hasContent);
  return categories.filter(hasContent);
}

/**
 * Nests each category under its parent's `children` array, recursively —
 * every entry keeps its own `children` populated (not just top-level ones),
 * so the desktop nav's flyout and the mobile drawer's accordion can walk the
 * tree to any depth. Children stay in the flat array too, unremoved, so the
 * homepage grid and mobile drawer can still read the same list flat.
 */
export function withNavChildren(
  categories: PublicNavCategoryDto[],
): PublicNavCategoryDto[] {
  // One shared node per category, created up front, so linking a child into
  // its parent's `children` array also carries that child's own (already
  // linked) children with it — a single pass keyed only by id would instead
  // copy each category's pre-link, still-empty `children`, flattening
  // anything past the first level.
  const nodes = new Map<string, PublicNavCategoryDto>();
  for (const category of categories) {
    nodes.set(category.id, { ...category, children: [] });
  }
  for (const category of categories) {
    if (!category.parentId) continue;
    const parent = nodes.get(category.parentId);
    const node = nodes.get(category.id);
    if (parent && node) parent.children.push(node);
  }
  return categories.map((category) => nodes.get(category.id)!);
}

interface AdvertisementRow {
  id: string;
  advertiserName: string;
  placement: AdPlacement;
  fitMode: AdFitMode;
  zoom: number;
  offsetX: number;
  offsetY: number;
  media: MediaRow;
}

export function toAdvertisement(
  advertisement: AdvertisementRow,
  toPublicUrl: ToPublicUrl,
): PublicAdvertisementDto {
  return {
    id: advertisement.id,
    advertiserName: advertisement.advertiserName,
    // FOOTER exists in the DB enum (another developer's in-progress work,
    // not wired to any application code) but never actually appears here -
    // nothing creates one, and the response schema only allows the three
    // placements this app supports.
    placement: advertisement.placement as PublicAdvertisementDto['placement'],
    // FILL is a leftover, unused DB enum value from an earlier design of
    // this same feature (crop used to be gated behind it) - nothing ever
    // writes it any more, so it's narrowed away the same way FOOTER is.
    fitMode: advertisement.fitMode as PublicAdvertisementDto['fitMode'],
    zoom: advertisement.zoom,
    offsetX: advertisement.offsetX,
    offsetY: advertisement.offsetY,
    image: {
      id: advertisement.media.id,
      url: toPublicUrl(advertisement.media.storageKey),
      width: advertisement.media.width,
      height: advertisement.media.height,
    },
  };
}

/** Meta descriptions are truncated, so the tag never carries the whole copy. */
const META_DESCRIPTION_MAX = 160;

function toMetaDescription(text: string | null): string | null {
  const trimmed = text?.replace(/\s+/g, ' ').trim();
  if (!trimmed) return null;
  return trimmed.length > META_DESCRIPTION_MAX
    ? `${trimmed.slice(0, META_DESCRIPTION_MAX - 1).trimEnd()}…`
    : trimmed;
}

export function toAdvertisementDetail(
  advertisement: AdvertisementDetailRow,
  toPublicUrl: ToPublicUrl,
): PublicAdvertisementDetailDto {
  return {
    ...toAdvertisement(advertisement, toPublicUrl),
    detailImage: toMedia(advertisement.detailMedia, toPublicUrl),
    description: (advertisement.description as RichTextContent | null) ?? null,
    destinationUrl: advertisement.destinationUrl,
    metaDescription: toMetaDescription(advertisement.descriptionText),
  };
}

interface SettingsRow {
  siteName: string;
  tagline: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  xUrl: string | null;
  whatsappEnglishUrl: string | null;
  whatsappKannadaUrl: string | null;
  defaultUiLanguage: Language;
  defaultSeoTitle: string | null;
  defaultMetaDescription: string | null;
  articleCacheMinutes: number;
  googleSiteVerification: string | null;
  logo: MediaRow | null;
  favicon: MediaRow | null;
  defaultOgImage: MediaRow | null;
}

/**
 * Browsers draw a favicon at 16–48px and iOS saves a 180px home-screen icon;
 * every page links it, so it is delivered at this width rather than as the
 * full upload (a 1254px, 320 KB original at the time of writing).
 */
const FAVICON_WIDTH = 192;

export function toSettings(
  settings: SettingsRow,
  toPublicUrl: ToPublicUrl,
  toSizedUrl: (storageKey: string, width: number) => string,
): PublicSiteSettingsDto {
  const { logo, favicon, defaultOgImage, ...rest } = settings;
  // Delivery never enlarges, so the reported size shrinks only when the
  // original is wider than the limit.
  const scale = favicon ? Math.min(1, FAVICON_WIDTH / favicon.width) : 1;
  return {
    ...rest,
    logo: toMedia(logo, toPublicUrl),
    favicon: favicon
      ? {
          id: favicon.id,
          url: toSizedUrl(favicon.storageKey, FAVICON_WIDTH),
          width: Math.round(favicon.width * scale),
          height: Math.round(favicon.height * scale),
        }
      : null,
    defaultOgImage: toMedia(defaultOgImage, toPublicUrl),
  };
}
