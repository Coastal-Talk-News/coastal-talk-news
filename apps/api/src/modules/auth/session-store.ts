import { createHash, randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;

export interface SessionRecord {
  id: string;
  userId: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface SessionStoreOptions {
  absoluteTtlMs: number;
  idleTtlMs: number;
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
