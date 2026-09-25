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
