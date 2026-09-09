import type {
  ApiFailure,
  ApiListSuccess,
  ApiSuccess,
} from '@coastal-talk-news/types';

const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:3001';

/**
 * Notified whenever a request comes back 401 so the app can end the session in
 * one place, rather than each caller inventing its own recovery.
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

/** Carries the API's error code so callers can branch without parsing strings. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(status: number, body: ApiFailure['error']) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, signal } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    signal,
    // The session lives in an httpOnly cookie, so every call must opt in to
    // sending credentials cross-origin.
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const failure = payload as ApiFailure | null;
    if (response.status === 401) {
      onUnauthorized?.();
    }
    throw new ApiError(
      response.status,
      failure?.error ?? {
        code: 'NETWORK_ERROR',
        message:
          'Could not reach the server. Check your connection and try again.',
      },
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) =>
    request<ApiSuccess<T>>(path, { signal }).then((r) => r.data),

  list: <T>(path: string, signal?: AbortSignal) =>
    request<ApiListSuccess<T>>(path, { signal }),

  post: <T>(path: string, body?: unknown) =>
    request<ApiSuccess<T>>(path, { method: 'POST', body }).then((r) => r.data),

  patch: <T>(path: string, body?: unknown) =>
    request<ApiSuccess<T>>(path, { method: 'PATCH', body }).then((r) => r.data),

  /** DELETE that returns a body, unlike the 204 deletes handled by send(). */
  remove: <T>(path: string) =>
    request<ApiSuccess<T>>(path, { method: 'DELETE' }).then((r) => r.data),

  /** For 204 endpoints, where there is no envelope to unwrap. */
  send: (path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown) =>
    request<void>(path, { method, body }),
};

export function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}
