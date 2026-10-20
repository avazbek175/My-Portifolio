/**
 * Storage adapter selection.
 */

import { env } from '../env';
import { localStorage } from './local';
import { blobStorage } from './vercel-blob';

export type PutInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

/** Raised when the configured object store rejects or fails an operation. */
export class StorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StorageError';
  }
}

export interface StorageAdapter {
  name: 'local' | 'vercel-blob';
  put(input: PutInput): Promise<{ key: string; url: string }>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
  read?(key: string): Promise<Buffer>;
}

export const getStorage = (): StorageAdapter =>
  env.storage.driver === 'vercel-blob' ? blobStorage : localStorage;

/** Build a safe, collision-resistant storage key. */
export const buildStorageKey = (extension: string): string => {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const id = globalThis.crypto.randomUUID();
  return `media/${yyyy}/${mm}/${id}.${extension}`;
};
