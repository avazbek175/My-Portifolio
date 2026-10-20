/**
 * Typed helpers for the admin API.
 */

import { apiFetch } from '@/lib/api';
import type {
  Admin,
  AuditEntry,
  DashboardStats,
  Experience,
  MediaItem,
  Message,
  MessageStatus,
  NavLink,
  Page,
  Paginated,
  Project,
  ServiceItem,
  SessionSummary,
  Skill,
} from '@/lib/cms-types';

export type ProjectInput = {
  title: string;
  slug?: string;
  summary?: string;
  description?: string;
  coverUrl?: string | null;
  coverMediaId?: string | null;
  gallery?: string[];
  category?: string;
  tags?: string[];
  repoUrl?: string | null;
  liveUrl?: string | null;
  featured?: boolean;
  status?: 'draft' | 'published';
  sortOrder?: number;
  startDate?: string | null;
  endDate?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type SkillInput = Partial<Omit<Skill, 'id'>>;
export type ExperienceInput = Partial<Omit<Experience, 'id'>>;
export type ServiceInput = Partial<Omit<ServiceItem, 'id'>>;
export type NavInput = Partial<Omit<NavLink, 'id'>>;

type QueryValue = string | number | boolean | undefined;

const toQuery = (params: Record<string, QueryValue>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

/* --------------------------------- Dashboard ----------------------------- */

export const getDashboardStats = () =>
  apiFetch<DashboardStats>('/api/admin/dashboard/stats');

/* --------------------------------- Projects ------------------------------ */

export const listProjects = (params: {
  status?: 'draft' | 'published';
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}) => apiFetch<Paginated<Project>>(`/api/admin/projects${toQuery(params)}`);

export const getProject = (id: string) =>
  apiFetch<Project>(`/api/admin/projects/${id}`);

export const createProject = (input: ProjectInput) =>
  apiFetch<Project>('/api/admin/projects', { method: 'POST', body: input });

export const updateProject = (id: string, input: ProjectInput) =>
  apiFetch<Project>(`/api/admin/projects/${id}`, { method: 'PUT', body: input });

export const deleteProject = (id: string) =>
  apiFetch<{ ok: true }>(`/api/admin/projects/${id}`, { method: 'DELETE' });

export const setProjectStatus = (id: string, status: 'draft' | 'published') =>
  apiFetch<Project>(`/api/admin/projects/${id}/status`, {
    method: 'POST',
    body: { status },
  });

export const setProjectFeatured = (id: string, featured: boolean) =>
  apiFetch<Project>(`/api/admin/projects/${id}/feature`, {
    method: 'POST',
    body: { featured },
  });

/* ---------------------------------- Media -------------------------------- */

export const listMedia = (params: { page?: number; pageSize?: number; search?: string } = {}) =>
  apiFetch<Paginated<MediaItem>>(`/api/admin/media${toQuery(params)}`);

export const uploadMedia = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<{ items: MediaItem[] }>('/api/admin/media', {
    method: 'POST',
    body: form,
  });
};

export const deleteMedia = (id: string) =>
  apiFetch<{ ok: true }>(`/api/admin/media/${id}`, { method: 'DELETE' });

/* -------------------------------- Messages ------------------------------- */

export const listMessages = (
  params: { status?: MessageStatus; search?: string; page?: number; pageSize?: number } = {},
) => apiFetch<Paginated<Message>>(`/api/admin/messages${toQuery(params)}`);

export const setMessageStatus = (id: string, status: MessageStatus) =>
  apiFetch<Message>(`/api/admin/messages/${id}`, { method: 'PATCH', body: { status } });

export const deleteMessage = (id: string) =>
  apiFetch<{ ok: true }>(`/api/admin/messages/${id}`, { method: 'DELETE' });

/* --------------------------------- Content ------------------------------- */

export const listPages = () => apiFetch<{ items: Page[] }>('/api/admin/content/pages');

export const getPage = (id: string) =>
  apiFetch<Page>(`/api/admin/content/pages/${id}`);

export const updatePage = (
  id: string,
  input: {
    title?: string | null;
    content: Record<string, unknown>;
    seoTitle?: string | null;
    seoDescription?: string | null;
  },
) => apiFetch<Page>(`/api/admin/content/pages/${id}`, { method: 'PUT', body: input });

export const getSettings = () =>
  apiFetch<Record<string, Record<string, unknown>>>('/api/admin/content/settings');

export const updateSetting = (key: string, value: Record<string, unknown>) =>
  apiFetch<{ id: string; key: string; value: Record<string, unknown> }>(
    '/api/admin/content/settings',
    { method: 'PUT', body: { key, value } },
  );

export const listCollection = <T>(name: string) =>
  apiFetch<{ items: T[] }>(`/api/admin/content/${name}`);

export const createCollectionItem = <T>(name: string, input: unknown) =>
  apiFetch<T>(`/api/admin/content/${name}`, { method: 'POST', body: input });

export const updateCollectionItem = <T>(name: string, id: string, input: unknown) =>
  apiFetch<T>(`/api/admin/content/${name}/${id}`, { method: 'PUT', body: input });

export const deleteCollectionItem = (name: string, id: string) =>
  apiFetch<{ ok: true }>(`/api/admin/content/${name}/${id}`, { method: 'DELETE' });

export const reorderCollection = (name: string, ids: string[]) =>
  apiFetch<{ ok: true }>(`/api/admin/content/${name}/reorder`, {
    method: 'POST',
    body: { ids },
  });

export const contentApi = {
  skills: {
    list: () => listCollection<Skill>('skills'),
    create: (input: SkillInput) => createCollectionItem<Skill>('skills', input),
    update: (id: string, input: SkillInput) => updateCollectionItem<Skill>('skills', id, input),
    remove: (id: string) => deleteCollectionItem('skills', id),
  },
  experiences: {
    list: () => listCollection<Experience>('experiences'),
    create: (input: ExperienceInput) => createCollectionItem<Experience>('experiences', input),
    update: (id: string, input: ExperienceInput) =>
      updateCollectionItem<Experience>('experiences', id, input),
    remove: (id: string) => deleteCollectionItem('experiences', id),
  },
  services: {
    list: () => listCollection<ServiceItem>('services'),
    create: (input: ServiceInput) => createCollectionItem<ServiceItem>('services', input),
    update: (id: string, input: ServiceInput) =>
      updateCollectionItem<ServiceItem>('services', id, input),
    remove: (id: string) => deleteCollectionItem('services', id),
  },
  nav: {
    list: () => listCollection<NavLink>('nav'),
    create: (input: NavInput) => createCollectionItem<NavLink>('nav', input),
    update: (id: string, input: NavInput) => updateCollectionItem<NavLink>('nav', id, input),
    remove: (id: string) => deleteCollectionItem('nav', id),
  },
};

/* ---------------------------------- Audit -------------------------------- */

export const listAudit = (limit = 100) =>
  apiFetch<{ items: AuditEntry[] }>(`/api/admin/audit${toQuery({ limit })}`);

/* -------------------------------- Account -------------------------------- */

export const changePassword = (currentPassword: string, newPassword: string) =>
  apiFetch<{ ok: true }>('/api/auth/password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });

export const updateProfile = (input: { name?: string; email?: string }) =>
  apiFetch<{ admin: Admin }>('/api/auth/profile', { method: 'PUT', body: input });

export const listSessions = () =>
  apiFetch<{ items: SessionSummary[] }>('/api/auth/sessions');

export const revokeSession = (id: string) =>
  apiFetch<{ ok: true }>(`/api/auth/sessions/${id}`, { method: 'DELETE' });
