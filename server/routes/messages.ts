/**
 * Admin message (contact inbox) routes.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { getClientIp } from '../lib/http';
import { badRequest, notFound } from '../lib/errors';
import { parseQuery } from '../lib/validation';
import { recordAudit } from '../services/audit.service';
import {
  deleteMessage,
  getMessage,
  listMessages,
  updateMessageStatus,
} from '../services/messages.service';
import type { AppEnv } from '../types';

const listQuerySchema = z.object({
  status: z.enum(['unread', 'read', 'archived']).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const messagesRoutes = new Hono<AppEnv>();

messagesRoutes.get('/', async (c) => {
  const query = parseQuery(c, listQuerySchema);
  return c.json(await listMessages(query));
});

messagesRoutes.get('/:id', async (c) => {
  const message = await getMessage(c.req.param('id'));
  if (!message) throw notFound('Message not found');
  return c.json(message);
});

messagesRoutes.patch('/:id', async (c) => {
  const session = c.get('session')!;
  const id = c.req.param('id');
  const { status } = await c.req
    .json<{ status?: string }>()
    .catch(() => ({ status: undefined }));

  const parsed = z.enum(['unread', 'read', 'archived']).safeParse(status);
  if (!parsed.success) throw badRequest('Invalid status');

  const message = await updateMessageStatus(id, parsed.data);

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'message.status.changed',
    entityType: 'message',
    entityId: id,
    metadata: { status: parsed.data },
    ip: getClientIp(c),
  });

  return c.json(message);
});

messagesRoutes.delete('/:id', async (c) => {
  const session = c.get('session')!;
  const id = c.req.param('id');
  await deleteMessage(id);

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'message.deleted',
    entityType: 'message',
    entityId: id,
    ip: getClientIp(c),
  });

  return c.json({ ok: true });
});
