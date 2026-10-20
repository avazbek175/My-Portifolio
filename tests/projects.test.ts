import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '../server/db';
import {
  createProject,
  getProjectById,
  listProjects,
  listPublishedProjects,
  updateProjectStatus,
} from '../server/services/projects.service';

const baseInput = {
  title: 'My Project',
  summary: 'A summary',
  description: 'A description',
  gallery: [],
  category: 'Web',
  tags: ['react'],
  coverUrl: null,
  repoUrl: null,
  liveUrl: null,
  featured: false,
  status: 'draft' as const,
};

describe('projects service', () => {
  beforeEach(async () => {
    const db = await getDb();
    await db.query('delete from projects');
  });

  it('creates a project with a generated unique slug', async () => {
    const first = await createProject({ ...baseInput });
    const second = await createProject({ ...baseInput });

    expect(first.slug).toBe('my-project');
    expect(second.slug).toBe('my-project-2');
  });

  it('keeps drafts out of the published list', async () => {
    const project = await createProject({ ...baseInput });
    expect(await listPublishedProjects()).toHaveLength(0);

    await updateProjectStatus(project.id, 'published');
    const published = await listPublishedProjects();
    expect(published.map((item) => item.id)).toContain(project.id);
  });

  it('sets publishedAt when publishing', async () => {
    const project = await createProject({ ...baseInput });
    const published = await updateProjectStatus(project.id, 'published');
    expect(published.publishedAt).not.toBeNull();

    const unpublished = await updateProjectStatus(project.id, 'draft');
    expect(unpublished.publishedAt).toBeNull();
  });

  it('filters by status and paginates', async () => {
    for (let index = 0; index < 5; index += 1) {
      await createProject({ ...baseInput, title: `Project ${index}`, status: 'published' });
    }

    const page = await listProjects({ status: 'published', page: 1, pageSize: 2 });
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(5);
    expect(page.pageSize).toBe(2);

    const one = page.items[0]!;
    expect((await getProjectById(one.id))?.id).toBe(one.id);
  });
});
