/**
 * Local storage file serving (development / fallback).
 *
 * Uploaded objects use content-addressed paths and are immutable.
 */

import { Hono } from 'hono';
import { env } from '../env';
import { localStorage } from '../storage/local';
import type { AppEnv } from '../types';

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

const contentTypeFor = (key: string): string => {
  const extension = key.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPES[extension] ?? 'application/octet-stream';
};

export const filesRoutes = new Hono<AppEnv>();

filesRoutes.get('/:key{.+}', async (c) => {
  if (env.storage.driver !== 'local') {
    return c.notFound();
  }

  const key = c.req.param('key');

  try {
    const buffer = await localStorage.read!(key);
    return c.body(new Uint8Array(buffer), 200, {
      'Content-Type': contentTypeFor(key),
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
  } catch {
    return c.notFound();
  }
});
