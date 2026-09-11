import type { Database } from '@coastal-talk-news/db';
import bcrypt from 'bcrypt';
import { UnauthorizedError } from '../../lib/errors.js';
import * as repository from './repository.js';

const DUMMY_HASH =
  '$2b$12$C6UzMDM.H6dfI/f/IKcEe.eS3nMEBcMHpBFCXNHNBBg9nRJlLIcmy';

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
