/**
 * Admin media library routes.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { env } from '../env';
import { getClientIp } from '../lib/http';
import { badRequest, notFound } from '../lib/errors';
import { parseQuery } from '../lib/validation';
import { recordAudit } from '../services/audit.service';
import { consumeRateLimit } from '../services/rateLimit.service';
import { deleteMedia, getMedia, listMedia, storeImage } from '../services/media.service';
import type { AppEnv } from '../types';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
});

export const mediaRoutes = new Hono<AppEnv>();

mediaRoutes.get('/', async (c) => {
  const query = parseQuery(c, listQuerySchema);
  return c.json(await listMedia(query));
});

mediaRoutes.get('/:id', async (c) => {
  const media = await getMedia(c.req.param('id'));
  if (!media) throw notFound('Media not found');
  return c.json(media);
});

mediaRoutes.post('/', async (c) => {
  const session = c.get('session')!;
  const ip = getClientIp(c);

  await consumeRateLimit(
    'upload:ip',
    ip,
    env.rateLimit.uploadMaxRequests,
    env.rateLimit.uploadWindowSeconds,
  );

  const body = await c.req.parseBody();
  const raw = body['file'];
  const files = (Array.isArray(raw) ? raw : [raw]).filter((entry): entry is File =>
    entry instanceof File,
  );

  if (files.length === 0) throw badRequest('No file provided');
  if (files.length > env.uploads.maxFilesPerRequest) {
    throw badRequest(`Too many files (max ${env.uploads.maxFilesPerRequest})`);
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > env.uploads.maxTotalBytes) throw badRequest('Upload is too large');

  const items = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > env.uploads.maxFileSizeBytes) {
      throw badRequest(`"${file.name}" exceeds the maximum file size`);
    }
    const media = await storeImage({ file: { buffer, originalName: file.name } });
    items.push(media);

    await recordAudit({
      adminId: session.admin.id,
      adminEmail: session.admin.email,
      action: 'media.uploaded',
      entityType: 'media',
      entityId: media.id,
      metadata: { filename: media.filename, size: media.sizeBytes },
      ip,
    });
  }

  return c.json({ items }, 201);
});

mediaRoutes.delete('/:id', async (c) => {
  const session = c.get('session')!;
  const id = c.req.param('id');
  await deleteMedia(id);

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'media.deleted',
    entityType: 'media',
    entityId: id,
    ip: getClientIp(c),
  });

  return c.json({ ok: true });
});
