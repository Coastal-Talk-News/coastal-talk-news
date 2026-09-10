import { Type } from '@sinclair/typebox';
import { IsoDateTime, paginationQueryFields } from './envelope.js';

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
