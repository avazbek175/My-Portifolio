/**
 * Local development API server.
 */

import { serve } from '@hono/node-server';
import { createApp } from './app';
import { env } from './env';

const port = Number(process.env.API_PORT ?? process.env.PORT ?? 8787);

const app = createApp();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[api] listening on http://localhost:${info.port} (${env.nodeEnv})`);
});
