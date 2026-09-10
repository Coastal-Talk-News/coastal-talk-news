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
  SESSION_TTL_HOURS: Type.Integer({ default: 12, minimum: 1, maximum: 720 }),
  SESSION_IDLE_MINUTES: Type.Integer({
    default: 480,
    minimum: 5,
    maximum: 43200,
  }),
  SESSION_MAX_PER_USER: Type.Integer({ default: 10, minimum: 1, maximum: 50 }),
  COOKIE_DOMAIN: Type.Optional(Type.String({ minLength: 1 })),

  CORS_ORIGINS: Type.String({ minLength: 1 }),

  CLOUDINARY_CLOUD_NAME: Type.String({ minLength: 1 }),
  CLOUDINARY_API_KEY: Type.String({ minLength: 1 }),
  CLOUDINARY_API_SECRET: Type.String({ minLength: 1 }),
  CLOUDINARY_FOLDER: Type.String({
    minLength: 1,
    default: 'coastal-talk-news',
  }),
});

export type Env = Static<typeof EnvSchema> & { corsOrigins: string[] };

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

  return { ...parsed, corsOrigins };
}
