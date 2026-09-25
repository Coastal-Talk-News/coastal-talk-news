import { Type } from '@sinclair/typebox';
import { IsoDateTime } from './envelope.js';
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  TWO_FACTOR_CODE_MAX,
} from './limits.js';

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

export const LoginResultSchema = Type.Object({
  status: Type.Union([
    Type.Literal('two_factor_required'),
    Type.Literal('two_factor_setup_required'),
  ]),
});

const TwoFactorCodeSchema = Type.String({
  minLength: 6,
  maxLength: TWO_FACTOR_CODE_MAX,
});

export const TwoFactorCodeBodySchema = Type.Object(
  { code: TwoFactorCodeSchema },
  { additionalProperties: false },
);

export const TwoFactorReauthBodySchema = Type.Object(
  {
    password: Type.String({ minLength: 1, maxLength: 200 }),
    code: TwoFactorCodeSchema,
  },
  { additionalProperties: false },
);

export const TwoFactorEnrollmentSchema = Type.Object({
  secret: Type.String(),
  otpauthUri: Type.String(),
});

export const TwoFactorSignInSchema = Type.Object({
  user: CmsUserSchema,
  usedRecoveryCode: Type.Boolean(),
  recoveryCodesRemaining: Type.Integer(),
});

export const TwoFactorEnrolledSchema = Type.Object({
  user: CmsUserSchema,
  recoveryCodes: Type.Array(Type.String()),
});

export const TwoFactorStatusSchema = Type.Object({
  enabledAt: IsoDateTime,
  recoveryCodesRemaining: Type.Integer(),
});

export const RecoveryCodesSchema = Type.Object({
  recoveryCodes: Type.Array(Type.String()),
});

export const AuthenticatorResetSchema = Type.Object({
  recoveryCodes: Type.Array(Type.String()),
  revokedSessions: Type.Integer(),
});
