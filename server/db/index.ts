/**
 * Database access layer.
 *
 * Production uses Postgres (`pg`) via DATABASE_URL. When DATABASE_URL is not
 * set (local development / tests) an embedded PGlite database is used so the
 * whole stack runs with zero external provisioning.
 */

import { env } from '../env';
import { migrations } from './migrations';

export type SqlRow = Record<string, unknown>;

export interface Db {
  dialect: 'pglite' | 'pg';
  query<T = SqlRow>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Run a SQL string that may contain multiple statements. */
  exec(sql: string): Promise<void>;
  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

type PgQueryResult = { rows: SqlRow[] };

const makeTxProxy = (
  runQuery: (sql: string, params: unknown[]) => Promise<SqlRow[]>,
  runExec: (sql: string) => Promise<void>,
): Db => ({
  dialect: 'pg',
  query: async <T = SqlRow>(sql: string, params: unknown[] = []) =>
    (await runQuery(sql, params)) as T[],
  exec: (sql: string) => runExec(sql),
  transaction: async () => {
    throw new Error('Nested transactions are not supported');
  },
  close: async () => undefined,
});

const createPgDb = async (): Promise<Db> => {
  const { Pool } = await import('pg');
  const needsSsl =
    env.isProduction || /sslmode=require/i.test(env.databaseUrl ?? '');

  const pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 5,
  });

  return {
    dialect: 'pg',
    query: async <T = SqlRow>(sql: string, params: unknown[] = []) => {
      const result = (await pool.query(sql, params as never[])) as PgQueryResult;
      return result.rows as T[];
    },
    exec: async (sql: string) => {
      await pool.query(sql);
    },
    transaction: async <T>(fn: (tx: Db) => Promise<T>) => {
      const client = await pool.connect();
      try {
        await client.query('begin');
        const tx = makeTxProxy(
          async (sql, params) => {
            const result = (await client.query(sql, params as never[])) as PgQueryResult;
            return result.rows;
          },
          async (sql) => {
            await client.query(sql);
          },
        );
        const value = await fn(tx);
        await client.query('commit');
        return value;
      } catch (error) {
        await client.query('rollback');
        throw error;
      } finally {
        client.release();
      }
    },
    close: async () => {
      await pool.end();
    },
  };
};

const createPgliteDb = async (): Promise<Db> => {
  const { PGlite } = await import('@electric-sql/pglite');
  const inMemory = env.isTest || env.pgliteDir === ':memory:';

  if (!inMemory) {
    const { mkdirSync } = await import('node:fs');
    mkdirSync(env.pgliteDir, { recursive: true });
  }

  const db = inMemory ? new PGlite() : new PGlite(env.pgliteDir);

  await db.waitReady;

  return {
    dialect: 'pglite',
    query: async <T = SqlRow>(sql: string, params: unknown[] = []) => {
      const result = await db.query<SqlRow>(sql, params as never[]);
      return result.rows as T[];
    },
    exec: async (sql: string) => {
      await db.exec(sql);
    },
    transaction: async <T>(fn: (tx: Db) => Promise<T>) => {
      return db.transaction(async (tx) => {
        const proxy = makeTxProxy(
          async (sql, params) => {
            const result = await tx.query<SqlRow>(sql, params as never[]);
            return result.rows;
          },
          async (sql) => {
            await tx.exec(sql);
          },
        );
        return fn(proxy);
      }) as Promise<T>;
    },
    close: async () => {
      await db.close();
    },
  };
};

let dbPromise: Promise<Db> | null = null;

export const getDb = (): Promise<Db> => {
  if (!dbPromise) {
    dbPromise = env.databaseUrl ? createPgDb() : createPgliteDb();
  }
  return dbPromise;
};

export const resetDb = async () => {
  readyPromise = null;
  if (dbPromise) {
    const db = await dbPromise;
    await db.close();
    dbPromise = null;
  }
};

/** Apply all pending migrations. Idempotent and safe to run on every boot. */
export const runMigrations = async (): Promise<void> => {
  const db = await getDb();

  await db.query(`
    create table if not exists _migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const applied = await db.query<{ id: string }>('select id from _migrations');
  const appliedIds = new Set(applied.map((row) => row.id));

  for (const migration of migrations) {
    if (appliedIds.has(migration.id)) continue;

    await db.transaction(async (tx) => {
      await tx.exec(migration.sql);
      await tx.query('insert into _migrations (id) values ($1)', [migration.id]);
    });
  }
};

/** Serialize a JS value for a jsonb column. */
export const json = (value: unknown): string => JSON.stringify(value ?? null);

let readyPromise: Promise<void> | null = null;

/** Ensure schema + default content exists. Runs once per process. */
export const ensureDatabase = (onReady?: (db: Db) => Promise<void>): Promise<void> => {
  if (!readyPromise) {
    readyPromise = (async () => {
      await runMigrations();
      if (onReady) {
        const db = await getDb();
        await onReady(db);
      }
    })();
  }
  return readyPromise;
};
