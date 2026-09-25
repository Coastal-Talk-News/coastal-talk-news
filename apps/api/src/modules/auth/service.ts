import type { Database } from '@coastal-talk-news/db';
import { PASSWORD_MAX_BYTES } from '@coastal-talk-news/validation/limits';
import { unmetPasswordRules } from '@coastal-talk-news/validation/password-policy';
import bcrypt from 'bcrypt';
import {
  BadRequestError,
  InvalidCurrentPasswordError,
  UnauthorizedError,
} from '../../lib/errors.js';
import * as repository from './repository.js';

const DUMMY_HASH =
  '$2b$12$C6UzMDM.H6dfI/f/IKcEe.eS3nMEBcMHpBFCXNHNBBg9nRJlLIcmy';

// Same cost the seed script hashes with, so a changed password is no cheaper
// to guess than the one it replaced.
const BCRYPT_ROUNDS = 12;

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export async function authenticate(
  db: Database,
  email: string,
  password: string,
): Promise<AuthenticatedUser> {
  const user = await repository.findByEmail(db, email.toLowerCase());
  const matches = await bcrypt.compare(
    password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  if (!user || !matches) {
    throw new UnauthorizedError('Invalid email or password.');
  }
  return { id: user.id, name: user.name, email: user.email };
}

export async function getCurrentUser(
  db: Database,
  id: string,
): Promise<AuthenticatedUser> {
  const user = await repository.findPublicById(db, id);
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export async function changePassword(
  db: Database,
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await repository.findPasswordHash(db, userId);
  if (!user) {
    // A live session for a user who no longer exists.
    throw new UnauthorizedError();
  }

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new InvalidCurrentPasswordError();
  }

  // Checked only after the current password is proven, so the answers below
  // can't be used to probe what the current password is.
  if (Buffer.byteLength(newPassword, 'utf8') > PASSWORD_MAX_BYTES) {
    throw new BadRequestError(
      `The new password is too long. Use at most ${PASSWORD_MAX_BYTES} bytes (about ${PASSWORD_MAX_BYTES} characters).`,
    );
  }
  const unmet = unmetPasswordRules(newPassword);
  if (unmet.length > 0) {
    throw new BadRequestError(
      `The new password needs: ${unmet.map((rule) => rule.label.toLowerCase()).join(', ')}.`,
      { unmet: unmet.map((rule) => rule.id) },
    );
  }
  if (newPassword === currentPassword) {
    throw new BadRequestError(
      'Choose a new password that is different from your current one.',
    );
  }

  await repository.updatePasswordHash(
    db,
    userId,
    await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
  );
}
