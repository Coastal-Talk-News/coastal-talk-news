import { Type } from '@sinclair/typebox';
import { IsoDateTime } from './envelope.js';
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from './limits.js';

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

export const ChangePasswordBodySchema = Type.Object(
  {
    currentPassword: Type.String({ minLength: 1, maxLength: 200 }),
    // Characters never outnumber bytes, so this is a cheap first cut; the
    // service measures the bytes bcrypt will actually see.
    newPassword: Type.String({
      minLength: PASSWORD_MIN_LENGTH,
      maxLength: PASSWORD_MAX_BYTES,
    }),
  },
  { additionalProperties: false },
);

export const PasswordChangedSchema = Type.Object({
  revokedSessions: Type.Integer(),
});
