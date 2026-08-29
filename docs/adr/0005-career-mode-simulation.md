# 5. Full career-mode simulation (engine v2)

Date: 2026-08-28

## Status

Accepted (supersedes the 3-node slice from ADR 0002's era)

## Context

The Milestone 1 slice was three decisions and a rookie-season result card. Played
next to the reference games (Copero _simulador-carrera_, Potrero _El Idolo_) it
was clearly too thin — those run a whole multi-season career with attribute
growth, trophies, and awards. The user asked to "improve the logic and
complexity": longer careers, position-specific archetypes, team selection,
season-by-season growth, and awards/championships.

## Decision

Rebuild `@chipy/engine` into a career-mode simulation, `ENGINE_VERSION = 2.0.0`.

- **8 ratings** (`finishing`, `midRange`, `threePoint`, `playmaking`,
  `perimeterDefense`, `interiorDefense`, `rebounding`, `basketballIQ`) plus meta
  attributes `athleticism` / `durability` / `hype`.
- **20 position-locked archetypes** (4 per position); the create screen only
  shows the four for the chosen position. Each archetype is data: rating bias,
  per-rating growth weights, award affinities.
- **30 real NBA teams** as a static data file (name, city, conference, market
  tier). Per-season team strength is rolled, not stored, so a team can be a
  contender in one playthrough and a lottery club in another. (Trademarks belong
  to their owners; disclaimed in the README. Swappable for fictional — it's one
  file.)
- **Partial evaluation.** `runCareer` returns `status: 'awaiting_choice'` with
  the next node when `choices` runs out, or `status: 'complete'` with the
  summary. The web drives the whole loop client-side by calling `runCareer` on
  every store change; the API only persists a `complete` result.
- **Talent gate.** A hidden per-career `talent` (derived from draft stock + a
  low-skewed roll) is squared into the growth formula, so most careers plateau
  as role players and a few develop into stars — the source of the outcome
  spread.
- **Legacy.** A 0–1000+ score from peak overall, longevity, weighted award
  counts, rings, and scoring milestones → a tier (`journeyman` …
  `inner_circle`), a letter grade, and a seeded Hall-of-Fame roll.

Determinism, purity, and "the engine runs on both sides" are unchanged from
ADR 0002.

## Consequences

- `@chipy/shared`'s `careerSummarySchema` and the API's leaderboard key/columns
  grow to match (GSI1 now sorts by `legacyScore`).
- Balance lives in a handful of constants (`growth.ts`, `season-sim.ts`,
  `awards.ts`, `legacy.ts`) and is covered by population property tests
  ("MVPs are rare", "grades form a spread") rather than exact-value assertions,
  so it can be retuned without rewriting tests.
- Old M1 careers (engine 1.x) are not forward-compatible; the field only held
  smoke-test data, so no migration was written.
