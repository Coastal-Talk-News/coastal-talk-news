import type { Database, SitePage } from '@coastal-talk-news/db';
import type { ArticleContent } from '@coastal-talk-news/types';
import type { FastifyBaseLogger } from 'fastify';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import {
  revalidateAllArticles,
  revalidateStandalonePages,
  type WebRevalidateConfig,
} from '../../lib/webRevalidate.js';
import { releaseMedia, syncPageMedia } from '../media/reference.js';
import { hydrateContent, prepareContent } from '../media/rich-text.js';
import { purgeStorageObjects } from '../media/service.js';
import type { ObjectStorage } from '../media/storage.js';
import * as repository from './repository.js';

export interface SettingsServiceDeps {
  db: Database;
  storage: ObjectStorage;
  logger: FastifyBaseLogger;
  webRevalidate: WebRevalidateConfig;
}

export interface UpdateSiteSettingsInput {
  siteName?: string;
  tagline?: string | null;
  logoMediaId?: string | null;
  faviconMediaId?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  aboutTitle?: string | null;
  aboutIntro?: string | null;
  aboutContent?: ArticleContent | null;
  aboutContentKannada?: ArticleContent | null;
  contactTitle?: string | null;
  contactIntro?: string | null;
  contactHours?: string | null;
  advertiseTitle?: string | null;
  advertiseIntro?: string | null;
  advertiseContent?: ArticleContent | null;
  privacyContent?: ArticleContent | null;
  termsContent?: ArticleContent | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  xUrl?: string | null;
  whatsappEnglishUrl?: string | null;
  whatsappKannadaUrl?: string | null;
  defaultSeoTitle?: string | null;
  defaultMetaDescription?: string | null;
  defaultOgImageId?: string | null;
  articleCacheMinutes?: number;
  googleSiteVerification?: string | null;
}

const STANDALONE_PAGE_FIELDS = [
  'aboutTitle',
  'aboutIntro',
  'aboutContent',
  'aboutContentKannada',
  'contactTitle',
  'contactIntro',
  'contactHours',
  'advertiseTitle',
  'advertiseIntro',
  'advertiseContent',
  'privacyContent',
  'termsContent',
  'contactEmail',
  'contactPhone',
  'contactAddress',
] as const satisfies ReadonlyArray<keyof UpdateSiteSettingsInput>;

function touchesStandalonePages(input: UpdateSiteSettingsInput): boolean {
  return STANDALONE_PAGE_FIELDS.some((field) => input[field] !== undefined);
}

/** Search Console's tokens are letters, digits, '-' and '_'. */
const VERIFICATION_TOKEN = /^[A-Za-z0-9_-]{10,100}$/;

/**
 * Accepts the bare token or the whole tag Search Console shows
 * (`<meta name="google-site-verification" content="…" />`) and keeps only
 * the token, so whatever is stored can only ever be a plain attribute value.
 */
function toVerificationToken(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const token = /content\s*=\s*["']([^"']*)["']/i.exec(trimmed)?.[1] ?? trimmed;
  if (!VERIFICATION_TOKEN.test(token)) {
    throw new BadRequestError(
      'That does not look like a Google Search Console verification code. Paste the code, or the whole meta tag Search Console gives you.',
    );
  }
  return token;
}

async function assertMediaExists(
  db: Database,
  mediaId: string,
  field: string,
): Promise<void> {
  if (!(await repository.mediaExists(db, mediaId))) {
    throw new BadRequestError(
      `${field} does not refer to an existing media asset.`,
    );
  }
}

/**
 * Each rich-text page and the settings fields that hold its body - every
 * SitePage *except* Terms (see the comment below) and Footer, which exists
 * in the DB enum as another developer's in-progress work with no fields
 * of its own yet.
 */
const PAGE_FIELDS = {
  ABOUT: ['aboutContent', 'aboutContentKannada'],
  ADVERTISE: ['advertiseContent'],
  PRIVACY: ['privacyContent'],
} as const satisfies Partial<
  Record<SitePage, ReadonlyArray<keyof UpdateSiteSettingsInput>>
>;

type ContentField = (typeof PAGE_FIELDS)[keyof typeof PAGE_FIELDS][number];
type ContentPatch = Partial<
  Record<ContentField | 'termsContent', object | null>
>;

/**
 * Cleans the bodies of every page this update touches. A page is handled as a
 * whole, so the field that was not sent is read back from what is stored: the
 * page's set of pictures is one list, and it would lose the other language's
 * pictures if only one side were looked at.
 */
async function preparePages(
  db: Database,
  existing: Record<ContentField, unknown>,
  input: UpdateSiteSettingsInput,
) {
  const patch: ContentPatch = {};
  const mediaByPage = new Map<SitePage, string[]>();

  for (const [page, fields] of Object.entries(PAGE_FIELDS) as Array<
    [keyof typeof PAGE_FIELDS, ReadonlyArray<ContentField>]
  >) {
    if (fields.every((field) => input[field] === undefined)) continue;

    const ids = new Set<string>();
    for (const field of fields) {
      const doc = input[field] === undefined ? existing[field] : input[field];
      if (!doc) {
        patch[field] = null;
        continue;
      }
      const prepared = await prepareContent(db, doc);
      patch[field] = prepared.content;
      prepared.mediaIds.forEach((id) => ids.add(id));
    }
    mediaByPage.set(page, [...ids]);
  }

  // Terms has no SitePage entry (see PAGE_FIELDS), so its pictures aren't
  // protected from "delete unused" the way the other pages' are — flagged in
  // docs/DATA-MODEL.md. Still cleaned through the same whitelist, since it's
  // rendered publicly like any other rich-text field.
  if (input.termsContent !== undefined && input.termsContent) {
    patch.termsContent = (await prepareContent(db, input.termsContent)).content;
  } else if (input.termsContent === null) {
    patch.termsContent = null;
  }

  return { patch, mediaByPage };
}

/** The editor needs each picture's URL, which the stored bodies leave out. */
async function forEditor(
  { db, storage }: SettingsServiceDeps,
  settings: NonNullable<Awaited<ReturnType<typeof repository.findFirst>>>,
) {
  const [
    aboutContent,
    aboutContentKannada,
    advertiseContent,
    privacyContent,
    termsContent,
  ] = await Promise.all(
    [
      settings.aboutContent,
      settings.aboutContentKannada,
      settings.advertiseContent,
      settings.privacyContent,
      settings.termsContent,
    ].map((doc) => (doc ? hydrateContent(db, storage, doc, 'editor') : doc)),
  );
  return {
    ...settings,
    aboutContent,
    aboutContentKannada,
    advertiseContent,
    privacyContent,
    termsContent,
  };
}

export async function getForCms(deps: SettingsServiceDeps) {
  const settings = await repository.findFirst(deps.db);
  if (!settings) {
    throw new NotFoundError('Site settings');
  }
  return forEditor(deps, settings);
}

export async function update(
  deps: SettingsServiceDeps,
  input: UpdateSiteSettingsInput,
) {
  const { db, storage, logger } = deps;

  const existing = await repository.findFirst(db);
  if (!existing) {
    throw new NotFoundError('Site settings');
  }
  const { patch, mediaByPage } = await preparePages(db, existing, input);
  const googleSiteVerification =
    input.googleSiteVerification !== undefined
      ? toVerificationToken(input.googleSiteVerification)
      : undefined;

  if (input.logoMediaId) {
    await assertMediaExists(db, input.logoMediaId, 'logoMediaId');
  }
  if (input.faviconMediaId) {
    await assertMediaExists(db, input.faviconMediaId, 'faviconMediaId');
  }
  if (input.defaultOgImageId) {
    await assertMediaExists(db, input.defaultOgImageId, 'defaultOgImageId');
  }

  const logoChanged =
    input.logoMediaId !== undefined &&
    input.logoMediaId !== existing.logoMediaId;
  const faviconChanged =
    input.faviconMediaId !== undefined &&
    input.faviconMediaId !== existing.faviconMediaId;
  const ogImageChanged =
    input.defaultOgImageId !== undefined &&
    input.defaultOgImageId !== existing.defaultOgImageId;

  const { settings, orphanedKeys } = await db.$transaction(async (tx) => {
    const settings = await repository.update(tx, existing.id, {
      ...patch,
      ...(input.siteName !== undefined
        ? { siteName: input.siteName.trim() }
        : {}),
      ...(input.tagline !== undefined
        ? { tagline: input.tagline?.trim() || null }
        : {}),
      ...(input.logoMediaId !== undefined
        ? { logoMediaId: input.logoMediaId }
        : {}),
      ...(input.faviconMediaId !== undefined
        ? { faviconMediaId: input.faviconMediaId }
        : {}),
      ...(input.contactEmail !== undefined
        ? { contactEmail: input.contactEmail?.trim() || null }
        : {}),
      ...(input.contactPhone !== undefined
        ? { contactPhone: input.contactPhone?.trim() || null }
        : {}),
      ...(input.contactAddress !== undefined
        ? { contactAddress: input.contactAddress?.trim() || null }
        : {}),
      ...(input.aboutTitle !== undefined
        ? { aboutTitle: input.aboutTitle?.trim() || null }
        : {}),
      ...(input.aboutIntro !== undefined
        ? { aboutIntro: input.aboutIntro?.trim() || null }
        : {}),
      ...(input.contactTitle !== undefined
        ? { contactTitle: input.contactTitle?.trim() || null }
        : {}),
      ...(input.contactIntro !== undefined
        ? { contactIntro: input.contactIntro?.trim() || null }
        : {}),
      ...(input.contactHours !== undefined
        ? { contactHours: input.contactHours?.trim() || null }
        : {}),
      ...(input.advertiseTitle !== undefined
        ? { advertiseTitle: input.advertiseTitle?.trim() || null }
        : {}),
      ...(input.advertiseIntro !== undefined
        ? { advertiseIntro: input.advertiseIntro?.trim() || null }
        : {}),
      // advertiseContent/privacyContent/termsContent all go through `patch`
      // above, which cleans the pictures each one places.
      ...(input.facebookUrl !== undefined
        ? { facebookUrl: input.facebookUrl?.trim() || null }
        : {}),
      ...(input.instagramUrl !== undefined
        ? { instagramUrl: input.instagramUrl?.trim() || null }
        : {}),
      ...(input.youtubeUrl !== undefined
        ? { youtubeUrl: input.youtubeUrl?.trim() || null }
        : {}),
      ...(input.xUrl !== undefined ? { xUrl: input.xUrl?.trim() || null } : {}),
      ...(input.whatsappEnglishUrl !== undefined
        ? { whatsappEnglishUrl: input.whatsappEnglishUrl?.trim() || null }
        : {}),
      ...(input.whatsappKannadaUrl !== undefined
        ? { whatsappKannadaUrl: input.whatsappKannadaUrl?.trim() || null }
        : {}),
      ...(input.defaultSeoTitle !== undefined
        ? { defaultSeoTitle: input.defaultSeoTitle?.trim() || null }
        : {}),
      ...(input.defaultMetaDescription !== undefined
        ? {
            defaultMetaDescription:
              input.defaultMetaDescription?.trim() || null,
          }
        : {}),
      ...(input.defaultOgImageId !== undefined
        ? { defaultOgImageId: input.defaultOgImageId }
        : {}),
      ...(input.articleCacheMinutes !== undefined
        ? { articleCacheMinutes: input.articleCacheMinutes }
        : {}),
      ...(googleSiteVerification !== undefined
        ? { googleSiteVerification }
        : {}),
    });

    const droppedFromPages: string[] = [];
    for (const [page, mediaIds] of mediaByPage) {
      droppedFromPages.push(...(await syncPageMedia(tx, page, mediaIds)));
    }

    const orphanedKeys = await releaseMedia(tx, [
      ...droppedFromPages,
      logoChanged ? existing.logoMediaId : null,
      faviconChanged ? existing.faviconMediaId : null,
      ogImageChanged ? existing.defaultOgImageId : null,
    ]);

    return { settings, orphanedKeys };
  });

  await purgeStorageObjects(storage, logger, orphanedKeys);
  if (touchesStandalonePages(input)) {
    await revalidateStandalonePages(deps.webRevalidate, deps.logger);
  }
  return forEditor(deps, settings);
}

/** The client-facing "Clear article cache" action: every cached article page
 *  on the reader site re-fetches on its next visit, regardless of how much
 *  of its cache window is left. */
export async function clearArticleCache(
  deps: SettingsServiceDeps,
): Promise<void> {
  await revalidateAllArticles(deps.webRevalidate, deps.logger);
}
