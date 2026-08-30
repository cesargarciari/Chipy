import { weightedPick, type Rng } from '../rng.js';
import type { Scenario, ScenarioContext } from './scenario-types.js';
import { SCENARIOS } from './scenarios/index.js';

function gateMatches(s: Scenario, ctx: ScenarioContext): boolean {
  const g = s.gate;
  if (g.phase && !g.phase.includes(ctx.phase)) return false;
  if (g.role && !g.role.includes(ctx.role)) return false;
  if (g.market && !g.market.includes(ctx.market)) return false;
  if (g.minAge !== undefined && ctx.age < g.minAge) return false;
  if (g.maxAge !== undefined && ctx.age > g.maxAge) return false;
  if (g.minSeason !== undefined && ctx.seasonNumber < g.minSeason) return false;
  if (g.maxSeason !== undefined && ctx.seasonNumber > g.maxSeason) return false;
  if (g.once && ctx.firedScenarioIds.has(s.id)) return false;
  if (g.predicate && !g.predicate(ctx)) return false;
  return true;
}

export function eligibleScenarios(ctx: ScenarioContext): Scenario[] {
  return SCENARIOS.filter((s) => gateMatches(s, ctx));
}

/** Weight-pick the next offseason scenario for this career state. */
export function pickScenario(rng: Rng, ctx: ScenarioContext): Scenario {
  const eligible = eligibleScenarios(ctx);
  if (eligible.length === 0) {
    throw new Error(
      `No eligible scenario for phase=${ctx.phase} age=${ctx.age} role=${ctx.role} season=${ctx.seasonNumber}`,
    );
  }
  return weightedPick(
    rng,
    eligible.map((s) => [s, s.gate.weight ?? 1] as const),
  );
}
