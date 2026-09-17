import { Type } from '@sinclair/typebox';
import { ArticleContentSchema } from './article.js';
import { IsoDateTime, paginationQueryFields } from './envelope.js';
import { MediaSummarySchema } from './media.js';
import { ADVERTISER_NAME_MAX, DESTINATION_URL_MAX } from './limits.js';

export { ADVERTISER_NAME_MAX, DESTINATION_URL_MAX };

export const AdPlacementSchema = Type.Union([
  Type.Literal('MASTHEAD'),
  Type.Literal('TOP'),
  Type.Literal('SIDEBAR'),
]);

const advertisementFields = {
  id: Type.String(),
  advertiserName: Type.String(),
  image: MediaSummarySchema,
  detailImage: Type.Union([MediaSummarySchema, Type.Null()]),
  description: Type.Union([ArticleContentSchema, Type.Null()]),
  destinationUrl: Type.Union([Type.String(), Type.Null()]),
  displayOrder: Type.Integer(),
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
  detailMediaId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
  description: Type.Union([ArticleContentSchema, Type.Null()]),
  // '' is how a cleared link arrives from the form, so it has to pass
  // alongside a real URL — the uri check alone would make a link unremovable.
  destinationUrl: Type.Union([
    Type.String({ maxLength: DESTINATION_URL_MAX, format: 'uri' }),
    Type.Literal(''),
    Type.Null(),
  ]),
  displayOrder: Type.Integer({ minimum: 0 }),
  placement: AdPlacementSchema,
  startAt: IsoDateTime,
  endAt: IsoDateTime,
};

export const CreateAdvertisementBodySchema = Type.Object(
  {
    advertiserName: writableAdvertisementFields.advertiserName,
    mediaId: writableAdvertisementFields.mediaId,
    detailMediaId: Type.Optional(writableAdvertisementFields.detailMediaId),
    description: Type.Optional(writableAdvertisementFields.description),
    destinationUrl: Type.Optional(writableAdvertisementFields.destinationUrl),
    displayOrder: Type.Optional(writableAdvertisementFields.displayOrder),
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

export const ReorderAdvertisementsBodySchema = Type.Object(
  {
    placement: AdPlacementSchema,
    ids: Type.Array(Type.String({ format: 'uuid' }), { minItems: 1 }),
  },
  { additionalProperties: false },
);
