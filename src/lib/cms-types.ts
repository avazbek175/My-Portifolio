/**
 * API response types shared between the public site and the admin panel.
 * These mirror the shapes returned by the Hono backend.
 */

export type ProjectStatus = 'draft' | 'published';

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
  status: ProjectStatus;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

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

export type Page = {
  id: string;
  title: string | null;
  content: Record<string, unknown>;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

export type PublicContent = {
  settings: Record<string, Record<string, unknown>>;
  pages: {
    home: Record<string, unknown> | null;
    about: Record<string, unknown> | null;
    contact: Record<string, unknown> | null;
  };
  nav: {
    header: NavLink[];
    footer: NavLink[];
    social: NavLink[];
  };
  skills: Skill[];
  experiences: Experience[];
  services: ServiceItem[];
  projects: Project[];
};

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

export type MediaItem = {
  id: string;
  url: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  format: string | null;
  createdAt: string;
};

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

export type DashboardStats = {
  projects: { total: number; published: number; draft: number; featured: number };
  media: { total: number; totalBytes: number };
  messages: { total: number; unread: number };
  recentProjects: Array<{
    id: string;
    title: string;
    status: ProjectStatus;
    updatedAt: string;
  }>;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
