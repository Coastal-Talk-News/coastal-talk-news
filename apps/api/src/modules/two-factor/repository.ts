import type { TransactionClient } from '@coastal-talk-news/db';

export function findTwoFactor(db: TransactionClient, userId: string) {
  return db.cmsUser.findUnique({
    where: { id: userId },
    select: { email: true, totpSecret: true, totpEnabledAt: true },
  });
}

/**
 * Stores a confirmed authenticator. Guarded on whether two-factor is already
 * on, so two sign-ins racing to enrol can't overwrite each other: the second
 * one changes nothing and the caller sees a count of zero.
 */
export function saveAuthenticator(
  tx: TransactionClient,
  userId: string,
  data: { sealedSecret: string; step: number; replacing: boolean },
) {
  return tx.cmsUser.updateMany({
    where: {
      id: userId,
      totpEnabledAt: data.replacing ? { not: null } : null,
    },
    data: {
      totpSecret: data.sealedSecret,
      totpEnabledAt: new Date(),
      totpLastStep: data.step,
    },
  });
}

/**
 * Moves the replay marker forward only if this step is newer than every code
 * accepted so far. Done in one statement so two requests carrying the same
 * code can't both win.
 */
export function advanceLastStep(
  db: TransactionClient,
  userId: string,
  step: number,
) {
  return db.cmsUser.updateMany({
    where: {
      id: userId,
      OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }],
    },
    data: { totpLastStep: step },
  });
}

export async function replaceRecoveryCodes(
  tx: TransactionClient,
  userId: string,
  codeHashes: string[],
) {
  await tx.cmsRecoveryCode.deleteMany({ where: { userId } });
  await tx.cmsRecoveryCode.createMany({
    data: codeHashes.map((codeHash) => ({ userId, codeHash })),
  });
}

/** Single use: only a code not yet spent can be spent, atomically. */
export function consumeRecoveryCode(
  db: TransactionClient,
  userId: string,
  codeHash: string,
) {
  return db.cmsRecoveryCode.updateMany({
    where: { userId, codeHash, usedAt: null },
    data: { usedAt: new Date() },
  });
}

export function countUnusedRecoveryCodes(
  db: TransactionClient,
  userId: string,
) {
  return db.cmsRecoveryCode.count({ where: { userId, usedAt: null } });
}
