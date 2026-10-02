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
  filename: Type.String(),
  mimeType: Type.String(),
  fileSize: Type.Integer(),
  width: Type.Integer(),
  height: Type.Integer(),
  createdAt: IsoDateTime,
  usage: MediaUsageSchema,
});

export const UploadSignatureBodySchema = Type.Object(
  {
    contentType: Type.String({ minLength: 1, maxLength: 100 }),
  },
  { additionalProperties: false },
);

const CloudinaryUploadTicketSchema = Type.Object({
  provider: Type.Literal('cloudinary'),
  cloudName: Type.String(),
  apiKey: Type.String(),
  timestamp: Type.Integer(),
  signature: Type.String(),
  publicId: Type.String(),
  allowedFormats: Type.String(),
});

const S3UploadTicketSchema = Type.Object({
  provider: Type.Literal('s3'),
  uploadUrl: Type.String(),
  storageKey: Type.String(),
  fields: Type.Record(Type.String(), Type.String()),
});

export const MediaUploadTicketSchema = Type.Union([
  CloudinaryUploadTicketSchema,
  S3UploadTicketSchema,
]);

export const RegisterMediaBodySchema = Type.Object(
  {
    storageKey: Type.String({ minLength: 1, maxLength: 300 }),
    filename: Type.String({ minLength: 1, maxLength: 255 }),
    // Fallback dimensions for a backend that can't report them itself
    // (S3-compatible storage). Cloudinary ignores these.
    width: Type.Optional(Type.Integer({ minimum: 1 })),
    height: Type.Optional(Type.Integer({ minimum: 1 })),
  },
  { additionalProperties: false },
);

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
