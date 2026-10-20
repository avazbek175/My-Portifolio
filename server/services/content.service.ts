/**
 * Content service: pages, settings, navigation, skills, experiences, services.
 */

import { z } from 'zod';
import { getDb, json } from '../db';
import { AppError, badRequest } from '../lib/errors';
import { createCollection } from './collection.service';

/* ------------------------------- Validation ------------------------------ */

const nullableText = (max: number) =>
  z.string().trim().max(max).nullable().optional().transform((v) => (v === '' ? null : v ?? null));

const sortOrder = z.number().int().min(0).max(100000).optional();

export const skillSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.string().trim().max(60).default('General'),
  icon: nullableText(400),
  description: nullableText(400),
  proficiency: z.number().int().min(0).max(100).nullable().optional(),
  sortOrder,
  visible: z.boolean().default(true),
});
export const skillUpdateSchema = skillSchema.partial();

export const experienceSchema = z.object({
  company: z.string().trim().min(1).max(120),
  position: z.string().trim().min(1).max(120),
  description: nullableText(2000),
  period: nullableText(80),
  kind: z.enum(['work', 'education']).default('work'),
  link: nullableText(500),
  sortOrder,
  visible: z.boolean().default(true),
});
export const experienceUpdateSchema = experienceSchema.partial();

export const serviceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: nullableText(2000),
  icon: nullableText(400),
  price: nullableText(80),
  sortOrder,
  visible: z.boolean().default(true),
});
export const serviceUpdateSchema = serviceSchema.partial();

export const navSchema = z.object({
  label: z.string().trim().min(1).max(60),
  href: z.string().trim().min(1).max(1000),
  location: z.enum(['header', 'footer', 'social']).default('header'),
  external: z.boolean().default(false),
  sortOrder,
  visible: z.boolean().default(true),
});
export const navUpdateSchema = navSchema.partial();

export const pageUpdateSchema = z.object({
  title: z.string().trim().max(120).nullable().optional(),
  content: z.record(z.string(), z.unknown()),
  seoTitle: nullableText(200),
  seoDescription: nullableText(300),
});

export const SETTING_KEYS = ['site', 'seo', 'appearance'] as const;
export const settingsUpdateSchema = z.object({
  key: z.enum(SETTING_KEYS),
  value: z.record(z.string(), z.unknown()),
});

/* -------------------------------- Collections ---------------------------- */

export type Skill = {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  description: string | null;
  proficiency: number | null;
  sortOrder: number;
  visible: boolean;
};

export type Experience = {
  id: string;
  company: string;
  position: string;
  description: string | null;
  period: string | null;
  kind: 'work' | 'education';
  link: string | null;
  sortOrder: number;
  visible: boolean;
};

export type ServiceItem = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  price: string | null;
  sortOrder: number;
  visible: boolean;
};

export type NavLink = {
  id: string;
  label: string;
  href: string;
  location: 'header' | 'footer' | 'social';
  external: boolean;
  sortOrder: number;
  visible: boolean;
};

export const skillsCollection = createCollection<Skill>({
  table: 'skills',
  fields: {
    name: 'name',
    category: 'category',
    icon: 'icon',
    description: 'description',
    proficiency: 'proficiency',
    sortOrder: 'sort_order',
    visible: 'visible',
  },
  filters: ['visible', 'category'],
});

export const experiencesCollection = createCollection<Experience>({
  table: 'experiences',
  fields: {
    company: 'company',
    position: 'position',
    description: 'description',
    period: 'period',
    kind: 'kind',
    link: 'link',
    sortOrder: 'sort_order',
    visible: 'visible',
  },
  filters: ['visible', 'kind'],
});

export const servicesCollection = createCollection<ServiceItem>({
  table: 'services',
  fields: {
    title: 'title',
    description: 'description',
    icon: 'icon',
    price: 'price',
    sortOrder: 'sort_order',
    visible: 'visible',
  },
  filters: ['visible'],
});

export const navCollection = createCollection<NavLink>({
  table: 'nav_links',
  fields: {
    label: 'label',
    href: 'href',
    location: 'location',
    external: 'external',
    sortOrder: 'sort_order',
    visible: 'visible',
  },
  filters: ['visible', 'location'],
});

/* ---------------------------------- Pages -------------------------------- */

export const PAGE_IDS = ['home', 'about', 'contact'] as const;

export type Page = {
  id: string;
  title: string | null;
  content: Record<string, unknown>;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

type PageRow = {
  id: string;
  title: string | null;
  content: unknown;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
};

const mapPage = (row: PageRow): Page => ({
  id: row.id,
  title: row.title,
  content: (row.content as Record<string, unknown>) ?? {},
  seoTitle: row.seo_title,
  seoDescription: row.seo_description,
  updatedAt: row.updated_at,
});

export const listPages = async (): Promise<Page[]> => {
  const db = await getDb();
  const rows = await db.query<PageRow>('select * from pages order by id asc');
  return rows.map(mapPage);
};

export const getPage = async (id: string): Promise<Page | null> => {
  const db = await getDb();
  const rows = await db.query<PageRow>('select * from pages where id = $1', [id]);
  return rows[0] ? mapPage(rows[0]) : null;
};

export const updatePage = async (
  id: string,
  input: { title?: string | null; content: Record<string, unknown>; seoTitle?: string | null; seoDescription?: string | null },
): Promise<Page> => {
  if (!(PAGE_IDS as readonly string[]).includes(id)) {
    throw badRequest('Unknown page');
  }

  const db = await getDb();
  const rows = await db.query<PageRow>(
    `update pages set
       title = coalesce($2, title),
       content = $3::jsonb,
       seo_title = $4,
       seo_description = $5,
       updated_at = now()
     where id = $1
     returning *`,
    [id, input.title ?? null, json(input.content), input.seoTitle ?? null, input.seoDescription ?? null],
  );

  if (!rows[0]) throw new AppError(404, 'not_found', 'Page not found');
  return mapPage(rows[0]);
};

/* --------------------------------- Settings ------------------------------ */

export type SettingsMap = Record<string, Record<string, unknown>>;

export const getSettings = async (): Promise<SettingsMap> => {
  const db = await getDb();
  const rows = await db.query<{ key: string; value: unknown }>(
    'select key, value from settings where key <> $1',
    ['seeded'],
  );

  const result: SettingsMap = {};
  for (const row of rows) {
    result[row.key] = (row.value as Record<string, unknown>) ?? {};
  }
  return result;
};

export const updateSetting = async (
  key: string,
  value: Record<string, unknown>,
): Promise<{ key: string; value: Record<string, unknown> }> => {
  if (!(SETTING_KEYS as readonly string[]).includes(key)) {
    throw badRequest('Unknown settings key');
  }

  const db = await getDb();
  const rows = await db.query<{ key: string; value: unknown }>(
    `insert into settings (key, value, updated_at) values ($1, $2::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()
     returning key, value`,
    [key, json(value)],
  );

  return {
    key: rows[0]!.key,
    value: (rows[0]!.value as Record<string, unknown>) ?? {},
  };
};
