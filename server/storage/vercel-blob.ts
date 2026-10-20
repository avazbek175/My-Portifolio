/**
 * Vercel Blob storage adapter (production).
 *
 * The blob read/write token is read from the server environment only and is
 * never exposed to the browser.
 */

import { del, get, put } from '@vercel/blob';
import { env } from '../env';
import { StorageError, type StorageAdapter } from './index';

/**
 * Blob store access mode. Private stores reject `access: 'public'` at upload
 * time, so the mode must be configurable to match how the store was created.
 * Defaults to `private`, which is served back to the browser through the
 * `/api/files/*` proxy route.
 */
const blobAccess: 'public' | 'private' =
  process.env.BLOB_ACCESS?.trim() === 'public' ? 'public' : 'private';

export const blobStorage: StorageAdapter = {
  name: 'vercel-blob',

  async put({ key, body, contentType }) {
    let result;
    try {
      result = await put(key, body, {
        access: blobAccess,
        contentType,
        addRandomSuffix: false,
        token: env.storage.blobToken,
      });
    } catch (error) {
      throw new StorageError(
        `Failed to store object: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
    // Private blobs cannot be fetched directly from the browser, so the public
    // site consumes them through our own proxy route. Public stores expose an
    // absolute URL that can be used as-is.
    const url = blobAccess === 'public' ? result.url : `${env.storage.publicPrefix}/${key}`;
    return { key, url };
  },

  async delete(key) {
    try {
      await del(key, { token: env.storage.blobToken });
    } catch (error) {
      throw new StorageError(
        `Failed to delete object: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  },

  publicUrl(key) {
    // Blob URLs are absolute and already stored in the database; this is a
    // best-effort fallback only.
    return key;
  },

  async read(key) {
    const result = await get(key, {
      access: blobAccess,
      token: env.storage.blobToken,
    });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error('Blob not found');
    }
    const response = new Response(result.stream);
    return Buffer.from(await response.arrayBuffer());
  },
};
