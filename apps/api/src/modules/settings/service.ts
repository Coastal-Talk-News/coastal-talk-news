import type { Database } from '@coastal-talk-news/db';
import type { ArticleContent } from '@coastal-talk-news/types';
import type { FastifyBaseLogger } from 'fastify';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { releaseMedia } from '../media/reference.js';
import { purgeStorageObjects } from '../media/service.js';
import type { ObjectStorage } from '../media/storage.js';
import * as repository from './repository.js';

export interface SettingsServiceDeps {
  db: Database;
  storage: ObjectStorage;
  logger: FastifyBaseLogger;
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
  contactTitle?: string | null;
  contactIntro?: string | null;
  contactHours?: string | null;
  advertiseTitle?: string | null;
  advertiseIntro?: string | null;
  advertiseContent?: ArticleContent | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  xUrl?: string | null;
  whatsappEnglishUrl?: string | null;
  whatsappKannadaUrl?: string | null;
  defaultSeoTitle?: string | null;
  defaultMetaDescription?: string | null;
  defaultOgImageId?: string | null;
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

export async function getForCms({ db }: SettingsServiceDeps) {
  const settings = await repository.findFirst(db);
  if (!settings) {
    throw new NotFoundError('Site settings');
  }
  return settings;
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
      ...(input.aboutContent !== undefined
        ? { aboutContent: input.aboutContent }
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
      ...(input.advertiseContent !== undefined
        ? { advertiseContent: input.advertiseContent }
        : {}),
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
    });

    const orphanedKeys = await releaseMedia(tx, [
      logoChanged ? existing.logoMediaId : null,
      faviconChanged ? existing.faviconMediaId : null,
      ogImageChanged ? existing.defaultOgImageId : null,
    ]);

    return { settings, orphanedKeys };
  });

  await purgeStorageObjects(storage, logger, orphanedKeys);
  return settings;
}
