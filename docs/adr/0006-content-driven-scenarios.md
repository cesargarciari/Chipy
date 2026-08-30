# 6. One option model + a content-driven scenario library

Date: 2026-08-29

## Status

Accepted (extends ADR 0005)

## Context

The v2 season loop offered the same four hardcoded options every offseason
("add a go-to move" forever). The user asked for depth like _El Idolo_ — dozens
of varied, one-off scenarios — and for it to be **scalable and maintainable**:
adding content should mean editing data, not the simulation. They also asked for
the option UI to show each choice's exact effect (`+8 FINISHING`), a real college
step, jersey + birth country, and stat continuity (no 24 → 6 ppg swings).

## Decision

**One option model everywhere.** Prologue, college decisions, and season
scenarios all use `GameOption { id, label, blurb, effect: OptionEffect,
stance?: OptionStance, watermark? }`:

- `effect` — flat integer deltas, applied deterministically and rendered as green
  chips by `describeEffects`. No RNG on choice effects, so the card promises
  exactly what you get. RNG stays in draft, college, growth, season sim, awards.
- `stance` — strategy knobs (impact/team multipliers, award affinity, role bias,
  and a **lingering `growthBias`** that nudges growth for a few seasons). Shown
  as a one-word tag, not chips.
- `applyOption(state, option)` is the single apply path; `optionView` is the
  single render path; `<ChoiceCard>` is the single component.

**Content-driven scenarios.** `packages/engine/src/season/scenarios/*.ts`, one
file per theme (`training`, `body`, `media`, `team`, `mind`, `money`, `legacy`),
each exporting `Scenario[]`. A `Scenario` has a declarative `gate` (phase, age,
season, role, market, `once`, `weight`, plus a `predicate` escape hatch), a
title/prompt, and 2–4 options. `pickScenario` filters by gate and weight-picks;
`buildScenarioIndex` validates the pack (unique option ids, 2–4 options, a
fallback exists). **Adding content = append an object.**

**Interactive college.** `recruiting` picks a tier → `college1` picks a real
program from `data/schools.ts` → `cy1` shows a simulated freshman line + March
result + declare/return/transfer (loops to 3 years). Stored on
`summary.college`.

**Profile + continuity.** `PlayerProfile` gains `jerseyNumber` and `country`
(from `data/countries.ts`); country pedigree weights national-team medal odds.
`roleFor` clamps to ±1 tier of last season; `simulateSeason` smooths each stat
toward the last played season (hard-capped change), so a mid-career trade can't
crater an average.

`ENGINE_VERSION` → `3.0.0` (profile shape changed; summary gains `college`).

## Consequences

- Balance shifted again (college adds development; more/bigger choice effects) —
  re-tuned in `growth.ts` / `college.ts` / `simulate.ts` / `legacy.ts` to a
  spread centred on B with rare S and a real washout tail. Still constant-driven,
  still covered by population property tests + a new stat-continuity property.
- Choice aggregates ("N% also chose X") only count stable option ids; team
  offers, school picks, and declare/return/transfer return `null` from
  `describeChoice`.
- Real school / NBA-team / country names are static data files, disclaimed in the
  README, swappable for fictional in one place.
