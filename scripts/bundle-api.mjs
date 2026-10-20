/**
 * Bundle the Vercel serverless function.
 *
 * Vercel's build transpiles `api/index.ts` in isolation, which leaves the
 * `../server/*` imports unresolved at runtime (`ERR_MODULE_NOT_FOUND`).
 * Here we pre-bundle the whole API into a single self-contained ESM file so
 * every local module is inlined, while native/Node packages stay external and
 * are installed by the platform.
 */

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

await build({
  entryPoints: [path.join(root, 'server/vercel-entry.ts')],
  outfile: path.join(root, 'api/index.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  sourcemap: false,
  minify: false,
  logLevel: 'info',
  // Keep runtime dependencies external: Vercel installs them from package.json.
  // Everything under `server/` is bundled into the output.
  external: [
    'pg',
    'sharp',
    '@node-rs/argon2',
    '@electric-sql/pglite',
    '@vercel/blob',
    '@hono/node-server',
    'hono',
  ],
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      'const require = __createRequire(import.meta.url);',
    ].join('\n'),
  },
});

console.log('[bundle-api] built api/index.js');
