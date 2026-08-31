import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Population and fast-check property tests replay hundreds of full careers in
    // one `it`. That runs in a few seconds on a multi-core dev box but tips past
    // the 5s default on a 2-vCPU CI runner, so give the whole suite real headroom.
    testTimeout: 60_000,
    hookTimeout: 60_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/types.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
