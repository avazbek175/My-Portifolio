/**
 * Idempotent default-content seeder.
 *
 * Runs once per database. A sentinel row in `settings` marks completion so it
 * never re-creates content that an administrator has deliberately removed.
 */

import { randomUUID } from 'node:crypto';
import { json, type Db } from '../db';
import {
  defaultExperiences,
  defaultNavLinks,
  defaultPages,
  defaultProjects,
  defaultServices,
  defaultSettings,
  defaultSkills,
} from '../data/defaults';

export const seedDefaults = async (db: Db): Promise<void> => {
  const marker = await db.query<{ value: unknown }>(
    "select value from settings where key = 'seeded'",
  );

  if (marker.length > 0) return;

  await db.transaction(async (tx) => {
    for (const [key, value] of Object.entries(defaultSettings)) {
      await tx.query(
        `insert into settings (key, value) values ($1, $2::jsonb)
         on conflict (key) do nothing`,
        [key, json(value)],
      );
    }

    for (const page of defaultPages) {
      await tx.query(
        `insert into pages (id, title, content, seo_title, seo_description)
         values ($1, $2, $3::jsonb, $4, $5)
         on conflict (id) do nothing`,
        [page.id, page.title, json(page.content), page.seoTitle, page.seoDescription],
      );
    }

    for (const link of defaultNavLinks) {
      await tx.query(
        `insert into nav_links (id, label, href, location, external, sort_order, visible)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          randomUUID(),
          link.label,
          link.href,
          link.location,
          link.external,
          link.sortOrder,
          link.visible,
        ],
      );
    }

    for (const skill of defaultSkills) {
      await tx.query(
        `insert into skills (id, name, category, icon, proficiency, sort_order, visible)
         values ($1, $2, $3, $4, $5, $6, true)`,
        [
          randomUUID(),
          skill.name,
          skill.category,
          skill.icon || null,
          skill.proficiency,
          skill.sortOrder,
        ],
      );
    }

    for (const item of defaultExperiences) {
      await tx.query(
        `insert into experiences (id, kind, company, position, description, period, link, sort_order, visible)
         values ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
        [
          randomUUID(),
          item.kind,
          item.company,
          item.position,
          item.description,
          item.period,
          item.link,
          item.sortOrder,
        ],
      );
    }

    for (const service of defaultServices) {
      await tx.query(
        `insert into services (id, title, description, icon, price, sort_order, visible)
         values ($1, $2, $3, $4, $5, $6, true)`,
        [
          randomUUID(),
          service.title,
          service.description,
          service.icon,
          service.price,
          service.sortOrder,
        ],
      );
    }

    for (const project of defaultProjects) {
      await tx.query(
        `insert into projects
           (id, slug, title, summary, description, cover_url, gallery, category, tags,
            repo_url, live_url, featured, status, sort_order, published_at)
         values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9::jsonb,$10,$11,$12,$13,$14,
            case when $13 = 'published' then now() else null end)`,
        [
          randomUUID(),
          project.slug,
          project.title,
          project.summary,
          project.description,
          project.coverUrl,
          json(project.gallery),
          project.category,
          json(project.tags),
          project.repoUrl,
          project.liveUrl,
          project.featured,
          project.status,
          project.sortOrder,
        ],
      );
    }

    await tx.query(
      `insert into settings (key, value) values ('seeded', 'true'::jsonb)
       on conflict (key) do nothing`,
    );
  });
};
