import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';

const start = async (): Promise<void> => {
  const env = loadEnv();
  const app = await buildApp(env);

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
