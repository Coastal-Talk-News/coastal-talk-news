import { createHash, randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;

/** How long someone has to finish the second step after entering a password. */
export const CHALLENGE_TTL_MS = 10 * 60 * 1000;
/** Wrong codes allowed against one pending sign-in before it is thrown away. */
const MAX_ATTEMPTS = 5;
/** Wrong codes allowed against one account, across every sign-in, per window. */
const MAX_USER_FAILURES = 10;
const USER_FAILURE_WINDOW_MS = 15 * 60 * 1000;

/**
 * verify: two-factor is set up, so a code is owed.
 * setup: it isn't yet, so the person must enrol before getting a session.
 */
export type ChallengeKind = 'verify' | 'setup';

export interface Challenge {
  /** Where this entry lives in the store, so callers can count failures on it. */
  key: string;
  userId: string;
  kind: ChallengeKind;
  expiresAt: Date;
  attempts: number;
  /** The base32 secret offered for enrolment. Held here, in memory only,
   *  until a code proves the authenticator has it; never written to the database
   *  before then. */
  secret?: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Pending sign-ins and pending authenticator resets. A password on its own
 * never becomes a session: it becomes one of these, and only a valid second
 * factor turns that into a session. Held in the API process like sessions are,
 * so a restart simply asks people to sign in again.
 */
export class ChallengeStore {
  private readonly pending = new Map<string, Challenge>();
  private readonly failures = new Map<string, number[]>();

  /** A new pending sign-in. The token goes to the browser; only its hash is kept. */
  issue(
    userId: string,
    kind: ChallengeKind,
    now = new Date(),
  ): { token: string; challenge: Challenge } {
    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    const challenge = this.store(hashToken(token), userId, kind, now);
    return { token, challenge };
  }

  find(token: string, now = new Date()): Challenge | null {
    return this.live(hashToken(token), now);
  }

  /** A pending authenticator reset, tied to the signed-in session that began it. */
  startReset(
    sessionId: string,
    userId: string,
    secret: string,
    now = new Date(),
  ): Challenge {
    const challenge = this.store(`reset:${sessionId}`, userId, 'setup', now);
    challenge.secret = secret;
    return challenge;
  }

  findReset(sessionId: string, now = new Date()): Challenge | null {
    return this.live(`reset:${sessionId}`, now);
  }

  /** Counts a wrong code. 'exhausted' means this entry is gone and must be restarted. */
  fail(key: string): 'retry' | 'exhausted' {
    const challenge = this.pending.get(key);
    if (!challenge) return 'exhausted';
    challenge.attempts += 1;
    if (challenge.attempts >= MAX_ATTEMPTS) {
      this.pending.delete(key);
      return 'exhausted';
    }
    return 'retry';
  }

  attemptsLeft(key: string): number {
    const challenge = this.pending.get(key);
    return challenge ? MAX_ATTEMPTS - challenge.attempts : 0;
  }

  discard(key: string): void {
    this.pending.delete(key);
  }

  discardToken(token: string): void {
    this.pending.delete(hashToken(token));
  }

  /** Too many wrong codes on one account, whatever route they came in by. */
  isLocked(userId: string, now = new Date()): boolean {
    return this.recentFailures(userId, now).length >= MAX_USER_FAILURES;
  }

  recordFailure(userId: string, now = new Date()): void {
    this.failures.set(userId, [
      ...this.recentFailures(userId, now),
      now.getTime(),
    ]);
  }

  clearFailures(userId: string): void {
    this.failures.delete(userId);
  }

  sweep(now = new Date()): void {
    for (const [key, challenge] of this.pending) {
      if (challenge.expiresAt.getTime() <= now.getTime())
        this.pending.delete(key);
    }
    for (const userId of this.failures.keys()) {
      if (this.recentFailures(userId, now).length === 0)
        this.failures.delete(userId);
    }
  }

  private store(
    key: string,
    userId: string,
    kind: ChallengeKind,
    now: Date,
  ): Challenge {
    const challenge: Challenge = {
      key,
      userId,
      kind,
      expiresAt: new Date(now.getTime() + CHALLENGE_TTL_MS),
      attempts: 0,
    };
    this.pending.set(key, challenge);
    return challenge;
  }

  private live(key: string, now: Date): Challenge | null {
    const challenge = this.pending.get(key);
    if (!challenge) return null;
    if (challenge.expiresAt.getTime() <= now.getTime()) {
      this.pending.delete(key);
      return null;
    }
    return challenge;
  }

  private recentFailures(userId: string, now: Date): number[] {
    const since = now.getTime() - USER_FAILURE_WINDOW_MS;
    return (this.failures.get(userId) ?? []).filter((at) => at > since);
  }
}
