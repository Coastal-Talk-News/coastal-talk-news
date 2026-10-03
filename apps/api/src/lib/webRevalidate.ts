import type { FastifyBaseLogger } from 'fastify';
import type { Env } from '../config/env.js';

export interface WebRevalidateConfig {
  baseUrl: string | undefined;
  secret: string | undefined;
}

export function webRevalidateConfig(env: Env): WebRevalidateConfig {
  return { baseUrl: env.WEB_BASE_URL, secret: env.WEB_REVALIDATE_SECRET };
}

/** Best-effort: never throws, since nothing here should fail the CMS action
 *  that triggered it (a save, a manual cache clear). */
async function callRevalidate(
  config: WebRevalidateConfig,
  logger: FastifyBaseLogger,
  tag: string,
): Promise<void> {
  if (!config.baseUrl || !config.secret) return;

  try {
    const response = await fetch(`${config.baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': config.secret,
      },
      body: JSON.stringify({ tag }),
    });
    if (!response.ok) {
      logger.warn(
        { status: response.status, tag },
        'Web cache revalidation request was rejected',
      );
    }
  } catch (error) {
    logger.warn(
      { err: error, tag },
      'Could not reach the web app to revalidate its cache',
    );
  }
}

/** Invalidates both the id tag and the slug tag (when the article has one) -
 *  a reader's cached page may have been fetched by either, depending on
 *  which address they followed. */
export async function revalidateArticle(
  config: WebRevalidateConfig,
  logger: FastifyBaseLogger,
  articleId: string,
  slug?: string | null,
): Promise<void> {
  await callRevalidate(config, logger, `article:${articleId}`);
  if (slug) await callRevalidate(config, logger, `article:${slug}`);
}

export function revalidateAllArticles(
  config: WebRevalidateConfig,
  logger: FastifyBaseLogger,
): Promise<void> {
  return callRevalidate(config, logger, 'articles');
}

/** One shared tag for About/Contact/Advertise/Privacy/Terms, since their
 *  contact fields overlap - a single save can affect more than one page. */
export function revalidateStandalonePages(
  config: WebRevalidateConfig,
  logger: FastifyBaseLogger,
): Promise<void> {
  return callRevalidate(config, logger, 'pages');
}

/** Invalidates both the id tag and the slug tag - see revalidateArticle. */
export async function revalidateCategory(
  config: WebRevalidateConfig,
  logger: FastifyBaseLogger,
  categoryId: string,
  slug?: string | null,
): Promise<void> {
  await callRevalidate(config, logger, `category:${categoryId}`);
  if (slug) await callRevalidate(config, logger, `category:${slug}`);
}
