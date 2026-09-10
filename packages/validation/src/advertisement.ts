import { Type } from '@sinclair/typebox';
import { IsoDateTime, paginationQueryFields } from './envelope.js';
import { MediaSummarySchema } from './media.js';

export const ADVERTISER_NAME_MAX = 120;
export const DESTINATION_URL_MAX = 2048;

const advertisementFields = {
  id: Type.String(),
  advertiserName: Type.String(),
  image: MediaSummarySchema,
  destinationUrl: Type.String(),
  priority: Type.Integer(),
  startAt: IsoDateTime,
  endAt: IsoDateTime,
  isActive: Type.Boolean(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
};

export const AdvertisementSchema = Type.Object(advertisementFields);

const writableAdvertisementFields = {
  advertiserName: Type.String({ minLength: 1, maxLength: ADVERTISER_NAME_MAX }),
  mediaId: Type.String({ format: 'uuid' }),
  destinationUrl: Type.String({
    maxLength: DESTINATION_URL_MAX,
    format: 'uri',
  }),
  priority: Type.Integer({ minimum: 0 }),
  startAt: IsoDateTime,
  endAt: IsoDateTime,
};

export const CreateAdvertisementBodySchema = Type.Object(
  {
    advertiserName: writableAdvertisementFields.advertiserName,
    mediaId: writableAdvertisementFields.mediaId,
    destinationUrl: writableAdvertisementFields.destinationUrl,
    // Omit to default to 0 — the only editorial control over prominence now
    // that there's no placement column (schema.prisma's Advertisement comment).
    priority: Type.Optional(writableAdvertisementFields.priority),
    startAt: writableAdvertisementFields.startAt,
    endAt: writableAdvertisementFields.endAt,
  },
  { additionalProperties: false },
);

export const UpdateAdvertisementBodySchema = Type.Partial(
  Type.Object(writableAdvertisementFields),
  {
    // Rejects an empty PATCH rather than reporting success for a no-op.
    minProperties: 1,
    additionalProperties: false,
  },
);

export const AdvertisementParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export const CmsAdvertisementListQuerySchema = Type.Object({
  ...paginationQueryFields,
});
