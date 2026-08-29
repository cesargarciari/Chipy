/**
 * `@chipy/shared` — the HTTP contract between `@chipy/web` and `@chipy/api`.
 *
 * Zod schemas are the single source of truth; the `*Dto` / `*Request` /
 * `*Response` types are inferred from them so the two apps cannot drift.
 */

export * from './career-summary.js';
export * from './api.js';
