import type { TransactionClient } from '@coastal-talk-news/db';

export function findByEmail(db: TransactionClient, email: string) {
  return db.cmsUser.findUnique({ where: { email } });
}

/** Explicit select — passwordHash must never reach a response body. */
export function findPublicById(db: TransactionClient, id: string) {
  return db.cmsUser.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
}
