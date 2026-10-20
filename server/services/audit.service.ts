/**
 * Audit log service. Never records passwords or tokens.
 */

import { getDb, json, type Db } from '../db';

export type AuditInput = {
  adminId?: string | null;
  adminEmail?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
};

export const recordAudit = async (
  input: AuditInput,
  db?: Db,
): Promise<void> => {
  const client = db ?? (await getDb());
  await client.query(
    `insert into audit_logs
       (admin_id, admin_email, action, entity_type, entity_id, metadata, ip)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [
      input.adminId ?? null,
      input.adminEmail ?? null,
      input.action,
      input.entityType ?? null,
      input.entityId ?? null,
      input.metadata ? json(input.metadata) : null,
      input.ip ?? null,
    ],
  );
};

export type AuditEntry = {
  id: number;
  admin_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
};

export const listAuditLogs = async (limit = 50): Promise<AuditEntry[]> => {
  const db = await getDb();
  return db.query<AuditEntry>(
    `select id, admin_email, action, entity_type, entity_id, metadata, ip, created_at
     from audit_logs
     order by created_at desc
     limit $1`,
    [Math.min(Math.max(limit, 1), 200)],
  );
};
