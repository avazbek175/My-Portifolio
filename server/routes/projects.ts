/**
 * Admin project routes.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { getClientIp } from '../lib/http';
import { notFound } from '../lib/errors';
import { parseJson, parseQuery } from '../lib/validation';
import { recordAudit } from '../services/audit.service';
import {
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  projectInputSchema,
  reorderProjects,
  updateProject,
  updateProjectFeatured,
  updateProjectStatus,
} from '../services/projects.service';
import type { AppEnv } from '../types';

const listQuerySchema = z.object({
  status: z.enum(['draft', 'published']).optional(),
  category: z.string().trim().max(80).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const projectsRoutes = new Hono<AppEnv>();

projectsRoutes.get('/', async (c) => {
  const query = parseQuery(c, listQuerySchema);
  const result = await listProjects(query);
  return c.json(result);
});

projectsRoutes.post('/reorder', async (c) => {
  const session = c.get('session')!;
  const payload = await parseJson(c, z.object({ ids: z.array(z.string().uuid()).max(500) }));
  await reorderProjects(payload.ids);

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'project.reordered',
    entityType: 'project',
    ip: getClientIp(c),
  });

  return c.json({ ok: true });
});

projectsRoutes.get('/:id', async (c) => {
  const project = await getProjectById(c.req.param('id'));
  if (!project) throw notFound('Project not found');
  return c.json(project);
});

projectsRoutes.post('/', async (c) => {
  const session = c.get('session')!;
  const payload = await parseJson(c, projectInputSchema);
  const project = await createProject(payload);

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'project.created',
    entityType: 'project',
    entityId: project.id,
    metadata: { title: project.title, status: project.status },
    ip: getClientIp(c),
  });

  return c.json(project, 201);
});

projectsRoutes.put('/:id', async (c) => {
  const session = c.get('session')!;
  const id = c.req.param('id');
  const payload = await parseJson(c, projectInputSchema);
  const project = await updateProject(id, payload);

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'project.updated',
    entityType: 'project',
    entityId: project.id,
    metadata: { title: project.title, status: project.status },
    ip: getClientIp(c),
  });

  return c.json(project);
});

projectsRoutes.delete('/:id', async (c) => {
  const session = c.get('session')!;
  const id = c.req.param('id');
  await deleteProject(id);

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'project.deleted',
    entityType: 'project',
    entityId: id,
    ip: getClientIp(c),
  });

  return c.json({ ok: true });
});

projectsRoutes.post('/:id/status', async (c) => {
  const session = c.get('session')!;
  const id = c.req.param('id');
  const payload = await parseJson(c, z.object({ status: z.enum(['draft', 'published']) }));
  const project = await updateProjectStatus(id, payload.status);

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: payload.status === 'published' ? 'project.published' : 'project.unpublished',
    entityType: 'project',
    entityId: project.id,
    ip: getClientIp(c),
  });

  return c.json(project);
});

projectsRoutes.post('/:id/feature', async (c) => {
  const session = c.get('session')!;
  const id = c.req.param('id');
  const payload = await parseJson(c, z.object({ featured: z.boolean() }));
  const project = await updateProjectFeatured(id, payload.featured);

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'project.featured.changed',
    entityType: 'project',
    entityId: project.id,
    metadata: { featured: project.featured },
    ip: getClientIp(c),
  });

  return c.json(project);
});
