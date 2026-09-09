import type { FastifyBaseLogger } from 'fastify';
import type { ObjectStorage } from './storage.js';

/**
 * Deletes R2 objects whose rows have already been removed.
 *
 * Runs after the transaction commits, so a failure here leaves an orphaned
 * object rather than a broken reference. That is the safer direction to fail:
 * the object is unreachable and the admin's "clean up unused" action can sweep
 * it later, so failures are logged rather than thrown.
 */
export async function purgeStorageObjects(
  storage: ObjectStorage,
  logger: FastifyBaseLogger,
  storageKeys: string[],
): Promise<void> {
  await Promise.all(
    storageKeys.map(async (storageKey) => {
      try {
        await storage.delete(storageKey);
      } catch (error) {
        logger.error(
          { err: error, storageKey },
          'Failed to delete orphaned object',
        );
      }
    }),
  );
}
