/**
 * Admin content routes: pages, settings and ordered collections.
 */

import { Hono, type Context } from 'hono';
import { z, type ZodType } from 'zod';
import { getClientIp } from '../lib/http';
import { notFound } from '../lib/errors';
import { parseJson } from '../lib/validation';
import { recordAudit } from '../services/audit.service';
import type { Collection } from '../services/collection.service';
import {
  experiencesCollection,
  navCollection,
  navSchema,
  navUpdateSchema,
  pageUpdateSchema,
  servicesCollection,
  serviceSchema,
  serviceUpdateSchema,
  SETTING_KEYS,
  skillsCollection,
  skillSchema,
  skillUpdateSchema,
  experienceSchema,
  experienceUpdateSchema,
  getPage,
  getSettings,
  listPages,
  updatePage,
  updateSetting,
} from '../services/content.service';
import type { AppEnv } from '../types';

const reorderSchema = z.object({ ids: z.array(z.string().uuid()).max(500) });

const collectionRoutes = <T>(
  name: string,
  collection: Collection<T>,
  createSchema: ZodType,
  updateSchema: ZodType,
): Hono<AppEnv> => {
  const router = new Hono<AppEnv>();

  const audit = async (c: Context<AppEnv>, action: string, entityId?: string) => {
    const session = c.get('session')!;
    await recordAudit({
      adminId: session.admin.id,
      adminEmail: session.admin.email,
      action: `${name}.${action}`,
      entityType: name,
      entityId,
      ip: getClientIp(c),
    });
  };

  router.get('/', async (c) => {
    return c.json({ items: await collection.list() });
  });

  router.post('/reorder', async (c) => {
    const payload = await parseJson(c, reorderSchema);
    await collection.reorder(payload.ids);
    await audit(c, 'reordered');
    return c.json({ ok: true });
  });

  router.post('/', async (c) => {
    const payload = await parseJson(c, createSchema) as Record<string, unknown>;
    const item = await collection.create(payload);
    await audit(c, 'created', (item as { id?: string }).id);
    return c.json(item, 201);
  });

  router.put('/:id', async (c) => {
    const payload = await parseJson(c, updateSchema) as Record<string, unknown>;
    const item = await collection.update(c.req.param('id'), payload);
    await audit(c, 'updated', (item as { id?: string }).id);
    return c.json(item);
  });

  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    await collection.remove(id);
    await audit(c, 'deleted', id);
    return c.json({ ok: true });
  });

  return router;
};

export const contentRoutes = new Hono<AppEnv>();

/* ---------------------------------- Pages -------------------------------- */

contentRoutes.get('/pages', async (c) => c.json({ items: await listPages() }));

contentRoutes.get('/pages/:id', async (c) => {
  const page = await getPage(c.req.param('id'));
  if (!page) throw notFound('Page not found');
  return c.json(page);
});

contentRoutes.put('/pages/:id', async (c) => {
  const session = c.get('session')!;
  const id = c.req.param('id');
  const payload = await parseJson(c, pageUpdateSchema);
  const page = await updatePage(id, payload);

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'page.updated',
    entityType: 'page',
    entityId: id,
    ip: getClientIp(c),
  });

  return c.json(page);
});

/* --------------------------------- Settings ------------------------------ */

contentRoutes.get('/settings', async (c) => c.json(await getSettings()));

contentRoutes.put('/settings', async (c) => {
  const session = c.get('session')!;
  const payload = await parseJson(c, z.object({
    key: z.enum(SETTING_KEYS),
    value: z.record(z.string(), z.unknown()),
  }));

  const setting = await updateSetting(payload.key, payload.value);

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'settings.updated',
    entityType: 'settings',
    entityId: payload.key,
    ip: getClientIp(c),
  });

  return c.json(setting);
});

/* ------------------------------- Collections ----------------------------- */

contentRoutes.route('/nav', collectionRoutes('nav', navCollection, navSchema, navUpdateSchema));
contentRoutes.route(
  '/skills',
  collectionRoutes('skill', skillsCollection, skillSchema, skillUpdateSchema),
);
contentRoutes.route(
  '/experiences',
  collectionRoutes('experience', experiencesCollection, experienceSchema, experienceUpdateSchema),
);
contentRoutes.route(
  '/services',
  collectionRoutes('service', servicesCollection, serviceSchema, serviceUpdateSchema),
);
