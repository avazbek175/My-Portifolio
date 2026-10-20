/**
 * HTTP helpers.
 */

import type { Context } from 'hono';

/** Best-effort client IP extraction behind a trusted proxy. */
export const getClientIp = (c: Context): string => {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return (
    c.req.header('x-real-ip') ??
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-vercel-forwarded-for') ??
    'unknown'
  );
};

export const getUserAgent = (c: Context): string =>
  c.req.header('user-agent')?.slice(0, 512) ?? 'unknown';

/** Parse a positive integer query param with bounds. */
export const intParam = (
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};
