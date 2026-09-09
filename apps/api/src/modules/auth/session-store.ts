import { createHash, randomBytes } from 'node:crypto';

/**
 * Server-held sessions, kept in process memory.
 *
 * Opaque IDs rather than JWTs so a session can actually be revoked: a stateless
 * token stays valid until it expires no matter what the server decides.
 *
 * Memory is the deliberate store — no Redis, no table. The consequence is that
 * every restart or deploy signs everyone out, and the API cannot run more than
 * one instance, because a session created on one would not exist on another.
 */

const TOKEN_BYTES = 32;

export interface SessionRecord {
  /** SHA-256 of the token. The token itself is never retained. */
  id: string;
  userId: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface SessionStoreOptions {
  /** Hard lifetime. A session dies at this point however active it is. */
  absoluteTtlMs: number;
  /** Idle lifetime. An untouched session dies after this. */
  idleTtlMs: number;
  /** Oldest sessions are dropped past this, so one account cannot grow memory without bound. */
  maxPerUser: number;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class SessionStore {
  private readonly sessions = new Map<string, SessionRecord>();

  constructor(private readonly options: SessionStoreOptions) {}

  create(
    userId: string,
    meta: { userAgent: string | null; ipAddress: string | null },
    now = new Date(),
  ): { token: string; session: SessionRecord } {
    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    const session: SessionRecord = {
      id: hashToken(token),
      userId,
      createdAt: now,
      lastSeenAt: now,
      expiresAt: new Date(now.getTime() + this.options.absoluteTtlMs),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    };

    this.sessions.set(session.id, session);
    this.enforcePerUserLimit(userId);
    return { token, session };
  }

  /**
   * Returns the session for a token and marks it seen, or null when it is
   * unknown, expired or idled out.
   */
  verify(token: string, now = new Date()): SessionRecord | null {
    const session = this.sessions.get(hashToken(token));
    if (!session) {
      return null;
    }

    if (this.hasLapsed(session, now)) {
      this.sessions.delete(session.id);
      return null;
    }

    session.lastSeenAt = now;
    return session;
  }

  revokeByToken(token: string): boolean {
    return this.sessions.delete(hashToken(token));
  }

  /** Scoped to the owner so one admin can never revoke another's session. */
  revokeForUser(userId: string, sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return false;
    }
    return this.sessions.delete(sessionId);
  }

  revokeOthers(userId: string, keepSessionId: string): number {
    let revoked = 0;
    for (const [id, session] of this.sessions) {
      if (session.userId === userId && id !== keepSessionId) {
        this.sessions.delete(id);
        revoked += 1;
      }
    }
    return revoked;
  }

  listForUser(userId: string, now = new Date()): SessionRecord[] {
    this.sweep(now);
    return [...this.sessions.values()]
      .filter((session) => session.userId === userId)
      .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime());
  }

  /** Drops lapsed sessions so memory does not grow with abandoned logins. */
  sweep(now = new Date()): number {
    let removed = 0;
    for (const [id, session] of this.sessions) {
      if (this.hasLapsed(session, now)) {
        this.sessions.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  get size(): number {
    return this.sessions.size;
  }

  private hasLapsed(session: SessionRecord, now: Date): boolean {
    return (
      session.expiresAt.getTime() <= now.getTime() ||
      now.getTime() - session.lastSeenAt.getTime() >= this.options.idleTtlMs
    );
  }

  private enforcePerUserLimit(userId: string): void {
    const owned = [...this.sessions.values()]
      .filter((session) => session.userId === userId)
      .sort((a, b) => a.lastSeenAt.getTime() - b.lastSeenAt.getTime());

    for (const session of owned.slice(
      0,
      owned.length - this.options.maxPerUser,
    )) {
      this.sessions.delete(session.id);
    }
  }
}
