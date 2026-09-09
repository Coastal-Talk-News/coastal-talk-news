import type { Id, IsoDateTime } from './api.js';

/** Has no password field of any kind — the hash has no wire representation. */
export interface CmsUserDto {
  id: Id;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** A signed-in device. `isCurrent` marks the session making the request. */
export interface SessionDto {
  id: Id;
  createdAt: IsoDateTime;
  lastSeenAt: IsoDateTime;
  expiresAt: IsoDateTime;
  userAgent: string | null;
  ipAddress: string | null;
  isCurrent: boolean;
}
