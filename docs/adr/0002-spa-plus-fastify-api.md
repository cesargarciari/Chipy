# 2. Vite SPA + separate Fastify API

Date: 2026-08-28

## Status

Accepted

## Context

The game is a narrative career simulator. The rules (stat math, RNG, scenarios)
are a self-contained function; the backend only needs to persist finished
careers, keep a leaderboard, and tally choices. Constraints: modern stack that
maps to the Canadian job market, deployable to AWS at near-zero cost, local-first
development.

Options considered:

1. **Vite React SPA + separate Fastify (TS) API** — clean front/back split, the
   API is a plain container that runs on Lambda now or Fargate later.
2. **Next.js full-stack** — one codebase, but SSR on AWS needs SST/OpenNext and
   carries more cost/complexity than this app's SEO needs justify.
3. **Next.js + Go API + Postgres** — widest skill surface, but ~$15–25/mo and
   more ops than a first milestone wants.

## Decision

Option 1. A Vite + React SPA and a separate Fastify API, in a pnpm + Turborepo
monorepo, all TypeScript. Shared code (`@chipy/engine`, `@chipy/shared`) is
imported by both.

The engine runs **in the browser** for instant, offline-capable play and **in
the API** as the authoritative re-simulation.

## Consequences

- Hosting is trivially cheap: static files on S3/CloudFront, API on Lambda.
- Two deploy targets instead of one.
- No SSR — the landing page ships a small pre-rendered `index.html`; fine for
  this app. Revisit if organic search becomes a goal.
- The engine must stay pure and framework-free (enforced by tests and by it
  having zero runtime deps beyond `zod`).
