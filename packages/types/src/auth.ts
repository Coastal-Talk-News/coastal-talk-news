import type { Id, IsoDateTime } from './api.js';

export interface CmsUserDto {
  id: Id;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SessionDto {
  id: Id;
  createdAt: IsoDateTime;
  lastSeenAt: IsoDateTime;
  expiresAt: IsoDateTime;
  userAgent: string | null;
  ipAddress: string | null;
  isCurrent: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordChangedDto {
  /** Other devices signed out by the change. */
  revokedSessions: number;
}

/**
 * Signing in takes two steps. Email and password never open a session on their
 * own: they only say which second step this person owes.
 */
export type LoginStatus = 'two_factor_required' | 'two_factor_setup_required';

export interface LoginResultDto {
  status: LoginStatus;
}

/** A six-digit authenticator code, or a recovery code where one is accepted. */
export interface TwoFactorCodeRequest {
  code: string;
}

/** Everything an authenticator app needs to add the account. */
export interface TwoFactorEnrollmentDto {
  /** Base32, for typing in by hand when a camera isn't an option. */
  secret: string;
  /** What the QR code encodes. */
  otpauthUri: string;
}

export interface TwoFactorSignInDto {
  user: CmsUserDto;
  /** True when a recovery code was spent instead of an authenticator code. */
  usedRecoveryCode: boolean;
  recoveryCodesRemaining: number;
}

/** Shown once: the codes are stored only as hashes. */
export interface TwoFactorEnrolledDto {
  user: CmsUserDto;
  recoveryCodes: string[];
}

export interface TwoFactorStatusDto {
  enabledAt: IsoDateTime;
  recoveryCodesRemaining: number;
}

/** Proof that the person at the keyboard is the account owner, again. */
export interface TwoFactorReauthRequest {
  password: string;
  code: string;
}

export interface RecoveryCodesDto {
  recoveryCodes: string[];
}

export interface AuthenticatorResetDto extends RecoveryCodesDto {
  /** Other devices signed out by the reset. */
  revokedSessions: number;
}
