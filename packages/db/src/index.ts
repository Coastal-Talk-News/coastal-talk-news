import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client.js';

export * from './generated/enums.js';
export type * from './generated/models.js';
export { PrismaClient };

export interface PrismaClientOptions {
  /**
   * PEM contents of the server's CA certificate. Supply it to get a verified
   * connection; without it the connection is encrypted but the server identity
   * is not checked.
   */
  sslCa?: string;
}

interface Connection {
  connectionString: string;
  ssl?: { ca?: string; rejectUnauthorized: boolean };
}

/**
 * Decides TLS in code rather than leaving it to the connection string.
 *
 * pg-connection-string treats `sslmode=require` as `verify-full`, and that
 * beats any ssl option passed alongside it. Managed providers (Supabase among
 * them) serve a chain Node's trust store rejects, so leaving sslmode in the URL
 * fails with "self-signed certificate in certificate chain".
 */
function buildConnection(rawUrl: string, sslCa?: string): Connection {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { connectionString: rawUrl };
  }

  const sslMode = url.searchParams.get('sslmode');
  url.searchParams.delete('sslmode');
  url.searchParams.delete('uselibpqcompat');

  const connectionString = url.toString();
  if (!sslMode || sslMode === 'disable') {
    return { connectionString };
  }

  return {
    connectionString,
    ssl: sslCa
      ? { ca: sslCa, rejectUnauthorized: true }
      : { rejectUnauthorized: false },
  };
}

export function createPrismaClient(
  connectionString: string,
  options: PrismaClientOptions = {},
): PrismaClient {
  const connection = buildConnection(connectionString, options.sslCa);
  return new PrismaClient({ adapter: new PrismaPg(connection) });
}

export type Database = PrismaClient;

/** Prisma strips top-level transaction methods inside a transaction, so code
 * that must run within one takes this instead of Database. */
export type TransactionClient = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];
