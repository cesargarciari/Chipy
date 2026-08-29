import type { ArchetypeDef } from '../types.js';
import { RATING_KEYS, type Ratings } from '../types.js';
import { clamp, type Rng } from '../rng.js';
import type { SeasonEffect } from './effects.js';

/**
 * Per-rating skill change available at a given age, then scaled by the
 * archetype's growth weight for that rating. Small positive numbers when young,
 * small negatives in the decline years — a key rating (weight ~1.4) gains
 * ~10 points across the whole rise, a non-key one (~0.8) far less.
 */
export function ageCurveDelta(age: number): number {
  const table: Record<number, number> = {
    19: 1.6,
    20: 1.4,
    21: 1.15,
    22: 0.9,
    23: 0.68,
    24: 0.48,
    25: 0.33,
    26: 0.2,
    27: 0.11,
    28: 0.04,
    29: 0.0,
    30: -0.2,
    31: -0.5,
    32: -0.85,
    33: -1.25,
    34: -1.7,
    35: -2.2,
    36: -2.8,
  };
  if (age <= 19) return table[19]!;
  if (age >= 37) return -3.4;
  return table[age] ?? 0;
}

/** How hard each rating falls in decline (IQ barely moves; athleticism-linked skills drop most). */
const DECLINE_WEIGHT: Record<string, number> = {
  finishing: 1.3,
  perimeterDefense: 1.2,
  interiorDefense: 1.1,
  rebounding: 0.9,
  midRange: 0.6,
  threePoint: 0.5,
  playmaking: 0.5,
  basketballIQ: 0.15,
};

interface GrowthArgs {
  ratings: Ratings;
  athleticism: number;
  age: number;
  talent: number;
  archetype: ArchetypeDef;
  effect: SeasonEffect;
}

export function growSeason(
  rng: Rng,
  { ratings, athleticism, age, talent, archetype, effect }: GrowthArgs,
): { ratings: Ratings; athleticism: number } {
  const base = ageCurveDelta(age);
  const next = { ...ratings };

  // Growth splits into a small component everyone gets and a large one only
  // genuine lottery-caliber talent gets — so role players plateau in the high
  // 70s / low 80s while stars climb into the 90s.
  const talentEdge = Math.max(0, talent - 0.97);

  for (const key of RATING_KEYS) {
    const decision = effect.growth?.[key] ?? 0;
    const immediate = effect.ratings?.[key] ?? 0;
    let delta: number;
    if (base >= 0) {
      const w = archetype.growthWeights[key] ?? 0.78;
      const baseGrowth = base * w * (0.25 + rng() * 0.9);
      const talentGrowth = base * w * talentEdge * 4.0 * (0.5 + rng());
      delta = baseGrowth + talentGrowth + decision + immediate;
    } else {
      const w = DECLINE_WEIGHT[key] ?? 0.8;
      delta = base * w * (0.7 + rng() * 0.6) + decision + immediate;
    }
    next[key] = clamp(Math.round(next[key] + delta), 25, 99);
  }

  let athDelta: number;
  if (age <= 24) athDelta = 1.0 + rng() * 1.4;
  else if (age <= 27) athDelta = 0.1 + rng() * 0.6;
  else if (age <= 29) athDelta = -(0.4 + rng() * 0.7);
  else athDelta = -(1.4 + rng() * 1.6) * ((age - 28) / 6);

  const nextAth = clamp(Math.round(athleticism + athDelta + (effect.athleticism ?? 0)), 25, 99);

  return { ratings: next, athleticism: nextAth };
}
