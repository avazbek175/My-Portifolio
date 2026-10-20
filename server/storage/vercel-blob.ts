/**
 * Vercel Blob storage adapter (production).
 *
 * The blob read/write token is read from the server environment only and is
 * never exposed to the browser.
 */

import { del, put } from '@vercel/blob';
import { env } from '../env';
import type { StorageAdapter } from './index';

export const blobStorage: StorageAdapter = {
  name: 'vercel-blob',

  async put({ key, body, contentType }) {
    const result = await put(key, body, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      token: env.storage.blobToken,
    });
    return { key, url: result.url };
  },

  async delete(key) {
    await del(key, { token: env.storage.blobToken });
  },

  publicUrl(key) {
    // Blob URLs are absolute and already stored in the database; this is a
    // best-effort fallback only.
    return key;
  },
};
