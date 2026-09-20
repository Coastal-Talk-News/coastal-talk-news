import { Prisma } from '@coastal-talk-news/db';
import type { AdPlacement, Database } from '@coastal-talk-news/db';
import type { RichTextContent } from '@coastal-talk-news/types';
import type { FastifyBaseLogger } from 'fastify';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../lib/errors.js';
import type { PaginationParams } from '../../lib/pagination.js';
import { toSkipTake } from '../../lib/pagination.js';
import { extractPlainText } from '../../lib/tiptap-text.js';
import { releaseMedia } from '../media/reference.js';
import { purgeStorageObjects } from '../media/service.js';
import type { ObjectStorage } from '../media/storage.js';
import * as repository from './repository.js';

export interface AdvertisementServiceDeps {
  db: Database;
  storage: ObjectStorage;
  logger: FastifyBaseLogger;
}

export interface CreateAdvertisementInput {
  advertiserName: string;
  mediaId: string;
  detailMediaId?: string | null;
  description?: RichTextContent | null;
  destinationUrl?: string | null;
  displayOrder?: number;
  placement?: AdPlacement;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
  startAt: string;
  endAt: string;
}

export type UpdateAdvertisementInput = Partial<CreateAdvertisementInput>;

/** Zones sold by the slot. Sidebar is absent because it is uncapped. */
const PLACEMENT_CAPACITY: Partial<Record<AdPlacement, number>> = {
  MASTHEAD: 1,
  TOP: 3,
};

const PLACEMENT_LABEL: Record<AdPlacement, string> = {
  MASTHEAD: 'Masthead',
  TOP: 'Top',
  SIDEBAR: 'Right Side',
};

async function assertMediaExists(db: Database, mediaId: string): Promise<void> {
  if (!(await repository.mediaExists(db, mediaId))) {
    throw new BadRequestError(
      'mediaId does not refer to an existing media asset.',
    );
  }
}

function assertWindow(startAt: Date, endAt: Date): void {
  if (endAt.getTime() <= startAt.getTime()) {
    throw new BadRequestError('endAt must be after startAt.');
  }
}

async function assertPlacementCapacity(
  db: Database,
  placement: AdPlacement,
  window: { startAt: Date; endAt: Date },
  excludeId?: string,
): Promise<void> {
  const capacity = PLACEMENT_CAPACITY[placement];
  if (capacity === undefined) {
    return;
  }

  const taken = await repository.countOverlappingInPlacement(
    db,
    placement,
    window,
    excludeId,
  );
  if (taken >= capacity) {
    throw new ConflictError(
      `${PLACEMENT_LABEL[placement]} placement is full (${capacity}/${capacity}) for these dates. Move another ad, or run this one over different dates.`,
    );
  }
}

/** An empty string is how a cleared link arrives from the form. */
function normalizeUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * The text is stored beside the document so listings and meta tags can read a
 * sentence of it without loading and walking the document itself.
 */
function descriptionWrite(
  description: RichTextContent | null | undefined,
): Partial<repository.AdvertisementWriteData> {
  if (description === undefined) {
    return {};
  }
  return {
    description: description ?? Prisma.DbNull,
    descriptionText: description ? extractPlainText(description) : null,
  };
}

export async function listForCms(
  { db }: AdvertisementServiceDeps,
  pagination: PaginationParams,
) {
  const [rows, total] = await Promise.all([
    repository.findMany(db, toSkipTake(pagination)),
    repository.count(db),
  ]);
  return { rows, total };
}

export async function getForCms({ db }: AdvertisementServiceDeps, id: string) {
  const item = await repository.findById(db, id);
  if (!item) {
    throw new NotFoundError('Advertisement');
  }
  return item;
}

export async function create(
  { db }: AdvertisementServiceDeps,
  input: CreateAdvertisementInput,
) {
  await assertMediaExists(db, input.mediaId);
  if (input.detailMediaId) {
    await assertMediaExists(db, input.detailMediaId);
  }

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  assertWindow(startAt, endAt);

  const placement: AdPlacement = input.placement ?? 'SIDEBAR';
  await assertPlacementCapacity(db, placement, { startAt, endAt });

  return repository.create(db, {
    advertiserName: input.advertiserName.trim(),
    mediaId: input.mediaId,
    detailMediaId: input.detailMediaId ?? null,
    destinationUrl: normalizeUrl(input.destinationUrl),
    // Appended to the end of the zone unless a position was given explicitly
    // - the CMS form never sends one, only the drag-to-reorder call does.
    displayOrder:
      input.displayOrder ?? (await repository.nextDisplayOrder(db, placement)),
    placement,
    zoom: input.zoom ?? 100,
    offsetX: input.offsetX ?? 0,
    offsetY: input.offsetY ?? 0,
    startAt,
    endAt,
    description: input.description ?? Prisma.DbNull,
    descriptionText: input.description
      ? extractPlainText(input.description)
      : null,
  });
}

export async function update(
  deps: AdvertisementServiceDeps,
  id: string,
  input: UpdateAdvertisementInput,
) {
  const { db, storage, logger } = deps;

  const existing = await repository.findById(db, id);
  if (!existing) {
    throw new NotFoundError('Advertisement');
  }

  if (input.mediaId) {
    await assertMediaExists(db, input.mediaId);
  }
  if (input.detailMediaId) {
    await assertMediaExists(db, input.detailMediaId);
  }

  const startAt = input.startAt ? new Date(input.startAt) : existing.startAt;
  const endAt = input.endAt ? new Date(input.endAt) : existing.endAt;
  assertWindow(startAt, endAt);

  // Re-checked whenever the zone or the dates move: either can push the ad
  // into a period that is already sold out.
  const placement = input.placement ?? existing.placement;
  const scheduleTouched =
    input.placement !== undefined ||
    input.startAt !== undefined ||
    input.endAt !== undefined;
  if (scheduleTouched) {
    await assertPlacementCapacity(db, placement, { startAt, endAt }, id);
  }

  // Moving zones drops the ad at the end of the new one, same as a fresh ad,
  // unless the caller also gave an explicit position to land on instead.
  const movingZones =
    input.placement !== undefined && input.placement !== existing.placement;
  const displayOrder =
    input.displayOrder ??
    (movingZones
      ? await repository.nextDisplayOrder(db, placement)
      : undefined);

  const detailMediaId =
    input.detailMediaId === undefined
      ? undefined
      : (input.detailMediaId ?? null);

  const replaced: Array<string | null> = [];
  if (input.mediaId !== undefined && input.mediaId !== existing.media.id) {
    replaced.push(existing.media.id);
  }
  if (
    detailMediaId !== undefined &&
    existing.detailMedia &&
    detailMediaId !== existing.detailMedia.id
  ) {
    replaced.push(existing.detailMedia.id);
  }

  const { advertisement, orphanedKeys } = await db.$transaction(async (tx) => {
    const advertisement = await repository.update(tx, id, {
      ...(input.advertiserName !== undefined
        ? { advertiserName: input.advertiserName.trim() }
        : {}),
      ...(input.mediaId !== undefined ? { mediaId: input.mediaId } : {}),
      ...(detailMediaId !== undefined ? { detailMediaId } : {}),
      ...(input.destinationUrl !== undefined
        ? { destinationUrl: normalizeUrl(input.destinationUrl) }
        : {}),
      ...(displayOrder !== undefined ? { displayOrder } : {}),
      ...(input.placement !== undefined ? { placement: input.placement } : {}),
      ...(input.zoom !== undefined ? { zoom: input.zoom } : {}),
      ...(input.offsetX !== undefined ? { offsetX: input.offsetX } : {}),
      ...(input.offsetY !== undefined ? { offsetY: input.offsetY } : {}),
      ...(input.startAt !== undefined ? { startAt } : {}),
      ...(input.endAt !== undefined ? { endAt } : {}),
      ...descriptionWrite(input.description),
    });

    const orphanedKeys = await releaseMedia(tx, replaced);
    return { advertisement, orphanedKeys };
  });

  await purgeStorageObjects(storage, logger, orphanedKeys);
  return advertisement;
}

/**
 * Applied as one transaction of individual updates rather than a bulk
 * statement: Postgres has no portable "set from this array, in this order"
 * form, and the list tops out in the tens of rows, so the round trips cost
 * nothing that matters.
 */
export async function reorder(
  { db }: AdvertisementServiceDeps,
  placement: AdPlacement,
  ids: string[],
): Promise<void> {
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    throw new BadRequestError('ids contains duplicate entries.');
  }

  await db.$transaction(async (tx) => {
    const total = await repository.countInPlacement(tx, placement);
    if (ids.length !== total) {
      throw new ConflictError(
        `Reorder must include every advertisement in ${PLACEMENT_LABEL[placement]}. Received ${ids.length} of ${total}.`,
        { received: ids.length, expected: total },
      );
    }

    const found = await repository.findIdsInPlacement(tx, placement, ids);
    if (found.length !== ids.length) {
      throw new BadRequestError(
        `ids contains an advertisement that does not exist, or is not in ${PLACEMENT_LABEL[placement]}.`,
      );
    }

    for (const [index, id] of ids.entries()) {
      await repository.setDisplayOrder(tx, id, index);
    }
  });
}

export async function remove(
  deps: AdvertisementServiceDeps,
  id: string,
): Promise<void> {
  const { db, storage, logger } = deps;

  const existing = await repository.findById(db, id);
  if (!existing) {
    throw new NotFoundError('Advertisement');
  }

  const orphanedKeys = await db.$transaction(async (tx) => {
    await repository.remove(tx, id);
    return releaseMedia(tx, [
      existing.media.id,
      existing.detailMedia?.id ?? null,
    ]);
  });

  await purgeStorageObjects(storage, logger, orphanedKeys);
}
