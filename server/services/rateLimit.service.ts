/**
 * Database-backed rate limiting (works across serverless instances).
 */

import { getDb } from '../db';
import { AppError } from '../lib/errors';

const WINDOW = (seconds: number) => `${seconds}`;

export const consumeRateLimit = async (
  bucket: string,
  key: string,
  max: number,
  windowSeconds: number,
): Promise<void> => {
  const db = await getDb();

  const rows = await db.query<{ count: number }>(
    `
    insert into rate_limits (bucket, key, count, reset_at)
    values ($1, $2, 1, now() + ($3 * interval '1 second'))
    on conflict (bucket, key) do update set
      count = case
        when rate_limits.reset_at <= now() then 1
        else rate_limits.count + 1
      end,
      reset_at = case
        when rate_limits.reset_at <= now() then now() + ($3 * interval '1 second')
        else rate_limits.reset_at
      end
    returning count
    `,
    [bucket, key, WINDOW(windowSeconds)],
  );

  const count = Number(rows[0]?.count ?? 0);

  if (count > max) {
    throw new AppError(
      429,
      'rate_limited',
      'Too many requests. Please try again later.',
    );
  }
};

/** Opportunistic cleanup of expired rate-limit rows. */
export const pruneRateLimits = async (): Promise<void> => {
  const db = await getDb();
  await db.query("delete from rate_limits where reset_at < now() - interval '1 day'");
};
