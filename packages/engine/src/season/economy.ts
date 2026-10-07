import { KEEP_RATE, marketValueFor } from '../data/contracts.js';
import { roundTo } from '../rng.js';
import type { CareerState } from '../types.js';
import type { AggregatePerkEffect } from './perks.js';

/** Pays out this season's salary. Only KEEP_RATE of it reaches the bank. */
export function settleSeasonPay(state: CareerState): void {
  const pay = state.salary;
  if (pay <= 0) return;
  state.bank = roundTo(state.bank + pay * KEEP_RATE, 1);
  state.careerEarnings = roundTo(state.careerEarnings + pay, 1);
  state.peakSalary = Math.max(state.peakSalary, pay);
}

export interface MarketInputs {
  overall: number;
  /** Last season's impact, or 0 if none. */
  lastImpact: number;
}

/** Updates market value from form, fame, perks and deals. */
export function recomputeMarketValue(
  state: CareerState,
  { overall, lastImpact }: MarketInputs,
  perk: AggregatePerkEffect,
): number {
  const modMult = state.valueMods.reduce((m, v) => m * v.mult, 1);
  const value = roundTo(
    marketValueFor({
      overall,
      age: state.age,
      lastImpact,
      hype: state.hype,
      valueMult: perk.valueMult * modMult,
    }),
    1,
  );
  state.marketValue = value;
  return value;
}

/** Counts down value boosts by one season. */
export function tickValueMods(state: CareerState): void {
  state.valueMods = state.valueMods
    .map((v) => ({ ...v, seasonsLeft: v.seasonsLeft - 1 }))
    .filter((v) => v.seasonsLeft > 0);
}
