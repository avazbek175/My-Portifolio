import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    env: {
      NODE_ENV: 'test',
      PGLITE_DIR: ':memory:',
    },
    pool: 'forks',
    fileParallelism: false,
    testTimeout: 20000,
  },
});
