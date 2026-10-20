import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/app';
import { createAdmin } from '../server/services/auth.service';

const app = createApp();
const base = 'http://localhost';

const login = (email: string, password: string) =>
  app.request(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

const sessionFrom = (response: Response): string => {
  const header = response.headers.get('set-cookie') ?? '';
  const match = header.match(/(?:^|;\s*)(?:__Host-)?sid=([^;]+)/);
  return match ? match[1]! : '';
};

describe('api routing', () => {
  beforeEach(async () => {
    await createAdmin({ email: 'admin@example.com', password: 'Sup3rSecret', name: 'Admin' });
  });

  it('registers the health endpoint under /api', async () => {
    const response = await app.request(`${base}/api/health`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('reaches the login handler and returns JSON with a session cookie', async () => {
    const response = await login('admin@example.com', 'Sup3rSecret');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(sessionFrom(response)).not.toBe('');
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const response = await app.request(`${base}/api/does-not-exist`);
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe('not_found');
  });

  it('returns a JSON 401 for unauthenticated /api/auth/me', async () => {
    const response = await app.request(`${base}/api/auth/me`);
    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe('unauthorized');
  });

  it('returns the current admin from /api/auth/me when authenticated', async () => {
    const loginResponse = await login('admin@example.com', 'Sup3rSecret');
    const cookie = `sid=${sessionFrom(loginResponse)}`;

    const response = await app.request(`${base}/api/auth/me`, { headers: { cookie } });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = (await response.json()) as {
      admin: { email: string };
      csrfToken: string;
    };
    expect(body.admin.email).toBe('admin@example.com');
    expect(typeof body.csrfToken).toBe('string');
  });

  it('never leaks secrets, tokens or password material in responses', async () => {
    const response = await login('admin@example.com', 'Sup3rSecret');
    const text = await response.text();
    expect(text).not.toContain('Sup3rSecret');
    expect(text).not.toContain('$argon2');
    expect(text).not.toContain('passwordHash');
  });
});
