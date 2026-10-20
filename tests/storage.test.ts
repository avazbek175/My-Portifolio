import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const putMock = vi.fn();
const getMock = vi.fn();
const delMock = vi.fn();

vi.mock('@vercel/blob', () => ({
  put: (...args: unknown[]) => putMock(...args),
  get: (...args: unknown[]) => getMock(...args),
  del: (...args: unknown[]) => delMock(...args),
}));

const importAdapter = async (access?: string) => {
  vi.resetModules();
  if (access === undefined) {
    delete process.env.BLOB_ACCESS;
  } else {
    process.env.BLOB_ACCESS = access;
  }
  process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_test';
  const { blobStorage } = await import('../server/storage/vercel-blob');
  return blobStorage;
};

describe('vercel-blob storage adapter', () => {
  beforeEach(() => {
    putMock.mockReset();
    getMock.mockReset();
    delMock.mockReset();
  });

  afterEach(() => {
    delete process.env.BLOB_ACCESS;
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it('defaults to private access and returns a proxy URL', async () => {
    putMock.mockResolvedValue({ url: 'https://store.public.blob.vercel-storage.com/x.png' });
    const storage = await importAdapter();

    const result = await storage.put({
      key: 'media/2026/01/x.png',
      body: Buffer.from('data'),
      contentType: 'image/png',
    });

    expect(putMock).toHaveBeenCalledWith(
      'media/2026/01/x.png',
      expect.any(Buffer),
      expect.objectContaining({ access: 'private', addRandomSuffix: false }),
    );
    expect(result.url).toBe('/api/files/media/2026/01/x.png');
  });

  it('uses the absolute blob URL when the store is public', async () => {
    putMock.mockResolvedValue({ url: 'https://store.public.blob.vercel-storage.com/x.png' });
    const storage = await importAdapter('public');

    const result = await storage.put({
      key: 'media/2026/01/x.png',
      body: Buffer.from('data'),
      contentType: 'image/png',
    });

    expect(putMock).toHaveBeenCalledWith(
      'media/2026/01/x.png',
      expect.any(Buffer),
      expect.objectContaining({ access: 'public' }),
    );
    expect(result.url).toBe('https://store.public.blob.vercel-storage.com/x.png');
  });

  it('wraps SDK failures in a StorageError', async () => {
    putMock.mockRejectedValue(
      new Error('Cannot use public access on a private store'),
    );
    const storage = await importAdapter();

    await expect(
      storage.put({
        key: 'media/2026/01/x.png',
        body: Buffer.from('data'),
        contentType: 'image/png',
      }),
    ).rejects.toMatchObject({ name: 'StorageError' });
  });

  it('reads a private blob back as a buffer', async () => {
    getMock.mockResolvedValue({
      statusCode: 200,
      stream: new Response(new Uint8Array([1, 2, 3])).body,
      headers: new Headers(),
      blob: { contentType: 'image/png', size: 3 },
    });
    const storage = await importAdapter();

    const buffer = await storage.read!('media/2026/01/x.png');

    expect(getMock).toHaveBeenCalledWith(
      'media/2026/01/x.png',
      expect.objectContaining({ access: 'private' }),
    );
    expect([...buffer]).toEqual([1, 2, 3]);
  });
});
