/**
 * Password hashing with Argon2id.
 */

import { Algorithm, hash, verify } from '@node-rs/argon2';
import { z } from 'zod';

const HASH_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export const hashPassword = (password: string): Promise<string> =>
  hash(password, HASH_OPTIONS);

export const verifyPassword = (digest: string, password: string): Promise<boolean> =>
  verify(digest, password, { algorithm: Algorithm.Argon2id }).catch(() => false);

export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'));
