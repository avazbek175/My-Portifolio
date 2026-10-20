/**
 * Admin authentication routes.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { env } from '../env';
import { getClientIp } from '../lib/http';
import { AppError } from '../lib/errors';
import { parseJson } from '../lib/validation';
import {
  logoutCurrentSession,
  requireAdmin,
  setSessionCookie,
} from '../middleware/auth';
import {
  authenticate,
  changePassword,
  createSession,
  listSessions,
  recordLoginAttempt,
  revokeOtherSessions,
  revokeSession,
  updateAdminProfile,
} from '../services/auth.service';
import { emailSchema } from '../services/password';
import { consumeRateLimit } from '../services/rateLimit.service';
import { recordAudit } from '../services/audit.service';
import type { AppEnv } from '../types';

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});

export const authRoutes = new Hono<AppEnv>();

authRoutes.post('/login', async (c) => {
  const ip = getClientIp(c);
  const payload = await parseJson(c, loginSchema);

  await consumeRateLimit(
    'login:ip',
    ip,
    env.rateLimit.loginMaxAttempts,
    env.rateLimit.loginWindowSeconds,
  );
  await consumeRateLimit(
    'login:account',
    payload.email,
    env.rateLimit.loginMaxAttempts,
    env.rateLimit.loginWindowSeconds,
  );

  const admin = await authenticate(payload.email, payload.password);
  await recordLoginAttempt({ identifier: payload.email, ip, success: Boolean(admin) });

  if (!admin) {
    await recordAudit({
      action: 'auth.login.failed',
      entityType: 'admin',
      metadata: { email: payload.email },
      ip,
    });
    throw new AppError(401, 'invalid_credentials', 'Invalid email or password');
  }

  const session = await createSession({
    adminId: admin.id,
    ip,
    userAgent: c.req.header('user-agent') ?? null,
  });

  setSessionCookie(c, session.id);

  await recordAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'auth.login',
    entityType: 'session',
    entityId: session.id,
    ip,
  });

  return c.json({ admin, csrfToken: session.csrfToken });
});

authRoutes.get('/me', requireAdmin, (c) => {
  const session = c.get('session')!;
  return c.json({ admin: session.admin, csrfToken: session.csrfToken });
});

authRoutes.post('/logout', requireAdmin, async (c) => {
  const session = c.get('session')!;
  await logoutCurrentSession(session.sessionId, c);
  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'auth.logout',
    entityType: 'session',
    entityId: session.sessionId,
    ip: getClientIp(c),
  });
  return c.json({ ok: true });
});

authRoutes.post('/password', requireAdmin, async (c) => {
  const session = c.get('session')!;
  const payload = await parseJson(
    c,
    z.object({
      currentPassword: z.string().min(1).max(200),
      newPassword: z
        .string()
        .min(10)
        .max(128)
        .regex(/[a-z]/)
        .regex(/[A-Z]/)
        .regex(/[0-9]/),
    }),
  );

  await changePassword({
    adminId: session.admin.id,
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
  });

  await revokeOtherSessions(session.admin.id, session.sessionId);

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'auth.password.changed',
    entityType: 'admin',
    entityId: session.admin.id,
    ip: getClientIp(c),
  });

  return c.json({ ok: true });
});

authRoutes.patch('/profile', requireAdmin, async (c) => {
  const session = c.get('session')!;
  const payload = await parseJson(
    c,
    z.object({
      name: z.string().trim().min(1).max(120).optional(),
      email: emailSchema.optional(),
    }),
  );

  const admin = await updateAdminProfile({
    adminId: session.admin.id,
    name: payload.name,
    email: payload.email,
  });

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'auth.profile.updated',
    entityType: 'admin',
    entityId: session.admin.id,
    ip: getClientIp(c),
  });

  return c.json({ admin });
});

authRoutes.get('/sessions', requireAdmin, async (c) => {
  const session = c.get('session')!;
  const sessions = await listSessions(session.admin.id, session.sessionId);
  return c.json({ items: sessions });
});

authRoutes.delete('/sessions/:id', requireAdmin, async (c) => {
  const session = c.get('session')!;
  const targetId = c.req.param('id');

  await revokeSession(targetId);

  await recordAudit({
    adminId: session.admin.id,
    adminEmail: session.admin.email,
    action: 'auth.session.revoked',
    entityType: 'session',
    entityId: targetId,
    ip: getClientIp(c),
  });

  return c.json({ ok: true });
});
