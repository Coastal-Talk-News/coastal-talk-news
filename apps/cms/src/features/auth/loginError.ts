import { ApiError } from '../../api/client.js';

export function loginErrorMessage(error: unknown): string | null {
  if (!error) return null;

  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return 'That email and password do not match. Check both and try again.';
      case 429:
        return 'Too many sign-in attempts. Wait a few minutes before trying again.';
      case 400:
        return 'Enter a valid email address and password.';
      case 503:
        return 'The server is temporarily unavailable. Try again in a moment.';
      default:
        return error.code === 'NETWORK_ERROR'
          ? 'Cannot reach the server. Check your connection and try again.'
          : 'Sign-in is unavailable right now. Please try again shortly.';
    }
  }

  return 'Something went wrong. Please try again.';
}
