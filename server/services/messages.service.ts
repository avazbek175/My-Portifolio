/**
 * Contact message service.
 */

import { randomUUID } from 'node:crypto';
import { getDb } from '../db';
import { AppError } from '../lib/errors';

export type MessageStatus = 'unread' | 'read' | 'archived';

export type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
};

type MessageRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
};

const mapMessage = (row: MessageRow): Message => ({
  id: row.id,
  name: row.name,
  email: row.email,
  subject: row.subject,
  body: row.body,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createMessage = async (input: {
  name: string;
  email: string;
  subject: string;
  body: string;
  ip: string | null;
}): Promise<Message> => {
  const db = await getDb();
  const rows = await db.query<MessageRow>(
    `insert into messages (id, name, email, subject, body, ip)
     values ($1,$2,$3,$4,$5,$6)
     returning *`,
    [randomUUID(), input.name, input.email, input.subject, input.body, input.ip],
  );
  return mapMessage(rows[0]!);
};

export const listMessages = async (options: {
  status?: MessageStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: Message[]; total: number; page: number; pageSize: number }> => {
  const db = await getDb();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (options.status) {
    params.push(options.status);
    conditions.push(`status = $${params.length}`);
  }
  if (options.search) {
    params.push(`%${options.search.toLowerCase()}%`);
    conditions.push(`(lower(name) like $${params.length} or lower(email) like $${params.length} or lower(subject) like $${params.length})`);
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

  const countRows = await db.query<{ count: string }>(
    `select count(*)::text as count from messages ${where}`,
    params,
  );

  params.push(pageSize);
  const limitIdx = params.length;
  params.push((page - 1) * pageSize);
  const offsetIdx = params.length;

  const rows = await db.query<MessageRow>(
    `select * from messages ${where} order by created_at desc
     limit $${limitIdx} offset $${offsetIdx}`,
    params,
  );

  return {
    items: rows.map(mapMessage),
    total: Number(countRows[0]?.count ?? 0),
    page,
    pageSize,
  };
};

export const getMessage = async (id: string): Promise<Message | null> => {
  const db = await getDb();
  const rows = await db.query<MessageRow>('select * from messages where id = $1', [id]);
  return rows[0] ? mapMessage(rows[0]) : null;
};

export const updateMessageStatus = async (
  id: string,
  status: MessageStatus,
): Promise<Message> => {
  const db = await getDb();
  const rows = await db.query<MessageRow>(
    'update messages set status = $2, updated_at = now() where id = $1 returning *',
    [id, status],
  );
  if (!rows[0]) throw new AppError(404, 'not_found', 'Message not found');
  return mapMessage(rows[0]);
};

export const deleteMessage = async (id: string): Promise<void> => {
  const db = await getDb();
  const rows = await db.query('delete from messages where id = $1 returning id', [id]);
  if (rows.length === 0) throw new AppError(404, 'not_found', 'Message not found');
};

export const countUnreadMessages = async (): Promise<number> => {
  const db = await getDb();
  const rows = await db.query<{ count: string }>(
    "select count(*)::text as count from messages where status = 'unread'",
  );
  return Number(rows[0]?.count ?? 0);
};
