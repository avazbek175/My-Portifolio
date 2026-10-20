/**
 * Public API routes: published content + contact form.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { env } from '../env';
import { getClientIp } from '../lib/http';
import { notFound } from '../lib/errors';
import { parseJson } from '../lib/validation';
import { getPublicContent } from '../services/public.service';
import { getPublishedProjectBySlug } from '../services/projects.service';
import { createMessage } from '../services/messages.service';
import { consumeRateLimit } from '../services/rateLimit.service';
import { recordAudit } from '../services/audit.service';
import { emailSchema } from '../services/password';
import type { AppEnv } from '../types';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: emailSchema,
  subject: z.string().trim().min(2, 'Please add a subject').max(160),
  message: z.string().trim().min(10, 'Message is too short').max(5000),
});

export const publicRoutes = new Hono<AppEnv>();

publicRoutes.get('/content', async (c) => {
  const content = await getPublicContent();
  return c.json(content);
});

publicRoutes.get('/projects', async (c) => {
  const content = await getPublicContent();
  return c.json({ items: content.projects });
});

publicRoutes.get('/projects/:slug', async (c) => {
  const slug = c.req.param('slug');
  const project = await getPublishedProjectBySlug(slug);
  if (!project) throw notFound('Project not found');
  return c.json(project);
});

publicRoutes.post('/contact', async (c) => {
  const ip = getClientIp(c);
  await consumeRateLimit(
    'contact:ip',
    ip,
    env.rateLimit.contactMaxRequests,
    env.rateLimit.contactWindowSeconds,
  );

  const payload = await parseJson(c, contactSchema);
  await consumeRateLimit(
    'contact:email',
    payload.email,
    env.rateLimit.contactMaxRequests,
    env.rateLimit.contactWindowSeconds,
  );

  const message = await createMessage({
    name: payload.name,
    email: payload.email,
    subject: payload.subject,
    body: payload.message,
    ip,
  });

  await recordAudit({
    action: 'message.received',
    entityType: 'message',
    entityId: message.id,
    metadata: { email: payload.email },
    ip,
  });

  return c.json({ ok: true, id: message.id }, 201);
});
