import type { ApiFailure } from '@coastal-talk-news/types';
import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../lib/errors.js';
import { isDatabaseUnavailable } from '../lib/infrastructure-errors.js';

export type ErrorResponse = ApiFailure;

function failure(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ErrorResponse {
  return {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
}

async function errorHandlerPlugin(app: FastifyInstance): Promise<void> {
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    return reply
      .status(404)
      .send(
        failure(
          'NOT_FOUND',
          `Route ${request.method} ${request.url} not found.`,
        ),
      );
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof AppError) {
      request.log.info(
        { code: error.code, statusCode: error.statusCode },
        error.message,
      );
      return reply
        .status(error.statusCode)
        .send(failure(error.code, error.message, error.details));
    }

    if (error.validation) {
      request.log.info(
        { validation: error.validation },
        'Request validation failed',
      );
      return reply
        .status(400)
        .send(failure('VALIDATION_FAILED', error.message));
    }

    // Infrastructure, not a defect: warn rather than error so genuine bugs stay
    // visible, and 503 so the caller knows it is worth retrying.
    if (isDatabaseUnavailable(error)) {
      request.log.warn({ err: error }, 'Database unreachable');
      return reply
        .status(503)
        .send(
          failure(
            'SERVICE_UNAVAILABLE',
            'The service is temporarily unavailable. Please try again in a moment.',
          ),
        );
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode < 500) {
      return reply
        .status(statusCode)
        .send(failure(error.code ?? 'BAD_REQUEST', error.message));
    }

    request.log.error({ err: error }, 'Unhandled error');
    return reply
      .status(500)
      .send(failure('INTERNAL_SERVER_ERROR', 'An unexpected error occurred.'));
  });
}

export default fp(errorHandlerPlugin, { name: 'error-handler' });
