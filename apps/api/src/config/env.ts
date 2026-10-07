import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

const EnvSchema = Type.Object({
  NODE_ENV: Type.Union(
    [
      Type.Literal('development'),
      Type.Literal('test'),
      Type.Literal('production'),
    ],
    { default: 'development' },
  ),
  PORT: Type.Integer({ default: 3000, minimum: 1, maximum: 65535 }),

  DATABASE_URL: Type.String({ minLength: 1 }),

  SESSION_SECRET: Type.String({ minLength: 32 }),
  // 32 random bytes, base64url. Seals every authenticator secret at rest, so
  // it must be the same everywhere the same database is used, and losing it
  // means every user has to set up two-factor again.
  TOTP_ENCRYPTION_KEY: Type.String({ minLength: 43, maxLength: 44 }),
  SESSION_TTL_HOURS: Type.Integer({ default: 168, minimum: 1, maximum: 720 }),
  SESSION_IDLE_MINUTES: Type.Integer({
    default: 480,
    minimum: 5,
    maximum: 43200,
  }),
  SESSION_MAX_PER_USER: Type.Integer({ default: 10, minimum: 1, maximum: 50 }),
  COOKIE_DOMAIN: Type.Optional(Type.String({ minLength: 1 })),

  CORS_ORIGINS: Type.String({ minLength: 1 }),

  // Which object storage backend handles image uploads. Only the selected
  // one's variables below are required - see the per-provider check in
  // loadEnv(). Switching is a config change only: nothing in the code
  // branches on which provider is active beyond this one setting.
  STORAGE_PROVIDER: Type.Union(
    [Type.Literal('cloudinary'), Type.Literal('s3')],
    { default: 'cloudinary' },
  ),

  CLOUDINARY_CLOUD_NAME: Type.Optional(Type.String({ minLength: 1 })),
  CLOUDINARY_API_KEY: Type.Optional(Type.String({ minLength: 1 })),
  CLOUDINARY_API_SECRET: Type.Optional(Type.String({ minLength: 1 })),
  CLOUDINARY_FOLDER: Type.String({
    minLength: 1,
    default: 'coastal-talk-news',
  }),

  // S3-compatible: real AWS S3, Cloudflare R2, or anything else that speaks
  // the S3 API. Leave S3_ENDPOINT unset for AWS S3 itself; set it to the
  // provider's endpoint (e.g. R2's account endpoint) for anything else.
  S3_BUCKET: Type.Optional(Type.String({ minLength: 1 })),
  S3_REGION: Type.Optional(Type.String({ minLength: 1 })),
  S3_ACCESS_KEY_ID: Type.Optional(Type.String({ minLength: 1 })),
  S3_SECRET_ACCESS_KEY: Type.Optional(Type.String({ minLength: 1 })),
  S3_ENDPOINT: Type.Optional(Type.String({ minLength: 1 })),
  // Base URL objects are served from - a CloudFront domain, R2's public
  // bucket URL, or a custom domain in front of either. Required because
  // plain bucket endpoints aren't public read by default.
  S3_PUBLIC_URL: Type.Optional(Type.String({ minLength: 1 })),
  // Some S3-compatible services need path-style addressing
  // (https://host/bucket/key) instead of the virtual-hosted style AWS
  // defaults to (https://bucket.host/key).
  S3_FORCE_PATH_STYLE: Type.Boolean({ default: false }),
  S3_FOLDER: Type.String({ minLength: 1, default: 'coastal-talk-news' }),

  // A hard ceiling on total stored image size, regardless of provider -
  // decimal MB, matching how every other storage figure in this app is
  // reported. Once reached, new uploads are refused until something is
  // deleted or this is raised.
  MEDIA_STORAGE_CAP_MB: Type.Integer({ default: 5000, minimum: 1 }),

  // Lets this server drop the reader site's cache on publish/edit. Both
  // optional - caching just falls back to its own TTL without them.
  WEB_BASE_URL: Type.Optional(Type.String({ minLength: 1 })),
  WEB_REVALIDATE_SECRET: Type.Optional(Type.String({ minLength: 16 })),

  // Lets two-factor sign-in offer a one-time code by email, alongside the
  // authenticator app. Both optional - leaving them unset keeps two-factor
  // authenticator-only exactly as before; see the per-pair check in
  // loadEnv().
  RESEND_API_KEY: Type.Optional(Type.String({ minLength: 1 })),
  EMAIL_OTP_FROM: Type.Optional(Type.String({ minLength: 1 })),

  // Lets the dashboard show today's Cloudflare Workers request count and
  // Observability event count. Both optional - leaving them unset just
  // leaves those two figures off the dashboard; see the per-pair check in
  // loadEnv().
  CLOUDFLARE_ACCOUNT_ID: Type.Optional(Type.String({ minLength: 1 })),
  CLOUDFLARE_API_TOKEN: Type.Optional(Type.String({ minLength: 1 })),
});

export type Env = Static<typeof EnvSchema> & {
  corsOrigins: string[];
  totpKey: Buffer;
  emailOtpEnabled: boolean;
  cloudflareEnabled: boolean;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const converted = Value.Convert(
    EnvSchema,
    Value.Clean(EnvSchema, { ...source }),
  );
  const parsed = Value.Default(EnvSchema, converted);

  if (!Value.Check(EnvSchema, parsed)) {
    const problems = [...Value.Errors(EnvSchema, parsed)]
      .map((error) => `  ${error.path || '/'}: ${error.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }

  const corsOrigins = parsed.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (corsOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must list at least one origin.');
  }

  const totpKey = Buffer.from(parsed.TOTP_ENCRYPTION_KEY, 'base64url');
  if (totpKey.length !== 32) {
    throw new Error(
      'TOTP_ENCRYPTION_KEY must be 32 random bytes, base64url encoded.',
    );
  }

  requireStorageProviderConfig(parsed);
  requireEmailOtpConfig(parsed);
  requireCloudflareConfig(parsed);

  return {
    ...parsed,
    corsOrigins,
    totpKey,
    emailOtpEnabled: Boolean(parsed.RESEND_API_KEY),
    cloudflareEnabled: Boolean(parsed.CLOUDFLARE_ACCOUNT_ID),
  };
}

/**
 * Only the active provider's variables are required - TypeBox can't express
 * "required if STORAGE_PROVIDER is X" declaratively, so this is a plain
 * follow-up check, the same way CORS_ORIGINS and TOTP_ENCRYPTION_KEY are
 * validated above.
 */
function requireStorageProviderConfig(env: Static<typeof EnvSchema>): void {
  function require(keys: (keyof Static<typeof EnvSchema>)[]) {
    const missing = keys.filter((key) => !env[key]);
    if (missing.length > 0) {
      throw new Error(
        `STORAGE_PROVIDER=${env.STORAGE_PROVIDER} requires: ${missing.join(', ')}`,
      );
    }
  }

  if (env.STORAGE_PROVIDER === 'cloudinary') {
    require([
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
    ]);
  } else {
    require([
      'S3_BUCKET',
      'S3_REGION',
      'S3_ACCESS_KEY_ID',
      'S3_SECRET_ACCESS_KEY',
      'S3_PUBLIC_URL',
    ]);
  }
}

/** The pair stands or falls together - sending mail needs both, and a lone
 *  one set is almost certainly a typo, not an intentional half-feature. */
function requireEmailOtpConfig(env: Static<typeof EnvSchema>): void {
  if (Boolean(env.RESEND_API_KEY) !== Boolean(env.EMAIL_OTP_FROM)) {
    throw new Error(
      'RESEND_API_KEY and EMAIL_OTP_FROM must both be set, or both left unset.',
    );
  }
}

/** Same reasoning as requireEmailOtpConfig - calling the Cloudflare API
 *  needs both, and a lone one set is almost certainly a typo. */
function requireCloudflareConfig(env: Static<typeof EnvSchema>): void {
  if (
    Boolean(env.CLOUDFLARE_ACCOUNT_ID) !== Boolean(env.CLOUDFLARE_API_TOKEN)
  ) {
    throw new Error(
      'CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must both be set, or both left unset.',
    );
  }
}
