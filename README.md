# Chipy

An NBA career simulator. Build a prospect at one of five positions with a
**position-locked archetype**, get drafted, pick your landing spot from three
teams, then steer a **full career** — one decision every offseason — from the
summer circuit to a jersey in the rafters. Attributes grow on an age curve,
seasons play out with awards (All-NBA, DPOY, MVP, scoring titles), playoff runs,
rings, and Olympic / World Cup medals, and it all ends on a **legacy screen**
with a trophy case and a Hall-of-Fame verdict. Inspired by narrative "career
simulator" games like Copero's _simulador-carrera_ and Potrero's _El Idolo_.

Built as an AWS Solutions Architect practice project and a portfolio piece —
local-first now, deployed to AWS at near-zero cost later.

**Status: full career-mode simulation, running entirely on your machine.**

## Stack

| Layer           | Choice                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------ |
| Language / repo | TypeScript (strict, ESM), pnpm + Turborepo monorepo                                        |
| Simulation      | `@chipy/engine` — pure, deterministic, zero runtime deps beyond `zod`; Vitest + fast-check |
| Contract        | `@chipy/shared` — one set of zod schemas for the HTTP API, used by both apps               |
| Web             | Vite + React 19, Tailwind v4, Zustand, TanStack Query, React Router                        |
| API             | Fastify 5, `fastify-type-provider-zod`, pino; Lambda-ready (`@fastify/aws-lambda`)         |
| Data            | DynamoDB (on-demand) single-table via `@aws-sdk/lib-dynamodb`; DynamoDB Local for dev      |
| Infra (M2)      | Terraform → S3 + CloudFront, API Gateway HTTP API + Lambda, DynamoDB, CloudWatch           |
| CI              | GitHub Actions: typecheck · lint · test · build · Playwright                               |

See [`docs/architecture.md`](docs/architecture.md), [`docs/cost.md`](docs/cost.md),
and the [ADRs](docs/adr/).

## Prerequisites

- **Node 22** (`.nvmrc`) and **pnpm** via Corepack: `corepack enable`
- **Docker** + Docker Compose (for DynamoDB Local)
- Terraform CLI is **not** needed for Milestone 1.

> This repo pins `packageManager: pnpm@9.15.4`, which overrides any global
> package-manager config for this directory.

## Quickstart

### Option A — everything in Docker (production-like)

```bash
cp .env.example .env
docker compose up --build
# web  → http://localhost:5173   (Vite build served by nginx)
# api  → http://localhost:3000   (runs as NODE_ENV=production)
# data → http://localhost:8001   (dynamodb-admin)
```

### Option B — hot-reload dev

```bash
cp .env.example .env
corepack enable
pnpm install
docker compose up -d dynamodb-local dynamodb-admin
pnpm dev        # engine + shared in watch, api on :3000, web on :5173
# API OpenAPI UI (dev only) → http://localhost:3000/docs
```

The API creates the local table on boot. To (re)create it manually:
`pnpm db:setup`.

## Scripts (run from the repo root)

| Command                             | What it does                                                            |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `pnpm dev`                          | Watch-build packages, run API + web with hot reload                     |
| `pnpm build`                        | Build every package and app                                             |
| `pnpm typecheck`                    | `tsc --noEmit` across the workspace                                     |
| `pnpm lint`                         | ESLint (flat config, typescript-eslint)                                 |
| `pnpm format` / `pnpm format:check` | Prettier                                                                |
| `pnpm test`                         | Vitest — engine unit + property, API route tests (needs DynamoDB Local) |
| `pnpm e2e`                          | Playwright — plays a whole career, create → legacy (no API required)    |
| `pnpm db:setup`                     | Create the single table in DynamoDB Local                               |

## How it plays

1. **Create** a prospect: name, position, and one of **4 position-locked
   archetypes** (a PG picks from Floor General / Scoring PG / Two-Way PG / Combo
   Guard, a C from Rim Protector / Stretch Five / Back-to-Basket Hub / Lob
   Threat, etc.), plus a home market. A seeded RNG rolls starting ratings.
2. **Prologue** — high-school and recruiting decisions shape your ratings, hype,
   and draft stock. The engine then simulates a **draft slot** (1–60 / undrafted)
   and derives a hidden **talent** ceiling from it.
3. **Landing spot** — choose one of three team offers (weighted by draft slot and
   home market). That's your rookie team.
4. **Season loop** — every offseason you make **one decision** (training focus,
   role, or in a contract year, a free-agency choice of three teams). Then an
   automatic in-season **event** fires (injury, breakout, trade, coaching change,
   feud, clutch moment…), attributes grow on an **age curve × archetype × talent**,
   the season is simulated (role → minutes → stat line → playoff run), and
   **awards** resolve. Odd summers add a **World Cup / Olympics** call-up.
5. Careers run ~10–20 seasons and end when you choose to retire (offered once
   you're 32+ or after a major injury) or the game forces it (age, decline, or a
   career-ending injury).
6. A **legacy screen**: trophy case, career totals, a season-by-season table,
   final-ratings radar, a legacy **tier** (Journeyman → Inner-Circle All-Timer)
   and **grade**, and a Hall-of-Fame verdict. If the API is up the career is
   saved — you get a `/c/<id>` share link and "N% of players also chose X"; if
   not, the screen still stands (offline).

## Testing notes

- Engine tests assert **determinism**: replaying a career from its recorded
  `choices` reproduces a byte-identical summary; summaries are JSON round-trip
  stable. Property tests over 200+ random careers check ratings stay in band,
  ages are monotonic, grades match their score bands, and MVPs stay rare.
- API tests spin up the real Fastify app against a throwaway table in DynamoDB
  Local (one per test file).
- The Playwright test plays a **whole career** with **no backend** — the engine
  ships client-side.

## Roadmap

- **M1 — vertical slice** _(shipped)_
- **M1.5 — career mode** _(this repo):_ multi-season careers, position-locked
  archetypes, real NBA teams, draft + landing spot, awards & trophies,
  international play, legacy screen
- **M2 — AWS deploy (cheapest):** Terraform modules, remote state, GitHub Actions
  deploy via AWS OIDC, CloudWatch dashboard + Budgets alarm
- **M3 — depth:** contracts & salary, multi-player trades, named teammates,
  in-season tournament
- **M4 — accounts & polish:** Cognito, OG share images, SQS aggregate pipeline,
  OpenTelemetry

## License

MIT. Not affiliated with or endorsed by the NBA.
