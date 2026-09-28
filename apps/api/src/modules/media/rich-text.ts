import type { Database } from '@coastal-talk-news/db';
import type { ImageCrop, ImageLayoutDto } from '@coastal-talk-news/types';
import {
  ImageCropSchema,
  ImagePlacementSchema,
  ImageWidthPercentSchema,
} from '@coastal-talk-news/validation';
import {
  IMAGE_CAPTION_MAX,
  IMAGE_DEFAULT_WIDTH_PERCENT,
} from '@coastal-talk-news/validation/limits';
import { Value } from '@sinclair/typebox/value';
import { BadRequestError } from '../../lib/errors.js';
import type { ObjectStorage, PixelRegion } from './storage.js';

/** Widest a picture is delivered; the article column never shows more. */
const DELIVERY_MAX_WIDTH = 1600;
/** Tiptap documents are a few levels deep; this only stops a hostile one. */
const MAX_DEPTH = 40;
const MAX_EXTERNAL_URL = 2048;
const UUID_PATTERN =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const IS_UUID = new RegExp(`^${UUID_PATTERN}$`, 'i');
/** The last path segment of a delivery URL is the asset's own uuid. */
const URL_KEY_TAIL = new RegExp(
  `/(${UUID_PATTERN})(?:\\.[a-z0-9]+)?(?:[?#]|$)`,
  'i',
);

type Json = Record<string, unknown>;

interface AssetRow {
  id: string;
  storageKey: string;
  width: number;
  height: number;
}

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isImage(node: Json): boolean {
  return node['type'] === 'image';
}

function attrsOf(node: Json): Json {
  return isObject(node['attrs']) ? node['attrs'] : {};
}

/** Depth-first, in document order. `visit` returns the node to keep, or null to drop it. */
function mapNodes(
  node: unknown,
  visit: (node: Json) => Json | null,
  depth = 0,
): Json | null {
  if (!isObject(node)) return null;
  if (depth > MAX_DEPTH) {
    throw new BadRequestError('The article content is nested too deeply.');
  }
  const mapped = visit(node);
  if (!mapped || !Array.isArray(mapped['content'])) return mapped;
  return {
    ...mapped,
    content: mapped['content'].flatMap((child: unknown) => {
      const next = mapNodes(child, visit, depth + 1);
      return next ? [next] : [];
    }),
  };
}

function walk(doc: unknown, visit: (node: Json) => void): void {
  mapNodes(doc, (node) => {
    visit(node);
    return node;
  });
}

function keyTail(src: unknown): string | null {
  return typeof src === 'string' ? (URL_KEY_TAIL.exec(src)?.[1] ?? null) : null;
}

function tailOf(storageKey: string): string {
  return storageKey.slice(storageKey.lastIndexOf('/') + 1);
}

function findAssets(
  db: Database,
  ids: string[],
  tails: string[],
): Promise<AssetRow[]> {
  if (ids.length === 0 && tails.length === 0) return Promise.resolve([]);
  return db.mediaAsset.findMany({
    where: {
      OR: [
        ...(ids.length ? [{ id: { in: ids } }] : []),
        ...tails.map((tail) => ({ storageKey: { endsWith: `/${tail}` } })),
      ],
    },
    select: { id: true, storageKey: true, width: true, height: true },
  });
}

function externalUrl(src: unknown): string | null {
  if (typeof src !== 'string' || src.length > MAX_EXTERNAL_URL) return null;
  try {
    const { protocol } = new URL(src);
    return protocol === 'https:' || protocol === 'http:' ? src : null;
  } catch {
    return null;
  }
}

function invalid(field: string): never {
  throw new BadRequestError(`An image in the content has an invalid ${field}.`);
}

function fitsPicture(crop: ImageCrop): boolean {
  // The small allowance absorbs float rounding in the crop tool.
  return crop.x + crop.width <= 1.0001 && crop.y + crop.height <= 1.0001;
}

function isCrop(value: unknown): value is ImageCrop {
  return Value.Check(ImageCropSchema, value) && fitsPicture(value);
}

/**
 * Strict about what the editor can produce, so tampering fails loudly instead
 * of being quietly repaired. Anything not listed here is dropped.
 */
function layoutAttrs(attrs: Json): Json {
  const out: Json = {};
  const { widthPercent, placement, crop } = attrs;

  if (widthPercent != null) {
    if (!Value.Check(ImageWidthPercentSchema, widthPercent)) invalid('width');
    out['widthPercent'] = widthPercent;
  }
  if (placement != null) {
    if (!Value.Check(ImagePlacementSchema, placement)) invalid('placement');
    out['placement'] = placement;
  }
  if (crop != null) {
    if (!isCrop(crop)) invalid('crop');
    out['crop'] = crop;
  }
  for (const name of ['alt', 'title']) {
    const value = attrs[name];
    if (value == null || value === '') continue;
    if (typeof value !== 'string' || value.length > IMAGE_CAPTION_MAX) {
      invalid(name);
    }
    out[name] = value;
  }
  return out;
}

export interface PreparedContent {
  content: Json;
  /** Every library picture the document places, without repeats. */
  mediaIds: string[];
}

/**
 * Runs on every save. The document is what readers render, so it is rebuilt
 * from a whitelist rather than trusted: each image ends up as a media id plus
 * only the layout attributes it has. The URL is not stored (it is derived on
 * the way out), which keeps articles small, and images saved before ids
 * existed are matched to their asset by the URL they carry, so opening and
 * saving an old article upgrades it.
 */
export async function prepareContent(
  db: Database,
  doc: unknown,
): Promise<PreparedContent> {
  const ids = new Set<string>();
  const tails = new Set<string>();
  walk(doc, (node) => {
    if (!isImage(node)) return;
    const { mediaId, src } = attrsOf(node);
    const tail = keyTail(src);
    if (typeof mediaId === 'string' && IS_UUID.test(mediaId)) ids.add(mediaId);
    else if (tail) tails.add(tail);
  });

  const assets = await findAssets(db, [...ids], [...tails]);
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const byTail = new Map(
    assets.map((asset) => [tailOf(asset.storageKey), asset]),
  );

  const used = new Set<string>();
  const content = mapNodes(doc, (node) => {
    if (!isImage(node)) return node;
    const attrs = attrsOf(node);
    const { mediaId } = attrs;
    const asset =
      typeof mediaId === 'string'
        ? byId.get(mediaId)
        : byTail.get(keyTail(attrs['src']) ?? '');

    if (asset) {
      used.add(asset.id);
      return {
        type: 'image',
        attrs: { mediaId: asset.id, ...layoutAttrs(attrs) },
      };
    }
    if (mediaId != null) {
      throw new BadRequestError(
        'The content uses an image that is no longer in the media library. Remove it and add it again.',
      );
    }
    // A picture from outside the library cannot be tracked or cropped, but it
    // is still a legitimate way to illustrate a story.
    const src = externalUrl(attrs['src']);
    return src
      ? { type: 'image', attrs: { src, ...layoutAttrs(attrs) } }
      : null;
  });

  return { content: content ?? {}, mediaIds: [...used] };
}

function cropRegion(crop: ImageCrop, asset: AssetRow): PixelRegion {
  const x = Math.min(Math.round(crop.x * asset.width), asset.width - 1);
  const y = Math.min(Math.round(crop.y * asset.height), asset.height - 1);
  return {
    x,
    y,
    width: Math.max(
      1,
      Math.min(Math.round(crop.width * asset.width), asset.width - x),
    ),
    height: Math.max(
      1,
      Math.min(Math.round(crop.height * asset.height), asset.height - y),
    ),
  };
}

export interface DeliveredImage {
  url: string;
  width: number;
  height: number;
}

/** The picture as readers get it: cropped to `crop` when there is one. */
export function deliverImage(
  storage: ObjectStorage,
  asset: AssetRow,
  crop: ImageCrop | null,
): DeliveredImage {
  if (!crop) {
    return {
      url: storage.publicUrl(asset.storageKey, { width: DELIVERY_MAX_WIDTH }),
      width: asset.width,
      height: asset.height,
    };
  }
  const region = cropRegion(crop, asset);
  return {
    url: storage.publicUrl(asset.storageKey, {
      width: DELIVERY_MAX_WIDTH,
      region,
    }),
    width: region.width,
    height: region.height,
  };
}

export type HydrateMode = 'editor' | 'reader';

/**
 * The reverse of `prepareContent`: puts each picture's URL and pixel size back
 * on its node. The editor gets the whole original, because it draws the crop
 * itself and so can follow a drag instantly; readers get the already-cropped
 * file. Every image also leaves with a width and placement, so older ones that
 * never had either look the same everywhere and clients need no defaults of
 * their own. External pictures keep their own URL.
 */
export async function hydrateContent<T>(
  db: Database,
  storage: ObjectStorage,
  doc: T,
  mode: HydrateMode,
): Promise<T> {
  const ids = new Set<string>();
  let hasImages = false;
  walk(doc, (node) => {
    if (!isImage(node)) return;
    hasImages = true;
    const { mediaId } = attrsOf(node);
    if (typeof mediaId === 'string') ids.add(mediaId);
  });
  if (!hasImages) return doc;

  const byId = new Map(
    (await findAssets(db, [...ids], [])).map((asset) => [asset.id, asset]),
  );

  return mapNodes(doc, (node) => {
    if (!isImage(node)) return node;
    const attrs = attrsOf(node);
    const layout = {
      widthPercent: attrs['widthPercent'] ?? IMAGE_DEFAULT_WIDTH_PERCENT,
      placement: attrs['placement'] ?? 'center',
    };
    const { mediaId } = attrs;
    if (typeof mediaId !== 'string') {
      return { ...node, attrs: { ...attrs, ...layout } };
    }

    const asset = byId.get(mediaId);
    // Only possible if the asset was removed behind the API's back.
    if (!asset) return null;

    const picture =
      mode === 'reader'
        ? deliverImage(
            storage,
            asset,
            isCrop(attrs['crop']) ? attrs['crop'] : null,
          )
        : {
            url: storage.publicUrl(asset.storageKey),
            width: asset.width,
            height: asset.height,
          };
    return {
      ...node,
      attrs: {
        ...attrs,
        ...layout,
        src: picture.url,
        naturalWidth: picture.width,
        naturalHeight: picture.height,
      },
    };
  }) as T;
}

export const DEFAULT_COVER_LAYOUT: ImageLayoutDto = {
  widthPercent: 100,
  placement: 'center',
  crop: null,
};

/** What is stored for the cover: nothing at all while it is left as it was. */
export function toStoredLayout(
  layout: ImageLayoutDto,
): Partial<ImageLayoutDto> {
  const { widthPercent, placement, crop } = layout;
  return {
    ...(widthPercent !== DEFAULT_COVER_LAYOUT.widthPercent
      ? { widthPercent }
      : {}),
    ...(placement !== DEFAULT_COVER_LAYOUT.placement ? { placement } : {}),
    ...(crop && isCrop(crop) ? { crop } : {}),
  };
}

/** Fills the stored, sparse layout back out. */
export function toLayout(stored: unknown): ImageLayoutDto {
  const value = isObject(stored) ? stored : {};
  const { widthPercent, placement, crop } = value;
  return {
    widthPercent: Value.Check(ImageWidthPercentSchema, widthPercent)
      ? widthPercent
      : DEFAULT_COVER_LAYOUT.widthPercent,
    placement: Value.Check(ImagePlacementSchema, placement)
      ? placement
      : DEFAULT_COVER_LAYOUT.placement,
    crop: isCrop(crop) ? crop : null,
  };
}
