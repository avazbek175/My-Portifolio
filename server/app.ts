/**
 * Application assembly for the CMS API (Hono).
 *
 * Mounted by both the local dev server (`server/index.ts`) and the Vercel
 * serverless function (`api/index.ts`).
 */

import { Hono } from 'hono';
import { ensureDatabase } from './db';
import { env, validateProductionEnv } from './env';
import { AppError } from './lib/errors';
import { getClientIp } from './lib/http';
import { attachSession, requireAdmin } from './middleware/auth';
import { corsMiddleware, securityHeaders } from './middleware/security';
import { seedDefaults } from './services/seed.service';
import { auditRoutes } from './routes/audit';
import { authRoutes } from './routes/auth';
import { contentRoutes } from './routes/content';
import { dashboardRoutes } from './routes/dashboard';
import { filesRoutes } from './routes/files';
import { mediaRoutes } from './routes/media';
import { messagesRoutes } from './routes/messages';
import { projectsRoutes } from './routes/projects';
import { publicRoutes } from './routes/public';
import type { AppEnv } from './types';

export const createApp = () => {
  validateProductionEnv();

  const app = new Hono<AppEnv>();

  app.use('*', securityHeaders);
  app.use('*', corsMiddleware);

  app.use('*', async (_c, next) => {
    await ensureDatabase(async (db) => {
      await seedDefaults(db);
    });
    await next();
  });

  app.use('*', attachSession);

  app.get('/api/health', (c) =>
    c.json({ ok: true, driver: env.storage.driver, env: env.nodeEnv }),
  );

  app.route('/api/public', publicRoutes);
  app.route('/api/files', filesRoutes);
  app.route('/api/auth', authRoutes);

  const admin = new Hono<AppEnv>();
  admin.use('*', requireAdmin);
  admin.route('/dashboard', dashboardRoutes);
  admin.route('/projects', projectsRoutes);
  admin.route('/media', mediaRoutes);
  admin.route('/messages', messagesRoutes);
  admin.route('/content', contentRoutes);
  admin.route('/audit', auditRoutes);
  app.route('/api/admin', admin);

  app.onError((error, c) => {
    if (error instanceof AppError) {
      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details ? { details: error.details } : {}),
          },
        },
        error.status as never,
      );
    }

    console.error('[api] unhandled error', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path: c.req.path,
      method: c.req.method,
      ip: getClientIp(c),
    });

    return c.json(
      { error: { code: 'server_error', message: 'Something went wrong' } },
      500,
    );
  });

  return app;
};

export type App = ReturnType<typeof createApp>;
