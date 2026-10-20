/**
 * Media library service: server-side image validation, storage and metadata.
 */

import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type { AvifOptions, FormatEnum, JpegOptions, PngOptions, Sharp, WebpOptions } from 'sharp';
import { getDb, json } from '../db';
import { env } from '../env';
import { AppError, badRequest } from '../lib/errors';
import { buildStorageKey, getStorage, StorageError } from '../storage';

export type Media = {
  id: string;
  url: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  format: string | null;
  createdAt: string;
};

type MediaRow = {
  id: string;
  url: string;
  storage_key: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  format: string | null;
  created_at: string;
};

const mapMedia = (row: MediaRow): Media => ({
  id: row.id,
  url: row.url,
  storageKey: row.storage_key,
  filename: row.filename,
  mimeType: row.mime_type,
  sizeBytes: row.size_bytes,
  width: row.width,
  height: row.height,
  format: row.format,
  createdAt: row.created_at,
});

const MIME_BY_FORMAT: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

export type ProcessedImage = {
  buffer: Buffer;
  format: string;
  mimeType: string;
  width: number;
  height: number;
};

/**
 * Validate and normalise an uploaded image.
 *
 * Validation is based on the decoded image, not the client filename or MIME
 * type. Re-encoding strips EXIF metadata (including GPS location).
 */
export const processImage = async (input: {
  buffer: Buffer;
  maxBytes?: number;
  maxDimension?: number;
  allowedFormats?: readonly string[];
}): Promise<ProcessedImage> => {
  const maxBytes = input.maxBytes ?? env.uploads.maxFileSizeBytes;
  const maxDimension = input.maxDimension ?? env.uploads.maxDimension;
  const allowed = input.allowedFormats ?? env.uploads.allowedFormats;

  if (input.buffer.length === 0) throw badRequest('Empty file');
  if (input.buffer.length > maxBytes) {
    throw new AppError(413, 'file_too_large', 'File exceeds the maximum size');
  }

  let pipeline: Sharp;
  try {
    pipeline = sharp(input.buffer, { failOn: 'error' });
  } catch {
    throw badRequest('Unsupported or corrupt image');
  }

  const metadata = await pipeline.metadata().catch(() => {
    throw badRequest('Unsupported or corrupt image');
  });

  const format = metadata.format as string | undefined;
  if (!format || !(allowed as readonly string[]).includes(format)) {
    throw badRequest(`Unsupported image format. Allowed: ${allowed.join(', ')}`);
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (width === 0 || height === 0) throw badRequest('Invalid image dimensions');
  if (width > maxDimension || height > maxDimension) {
    throw badRequest(`Image dimensions must not exceed ${maxDimension}px`);
  }

  const options: PngOptions | AvifOptions | JpegOptions | WebpOptions =
    format === 'png'
      ? { compressionLevel: 9 }
      : format === 'avif'
        ? { quality: 55 }
        : { quality: 82, mozjpeg: format === 'jpeg' };

  // `rotate()` with no argument applies EXIF orientation, then output drops
  // all metadata because `withMetadata()` is never called.
  const output = await sharp(input.buffer)
    .rotate()
    .toFormat(format as keyof FormatEnum, options)
    .toBuffer();

  return {
    buffer: output,
    format,
    mimeType: MIME_BY_FORMAT[format] ?? `image/${format}`,
    width,
    height,
  };
};

export const storeImage = async (input: {
  file: { buffer: Buffer; originalName: string };
}): Promise<Media> => {
  const processed = await processImage({ buffer: input.file.buffer });
  const storage = getStorage();
  const key = buildStorageKey(processed.format === 'jpeg' ? 'jpg' : processed.format);

  const { url } = await storage.put({
    key,
    body: processed.buffer,
    contentType: processed.mimeType,
  }).catch((error: unknown) => {
    if (error instanceof StorageError) {
      throw new AppError(502, 'storage_error', 'The image could not be stored');
    }
    throw error;
  });

  const db = await getDb();
  const id = randomUUID();
  const safeName = input.file.originalName.replace(/[^\w.-]+/g, '_').slice(0, 120) || 'image';

  const rows = await db.query<MediaRow>(
    `insert into media
       (id, storage_key, url, filename, mime_type, size_bytes, width, height, format)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     returning *`,
    [
      id,
      key,
      url,
      safeName,
      processed.mimeType,
      processed.buffer.length,
      processed.width,
      processed.height,
      processed.format,
    ],
  );

  return mapMedia(rows[0]!);
};

export const listMedia = async (options: {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: 'newest' | 'oldest';
}): Promise<{ items: Media[]; total: number; page: number; pageSize: number }> => {
  const db = await getDb();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 24));
  const order = options.sort === 'oldest' ? 'asc' : 'desc';

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (options.search) {
    params.push(`%${options.search.toLowerCase()}%`);
    conditions.push(`lower(filename) like $${params.length}`);
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

  const countRows = await db.query<{ count: string }>(
    `select count(*)::text as count from media ${where}`,
    params,
  );

  params.push(pageSize);
  const limitIdx = params.length;
  params.push((page - 1) * pageSize);
  const offsetIdx = params.length;

  const rows = await db.query<MediaRow>(
    `select * from media ${where} order by created_at ${order}
     limit $${limitIdx} offset $${offsetIdx}`,
    params,
  );

  return {
    items: rows.map(mapMedia),
    total: Number(countRows[0]?.count ?? 0),
    page,
    pageSize,
  };
};

export const getMedia = async (id: string): Promise<Media | null> => {
  const db = await getDb();
  const rows = await db.query<MediaRow>('select * from media where id = $1', [id]);
  return rows[0] ? mapMedia(rows[0]) : null;
};

/** Check whether a media URL is referenced by any content. */
export const isMediaReferenced = async (url: string): Promise<boolean> => {
  const db = await getDb();
  const rows = await db.query<{ count: string }>(
    `select (
       (select count(*) from projects where cover_url = $1)
       + (select count(*) from skills where icon = $1)
       + (select count(*) from services where icon = $1)
       + (select count(*) from projects where gallery @> $2::jsonb)
     )::text as count`,
    [url, json([url])],
  );
  return Number(rows[0]?.count ?? 0) > 0;
};

export const deleteMedia = async (id: string): Promise<void> => {
  const media = await getMedia(id);
  if (!media) throw new AppError(404, 'not_found', 'Media not found');

  if (await isMediaReferenced(media.url)) {
    throw new AppError(
      409,
      'media_in_use',
      'This image is used by existing content and cannot be deleted.',
    );
  }

  // Delete the object first; only remove metadata if storage deletion succeeds.
  await getStorage().delete(media.storageKey).catch((error: unknown) => {
    if (error instanceof StorageError) {
      throw new AppError(502, 'storage_error', 'The image could not be deleted');
    }
    throw error;
  });

  const db = await getDb();
  await db.query('delete from media where id = $1', [id]);
};
