import { clamp, jitter, type Rng } from '../rng.js';
import type { DraftResult } from '../types.js';

/** Share of pay you keep after taxes, agents and spending. */
export const KEEP_RATE = 0.62;

/** Rookie salary by draft slot, in millions per year. */
export function rookieScale(draft: DraftResult): number {
  if (draft.undrafted || draft.pick === null) return 1.2;
  // Pick 1 is about 10.5, pick 30 about 2.6, pick 60 about 1.4.
  return clamp(10.8 - Math.log2(draft.pick + 1) * 2.35, 1.3, 11);
}

export interface MarketValueArgs {
  overall: number;
  age: number;
  /** Last season's impact, or 0 if none. */
  lastImpact: number;
  hype: number;
  /** Multiplier from perks and shoe deals. */
  valueMult: number;
}

/** What the market would pay per year, in millions. Mostly based on overall, lower after 31. */
export function marketValueFor({
  overall,
  age,
  lastImpact,
  hype,
  valueMult,
}: MarketValueArgs): number {
  const base = (overall - 70) * 1.35;
  const production = clamp((lastImpact - 13) * 0.5, -4, 9);
  const fame = clamp((hype - 58) * 0.08, -3, 5);
  const agePenalty = age <= 30 ? 0 : -((age - 30) ** 1.4) * 0.9;
  return clamp((base + production + fame + agePenalty) * valueMult, 0.8, 38);
}

/** A team's actual offer. Rebuilding teams pay more, contenders a bit less. */
export function offerSalary(
  rng: Rng,
  marketValue: number,
  teamStrength: number,
  years: number,
): number {
  const teamFactor = teamStrength >= 0.68 ? 0.9 : teamStrength <= 0.42 ? 1.14 : 1.0;
  const longDealDiscount = years >= 4 ? 0.96 : 1.0;
  return clamp(
    Math.round((marketValue * teamFactor * longDealDiscount + jitter(rng, 2) / 2) * 10) / 10,
    1.1,
    40,
  );
}

/** Overseas pay, a fraction of NBA money. */
export function euroSalary(rng: Rng, marketValue: number, prestige: number): number {
  const base = clamp(marketValue * 0.5 * (0.7 + prestige * 0.7), 1.4, 11);
  return Math.round((base + jitter(rng, 1) / 2) * 10) / 10;
}
