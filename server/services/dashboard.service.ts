/**
 * Dashboard statistics service (real database data only).
 */

import { getDb } from '../db';

export type DashboardStats = {
  projects: {
    total: number;
    published: number;
    draft: number;
    featured: number;
  };
  media: {
    total: number;
    totalBytes: number;
  };
  messages: {
    total: number;
    unread: number;
  };
  recentProjects: Array<{
    id: string;
    title: string;
    status: 'draft' | 'published';
    updatedAt: string;
  }>;
  recentMessages: Array<{
    id: string;
    name: string;
    subject: string;
    status: 'unread' | 'read' | 'archived';
    createdAt: string;
  }>;
  recentMedia: Array<{
    id: string;
    filename: string;
    url: string;
    createdAt: string;
  }>;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const db = await getDb();

  const projectRows = await db.query<{
    total: string;
    published: string;
    draft: string;
    featured: string;
  }>(
    `select
       count(*)::text as total,
       count(*) filter (where status = 'published')::text as published,
       count(*) filter (where status = 'draft')::text as draft,
       count(*) filter (where featured)::text as featured
     from projects`,
  );

  const mediaRows = await db.query<{ total: string; total_bytes: string }>(
    'select count(*)::text as total, coalesce(sum(size_bytes),0)::text as total_bytes from media',
  );

  const messageRows = await db.query<{ total: string; unread: string }>(
    "select count(*)::text as total, count(*) filter (where status = 'unread')::text as unread from messages",
  );

  const recentRows = await db.query<{
    id: string;
    title: string;
    status: 'draft' | 'published';
    updated_at: string;
  }>(
    `select id, title, status, updated_at
     from projects
     order by updated_at desc
     limit 5`,
  );

  const recentMessageRows = await db.query<{
    id: string;
    name: string;
    subject: string;
    status: 'unread' | 'read' | 'archived';
    created_at: string;
  }>(
    `select id, name, subject, status, created_at
     from messages
     order by created_at desc
     limit 5`,
  );

  const recentMediaRows = await db.query<{
    id: string;
    filename: string;
    url: string;
    created_at: string;
  }>(
    `select id, filename, url, created_at
     from media
     order by created_at desc
     limit 6`,
  );

  const projects = projectRows[0];
  const media = mediaRows[0];
  const messages = messageRows[0];

  return {
    projects: {
      total: Number(projects?.total ?? 0),
      published: Number(projects?.published ?? 0),
      draft: Number(projects?.draft ?? 0),
      featured: Number(projects?.featured ?? 0),
    },
    media: {
      total: Number(media?.total ?? 0),
      totalBytes: Number(media?.total_bytes ?? 0),
    },
    messages: {
      total: Number(messages?.total ?? 0),
      unread: Number(messages?.unread ?? 0),
    },
    recentProjects: recentRows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      updatedAt: row.updated_at,
    })),
    recentMessages: recentMessageRows.map((row) => ({
      id: row.id,
      name: row.name,
      subject: row.subject,
      status: row.status,
      createdAt: row.created_at,
    })),
    recentMedia: recentMediaRows.map((row) => ({
      id: row.id,
      filename: row.filename,
      url: row.url,
      createdAt: row.created_at,
    })),
  };
};
