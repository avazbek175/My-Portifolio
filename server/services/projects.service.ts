/**
 * Project service: CRUD, publishing, ordering, public visibility.
 */

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb, json } from '../db';
import { AppError, badRequest } from '../lib/errors';

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Slug is required')
  .max(80, 'Slug is too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may contain lowercase letters, numbers and hyphens');

const urlOrNull = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => value === '' || /^https?:\/\/.+/i.test(value) || value.startsWith('/'),
    'Enter a valid URL',
  )
  .nullable()
  .optional()
  .transform((value) => (value ? value : null));

export const projectInputSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(160),
  slug: slugSchema.optional(),
  summary: z.string().trim().max(300).default(''),
  description: z.string().trim().max(20000).default(''),
  coverUrl: urlOrNull,
  coverMediaId: z.string().uuid().nullable().optional(),
  gallery: z.array(z.string().trim().max(2048)).max(30).default([]),
  category: z.string().trim().max(80).default('General'),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  repoUrl: urlOrNull,
  liveUrl: urlOrNull,
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  startDate: z.string().trim().max(40).nullable().optional(),
  endDate: z.string().trim().max(40).nullable().optional(),
  seoTitle: z.string().trim().max(200).nullable().optional(),
  seoDescription: z.string().trim().max(300).nullable().optional(),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

export type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  coverMediaId: string | null;
  coverUrl: string | null;
  gallery: string[];
  category: string;
  tags: string[];
  repoUrl: string | null;
  liveUrl: string | null;
  featured: boolean;
  status: 'draft' | 'published';
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  cover_media_id: string | null;
  cover_url: string | null;
  gallery: unknown;
  category: string;
  tags: unknown;
  repo_url: string | null;
  live_url: string | null;
  featured: boolean;
  status: 'draft' | 'published';
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

const toArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((entry) => String(entry)) : [];

const mapProject = (row: ProjectRow): Project => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  summary: row.summary,
  description: row.description,
  coverMediaId: row.cover_media_id,
  coverUrl: row.cover_url,
  gallery: toArray(row.gallery),
  category: row.category,
  tags: toArray(row.tags),
  repoUrl: row.repo_url,
  liveUrl: row.live_url,
  featured: row.featured,
  status: row.status,
  sortOrder: row.sort_order,
  startDate: row.start_date,
  endDate: row.end_date,
  seoTitle: row.seo_title,
  seoDescription: row.seo_description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  publishedAt: row.published_at,
});

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'project';

const ensureUniqueSlug = async (slug: string, excludeId?: string): Promise<string> => {
  const db = await getDb();
  let candidate = slug;
  let suffix = 1;

  while (true) {
    const rows = await db.query<{ id: string }>(
      'select id from projects where slug = $1',
      [candidate],
    );
    const conflict = rows.find((row) => row.id !== excludeId);
    if (!conflict) return candidate;
    suffix += 1;
    candidate = `${slug}-${suffix}`.slice(0, 80);
    if (suffix > 500) throw badRequest('Unable to generate a unique slug');
  }
};

export const listProjects = async (options: {
  status?: 'draft' | 'published';
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: Project[]; total: number; page: number; pageSize: number }> => {
  const db = await getDb();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options.status) {
    params.push(options.status);
    conditions.push(`status = $${params.length}`);
  }
  if (options.category) {
    params.push(options.category);
    conditions.push(`category = $${params.length}`);
  }
  if (options.search) {
    params.push(`%${options.search.toLowerCase()}%`);
    conditions.push(`lower(title) like $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

  const countRows = await db.query<{ count: string }>(
    `select count(*)::text as count from projects ${where}`,
    params,
  );

  params.push(pageSize);
  const limitIdx = params.length;
  params.push((page - 1) * pageSize);
  const offsetIdx = params.length;

  const rows = await db.query<ProjectRow>(
    `select * from projects ${where}
     order by sort_order asc, created_at desc
     limit $${limitIdx} offset $${offsetIdx}`,
    params,
  );

  return {
    items: rows.map(mapProject),
    total: Number(countRows[0]?.count ?? 0),
    page,
    pageSize,
  };
};

export const listPublishedProjects = async (): Promise<Project[]> => {
  const db = await getDb();
  const rows = await db.query<ProjectRow>(
    `select * from projects where status = 'published'
     order by sort_order asc, published_at desc`,
  );
  return rows.map(mapProject);
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  const db = await getDb();
  const rows = await db.query<ProjectRow>('select * from projects where id = $1', [id]);
  return rows[0] ? mapProject(rows[0]) : null;
};

export const getPublishedProjectBySlug = async (slug: string): Promise<Project | null> => {
  const db = await getDb();
  const rows = await db.query<ProjectRow>(
    "select * from projects where slug = $1 and status = 'published'",
    [slug],
  );
  return rows[0] ? mapProject(rows[0]) : null;
};

export const createProject = async (input: ProjectInput): Promise<Project> => {
  const db = await getDb();
  const baseSlug = input.slug ? slugSchema.parse(input.slug) : slugify(input.title);
  const slug = await ensureUniqueSlug(baseSlug);
  const id = randomUUID();
  const sortOrder = input.sortOrder ?? Date.now() % 100000;

  const rows = await db.query<ProjectRow>(
    `insert into projects
       (id, slug, title, summary, description, cover_media_id, cover_url, gallery,
        category, tags, repo_url, live_url, featured, status, sort_order,
        start_date, end_date, seo_title, seo_description, published_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10::jsonb,$11,$12,$13,$14,$15,
             $16,$17,$18,$19,
             case when $14 = 'published' then now() else null end)
     returning *`,
    [
      id,
      slug,
      input.title,
      input.summary,
      input.description,
      input.coverMediaId ?? null,
      input.coverUrl,
      json(input.gallery),
      input.category,
      json(input.tags),
      input.repoUrl,
      input.liveUrl,
      input.featured,
      input.status,
      sortOrder,
      input.startDate ?? null,
      input.endDate ?? null,
      input.seoTitle ?? null,
      input.seoDescription ?? null,
    ],
  );

  return mapProject(rows[0]!);
};

export const updateProject = async (
  id: string,
  input: ProjectInput,
): Promise<Project> => {
  const db = await getDb();
  const existing = await getProjectById(id);
  if (!existing) throw new AppError(404, 'not_found', 'Project not found');

  const baseSlug = input.slug ? slugSchema.parse(input.slug) : slugify(input.title);
  const slug = await ensureUniqueSlug(baseSlug, id);

  const rows = await db.query<ProjectRow>(
    `update projects set
       slug = $2, title = $3, summary = $4, description = $5,
       cover_media_id = $6, cover_url = $7, gallery = $8::jsonb,
       category = $9, tags = $10::jsonb, repo_url = $11, live_url = $12,
       featured = $13, status = $14, sort_order = $15,
       start_date = $16, end_date = $17, seo_title = $18, seo_description = $19,
       published_at = case
         when $20 = 'published' and published_at is null then now()
         when $20 = 'draft' then null
         else published_at
       end,
       updated_at = now()
     where id = $1
     returning *`,
    [
      id,
      slug,
      input.title,
      input.summary,
      input.description,
      input.coverMediaId ?? null,
      input.coverUrl,
      json(input.gallery),
      input.category,
      json(input.tags),
      input.repoUrl,
      input.liveUrl,
      input.featured,
      input.status,
      input.sortOrder ?? 0,
      input.startDate ?? null,
      input.endDate ?? null,
      input.seoTitle ?? null,
      input.seoDescription ?? null,
      input.status,
    ],
  );

  return mapProject(rows[0]!);
};

export const updateProjectStatus = async (
  id: string,
  status: 'draft' | 'published',
): Promise<Project> => {
  const db = await getDb();
  const rows = await db.query<ProjectRow>(
    `update projects set
       status = $2,
       published_at = case
         when $2 = 'published' and published_at is null then now()
         when $2 = 'draft' then null
         else published_at
       end,
       updated_at = now()
     where id = $1
     returning *`,
    [id, status],
  );
  if (!rows[0]) throw new AppError(404, 'not_found', 'Project not found');
  return mapProject(rows[0]);
};

export const updateProjectFeatured = async (
  id: string,
  featured: boolean,
): Promise<Project> => {
  const db = await getDb();
  const rows = await db.query<ProjectRow>(
    'update projects set featured = $2, updated_at = now() where id = $1 returning *',
    [id, featured],
  );
  if (!rows[0]) throw new AppError(404, 'not_found', 'Project not found');
  return mapProject(rows[0]);
};

export const reorderProjects = async (orderedIds: string[]): Promise<void> => {
  const db = await getDb();
  await db.transaction(async (tx) => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      await tx.query('update projects set sort_order = $2, updated_at = now() where id = $1', [
        orderedIds[index],
        index,
      ]);
    }
  });
};

export const deleteProject = async (id: string): Promise<void> => {
  const db = await getDb();
  const rows = await db.query('delete from projects where id = $1 returning id', [id]);
  if (rows.length === 0) throw new AppError(404, 'not_found', 'Project not found');
};
