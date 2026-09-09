import { Type } from '@sinclair/typebox';

export const MediaSummarySchema = Type.Object({
  id: Type.String(),
  url: Type.String(),
  width: Type.Integer(),
  height: Type.Integer(),
});
