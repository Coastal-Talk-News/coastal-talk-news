export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super(401, 'UNAUTHORIZED', message);
  }
}

/** Not a 401: the CMS reads a 401 as an expired session and signs the person
 *  out, and whoever hits this is signed in and has just mistyped. */
export class InvalidCurrentPasswordError extends AppError {
  constructor() {
    super(
      400,
      'INVALID_CURRENT_PASSWORD',
      'Your current password is incorrect.',
    );
  }
}

/** The code was wrong (or already spent). A 400, never a 401: the CMS reads a
 *  401 as an expired session and would sign out someone who just mistyped. */
export class InvalidTwoFactorCodeError extends AppError {
  constructor(
    message = 'That code is not correct.',
    details?: Record<string, unknown>,
  ) {
    super(400, 'INVALID_TWO_FACTOR_CODE', message, details);
  }
}

/** The pending sign-in is gone: expired, used up, or never started. There is no
 *  session yet, so this is the one place a 401 is safe. */
export class SignInExpiredError extends AppError {
  constructor(message = 'Your sign-in expired. Sign in again.') {
    super(401, 'SIGN_IN_EXPIRED', message);
  }
}

export class TwoFactorLockedError extends AppError {
  constructor() {
    super(
      429,
      'TWO_FACTOR_LOCKED',
      'Too many incorrect codes. Wait a few minutes before trying again.',
    );
  }
}

/** A signed-in person's setup or reset ran out. Unlike a sign-in it is a 409,
 *  because they still have a session that must not be dropped. */
export class TwoFactorSetupExpiredError extends AppError {
  constructor(message = 'Your setup expired. Start again.') {
    super(409, 'TWO_FACTOR_SETUP_EXPIRED', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found.`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(409, 'CONFLICT', message, details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message: string) {
    super(413, 'PAYLOAD_TOO_LARGE', message);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message: string) {
    super(415, 'UNSUPPORTED_MEDIA_TYPE', message);
  }
}
