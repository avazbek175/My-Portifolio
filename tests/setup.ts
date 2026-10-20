import { afterAll, beforeEach } from 'vitest';
import { ensureDatabase, resetDb } from '../server/db';
import { seedDefaults } from '../server/services/seed.service';

beforeEach(async () => {
  await resetDb();
  await ensureDatabase(async (db) => {
    await seedDefaults(db);
  });
});

afterAll(async () => {
  await resetDb();
});
