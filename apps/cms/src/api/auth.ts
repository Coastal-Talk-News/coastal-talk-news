import type {
  AuthenticatorResetDto,
  ChangePasswordRequest,
  CmsUserDto,
  LoginRequest,
  LoginResultDto,
  PasswordChangedDto,
  RecoveryCodesDto,
  SessionDto,
  TwoFactorEnrolledDto,
  TwoFactorEnrollmentDto,
  TwoFactorReauthRequest,
  TwoFactorSignInDto,
  TwoFactorStatusDto,
} from '@coastal-talk-news/types';
import { api } from './client.js';

const BASE = '/api/v1/cms/auth';

export const authApi = {
  login: (body: LoginRequest) =>
    api.post<LoginResultDto>(`${BASE}/login`, body),
  logout: () => api.send(`${BASE}/logout`, 'POST'),
  changePassword: (body: ChangePasswordRequest) =>
    api.post<PasswordChangedDto>(`${BASE}/change-password`, body),
  me: (signal?: AbortSignal) => api.get<CmsUserDto>(`${BASE}/me`, signal),

  sessions: (signal?: AbortSignal) =>
    api.get<SessionDto[]>(`${BASE}/sessions`, signal),
  revokeSession: (id: string) => api.send(`${BASE}/sessions/${id}`, 'DELETE'),
  revokeOtherSessions: () =>
    api.remove<{ revoked: number }>(`${BASE}/sessions/others`),

  /** Signing in takes a second step: a code, or setting two-factor up first. */
  twoFactor: {
    beginSetup: () => api.post<TwoFactorEnrollmentDto>(`${BASE}/2fa/setup`),
    confirmSetup: (code: string) =>
      api.post<TwoFactorEnrolledDto>(`${BASE}/2fa/setup/confirm`, { code }),
    verify: (code: string) =>
      api.post<TwoFactorSignInDto>(`${BASE}/2fa/verify`, { code }),

    status: (signal?: AbortSignal) =>
      api.get<TwoFactorStatusDto>(`${BASE}/2fa`, signal),
    regenerateRecoveryCodes: (body: TwoFactorReauthRequest) =>
      api.post<RecoveryCodesDto>(`${BASE}/2fa/recovery-codes`, body),
    beginReset: (body: TwoFactorReauthRequest) =>
      api.post<TwoFactorEnrollmentDto>(`${BASE}/2fa/reset`, body),
    confirmReset: (code: string) =>
      api.post<AuthenticatorResetDto>(`${BASE}/2fa/reset/confirm`, { code }),
  },
};
