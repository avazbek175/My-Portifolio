/**
 * Small cryptographic helpers built on Node's crypto module.
 */

import {
  randomBytes,
  randomUUID,
  createHash,
  timingSafeEqual,
} from 'node:crypto';

export const newId = (): string => randomUUID();

export const randomToken = (bytes = 32): string =>
  randomBytes(bytes).toString('base64url');

export const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

/** Constant-time string comparison that never throws on length mismatch. */
export const safeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to keep timing consistent, then fail.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
};
