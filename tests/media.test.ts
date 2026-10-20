import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { processImage } from '../server/services/media.service';

const png = async (width: number, height: number): Promise<Buffer> =>
  sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 20, g: 120, b: 80, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

describe('media.processImage', () => {
  it('accepts a valid png and preserves dimensions', async () => {
    const result = await processImage({ buffer: await png(32, 24) });
    expect(result.format).toBe('png');
    expect(result.mimeType).toBe('image/png');
    expect(result.width).toBe(32);
    expect(result.height).toBe(24);
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it('rejects files that are not images', async () => {
    await expect(
      processImage({ buffer: Buffer.from('not an image at all') }),
    ).rejects.toThrow(/Unsupported|corrupt/i);
  });

  it('rejects images exceeding the maximum dimension', async () => {
    await expect(
      processImage({ buffer: await png(120, 120), maxDimension: 64 }),
    ).rejects.toThrow(/dimensions/i);
  });

  it('rejects images exceeding the maximum size', async () => {
    await expect(
      processImage({ buffer: await png(64, 64), maxBytes: 10 }),
    ).rejects.toThrow(/maximum size/i);
  });

  it('rejects formats outside the allow list', async () => {
    await expect(
      processImage({ buffer: await png(16, 16), allowedFormats: ['jpeg'] }),
    ).rejects.toThrow(/Unsupported image format/i);
  });
});
