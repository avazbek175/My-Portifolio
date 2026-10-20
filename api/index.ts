/**
 * Vercel serverless entry point.
 *
 * Uses the Node.js runtime (required for pg, sharp and Argon2). Vercel invokes
 * the default export as a Node request listener created by `@hono/node-server`.
 */

import { getRequestListener } from '@hono/node-server';
import { createApp } from '../server/app';

const app = createApp();

export default getRequestListener(app.fetch);
