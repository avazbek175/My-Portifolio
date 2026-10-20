/**
 * Authentication service: admins, sessions, password changes.
 */

import { randomBytes, randomUUID } from 'node:crypto';
import { getDb } from '../db';
import { env } from '../env';
import { AppError, unauthorized } from '../lib/errors';
import { hashPassword, verifyPassword } from './password';

export type Admin = {
  id: string;
  email: string;
  name: string;
  totp_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type SessionSummary = {
  id: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  current: boolean;
};

export type AuthenticatedSession = {
  sessionId: string;
  csrfToken: string;
  admin: Admin;
};

const adminColumns = 'id, email, name, totp_enabled, created_at, updated_at';

export const createAdmin = async (input: {
  email: string;
  password: string;
  name?: string;
}): Promise<Admin> => {
  const db = await getDb();
  const id = randomUUID();
  const passwordHash = await hashPassword(input.password);

  const rows = await db.query<Admin>(
    `insert into admins (id, email, name, password_hash)
     values ($1, $2, $3, $4)
     returning ${adminColumns}`,
    [id, input.email, input.name ?? 'Administrator', passwordHash],
  );

  return rows[0]!;
};

export const countAdmins = async (): Promise<number> => {
  const db = await getDb();
  const rows = await db.query<{ count: string }>('select count(*)::text as count from admins');
  return Number(rows[0]?.count ?? 0);
};

export const findAdminByEmail = async (email: string): Promise<Admin | null> => {
  const db = await getDb();
  const rows = await db.query<Admin>(
    `select ${adminColumns} from admins where email = $1`,
    [email],
  );
  return rows[0] ?? null;
};

export const authenticate = async (
  email: string,
  password: string,
): Promise<Admin | null> => {
  const db = await getDb();
  const rows = await db.query<Admin & { password_hash: string }>(
    `select ${adminColumns}, password_hash from admins where email = $1`,
    [email],
  );

  const record = rows[0];
  if (!record) {
    // Perform a dummy verify to reduce timing differences for unknown users.
    await verifyPassword(
      '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzYWx0$0000000000000000000000000000000000000000000',
      password,
    ).catch(() => false);
    return null;
  }

  const valid = await verifyPassword(record.password_hash, password);
  if (!valid) return null;

  return {
    id: record.id,
    email: record.email,
    name: record.name,
    totp_enabled: record.totp_enabled,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
};

export const recordLoginAttempt = async (input: {
  identifier: string;
  ip: string | null;
  success: boolean;
}): Promise<void> => {
  const db = await getDb();
  await db.query(
    'insert into login_attempts (identifier, ip, success) values ($1, $2, $3)',
    [input.identifier, input.ip, input.success],
  );
};

export const createSession = async (input: {
  adminId: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<{ id: string; csrfToken: string; expiresAt: string }> => {
  const db = await getDb();
  const id = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(32).toString('base64url');

  const rows = await db.query<{ expires_at: string }>(
    `insert into sessions (id, admin_id, csrf_token, ip, user_agent, expires_at)
     values ($1, $2, $3, $4, $5, now() + ($6 * interval '1 second'))
     returning expires_at`,
    [id, input.adminId, csrfToken, input.ip, input.userAgent, env.session.absoluteTtlSeconds],
  );

  return { id, csrfToken, expiresAt: rows[0]!.expires_at };
};

/**
 * Resolve a session id to an authenticated session. Enforces absolute and idle
 * timeouts and refreshes `last_seen_at`. Returns null when invalid.
 */
export const resolveSession = async (
  sessionId: string,
): Promise<AuthenticatedSession | null> => {
  const db = await getDb();

  const rows = await db.query<
    Admin & {
      session_id: string;
      csrf_token: string;
      expires_at: string;
      last_seen_at: string;
      revoked_at: string | null;
    }
  >(
    `select ${adminColumns.split(', ').map((col) => `a.${col}`).join(', ')},
            s.id as session_id, s.csrf_token, s.expires_at, s.last_seen_at, s.revoked_at
     from sessions s
     join admins a on a.id = s.admin_id
     where s.id = $1`,
    [sessionId],
  );

  const row = rows[0];
  if (!row) return null;
  if (row.revoked_at) return null;

  const now = Date.now();
  const expiresAt = new Date(row.expires_at).getTime();
  const lastSeen = new Date(row.last_seen_at).getTime();
  const idleDeadline = lastSeen + env.session.idleTtlSeconds * 1000;

  if (now >= expiresAt || now >= idleDeadline) {
    await db.query(
      'update sessions set revoked_at = now() where id = $1 and revoked_at is null',
      [sessionId],
    );
    return null;
  }

  await db.query('update sessions set last_seen_at = now() where id = $1', [sessionId]);

  return {
    sessionId: row.session_id,
    csrfToken: row.csrf_token,
    admin: {
      id: row.id,
      email: row.email,
      name: row.name,
      totp_enabled: row.totp_enabled,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  };
};

export const revokeSession = async (sessionId: string): Promise<void> => {
  const db = await getDb();
  await db.query(
    'update sessions set revoked_at = now() where id = $1 and revoked_at is null',
    [sessionId],
  );
};

export const revokeOtherSessions = async (
  adminId: string,
  keepSessionId: string,
): Promise<void> => {
  const db = await getDb();
  await db.query(
    `update sessions set revoked_at = now()
     where admin_id = $1 and id <> $2 and revoked_at is null`,
    [adminId, keepSessionId],
  );
};

export const listSessions = async (
  adminId: string,
  currentSessionId: string,
): Promise<SessionSummary[]> => {
  const db = await getDb();
  const rows = await db.query<SessionSummary & { current: boolean }>(
    `select id, ip, user_agent, created_at, last_seen_at, expires_at,
            (id = $2) as current
     from sessions
     where admin_id = $1 and revoked_at is null and expires_at > now()
     order by last_seen_at desc`,
    [adminId, currentSessionId],
  );
  return rows;
};

export const changePassword = async (input: {
  adminId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  const db = await getDb();
  const rows = await db.query<{ password_hash: string }>(
    'select password_hash from admins where id = $1',
    [input.adminId],
  );

  const record = rows[0];
  if (!record) throw unauthorized();

  const valid = await verifyPassword(record.password_hash, input.currentPassword);
  if (!valid) {
    throw new AppError(400, 'invalid_password', 'Current password is incorrect');
  }

  const passwordHash = await hashPassword(input.newPassword);
  await db.query(
    'update admins set password_hash = $2, updated_at = now() where id = $1',
    [input.adminId, passwordHash],
  );
};

export const updateAdminProfile = async (input: {
  adminId: string;
  name?: string;
  email?: string;
}): Promise<Admin> => {
  const db = await getDb();
  const rows = await db.query<Admin>(
    `update admins set
       name = coalesce($2, name),
       email = coalesce($3, email),
       updated_at = now()
     where id = $1
     returning ${adminColumns}`,
    [input.adminId, input.name ?? null, input.email ?? null],
  );
  return rows[0]!;
};
