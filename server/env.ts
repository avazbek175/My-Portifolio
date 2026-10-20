/**
 * Environment configuration for the CMS backend.
 * Fails closed in production when required configuration is missing.
 */

export type StorageDriver = 'local' | 'vercel-blob';

const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim() || '';

const storageDriver: 'local' | 'vercel-blob' =
  (process.env.STORAGE_DRIVER as 'local' | 'vercel-blob' | undefined) ??
  (blobToken ? 'vercel-blob' : 'local');

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  /** Postgres connection string. When absent, an embedded PGlite database is used. */
  databaseUrl: process.env.DATABASE_URL?.trim() || undefined,
  /** Directory used by the embedded PGlite database (development). */
  pgliteDir:
    process.env.PGLITE_DIR?.trim() || '.data/pglite',

  appUrl: process.env.APP_URL?.trim() || 'http://localhost:5173',

  storage: {
    driver: storageDriver,
    blobToken: blobToken || undefined,
    localDir: process.env.LOCAL_STORAGE_DIR?.trim() || '.data/uploads',
    publicPrefix: process.env.LOCAL_STORAGE_PUBLIC_PREFIX?.trim() || '/api/files',
  },

  uploads: {
    maxFileSizeBytes: Number(process.env.UPLOAD_MAX_FILE_SIZE ?? 8 * 1024 * 1024),
    maxFilesPerRequest: Number(process.env.UPLOAD_MAX_FILES ?? 8),
    maxTotalBytes: Number(process.env.UPLOAD_MAX_TOTAL_SIZE ?? 32 * 1024 * 1024),
    maxDimension: Number(process.env.UPLOAD_MAX_DIMENSION ?? 8000),
    allowedFormats: ['jpeg', 'png', 'webp', 'avif'] as const,
  },

  session: {
    /** Idle timeout in seconds. */
    idleTtlSeconds: Number(process.env.SESSION_IDLE_TTL ?? 60 * 60 * 24),
    /** Absolute timeout in seconds. */
    absoluteTtlSeconds: Number(process.env.SESSION_ABSOLUTE_TTL ?? 60 * 60 * 24 * 30),
  },

  rateLimit: {
    loginWindowSeconds: Number(process.env.LOGIN_RATE_WINDOW ?? 15 * 60),
    loginMaxAttempts: Number(process.env.LOGIN_RATE_MAX ?? 8),
    contactWindowSeconds: Number(process.env.CONTACT_RATE_WINDOW ?? 10 * 60),
    contactMaxRequests: Number(process.env.CONTACT_RATE_MAX ?? 5),
    uploadWindowSeconds: Number(process.env.UPLOAD_RATE_WINDOW ?? 60),
    uploadMaxRequests: Number(process.env.UPLOAD_RATE_MAX ?? 30),
  },
} as const;

/** Fail closed on missing production configuration. */
export const validateProductionEnv = () => {
  if (!env.isProduction) return;

  const missing: string[] = [];
  if (!env.databaseUrl) missing.push('DATABASE_URL');
  if (env.storage.driver === 'vercel-blob' && !env.storage.blobToken) {
    missing.push('BLOB_READ_WRITE_TOKEN');
  }
  if (env.storage.driver === 'local') missing.push('STORAGE_DRIVER (local storage is not persistent in production)');

  if (missing.length > 0) {
    throw new Error(
      `Invalid production configuration. Missing: ${missing.join(', ')}`,
    );
  }
};

export type Env = typeof env;
