import type { TransactionClient } from '@coastal-talk-news/db';

export function findByEmail(db: TransactionClient, email: string) {
  return db.cmsUser.findUnique({ where: { email } });
}

export function findPublicById(db: TransactionClient, id: string) {
  return db.cmsUser.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
}

export function findPasswordHash(db: TransactionClient, id: string) {
  return db.cmsUser.findUnique({
    where: { id },
    select: { passwordHash: true },
  });
}

export function updatePasswordHash(
  db: TransactionClient,
  id: string,
  passwordHash: string,
) {
  return db.cmsUser.update({
    where: { id },
    data: { passwordHash },
    select: { id: true },
  });
}
