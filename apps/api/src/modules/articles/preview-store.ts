import { randomBytes } from 'node:crypto';

/** Long enough to write and check an article, short enough that a link left in a chat goes stale. */
export const PREVIEW_TTL_MS = 30 * 60 * 1000;
/** A ceiling, not a target: the oldest go first, so a loop can never fill memory. */
const MAX_PREVIEWS = 200;

interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Drafts on their way to being looked at. The link is the only credential: the
 * token is 256 random bits, so it cannot be guessed, and it is gone after
 * `PREVIEW_TTL_MS`. Held in the API process like sessions are, so a restart
 * just makes people press Preview again.
 */
export class PreviewStore<T> {
  private readonly entries = new Map<string, Entry<T>>();

  add(value: T, now = Date.now()): { token: string; expiresAt: Date } {
    this.sweep(now);
    while (this.entries.size >= MAX_PREVIEWS) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
    const token = randomBytes(32).toString('base64url');
    const expiresAt = now + PREVIEW_TTL_MS;
    this.entries.set(token, { value, expiresAt });
    return { token, expiresAt: new Date(expiresAt) };
  }

  get(token: string, now = Date.now()): T | null {
    const entry = this.entries.get(token);
    if (!entry) return null;
    if (entry.expiresAt <= now) {
      this.entries.delete(token);
      return null;
    }
    return entry.value;
  }

  sweep(now = Date.now()): void {
    for (const [token, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(token);
    }
  }
}
