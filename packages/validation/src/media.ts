import { Type } from '@sinclair/typebox';
import { IsoDateTime, paginationQueryFields } from './envelope.js';
import {
  IMAGE_CROP_MIN_FRACTION,
  IMAGE_WIDTH_MAX_PERCENT,
  IMAGE_WIDTH_MIN_PERCENT,
} from './limits.js';

export const MediaSummarySchema = Type.Object({
  id: Type.String(),
  url: Type.String(),
  width: Type.Integer(),
  height: Type.Integer(),
});

export const MediaUsageSchema = Type.Object({
  articles: Type.Integer(),
  categories: Type.Integer(),
  advertisements: Type.Integer(),
  settings: Type.Integer(),
  total: Type.Integer(),
});

export const MediaAssetSchema = Type.Object({
  id: Type.String(),
  url: Type.String(),
  thumbnailUrl: Type.String(),
  filename: Type.String(),
  mimeType: Type.String(),
  fileSize: Type.Integer(),
  width: Type.Integer(),
  height: Type.Integer(),
  createdAt: IsoDateTime,
  usage: MediaUsageSchema,
});

export const MediaListQuerySchema = Type.Object({
  ...paginationQueryFields,
  search: Type.Optional(Type.String({ maxLength: 120 })),
});

export const MediaParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export const CleanupResultSchema = Type.Object({ removed: Type.Integer() });

export const ImagePlacementSchema = Type.Union([
  Type.Literal('left'),
  Type.Literal('center'),
  Type.Literal('right'),
  Type.Literal('float-left'),
  Type.Literal('float-right'),
]);

const Fraction = Type.Number({ minimum: 0, maximum: 1 });

export const ImageCropSchema = Type.Object(
  {
    x: Fraction,
    y: Fraction,
    width: Type.Number({ minimum: IMAGE_CROP_MIN_FRACTION, maximum: 1 }),
    height: Type.Number({ minimum: IMAGE_CROP_MIN_FRACTION, maximum: 1 }),
  },
  { additionalProperties: false },
);

export const ImageWidthPercentSchema = Type.Integer({
  minimum: IMAGE_WIDTH_MIN_PERCENT,
  maximum: IMAGE_WIDTH_MAX_PERCENT,
});

export const ImageLayoutSchema = Type.Object(
  {
    widthPercent: ImageWidthPercentSchema,
    placement: ImagePlacementSchema,
    crop: Type.Union([ImageCropSchema, Type.Null()]),
  },
  { additionalProperties: false },
);
