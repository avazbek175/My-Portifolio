/**
 * Shared server types for Hono context variables.
 */

import type { Admin, AuthenticatedSession } from './services/auth.service';

export type AppVariables = {
  session: AuthenticatedSession | null;
  admin: Admin | null;
  requestId: string;
};

export type AppEnv = {
  Variables: AppVariables;
};
