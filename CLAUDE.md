# Chipy agent guide

NBA career simulator. pnpm + Turborepo monorepo, TypeScript strict ESM, Node 22.
Read `docs/architecture.md` and `docs/adr/` before non-trivial changes.

## Layout

| Package                             | Role                                               | Rules                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/engine` (`@chipy/engine`) | Pure deterministic simulation                      | **No IO, no DOM, no filesystem, no clock.** Randomness only via the seeded `rng` (`mulberry32`). Never `Date.now()` / `Math.random()`. |
| `packages/shared` (`@chipy/shared`) | The HTTP contract: zod schemas + inferred DTOs     | Contract changes start here. Both apps depend on it.                                                                                   |
| `apps/api` (`@chipy/api`)           | Fastify 5 + DynamoDB single-table + Lambda handler | All env access goes through `src/config.ts` (zod-validated, fails loud). Log with `pino`, never `console`.                             |
| `apps/web` (`@chipy/web`)           | Vite + React 19 SPA                                | Runs the engine client-side for offline play; the API only backs save/share/leaderboard, and each fails soft.                          |

## Commands (run from repo root)

- `pnpm dev`: watch-build packages, API on :3000, web on :5173
- `pnpm typecheck`: `tsc --noEmit` across the workspace (also typechecks tests)
- `pnpm lint`: ESLint flat config
- `pnpm format` / `pnpm format:check`: Prettier
- `pnpm test`: Vitest (unit + property + contract). **API tests need DynamoDB Local:**
  run `docker compose up -d dynamodb-local` first, or set `DYNAMODB_ENDPOINT=http://localhost:8000`
- `pnpm e2e`: Playwright, plays a full career with no backend
- `pnpm db:setup`: create the local single table

## Definition of done

`pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` all green (same order as CI).
Touching the engine also requires `pnpm --filter @chipy/engine test:coverage` (thresholds 80/80/70/80).
Touching the career loop or a UI flow also requires `pnpm e2e`.

## Conventions

- **Strict ESM.** `engine` and `api` use `NodeNext`, so relative imports need the `.js`
  extension (`./rng.js`). `web` uses the bundler resolver (no extension).
- **Type-only imports inline**: `import { foo, type Bar } from '...'` (enforced by ESLint).
- **No escape hatches.** No `any`, no `@ts-ignore`, no `eslint-disable`. The repo has
  zero of each. If you reach for one, redesign or ask.
- **Validate at boundaries** with zod (HTTP bodies, env, engine input). Never trust the
  client: the API replays the engine from stored inputs and treats _its_ output as truth.
- **Engine determinism is a hard invariant.** Replaying a career from its recorded
  `choices` must reproduce a byte-identical `CareerSummary`. Node resolution consumes no
  main-stream RNG. Tests assert this, so don't weaken them.
- **Bump `ENGINE_VERSION`** (`packages/engine/src/types.ts`) when a rules change could make
  a persisted `choices` array un-replayable. The web store and saved summaries key off it.
- **Adding season content** = append a `Scenario` object to
  `packages/engine/src/season/scenarios/<theme>.ts`. No code wiring; `buildScenarioIndex`
  validates it in tests. Same for perks (`src/data/perks.ts`) and mid-season forks.
- **New engine exports** must be re-exported from `packages/engine/src/index.ts` (the only
  entrypoint).
- **Significant decisions get an ADR**: `docs/adr/`, Nygard format, numbered, append-only,
  supersede rather than edit.
- **Commits**: Conventional Commits (`feat(engine): ...`). Branch off `main`.
  Don't commit or push unless asked.

## Writing

- **No em dashes** anywhere: prose, code comments, docs, ADRs, commit messages, PR text.
  Use a colon, a comma, parentheses, or two sentences instead.

## Gotchas

- `apps/web` reads the repo-root `.env` (`VITE_` vars), not a local one. See `vite.config.ts`.
- DynamoDB access patterns and key layout live in `apps/api/src/db/keys.ts`. No scans on
  the hot path.
- `pnpm` is pinned (`packageManager: pnpm@9.15.4`); use `corepack enable`.
