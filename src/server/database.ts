import { Pool, type QueryResultRow } from "pg";
import { createProviderRotator, parseDatabaseProviders, type DatabaseProvider } from "./providerRotation";

type ProviderPool = {
  provider: DatabaseProvider;
  pool: Pool;
};

const providers = parseDatabaseProviders(process.env.DATABASE_URL);
const rotator = createProviderRotator(providers);
const pools = new Map<string, Pool>();

export function configuredProviders() {
  return rotator.allProviders();
}

export function hasDatabaseProviders() {
  return configuredProviders().length > 0;
}

function poolFor(provider: DatabaseProvider) {
  const existing = pools.get(provider.name);
  if (existing) return existing;
  const pool = new Pool({
    connectionString: provider.url,
    max: 4,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 8_000,
  });
  pools.set(provider.name, pool);
  return pool;
}

export function nextWritePool(): ProviderPool | null {
  const provider = rotator.nextWriteProvider();
  if (!provider) return null;
  return { provider, pool: poolFor(provider) };
}

export async function queryWriteProvider<T extends QueryResultRow>(
  sql: string,
  values: unknown[],
) {
  const target = nextWritePool();
  if (!target) throw new Error("No database provider configured.");
  const result = await target.pool.query<T>(sql, values);
  return { provider: target.provider, rows: result.rows };
}

export async function queryAllProviders<T extends QueryResultRow>(
  sql: string,
  values: unknown[],
) {
  const results: Array<{ provider: DatabaseProvider; rows: T[]; error?: Error }> = [];
  for (const provider of configuredProviders()) {
    try {
      const result = await poolFor(provider).query<T>(sql, values);
      results.push({ provider, rows: result.rows });
    } catch (error) {
      results.push({ provider, rows: [], error: error instanceof Error ? error : new Error(String(error)) });
    }
  }
  return results;
}

