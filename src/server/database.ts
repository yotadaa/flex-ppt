import { createConnection, createPool as createMysqlPool, type Pool as MysqlPool, type ResultSetHeader } from "mysql2/promise";
import { Pool as PostgresPool } from "pg";
import { createProviderRotator, parseDatabaseProviders, type DatabaseProvider } from "./providerRotation";

type MysqlValue = string | number | bigint | boolean | Date | null | Buffer | Uint8Array | MysqlValue[] | { [key: string]: MysqlValue };

export type SqlStatement = string | {
  postgres: string;
  mysql: string;
};

export type ProviderQueryResult<T> = {
  provider: DatabaseProvider;
  rows: T[];
  affectedRows: number;
};

export type ProviderQueryTarget = {
  provider: DatabaseProvider;
  query: <T>(statement: SqlStatement, values?: unknown[]) => Promise<ProviderQueryResult<T>>;
};

const defaultLocalMysqlUrl = "mysql://root:password@127.0.0.1:3306/flex_ppt";
const providers = parseDatabaseProviders(resolveDatabaseProviderUrls());
const rotator = createProviderRotator(providers);
const postgresPools = new Map<string, PostgresPool>();
const mysqlPools = new Map<string, MysqlPool>();
const mysqlSchemasReady = new Set<string>();

export function configuredProviders() {
  return rotator.allProviders();
}

export function hasDatabaseProviders() {
  return configuredProviders().length > 0;
}

export function databaseRuntimeSummary() {
  const activeProviders = configuredProviders();
  return {
    configured: activeProviders.length > 0,
    mode: databaseMode(),
    providerCount: activeProviders.length,
    dialects: [...new Set(activeProviders.map((provider) => provider.dialect))],
  };
}

export function writePoolsInOrder(): ProviderQueryTarget[] {
  const first = rotator.nextWriteProvider();
  if (!first) return [];
  const ordered = [
    first,
    ...configuredProviders().filter((provider) => provider.name !== first.name),
  ];
  return ordered.map(targetFor);
}

export async function queryWriteProvider<T>(
  statement: SqlStatement,
  values: unknown[] = [],
) {
  const target = writePoolsInOrder()[0];
  if (!target) throw new Error("No database provider configured.");
  return target.query<T>(statement, values);
}

export async function queryAllProviders<T>(
  statement: SqlStatement,
  values: unknown[] = [],
) {
  const results: Array<ProviderQueryResult<T> & { error?: Error }> = [];
  for (const provider of configuredProviders()) {
    try {
      results.push(await queryProvider<T>(provider, statement, values));
    } catch (error) {
      results.push({
        provider,
        rows: [],
        affectedRows: 0,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
  return results;
}

function targetFor(provider: DatabaseProvider): ProviderQueryTarget {
  return {
    provider,
    query: <T>(statement: SqlStatement, values: unknown[] = []) => queryProvider<T>(provider, statement, values),
  };
}

async function queryProvider<T>(
  provider: DatabaseProvider,
  statement: SqlStatement,
  values: unknown[] = [],
): Promise<ProviderQueryResult<T>> {
  if (provider.dialect === "mysql") {
    await ensureMysqlSchema(provider);
    const [result] = await mysqlPoolFor(provider).execute(sqlFor(provider, statement), mysqlValues(values));
    return {
      provider,
      rows: Array.isArray(result) ? result as T[] : [],
      affectedRows: isResultSetHeader(result) ? result.affectedRows : 0,
    };
  }

  const result = await postgresPoolFor(provider).query(sqlFor(provider, statement), postgresValues(values));
  return {
    provider,
    rows: result.rows as T[],
    affectedRows: result.rowCount || 0,
  };
}

function sqlFor(provider: DatabaseProvider, statement: SqlStatement) {
  return typeof statement === "string" ? statement : statement[provider.dialect];
}

function postgresPoolFor(provider: DatabaseProvider) {
  const existing = postgresPools.get(provider.name);
  if (existing) return existing;
  const pool = new PostgresPool({
    connectionString: provider.url,
    max: 4,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 8_000,
  });
  postgresPools.set(provider.name, pool);
  return pool;
}

function mysqlPoolFor(provider: DatabaseProvider) {
  const existing = mysqlPools.get(provider.name);
  if (existing) return existing;
  const config = mysqlConfigFromUrl(provider.url, true);
  const pool = createMysqlPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 4,
    maxIdle: 4,
    idleTimeout: 20_000,
    connectTimeout: 8_000,
    charset: "utf8mb4",
  });
  mysqlPools.set(provider.name, pool);
  return pool;
}

async function ensureMysqlSchema(provider: DatabaseProvider) {
  const config = mysqlConfigFromUrl(provider.url, false);
  const database = mysqlDatabaseName(provider.url);
  const readyKey = `${provider.name}:${database}`;
  if (mysqlSchemasReady.has(readyKey)) return;

  const connection = await createConnection({
    ...config,
    connectTimeout: 8_000,
  });

  try {
    const databaseName = mysqlIdentifier(database);
    await connection.query(`create database if not exists ${databaseName} character set utf8mb4 collate utf8mb4_unicode_ci`);
    await connection.query(`
      create table if not exists ${databaseName}.projects (
        id varchar(80) primary key,
        provider varchar(80) not null,
        user_id varchar(80) not null,
        owner_email varchar(320) not null,
        title varchar(255) not null,
        description text not null,
        type varchar(40) not null,
        category varchar(120) not null,
        thumbnail text not null,
        visibility varchar(40) not null,
        slide_count int not null default 1,
        accent varchar(40) not null default '#0f8f86',
        updated_at timestamp not null default current_timestamp on update current_timestamp,
        created_at timestamp not null default current_timestamp,
        index projects_user_updated_idx (user_id, updated_at),
        index projects_provider_idx (provider)
      ) character set utf8mb4 collate utf8mb4_unicode_ci
    `);
    mysqlSchemasReady.add(readyKey);
  } finally {
    await connection.end();
  }
}

function resolveDatabaseProviderUrls() {
  const mode = databaseMode();
  if (mode === "supabase" || mode === "postgres") return process.env.DATABASE_URL || "";
  if (mode === "local-mysql" || mode === "mysql") {
    return process.env.LOCAL_DATABASE_URL || process.env.MYSQL_DATABASE_URL || defaultLocalMysqlUrl;
  }
  return process.env.LOCAL_DATABASE_URL || process.env.MYSQL_DATABASE_URL || defaultLocalMysqlUrl;
}

function databaseMode() {
  return (process.env.FLEX_DATABASE_MODE || "local-mysql").trim().toLowerCase();
}

function mysqlConfigFromUrl(raw: string, includeDatabase: boolean) {
  const url = new URL(raw);
  const database = mysqlDatabaseName(raw);
  return {
    host: url.hostname || "127.0.0.1",
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username || "root"),
    password: decodeURIComponent(url.password || ""),
    ...(includeDatabase ? { database } : {}),
  };
}

function mysqlDatabaseName(raw: string) {
  const url = new URL(raw);
  return decodeURIComponent(url.pathname.replace(/^\/+/, "")) || "flex_ppt";
}

function mysqlIdentifier(value: string) {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Unsafe MySQL identifier: ${value}`);
  }
  return `\`${value}\``;
}

function isResultSetHeader(result: unknown): result is ResultSetHeader {
  return Boolean(result && typeof result === "object" && "affectedRows" in result);
}

function postgresValues(values: unknown[]) {
  return values.map((value) => value === undefined ? null : value);
}

function mysqlValues(values: unknown[]): MysqlValue[] {
  return values.map((value) => {
    if (value === undefined || value === null) return null;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "bigint" ||
      typeof value === "boolean" ||
      value instanceof Date ||
      Buffer.isBuffer(value) ||
      value instanceof Uint8Array
    ) {
      return value;
    }
    if (Array.isArray(value)) return mysqlValues(value);
    return String(value);
  });
}
