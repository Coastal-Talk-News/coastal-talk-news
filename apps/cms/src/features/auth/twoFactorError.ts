import { ApiError } from '../../api/client.js';

export interface TwoFactorFailure {
  message: string;
  /** The flow this was part of is over and has to start again from its
   *  beginning: the pending sign-in ran out, or a reset timed out. */
  restart: boolean;
  /** Which field the message belongs under. */
  field: 'code' | 'password' | 'form';
}

/** One place that turns the API's two-factor failures into words for people. */
export function describeTwoFactorError(error: unknown): TwoFactorFailure {
  if (!(error instanceof ApiError)) {
    return {
      message: 'Something went wrong. Please try again.',
      restart: false,
      field: 'form',
    };
  }

  switch (error.code) {
    case 'INVALID_TWO_FACTOR_CODE': {
      const left = error.details?.attemptsLeft;
      const suffix =
        typeof left === 'number'
          ? ` ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`
          : '';
      return {
        message: `${error.message}${suffix}`,
        restart: false,
        field: 'code',
      };
    }
    case 'INVALID_CURRENT_PASSWORD':
      return {
        message: 'That is not your current password.',
        restart: false,
        field: 'password',
      };
    case 'SIGN_IN_EXPIRED':
    case 'TWO_FACTOR_SETUP_EXPIRED':
      return { message: error.message, restart: true, field: 'form' };
    default:
      return {
        message:
          error.status === 429
            ? 'Too many attempts. Wait a few minutes before trying again.'
            : error.message,
        restart: false,
        field: 'form',
      };
  }
}
