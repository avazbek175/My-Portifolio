/**
 * Local filesystem storage adapter (development only).
 *
 * Files are served by the `/api/files/*` route in development.
 */

import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { env } from '../env';
import type { StorageAdapter } from './index';

const baseDir = resolve(process.cwd(), env.storage.localDir);

/** Resolve a storage key to an absolute path, preventing traversal. */
export const resolveLocalPath = (key: string): string => {
  const safeKey = normalize(key).replace(/^([.]{2}[/\\])+/, '');
  const full = resolve(baseDir, safeKey);

  if (full !== baseDir && !full.startsWith(baseDir + sep)) {
    throw new Error('Invalid storage key');
  }

  return full;
};

export const localStorage: StorageAdapter = {
  name: 'local',

  async put({ key, body }) {
    const full = resolveLocalPath(key);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, body);
    return { key, url: `${env.storage.publicPrefix}/${key}` };
  },

  async delete(key) {
    const full = resolveLocalPath(key);
    await rm(full, { force: true });
  },

  publicUrl(key) {
    return `${env.storage.publicPrefix}/${key}`;
  },

  async read(key) {
    return readFile(resolveLocalPath(key));
  },
};

export const localFilePath = (key: string): string => join(baseDir, key);
