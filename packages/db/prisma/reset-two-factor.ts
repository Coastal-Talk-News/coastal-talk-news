import { createPrismaClient } from '../src/index.js';

/**
 * Clears a user's two-factor setup, for the one case the app cannot recover
 * from itself: they have lost their authenticator AND their recovery codes.
 * Their next sign-in asks them to enrol again, exactly like a first sign-in.
 *
 *   pnpm --filter @coastal-talk-news/db db:reset-2fa <email>
 *
 * Their password is untouched, so this is only as strong as whoever can run it
 * against the production database - confirm the person's identity first.
 */
async function main(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error(
      'Usage: pnpm --filter @coastal-talk-news/db db:reset-2fa <email>',
    );
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL must be set (apps/api/.env provides it).');
  }

  const prisma = createPrismaClient(url);
  try {
    const [, updated] = await prisma.$transaction([
      prisma.cmsRecoveryCode.deleteMany({ where: { user: { email } } }),
      prisma.cmsUser.updateMany({
        where: { email },
        data: { totpSecret: null, totpEnabledAt: null, totpLastStep: null },
      }),
    ]);
    if (updated.count === 0) {
      throw new Error(`No CMS user has the email ${email}.`);
    }
    console.log(
      `Two-factor cleared for ${email}. They will set it up again at their next sign-in.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
