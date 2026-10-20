/**
 * Generic collection service used by simple ordered content types
 * (skills, experiences, services, nav links).
 *
 * Table and column names come from server-side configuration only, never from
 * user input, so they are safe to interpolate into SQL.
 */

import { randomUUID } from 'node:crypto';
import { getDb } from '../db';
import { AppError } from '../lib/errors';

export type CollectionConfig = {
  table: string;
  /** Maps public camelCase field names to database column names. */
  fields: Record<string, string>;
  /** Column names allowed as equality filters in `list()`. */
  filters?: readonly string[];
  orderBy?: string;
  timestamps?: boolean;
};

export type Collection<T> = {
  list: (filters?: Record<string, string | boolean>) => Promise<T[]>;
  get: (id: string) => Promise<T | null>;
  create: (input: Record<string, unknown>) => Promise<T>;
  update: (id: string, input: Record<string, unknown>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<void>;
};

export const createCollection = <T>(config: CollectionConfig): Collection<T> => {
  const { table, fields } = config;
  const orderBy = config.orderBy ?? 'sort_order asc, created_at asc';
  const filters = new Set(config.filters ?? []);
  const timestamps = config.timestamps ?? true;

  const writableColumns = new Map(
    Object.entries(fields).map(([publicKey, column]) => [publicKey, column]),
  );

  const pickWritable = (input: Record<string, unknown>): Array<[string, unknown]> =>
    Object.entries(input)
      .filter(([key]) => writableColumns.has(key))
      .map(([key, value]) => [writableColumns.get(key)!, value] as [string, unknown]);

  const mapRow = (row: Record<string, unknown>): T => {
    const result: Record<string, unknown> = {};
    for (const [publicKey, column] of Object.entries(fields)) {
      result[publicKey] = row[column];
    }
    return result as T;
  };

  return {
    async list(filterValues = {}) {
      const db = await getDb();
      const conditions: string[] = [];
      const params: unknown[] = [];

      for (const [column, value] of Object.entries(filterValues)) {
        if (!filters.has(column)) continue;
        params.push(value);
        conditions.push(`${column} = $${params.length}`);
      }

      const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
      const rows = await db.query<Record<string, unknown>>(
        `select * from ${table} ${where} order by ${orderBy}`,
        params,
      );
      return rows.map(mapRow);
    },

    async get(id) {
      const db = await getDb();
      const rows = await db.query<Record<string, unknown>>(
        `select * from ${table} where id = $1`,
        [id],
      );
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async create(input) {
      const db = await getDb();
      const data = pickWritable(input);
      const columns = ['id', ...data.map(([column]) => column)];
      const params = [randomUUID(), ...data.map(([, value]) => value)];
      const placeholders = params.map((_, index) => `$${index + 1}`);

      const rows = await db.query<Record<string, unknown>>(
        `insert into ${table} (${columns.join(', ')})
         values (${placeholders.join(', ')})
         returning *`,
        params,
      );

      return mapRow(rows[0]!);
    },

    async update(id, input) {
      const db = await getDb();
      const data = pickWritable(input);

      if (data.length === 0) {
        const existing = await db.query<Record<string, unknown>>(
          `select * from ${table} where id = $1`,
          [id],
        );
        if (!existing[0]) throw new AppError(404, 'not_found', 'Record not found');
        return mapRow(existing[0]);
      }

      const params = data.map(([, value]) => value);
      const assignments = data.map(([column], index) => `${column} = $${index + 1}`);
      if (timestamps) assignments.push('updated_at = now()');

      params.push(id);
      const rows = await db.query<Record<string, unknown>>(
        `update ${table} set ${assignments.join(', ')} where id = $${params.length} returning *`,
        params,
      );

      if (!rows[0]) throw new AppError(404, 'not_found', 'Record not found');
      return mapRow(rows[0]);
    },

    async remove(id) {
      const db = await getDb();
      const rows = await db.query(`delete from ${table} where id = $1 returning id`, [id]);
      if (rows.length === 0) throw new AppError(404, 'not_found', 'Record not found');
    },

    async reorder(orderedIds) {
      const db = await getDb();
      await db.transaction(async (tx) => {
        for (let index = 0; index < orderedIds.length; index += 1) {
          await tx.query(`update ${table} set sort_order = $2 where id = $1`, [
            orderedIds[index],
            index,
          ]);
        }
      });
    },
  };
};
