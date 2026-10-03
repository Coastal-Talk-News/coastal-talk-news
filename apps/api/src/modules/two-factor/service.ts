import { randomInt, timingSafeEqual } from 'node:crypto';
import type { Database, TransactionClient } from '@coastal-talk-news/db';
import type {
  TwoFactorEnrollmentDto,
  TwoFactorStatusDto,
} from '@coastal-talk-news/types';
import {
  ConflictError,
  InvalidTwoFactorCodeError,
  TwoFactorLockedError,
} from '../../lib/errors.js';
import type { Mailer } from '../../lib/mailer.js';
import {
  RECOVERY_CODE_COUNT,
  generateRecoveryCode,
  looksLikeRecoveryCode,
  normalizeRecoveryCode,
} from '../../lib/recovery-codes.js';
import type { SecretBox } from '../../lib/secret-box.js';
import {
  decodeBase32,
  generateTotpSecret,
  matchTotp,
  otpauthUri,
} from '../../lib/totp.js';
import type { Challenge, ChallengeStore } from '../auth/challenge-store.js';
import { assertCurrentPassword } from '../auth/service.js';
import * as repository from './repository.js';

export interface TwoFactorDeps {
  db: Database;
  box: SecretBox;
  challenges: ChallengeStore;
  mailer: Mailer | null;
}

export type SecondFactorMethod = 'totp' | 'recovery' | 'email';

/** Shown in authenticator apps next to the account name. */
const ISSUER = 'Coastal Talk News';

const REPLAYED_CODE =
  'That code was already used. Wait for the next one and try again.';

/** A fresh secret and what the QR code encodes. Nothing is saved yet. */
export function beginEnrollment(
  email: string,
  existingSecret?: string,
): TwoFactorEnrollmentDto {
  const secret = existingSecret ?? generateTotpSecret();
  return {
    secret,
    otpauthUri: otpauthUri({ secret, account: email, issuer: ISSUER }),
  };
}

function assertNotLocked({ challenges }: TwoFactorDeps, userId: string): void {
  if (challenges.isLocked(userId)) throw new TwoFactorLockedError();
}

async function issueRecoveryCodes(
  tx: TransactionClient,
  box: SecretBox,
  userId: string,
): Promise<string[]> {
  const codes = Array.from(
    { length: RECOVERY_CODE_COUNT },
    generateRecoveryCode,
  );
  await repository.replaceRecoveryCodes(
    tx,
    userId,
    codes.map((code) => box.digest(normalizeRecoveryCode(code))),
  );
  return codes;
}

/**
 * Turns a proposed secret into the user's authenticator once a code from it
 * checks out - which is the only moment it reaches the database. Returns the
 * new recovery codes, in the clear, for the one time they are ever shown.
 */
export async function saveEnrollment(
  deps: TwoFactorDeps,
  userId: string,
  secret: string,
  code: string,
  options: { replacing: boolean },
): Promise<string[]> {
  assertNotLocked(deps, userId);

  const step = matchTotp(decodeBase32(secret), code.replace(/\s/g, ''));
  if (step === null) {
    deps.challenges.recordFailure(userId);
    throw new InvalidTwoFactorCodeError();
  }

  const recoveryCodes = await deps.db.$transaction(async (tx) => {
    const saved = await repository.saveAuthenticator(tx, userId, {
      sealedSecret: deps.box.seal(secret),
      step,
      replacing: options.replacing,
    });
    if (saved.count === 0) {
      throw new ConflictError(
        options.replacing
          ? 'Two-factor authentication is not set up on this account.'
          : 'Two-factor authentication is already set up on this account.',
      );
    }
    return issueRecoveryCodes(tx, deps.box, userId);
  });

  deps.challenges.clearFailures(userId);
  return recoveryCodes;
}

async function checkCode(
  deps: TwoFactorDeps,
  userId: string,
  submitted: string,
): Promise<SecondFactorMethod> {
  const compact = submitted.replace(/\s/g, '');

  if (/^\d{6}$/.test(compact)) {
    const record = await repository.findTwoFactor(deps.db, userId);
    if (!record?.totpSecret) throw new InvalidTwoFactorCodeError();

    const step = matchTotp(
      decodeBase32(deps.box.open(record.totpSecret)),
      compact,
    );
    if (step === null) throw new InvalidTwoFactorCodeError();

    const advanced = await repository.advanceLastStep(deps.db, userId, step);
    if (advanced.count === 0) {
      throw new InvalidTwoFactorCodeError(REPLAYED_CODE);
    }
    return 'totp';
  }

  const normalized = normalizeRecoveryCode(submitted);
  if (looksLikeRecoveryCode(normalized)) {
    const spent = await repository.consumeRecoveryCode(
      deps.db,
      userId,
      deps.box.digest(normalized),
    );
    if (spent.count === 1) return 'recovery';
  }
  throw new InvalidTwoFactorCodeError();
}

/** Five minutes - shorter than the ten-minute challenge it rides on, so a
 *  stale emailed code can't linger as long as the sign-in attempt itself. */
const EMAIL_CODE_TTL_MS = 5 * 60 * 1000;

function generateEmailCode(): string {
  return randomInt(1_000_000).toString().padStart(6, '0');
}

/**
 * Emails a one-time code for the pending sign-in and holds its digest on the
 * challenge itself - nothing is written to the database, the same reasoning
 * as the setup secret `beginSetup` holds there. Only reachable once Resend is
 * configured (see env.emailOtpEnabled); the service checks `deps.mailer`
 * itself rather than trusting the route not to be called otherwise.
 */
export async function sendEmailCode(
  deps: TwoFactorDeps,
  challenge: Challenge,
  email: string,
): Promise<void> {
  assertNotLocked(deps, challenge.userId);
  if (!deps.mailer) {
    throw new ConflictError('Email sign-in codes are not turned on.');
  }

  const code = generateEmailCode();
  await deps.mailer.sendTwoFactorCode(email, code);
  challenge.emailCode = {
    hash: deps.box.digest(code),
    expiresAt: Date.now() + EMAIL_CODE_TTL_MS,
  };
}

/**
 * The sign-in step's second factor: an emailed code just sent for this
 * challenge, if one is pending and still fresh, otherwise an authenticator or
 * recovery code exactly as before. Only this wrapper knows about emailed
 * codes - `verifySecondFactor` below, and everything that calls it directly
 * (reauthentication), is unchanged.
 */
export async function verifySignInCode(
  deps: TwoFactorDeps,
  challenge: Challenge,
  submitted: string,
): Promise<{ method: SecondFactorMethod; recoveryCodesRemaining: number }> {
  const pending = challenge.emailCode;
  const compact = submitted.replace(/\s/g, '');

  if (
    pending &&
    pending.expiresAt > Date.now() &&
    /^\d{6}$/.test(compact) &&
    timingSafeEqual(
      Buffer.from(deps.box.digest(compact)),
      Buffer.from(pending.hash),
    )
  ) {
    challenge.emailCode = undefined;
    deps.challenges.clearFailures(challenge.userId);
    return {
      method: 'email',
      recoveryCodesRemaining: await repository.countUnusedRecoveryCodes(
        deps.db,
        challenge.userId,
      ),
    };
  }

  return verifySecondFactor(deps, challenge.userId, submitted);
}

/**
 * Accepts an authenticator code or a recovery code, whichever was typed. Every
 * wrong answer counts toward the account's lockout, however it arrived.
 */
export async function verifySecondFactor(
  deps: TwoFactorDeps,
  userId: string,
  submitted: string,
): Promise<{ method: SecondFactorMethod; recoveryCodesRemaining: number }> {
  assertNotLocked(deps, userId);

  let method: SecondFactorMethod;
  try {
    method = await checkCode(deps, userId, submitted);
  } catch (error) {
    if (error instanceof InvalidTwoFactorCodeError) {
      deps.challenges.recordFailure(userId);
    }
    throw error;
  }

  deps.challenges.clearFailures(userId);
  return {
    method,
    recoveryCodesRemaining: await repository.countUnusedRecoveryCodes(
      deps.db,
      userId,
    ),
  };
}

/** For actions too sensitive to rest on a session alone: password and a code. */
export async function reauthenticate(
  deps: TwoFactorDeps,
  userId: string,
  password: string,
  code: string,
): Promise<void> {
  await assertCurrentPassword(deps.db, userId, password);
  await verifySecondFactor(deps, userId, code);
}

export async function regenerateRecoveryCodes(
  deps: TwoFactorDeps,
  userId: string,
): Promise<string[]> {
  return deps.db.$transaction((tx) => issueRecoveryCodes(tx, deps.box, userId));
}

export async function getStatus(
  deps: TwoFactorDeps,
  userId: string,
): Promise<TwoFactorStatusDto> {
  const record = await repository.findTwoFactor(deps.db, userId);
  if (!record?.totpEnabledAt) {
    // Only reachable if an operator cleared two-factor under a live session.
    throw new ConflictError('Two-factor authentication is not set up.');
  }
  return {
    enabledAt: record.totpEnabledAt.toISOString(),
    recoveryCodesRemaining: await repository.countUnusedRecoveryCodes(
      deps.db,
      userId,
    ),
  };
}
