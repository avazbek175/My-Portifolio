/**
 * CLI: provision an administrator account.
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='S3cure!Pass' \
 *     npm run admin:create -- "Your Name"
 */

import { ensureDatabase, resetDb } from '../db';
import { emailSchema, passwordSchema } from '../services/password';
import { createAdmin, findAdminByEmail } from '../services/auth.service';
import { seedDefaults } from '../services/seed.service';

const run = async () => {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const name = (process.env.ADMIN_NAME ?? process.argv[2] ?? 'Administrator').trim();

  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    throw new Error('ADMIN_EMAIL must be set to a valid email address');
  }

  const parsedPassword = passwordSchema.safeParse(password);
  if (!parsedPassword.success) {
    throw new Error(parsedPassword.error.issues[0]?.message ?? 'Invalid ADMIN_PASSWORD');
  }

  await ensureDatabase(async (db) => {
    await seedDefaults(db);
  });

  if (await findAdminByEmail(parsedEmail.data)) {
    throw new Error('An administrator with this email already exists');
  }

  const admin = await createAdmin({
    email: parsedEmail.data,
    password: parsedPassword.data,
    name: name || 'Administrator',
  });

  console.log(`Created administrator: ${admin.email}`);
};

run()
  .then(async () => {
    await resetDb();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(`[admin:create] ${error instanceof Error ? error.message : error}`);
    try {
      await resetDb();
    } catch {
      // ignore
    }
    process.exit(1);
  });
