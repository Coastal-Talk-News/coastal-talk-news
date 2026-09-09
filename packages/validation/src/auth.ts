import { Type } from '@sinclair/typebox';
import { IsoDateTime } from './envelope.js';

export const CmsUserSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  email: Type.String({ format: 'email' }),
});

export const LoginBodySchema = Type.Object({
  email: Type.String({ format: 'email', maxLength: 255 }),
  password: Type.String({ minLength: 1, maxLength: 200 }),
});

export const SessionSchema = Type.Object({
  id: Type.String(),
  createdAt: IsoDateTime,
  lastSeenAt: IsoDateTime,
  expiresAt: IsoDateTime,
  userAgent: Type.Union([Type.String(), Type.Null()]),
  ipAddress: Type.Union([Type.String(), Type.Null()]),
  isCurrent: Type.Boolean(),
});

export const SessionParamsSchema = Type.Object({
  id: Type.String({ minLength: 1, maxLength: 128 }),
});

export const RevokedCountSchema = Type.Object({ revoked: Type.Integer() });
