import type {
  ChangePasswordRequest,
  CmsUserDto,
  LoginRequest,
  PasswordChangedDto,
  SessionDto,
} from '@coastal-talk-news/types';
import { api } from './client.js';

const BASE = '/api/v1/cms/auth';

export const authApi = {
  login: (body: LoginRequest) => api.post<CmsUserDto>(`${BASE}/login`, body),
  logout: () => api.send(`${BASE}/logout`, 'POST'),
  changePassword: (body: ChangePasswordRequest) =>
    api.post<PasswordChangedDto>(`${BASE}/change-password`, body),
  me: (signal?: AbortSignal) => api.get<CmsUserDto>(`${BASE}/me`, signal),

  sessions: (signal?: AbortSignal) =>
    api.get<SessionDto[]>(`${BASE}/sessions`, signal),
  revokeSession: (id: string) => api.send(`${BASE}/sessions/${id}`, 'DELETE'),
  revokeOtherSessions: () =>
    api.remove<{ revoked: number }>(`${BASE}/sessions/others`),
};
