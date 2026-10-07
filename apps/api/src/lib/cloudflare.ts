const API_BASE = 'https://api.cloudflare.com/client/v4';

// Cloudflare's API doesn't expose the account's actual plan limit, so these
// are the Workers Free plan's own published daily caps - the only plan this
// dashboard figure is meant to warn about running out on.
const FREE_REQUESTS_PER_DAY = 100_000;
const FREE_OBSERVABILITY_EVENTS_PER_DAY = 200_000;

export interface CloudflareUsage {
  used: number;
  limit: number;
}

export interface CloudflareClient {
  /** Workers requests served today (UTC). */
  requestsToday(): Promise<CloudflareUsage>;
  /** Workers Observability events ingested today (UTC). */
  observabilityEventsToday(): Promise<CloudflareUsage>;
}

function startOfUtcDay(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/** Only built when CLOUDFLARE_ACCOUNT_ID/CLOUDFLARE_API_TOKEN are set - see
 *  env.cloudflareEnabled and the `app.cloudflare` decorator in
 *  plugins/cloudflare.ts. */
export function createCloudflareClient(
  accountId: string,
  apiToken: string,
): CloudflareClient {
  const authHeaders = {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };

  async function graphql<T>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(`${API_BASE}/graphql`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) {
      throw new Error(`Cloudflare GraphQL API responded ${response.status}.`);
    }
    const body = (await response.json()) as {
      data?: T;
      errors?: { message: string }[];
    };
    if (body.errors?.length) {
      throw new Error(`Cloudflare GraphQL API: ${body.errors[0]?.message}`);
    }
    if (!body.data) {
      throw new Error('Cloudflare GraphQL API returned no data.');
    }
    return body.data;
  }

  return {
    async requestsToday() {
      const now = new Date();
      type Result = {
        viewer: {
          accounts: {
            workersInvocationsAdaptive: { sum: { requests: number } }[];
          }[];
        };
      };
      const data = await graphql<Result>(
        `
          query RequestsToday(
            $accountTag: String!
            $since: Time!
            $until: Time!
          ) {
            viewer {
              accounts(filter: { accountTag: $accountTag }) {
                workersInvocationsAdaptive(
                  limit: 1
                  filter: { datetime_geq: $since, datetime_leq: $until }
                ) {
                  sum {
                    requests
                  }
                }
              }
            }
          }
        `,
        {
          accountTag: accountId,
          since: startOfUtcDay(now).toISOString(),
          until: now.toISOString(),
        },
      );
      const used =
        data.viewer.accounts[0]?.workersInvocationsAdaptive[0]?.sum.requests ??
        0;
      return { used, limit: FREE_REQUESTS_PER_DAY };
    },

    async observabilityEventsToday() {
      const now = new Date();
      const response = await fetch(
        `${API_BASE}/accounts/${accountId}/workers/observability/telemetry/query`,
        {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            // Required by the API even though nothing here ever re-reads a
            // saved query by it - any unique-enough string is accepted.
            queryId: 'coastal-talk-news-dashboard-observability-events',
            timeframe: {
              from: startOfUtcDay(now).getTime(),
              to: now.getTime(),
            },
            parameters: {
              view: 'calculations',
              calculations: [{ operator: 'count', alias: 'events' }],
              filterCombination: 'and',
              filters: [],
            },
          }),
        },
      );
      if (!response.ok) {
        throw new Error(
          `Cloudflare Observability API responded ${response.status}.`,
        );
      }
      const body = (await response.json()) as {
        success: boolean;
        errors?: { message: string }[];
        result?: {
          calculations?: { aggregates?: { value?: number }[] }[];
        };
      };
      if (!body.success) {
        throw new Error(
          `Cloudflare Observability API: ${body.errors?.[0]?.message ?? 'request failed'}`,
        );
      }
      const used = body.result?.calculations?.[0]?.aggregates?.[0]?.value ?? 0;
      return { used, limit: FREE_OBSERVABILITY_EVENTS_PER_DAY };
    },
  };
}
