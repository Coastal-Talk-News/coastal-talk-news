import { Type } from '@sinclair/typebox';
import { IsoDateTime, paginationQueryFields } from './envelope.js';
import { MediaSummarySchema } from './media.js';
import { ADVERTISER_NAME_MAX, DESTINATION_URL_MAX } from './limits.js';

export { ADVERTISER_NAME_MAX, DESTINATION_URL_MAX };

export const AdPlacementSchema = Type.Union([
  Type.Literal('TOP'),
  Type.Literal('SIDEBAR'),
]);

const advertisementFields = {
  id: Type.String(),
  advertiserName: Type.String(),
  image: MediaSummarySchema,
  destinationUrl: Type.String(),
  priority: Type.Integer(),
  placement: AdPlacementSchema,
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
  placement: AdPlacementSchema,
  startAt: IsoDateTime,
  endAt: IsoDateTime,
};

export const CreateAdvertisementBodySchema = Type.Object(
  {
    advertiserName: writableAdvertisementFields.advertiserName,
    mediaId: writableAdvertisementFields.mediaId,
    destinationUrl: writableAdvertisementFields.destinationUrl,
    priority: Type.Optional(writableAdvertisementFields.priority),
    placement: Type.Optional(writableAdvertisementFields.placement),
    startAt: writableAdvertisementFields.startAt,
    endAt: writableAdvertisementFields.endAt,
  },
  { additionalProperties: false },
);

export const UpdateAdvertisementBodySchema = Type.Partial(
  Type.Object(writableAdvertisementFields),
  {
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
