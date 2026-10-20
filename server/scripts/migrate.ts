/**
 * CLI: apply migrations and seed default content.
 *
 * Usage: npm run db:migrate
 */

import { ensureDatabase, resetDb } from '../db';
import { seedDefaults } from '../services/seed.service';

const run = async () => {
  await ensureDatabase(async (db) => {
    await seedDefaults(db);
  });
  console.log('Database is up to date.');
};

run()
  .then(async () => {
    await resetDb();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(`[db:migrate] ${error instanceof Error ? error.message : error}`);
    try {
      await resetDb();
    } catch {
      // ignore
    }
    process.exit(1);
  });
