---
description: Add a season scenario to the engine content library
argument-hint: <theme> "<one-line pitch>"
---

Add a new season `Scenario` for: $ARGUMENTS

Context:

- Season content lives in `packages/engine/src/season/scenarios/<theme>.ts`, one
  file per theme (body, breakthrough, legacy, media, mind, money, shoe, team,
  training). Each file exports an array of `Scenario` objects.
- `packages/engine/src/season/scenario-types.ts` defines `Scenario`, its `gate`
  (phase / age / season / role / market / `once` / `weight` / `predicate`), and
  the option shape: `effect` (flat integer deltas, plus `money`) and `stance`
  (impact / team / award multipliers, role bias, `growthBias`).
- `buildScenarioIndex` validates every pack; the scenario tests fail on a
  malformed one.

Steps:

1. Read the target theme file and `scenario-types.ts`. Match the existing shape
   and value ranges in that file.
2. Append one `Scenario`: a `gate` that fits the pitch, and 2 to 4 options, each
   with explicit `effect` chips and a one-word `stance` tag. No RNG in option
   effects; the card promises exactly what it gives.
3. Run `pnpm --filter @chipy/engine test` and fix whatever the scenario-index or
   content tests flag.
4. Show the diff. Do not bump `ENGINE_VERSION` (additive content does not change
   how existing recorded `choices` replay). Do not commit.
