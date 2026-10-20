import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/app';
import { createAdmin } from '../server/services/auth.service';
import { hashPassword, verifyPassword } from '../server/services/password';

const app = createApp();

const base = 'http://localhost';

const login = async (email: string, password: string) => {
  const response = await app.request(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response;
};

const sessionFrom = (response: Response): string => {
  const header = response.headers.get('set-cookie') ?? '';
  const match = header.match(/(?:^|;\s*)(?:__Host-)?sid=([^;]+)/);
  return match ? match[1]! : '';
};

describe('password hashing', () => {
  it('hashes and verifies a password', async () => {
    const digest = await hashPassword('Sup3rSecret');
    expect(digest).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(digest, 'Sup3rSecret')).toBe(true);
    expect(await verifyPassword(digest, 'wrong')).toBe(false);
  });
});

describe('auth routes', () => {
  beforeEach(async () => {
    await createAdmin({ email: 'admin@example.com', password: 'Sup3rSecret', name: 'Admin' });
  });

  it('rejects invalid credentials', async () => {
    const response = await login('admin@example.com', 'wrong-password');
    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe('invalid_credentials');
  });

  it('logs in and returns a session plus csrf token', async () => {
    const response = await login('admin@example.com', 'Sup3rSecret');
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      admin: { email: string };
      csrfToken: string;
    };
    expect(body.admin.email).toBe('admin@example.com');
    expect(typeof body.csrfToken).toBe('string');
    expect(sessionFrom(response)).not.toBe('');
  });

  it('requires a valid csrf token for unsafe admin requests', async () => {
    const response = await login('admin@example.com', 'Sup3rSecret');
    const cookie = `sid=${sessionFrom(response)}`;

    const withoutCsrf = await app.request(`${base}/api/admin/projects`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    });
    expect(withoutCsrf.status).toBe(403);
  });

  it('blocks unauthenticated access to admin routes', async () => {
    const response = await app.request(`${base}/api/admin/projects`);
    expect(response.status).toBe(401);
  });
});
