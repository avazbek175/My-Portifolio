/**
 * Request validation helpers.
 */

import type { Context } from 'hono';
import type { ZodType } from 'zod';
import { AppError, badRequest } from './errors';

export const parseJson = async <T>(c: Context, schema: ZodType<T>): Promise<T> => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw badRequest('Invalid JSON body');
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError(400, 'validation_error', 'Validation failed', result.error.flatten());
  }
  return result.data;
};

export const parseQuery = <T>(c: Context, schema: ZodType<T>): T => {
  const result = schema.safeParse(c.req.query());
  if (!result.success) {
    throw new AppError(400, 'validation_error', 'Invalid query parameters', result.error.flatten());
  }
  return result.data;
};

export const requireParam = (c: Context, name: string): string => {
  const value = c.req.param(name);
  if (!value) throw badRequest(`Missing parameter: ${name}`);
  return value;
};
