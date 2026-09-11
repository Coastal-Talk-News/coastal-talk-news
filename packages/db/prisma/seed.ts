import bcrypt from 'bcrypt';
import { createPrismaClient } from '../src/index.js';

const BCRYPT_ROUNDS = 12;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set to run the seed.`);
  }
  return value;
}

async function main(): Promise<void> {
  const prisma = createPrismaClient(required('DATABASE_URL'));

  const email = required('SEED_ADMIN_EMAIL').toLowerCase();
  // No default: a fallback would ship a known credential to every environment
  // that forgot to set this.
  const password = required('SEED_ADMIN_PASSWORD');
  const name = process.env.SEED_ADMIN_NAME ?? 'Administrator';

  try {
    // Hash written on create only, so re-running never resets a password the
    // client has since changed.
    const admin = await prisma.cmsUser.upsert({
      where: { email },
      update: { name },
      create: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      },
      select: { id: true, email: true },
    });

    const existingSettings = await prisma.siteSettings.findFirst({
      select: { id: true },
    });
    const settings =
      existingSettings ??
      (await prisma.siteSettings.create({
        data: { siteName: process.env.SEED_SITE_NAME ?? 'Coastal Talk News' },
        select: { id: true },
      }));

    process.stdout.write(
      `Seeded admin ${admin.email} and site settings ${settings.id}.
`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}
`);
  process.exit(1);
});
