/**
 * Authentication middleware: session loading, authorization, CSRF.
 */

import { timingSafeEqual } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { env } from '../env';
import { AppError, forbidden, unauthorized } from '../lib/errors';
import { resolveSession, revokeSession } from '../services/auth.service';
import type { AppEnv } from '../types';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const sessionCookieName = (): string =>
  env.isProduction ? '__Host-sid' : 'sid';

export const setSessionCookie = (c: Parameters<MiddlewareHandler<AppEnv>>[0], id: string) => {
  setCookie(c, sessionCookieName(), id, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'Lax',
    path: '/',
    maxAge: env.session.absoluteTtlSeconds,
  });
};

export const clearSessionCookie = (c: Parameters<MiddlewareHandler<AppEnv>>[0]) => {
  deleteCookie(c, sessionCookieName(), {
    path: '/',
    secure: env.isProduction,
    sameSite: 'Lax',
  });
};

const safeEquals = (a: string, b: string): boolean => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
};

/** Load the session (if any) onto the request context. Never rejects. */
export const attachSession: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set('session', null);
  c.set('admin', null);

  const sessionId = getCookie(c, sessionCookieName());
  if (sessionId) {
    const session = await resolveSession(sessionId);
    if (session) {
      c.set('session', session);
      c.set('admin', session.admin);
    } else {
      clearSessionCookie(c);
    }
  }

  await next();
};

/** Require an authenticated administrator. Enforces CSRF on unsafe methods. */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const session = c.get('session');
  if (!session) {
    throw unauthorized();
  }

  if (!SAFE_METHODS.has(c.req.method)) {
    const provided = c.req.header('x-csrf-token') ?? '';
    if (!provided || !safeEquals(provided, session.csrfToken)) {
      throw forbidden('Invalid or missing CSRF token');
    }
  }

  await next();
};

/** Revoke the current session and clear the cookie. */
export const logoutCurrentSession = async (
  sessionId: string,
  c: Parameters<MiddlewareHandler<AppEnv>>[0],
): Promise<void> => {
  await revokeSession(sessionId);
  clearSessionCookie(c);
};

export { AppError };
