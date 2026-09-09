/**
 * Distinguishes "the database was unreachable" from "the code is wrong".
 *
 * Both arrive as thrown errors, but they need opposite handling: a bug is a 500
 * that should page someone, while a DNS blip or a dropped connection is a 503
 * the caller should simply retry. Logging the second as an error trains people
 * to ignore the first.
 */

/** Prisma's own connectivity codes. */
const PRISMA_CONNECTION_CODES = new Set([
  'P1000', // authentication failed against the database server
  'P1001', // can't reach database server
  'P1002', // database server reached but timed out
  'P1008', // operation timed out
  'P1017', // server closed the connection
]);

/** Node socket and DNS failures, which surface through the driver adapter. */
const NETWORK_CODES = new Set([
  'EAI_AGAIN', // transient DNS resolution failure
  'ENOTFOUND',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'EHOSTUNREACH',
  'ENETUNREACH',
]);

export function isDatabaseUnavailable(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = (error as { code?: unknown }).code;
  if (typeof code === 'string') {
    if (PRISMA_CONNECTION_CODES.has(code) || NETWORK_CODES.has(code)) {
      return true;
    }
  }

  // Driver-adapter failures can arrive wrapped, with the socket error only in
  // the message.
  const message = (error as { message?: unknown }).message;
  return (
    typeof message === 'string' &&
    [...NETWORK_CODES].some((networkCode) => message.includes(networkCode))
  );
}
