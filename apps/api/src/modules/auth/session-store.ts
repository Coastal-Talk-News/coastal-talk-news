import { createHash, randomBytes } from 'node:crypto';
import type { Database } from '@coastal-talk-news/db';

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

function hasLapsed(
  session: SessionRecord,
  now: Date,
  idleTtlMs: number,
): boolean {
  return (
    session.expiresAt.getTime() <= now.getTime() ||
    now.getTime() - session.lastSeenAt.getTime() >= idleTtlMs
  );
}

/**
 * A signed-in device, backed by `cms_sessions`. Only the SHA-256 hash of the
 * token is ever written to or read from the database - the plaintext token
 * lives only in the cookie - so a copy of the table can't be replayed.
 *
 * A session past its absolute or idle deadline isn't just rejected: `verify`
 * deletes it on the spot, and the periodic `sweep` catches whatever a reader
 * never comes back to redeem. Either way it's really gone, not flagged.
 */
export class SessionStore {
  constructor(
    private readonly db: Database,
    private readonly options: SessionStoreOptions,
  ) {}

  async create(
    userId: string,
    meta: { userAgent: string | null; ipAddress: string | null },
    now = new Date(),
  ): Promise<{ token: string; session: SessionRecord }> {
    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    const expiresAt = new Date(now.getTime() + this.options.absoluteTtlMs);

    const row = await this.db.cmsSession.create({
      data: {
        id: hashToken(token),
        userId,
        createdAt: now,
        lastSeenAt: now,
        expiresAt,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    await this.enforcePerUserLimit(userId);
    return { token, session: row };
  }

  async verify(token: string, now = new Date()): Promise<SessionRecord | null> {
    const session = await this.db.cmsSession.findUnique({
      where: { id: hashToken(token) },
    });
    if (!session) {
      return null;
    }

    if (hasLapsed(session, now, this.options.idleTtlMs)) {
      await this.db.cmsSession
        .delete({ where: { id: session.id } })
        // Already gone (e.g. a concurrent sweep) is the same outcome.
        .catch(() => undefined);
      return null;
    }

    return this.db.cmsSession.update({
      where: { id: session.id },
      data: { lastSeenAt: now },
    });
  }

  async revokeByToken(token: string): Promise<boolean> {
    return this.db.cmsSession
      .delete({ where: { id: hashToken(token) } })
      .then(() => true)
      .catch(() => false);
  }

  async revokeForUser(userId: string, sessionId: string): Promise<boolean> {
    const { count } = await this.db.cmsSession.deleteMany({
      where: { id: sessionId, userId },
    });
    return count > 0;
  }

  async revokeOthers(userId: string, keepSessionId: string): Promise<number> {
    const { count } = await this.db.cmsSession.deleteMany({
      where: { userId, id: { not: keepSessionId } },
    });
    return count;
  }

  async listForUser(
    userId: string,
    now = new Date(),
  ): Promise<SessionRecord[]> {
    await this.sweep(now);
    return this.db.cmsSession.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async sweep(now = new Date()): Promise<number> {
    const { count } = await this.db.cmsSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: now } },
          {
            lastSeenAt: {
              lte: new Date(now.getTime() - this.options.idleTtlMs),
            },
          },
        ],
      },
    });
    return count;
  }

  async size(): Promise<number> {
    return this.db.cmsSession.count();
  }

  private async enforcePerUserLimit(userId: string): Promise<void> {
    const owned = await this.db.cmsSession.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
      skip: this.options.maxPerUser,
      select: { id: true },
    });
    if (owned.length === 0) {
      return;
    }
    await this.db.cmsSession.deleteMany({
      where: { id: { in: owned.map((session) => session.id) } },
    });
  }
}
