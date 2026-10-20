/**
 * Security middleware: hardening headers and strict CORS.
 */

import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { env } from '../env';
import type { AppEnv } from '../types';

const allowedOrigins = new Set<string>(
  [
    env.appUrl,
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:8787',
  ].filter(Boolean) as string[],
);

export const securityHeaders: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next();

  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('X-XSS-Protection', '0');
  c.header(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  );
  c.header(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  );

  if (env.isProduction) {
    c.header(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
  }

  // Never allow API responses to be cached by shared caches.
  if (!c.res.headers.has('Cache-Control')) {
    c.header('Cache-Control', 'no-store');
  }
};

export const corsMiddleware = cors({
  origin: (origin) => (origin && allowedOrigins.has(origin) ? origin : undefined),
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'x-csrf-token'],
  exposeHeaders: [],
  credentials: true,
  maxAge: 600,
});
