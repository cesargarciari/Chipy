import { clamp, jitter, type Rng } from '../rng.js';
import type { DraftResult } from '../types.js';

/** Share of gross pay that actually reaches the bank (taxes + agent + lifestyle). */
export const KEEP_RATE = 0.52;

/** First-contract salary ($M/yr) from where you were drafted. */
export function rookieScale(draft: DraftResult): number {
  if (draft.undrafted || draft.pick === null) return 1.2;
  // pick 1 ≈ 10.5, pick 14 ≈ 4.4, pick 30 ≈ 2.6, pick 60 ≈ 1.4
  return clamp(10.8 - Math.log2(draft.pick + 1) * 2.35, 1.3, 11);
}

export interface MarketValueArgs {
  overall: number;
  age: number;
  /** Last played season's `impact` (0 if none / injured). */
  lastImpact: number;
  hype: number;
  /** Perk / shoe-deal multiplier. */
  valueMult: number;
}

/**
 * What the market would pay per year ($M). Driven mostly by overall, boosted by
 * recent production and fame, discounted past ~31. Deliberately modest so that
 * a $10–20M perk is a real slice of a career, not pocket change.
 */
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

/** A team's actual offer ($M/yr): rebuilders overpay, contenders pay a touch under. */
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

/** Overseas pay (€M ≈ $M here) - a fraction of NBA money. */
export function euroSalary(rng: Rng, marketValue: number, prestige: number): number {
  const base = clamp(marketValue * 0.5 * (0.7 + prestige * 0.7), 1.4, 11);
  return Math.round((base + jitter(rng, 1) / 2) * 10) / 10;
}
