import type { FastifyRequest } from 'fastify';
import { BadRequestError } from './errors.js';

/**
 * A `preValidation` hook that refuses a body whose named fields are not JSON
 * strings. Fastify's validator coerces types by default, so `["secret"]` or
 * `12345` would otherwise reach the handler as the strings "secret" and
 * "12345"; for credentials that is a malformed request, not a value to be
 * reinterpreted. It runs before validation, so it sees the body as sent.
 */
export function requireStringFields(...fields: string[]) {
  return async (request: FastifyRequest): Promise<void> => {
    const body = request.body as Record<string, unknown> | null | undefined;
    if (fields.some((field) => typeof body?.[field] !== 'string')) {
      throw new BadRequestError(
        `${fields.join(' and ')} must be sent as text.`,
      );
    }
  };
}
