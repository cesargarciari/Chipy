import type { Scenario } from '../scenario-types.js';
import { bodyScenarios } from './body.js';
import { breakthroughScenarios } from './breakthrough.js';
import { legacyScenarios } from './legacy.js';
import { mediaScenarios } from './media.js';
import { mindScenarios } from './mind.js';
import { moneyScenarios } from './money.js';
import { shoeScenarios } from './shoe.js';
import { teamScenarios } from './team.js';
import { trainingScenarios } from './training.js';

/**
 * The whole scenario library. Adding content = append an object to one of the
 * themed files. `buildScenarioIndex()` validates the pack (unique ids, 2–4
 * options, always at least one ungated fallback) — called from the test suite.
 */
export const SCENARIOS: readonly Scenario[] = [
  ...trainingScenarios,
  ...bodyScenarios,
  ...mediaScenarios,
  ...teamScenarios,
  ...mindScenarios,
  ...moneyScenarios,
  ...legacyScenarios,
  ...shoeScenarios,
  ...breakthroughScenarios,
];

let optionIndex: Map<string, { scenario: Scenario; optionId: string }> | null = null;

export function buildScenarioIndex(): Map<string, { scenario: Scenario; optionId: string }> {
  if (optionIndex) return optionIndex;
  const map = new Map<string, { scenario: Scenario; optionId: string }>();
  const scenarioIds = new Set<string>();
  let hasFallback = false;

  for (const s of SCENARIOS) {
    if (scenarioIds.has(s.id)) throw new Error(`Duplicate scenario id "${s.id}"`);
    scenarioIds.add(s.id);
    if (s.options.length < 2 || s.options.length > 4) {
      throw new Error(`Scenario "${s.id}" must have 2–4 options, has ${s.options.length}`);
    }
    const g = s.gate;
    if (
      !g.phase &&
      !g.role &&
      !g.market &&
      g.minAge === undefined &&
      g.maxAge === undefined &&
      g.minSeason === undefined &&
      g.maxSeason === undefined &&
      !g.once &&
      !g.predicate
    ) {
      hasFallback = true;
    }
    for (const o of s.options) {
      if (map.has(o.id)) throw new Error(`Duplicate option id "${o.id}" (in scenario "${s.id}")`);
      map.set(o.id, { scenario: s, optionId: o.id });
    }
  }

  if (!hasFallback) {
    throw new Error('The scenario pack needs at least one always-eligible fallback scenario');
  }
  optionIndex = map;
  return map;
}

export function findScenarioOption(optionId: string) {
  return buildScenarioIndex().get(optionId) ?? null;
}
