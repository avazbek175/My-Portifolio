# CYBERAVAZ — Portfolio & CMS

Personal portfolio site for **Avazbek** (cyberavaz), a frontend designer & developer,
now powered by a self-hosted content management system.

- **Public site** — animated single-page portfolio rendered from live API content.
- **Admin panel** — authentication, projects, media library, contact inbox, content
  collections, account settings and an audit log.

Built with React 19, TypeScript, Vite 7, Tailwind CSS v4 and shadcn/ui on the frontend,
and Hono + Vercel Functions with Postgres/PGlite on the backend.

## Features

### Public site

- Single-page portfolio with slide-out navigation and scroll-spy active links
- Animated, scroll-revealed sections (Hero, Projects, About, Services, Resume, Reviews, Contact)
- Content loaded from `GET /api/public/content` with static fallback so the site
  always renders, even if the API is unreachable
- Contact form posts to `POST /api/public/contact` and stores messages in the inbox

### Admin panel (`/admin`)

- Email + password sign in with Argon2id hashing, database-backed sessions and CSRF protection
- Dashboard with real statistics (projects, media, messages, recently updated)
- Projects CRUD with publish/unpublish, feature toggle, tags, gallery and SEO fields
- Media library with server-side image validation/optimisation (`sharp`) and a picker
  for project covers and galleries
- Contact inbox with read/unread/archive states
- Content manager for skills, experiences, services and navigation links
- Account settings: profile, password change and active session management
- Read-only audit log of admin actions

## Tech stack

**Frontend:** React 19, TypeScript, Vite 7, Tailwind CSS v4 (`@tailwindcss/vite`),
shadcn/ui (radix-ui), react-hook-form + zod, react-router-dom.

**Backend:** Hono on Vercel Functions (Node runtime), `pg` (Postgres / Neon) in
production and `@electric-sql/pglite` locally and in tests, `@vercel/blob` for
storage in production and the local filesystem in dev, `sharp` for images,
Vitest for tests.

## Getting started

```bash
npm install
npm run dev          # web (5173) + API (8787) together
```

`npm run dev` runs the Vite dev server and the Hono API via `concurrently`.
Vite proxies `/api/*` to the API server, so the two stay same-origin in development.

Create the first administrator (reads `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME`
from `.env`):

```bash
npm run admin:create
```

Then sign in at `http://localhost:5173/admin`.

### Environment

Copy `.env.example` to `.env`. In development everything works with the defaults
(embedded PGlite database under `.data/` and local file storage). In production
set `DATABASE_URL`, `STORAGE_DRIVER=vercel-blob` and `BLOB_READ_WRITE_TOKEN`.

## Scripts

```bash
npm run dev            # web + API in watch mode
npm run dev:web        # Vite dev server only
npm run dev:api        # Hono API only (tsx watch)
npm run build          # type-check + production build to dist/
npm run preview        # preview the production build
npm run lint           # ESLint
npm run typecheck      # full type-check (client + server)
npm run test           # Vitest (auth, projects, media)
npm run admin:create   # provision an administrator
npm run db:migrate     # apply migrations and seed default content
```

## Project structure

```
api/                     # Vercel serverless entry (Hono)
server/
  app.ts                 # route assembly
  routes/                # public, auth, projects, media, messages, content, dashboard, audit, files
  services/              # domain logic
  db/                    # PGlite/Postgres adapter + migrations
  middleware/            # auth (sessions, CSRF), security headers, CORS
  scripts/               # create-admin, migrate
  data/defaults.ts       # seed content
src/
  admin/                 # admin panel (layout, pages, API helpers)
  components/            # public sections, Sidebar, Reveal
  context/               # ContentProvider (public content) + AuthProvider
  lib/                   # api client, types, content mapper, icons
  constants/             # static fallback content
tests/                   # Vitest suites
```

## API overview

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/public/content` | Public site content (pages, nav, collections, projects) |
| `POST` | `/api/public/contact` | Store a contact message |
| `POST` | `/api/auth/login` | Sign in, returns `admin` + `csrfToken` |
| `GET` | `/api/auth/me` | Current session |
| `GET` | `/api/admin/dashboard/stats` | Dashboard statistics |
| `GET/POST/PUT/DELETE` | `/api/admin/projects` | Project management |
| `GET/POST/DELETE` | `/api/admin/media` | Media library |
| `GET/PATCH/DELETE` | `/api/admin/messages` | Contact inbox |
| `GET/PUT` | `/api/admin/content/*` | Pages, settings and collections |
| `GET` | `/api/admin/audit` | Audit log (admin only) |

All `/api/admin/*` routes require an authenticated session; unsafe methods also
require the `x-csrf-token` header returned at login.

## Testing

```bash
npm test
```

The suite runs against an in-memory PGlite database and covers authentication,
project CRUD/CSRF and media upload/validation.

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import it in Vercel. Vercel auto-detects Vite; keep the defaults.
3. Add environment variables: `DATABASE_URL`, `APP_URL`, `STORAGE_DRIVER=vercel-blob`,
   `BLOB_READ_WRITE_TOKEN`, and session/rate-limit overrides as needed.
4. Deploy. `vercel.json` configures the SPA rewrite (all non-`/api` routes →
   `index.html`) and the serverless function.

After the first deploy, run `npm run admin:create` against the production database
(or insert an admin row directly) to create your sign-in account.
