/**
 * Admin audit log routes (read-only).
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { parseQuery } from '../lib/validation';
import { listAuditLogs } from '../services/audit.service';
import type { AppEnv } from '../types';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const auditRoutes = new Hono<AppEnv>();

auditRoutes.get('/', async (c) => {
  const { limit } = parseQuery(c, querySchema);
  return c.json({ items: await listAuditLogs(limit) });
});
