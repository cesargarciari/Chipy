# Architecture

## Shape

```
┌───────────────┐     HTTPS      ┌──────────────────┐     AWS SDK     ┌───────────────┐
│  Web (SPA)    │ ─────────────► │  API (Fastify)   │ ──────────────► │  DynamoDB     │
│  Vite + React │   /api/*       │  Node 22         │   single table  │  on-demand    │
│  @chipy/engine│ ◄───────────── │  @chipy/engine   │ ◄────────────── │  PK/SK + gsi1 │
└───────────────┘   JSON         └──────────────────┘                 └───────────────┘
        │                                 │
        └────────────── @chipy/engine ────┘   (same simulation on both sides)
                        @chipy/shared         (one zod contract on both sides)
```

- **Local (Milestone 1):** `docker compose` runs the API, the web app, and
  DynamoDB Local. `pnpm dev` runs API + web with hot reload against DynamoDB Local.
- **AWS (Milestone 2):** SPA on S3 + CloudFront; API on Lambda behind an API
  Gateway HTTP API; the real DynamoDB table. CloudFront routes `/api/*` to the
  API origin so the browser stays same-origin.

## Packages

| Package         | Responsibility                                                                                                                                                                   | Depends on         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `@chipy/engine` | Pure simulation: RNG, 8 ratings, 20 position-locked archetypes, 30 teams, prologue, draft, the season loop (growth / events / awards / playoffs / international), legacy. No IO. | —                  |
| `@chipy/shared` | The HTTP contract: zod schemas + inferred DTOs.                                                                                                                                  | `engine`           |
| `@chipy/api`    | Fastify server, DynamoDB single-table repo, Lambda handler.                                                                                                                      | `engine`, `shared` |
| `@chipy/web`    | React SPA. Runs the engine locally for instant play; calls the API to persist and share.                                                                                         | `engine`, `shared` |

## The career loop

`runCareer({ seed, profile, choices })` walks: **prologue** (2 nodes) →
**draft** (engine derives a hidden `talent` ceiling from draft stock) →
**landing spot** (1 of 3 team offers) → **season loop** (one decision per
season; the engine then rolls an in-season event, grows ratings on an
age curve scaled by archetype weights and `talent²`, simulates the season and
playoffs, resolves awards, and — on odd summers — an Olympic / World Cup medal)
→ **legacy** (career totals, trophy tally, a 0-1000+ legacy score → tier +
grade + Hall-of-Fame roll).

`choices` is variable-length. When it runs out, `runCareer` returns
`status: 'awaiting_choice'` with the next node to render; when the career ends
(retirement or a forced end), it returns `status: 'complete'` with the full
`CareerSummary`. The web drives this loop entirely client-side.

## Two ideas doing the heavy lifting

### 1. The engine is deterministic and runs on both sides

`runCareer` is a pure function of `(seed, profile, choices)`. The browser runs it
for instant, offline play. The API runs the **same** function from the same
stored inputs and treats its output as the source of truth — a tampered or stale
client cannot write bogus stats, and the API only persists a result whose
`status` is `complete`. `engineVersion` (now `2.0.0`) on every summary records
which rules produced it. Property tests assert that replaying from recorded
`choices` reproduces a deep-equal summary, and JSON round-trip stability.

### 2. One zod contract, no drift

`@chipy/shared` owns the request/response schemas. The API validates with them
(`fastify-type-provider-zod`), the web infers its types from them, and the
`careerSummarySchema` is checked against a real engine summary in a test.

## DynamoDB single-table design

One table, one GSI. Access patterns and key layout live in
[`apps/api/src/db/keys.ts`](../apps/api/src/db/keys.ts):

| #   | Pattern                            | Keys                                                                |
| --- | ---------------------------------- | ------------------------------------------------------------------- |
| 1   | Put / get a career by id           | `PK = CAREER#<id>`, `SK = CAREER`                                   |
| 2   | Top N careers for a month          | `gsi1pk = LB#<yyyymm>`, `gsi1sk = <legacyScore:5>#<id>`, query desc |
| 3   | Increment a (node, choice) counter | `PK = AGG#<nodeId>`, `SK = CHOICE#<choiceId>`, `UpdateItem ADD`     |
| 4   | Read every counter for a node      | `PK = AGG#<nodeId>`, `begins_with(SK, CHOICE#)`                     |

Only "comparable" choices are counted for #3/#4 — prologue and season-decision
ids, never team offers (which resolve to a different team per player, so
`engine.describeChoice` returns `null` and the repo skips them). No scans on the
hot path.

## Resilience choices

- **Graceful degradation:** the game is fully playable with the API down; only
  save / share / leaderboard need it, and each fails soft in the UI.
- **Best-effort aggregates:** the "what others chose" counters are bumped with
  `Promise.allSettled` after the career is already persisted — a lagging counter
  never fails a request.
- **Idempotent-ish writes:** `PutItem` uses `attribute_not_exists(PK)`; an id
  collision retries with a fresh id.
- **Liveness vs readiness:** `/healthz` (process up) is separate from `/readyz`
  (can reach DynamoDB — returns 503 if not).
- **Loud config:** the API refuses to boot on an invalid environment.
- **Reproducible envs:** everything is `docker compose` now, Terraform in M2.
