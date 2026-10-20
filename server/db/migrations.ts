/**
 * Database migrations.
 *
 * Migrations are embedded as strings so they are always available inside
 * serverless bundles (no filesystem dependency at runtime).
 */

export type Migration = {
  id: string;
  sql: string;
};

export const migrations: Migration[] = [
  {
    id: '0001_init',
    sql: `
      create table if not exists admins (
        id uuid primary key,
        email text not null unique,
        name text not null default 'Administrator',
        password_hash text not null,
        totp_secret text,
        totp_enabled boolean not null default false,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists sessions (
        id text primary key,
        admin_id uuid not null references admins(id) on delete cascade,
        csrf_token text not null,
        ip text,
        user_agent text,
        created_at timestamptz not null default now(),
        last_seen_at timestamptz not null default now(),
        expires_at timestamptz not null,
        revoked_at timestamptz
      );
      create index if not exists sessions_admin_idx on sessions(admin_id);

      create table if not exists login_attempts (
        id bigserial primary key,
        identifier text not null,
        ip text,
        success boolean not null default false,
        created_at timestamptz not null default now()
      );
      create index if not exists login_attempts_idx on login_attempts(identifier, created_at);

      create table if not exists rate_limits (
        bucket text not null,
        key text not null,
        count integer not null default 0,
        reset_at timestamptz not null,
        primary key (bucket, key)
      );

      create table if not exists media (
        id uuid primary key,
        storage_key text not null unique,
        url text not null,
        filename text not null,
        mime_type text not null,
        size_bytes integer not null,
        width integer,
        height integer,
        format text,
        created_at timestamptz not null default now()
      );

      create table if not exists projects (
        id uuid primary key,
        slug text not null unique,
        title text not null,
        summary text not null default '',
        description text not null default '',
        cover_media_id uuid references media(id) on delete set null,
        cover_url text,
        gallery jsonb not null default '[]'::jsonb,
        category text not null default 'General',
        tags jsonb not null default '[]'::jsonb,
        repo_url text,
        live_url text,
        featured boolean not null default false,
        status text not null default 'draft' check (status in ('draft','published')),
        sort_order integer not null default 0,
        start_date text,
        end_date text,
        seo_title text,
        seo_description text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        published_at timestamptz
      );
      create index if not exists projects_status_idx on projects(status);
      create index if not exists projects_order_idx on projects(sort_order);

      create table if not exists skills (
        id uuid primary key,
        name text not null,
        category text not null default 'General',
        icon text,
        description text,
        proficiency integer,
        sort_order integer not null default 0,
        visible boolean not null default true,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists experiences (
        id uuid primary key,
        company text not null,
        position text not null,
        description text,
        period text,
        kind text not null default 'work' check (kind in ('work','education')),
        link text,
        sort_order integer not null default 0,
        visible boolean not null default true,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists services (
        id uuid primary key,
        title text not null,
        description text,
        icon text,
        price text,
        sort_order integer not null default 0,
        visible boolean not null default true,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists nav_links (
        id uuid primary key,
        label text not null,
        href text not null,
        location text not null default 'header' check (location in ('header','footer','social')),
        external boolean not null default false,
        sort_order integer not null default 0,
        visible boolean not null default true,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists pages (
        id text primary key,
        title text,
        content jsonb not null default '{}'::jsonb,
        seo_title text,
        seo_description text,
        updated_at timestamptz not null default now()
      );

      create table if not exists settings (
        key text primary key,
        value jsonb not null default '{}'::jsonb,
        updated_at timestamptz not null default now()
      );

      create table if not exists messages (
        id uuid primary key,
        name text not null,
        email text not null,
        subject text not null,
        body text not null,
        status text not null default 'unread' check (status in ('unread','read','archived')),
        ip text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create index if not exists messages_status_idx on messages(status);

      create table if not exists audit_logs (
        id bigserial primary key,
        admin_id uuid references admins(id) on delete set null,
        admin_email text,
        action text not null,
        entity_type text,
        entity_id text,
        metadata jsonb,
        ip text,
        created_at timestamptz not null default now()
      );
      create index if not exists audit_logs_created_idx on audit_logs(created_at desc);
    `,
  },
];
