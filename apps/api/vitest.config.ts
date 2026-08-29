import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Route tests hit DynamoDB Local; keep them serial and give them room.
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
