import type { ArchetypeDef, RatingKey } from '../types.js';
import { RATING_KEYS, type Ratings } from '../types.js';
import { clamp, type Rng } from '../rng.js';
import type { SeasonEffect } from './effects.js';

/**
 * Per-rating skill change available at a given age, then scaled by the
 * archetype's growth weight for that rating. A long, decelerating climb — every
 * year adds a little into the early 30s — then a hard flip to decline at 34 as
 * age catches up. A key rating (weight ~1.4) gains ~12 points across the rise.
 */
export function ageCurveDelta(age: number): number {
  const table: Record<number, number> = {
    19: 1.75,
    20: 1.55,
    21: 1.3,
    22: 1.05,
    23: 0.82,
    24: 0.6,
    25: 0.42,
    // The "prime plateau" — near-maintenance, a point or two of polish a year.
    26: 0.2,
    27: 0.16,
    28: 0.13,
    29: 0.1,
    30: 0.08,
    31: 0.06,
    32: 0.04,
    33: 0.02,
    // Age catches up.
    34: -0.7,
    35: -1.6,
    36: -2.6,
    37: -3.7,
  };
  if (age <= 19) return table[19]!;
  if (age >= 38) return -4.8;
  return table[age] ?? 0;
}

/** Baseline durability lost to age each season — nothing before 31, steepening after. */
export function durabilityAgeDelta(age: number, rng: Rng): number {
  if (age <= 30) return 0;
  return -(age - 30) * 0.7 * (0.6 + rng() * 0.7);
}

/** How hard each rating falls in decline (athleticism-linked skills drop most). */
const DECLINE_WEIGHT: Record<string, number> = {
  finishing: 1.3,
  perimeterDefense: 1.2,
  interiorDefense: 1.1,
  rebounding: 0.9,
  midRange: 0.6,
  threePoint: 0.5,
  playmaking: 0.5,
  // Fades slower than the physical skills, but it still fades.
  basketballIQ: 0.6,
};

interface GrowthArgs {
  ratings: Ratings;
  athleticism: number;
  age: number;
  talent: number;
  archetype: ArchetypeDef;
  effect: SeasonEffect;
  /** Sum of active lingering growth biases from past decisions, this season. */
  growthBias?: Partial<Record<RatingKey, number>>;
}

export function growSeason(
  rng: Rng,
  { ratings, athleticism, age, talent, archetype, effect, growthBias }: GrowthArgs,
): { ratings: Ratings; athleticism: number; durabilityDelta: number } {
  const base = ageCurveDelta(age);
  const next = { ...ratings };

  // Growth splits into a small component everyone gets and a large one only
  // genuine lottery-caliber talent gets — so role players plateau in the high
  // 70s / low 80s while stars climb into the 90s.
  const talentEdge = Math.max(0, talent - 0.95);

  for (const key of RATING_KEYS) {
    // Lingering decision biases stack, but cap their pull so it can't run away.
    const decision =
      (effect.growth?.[key] ?? 0) + Math.min(1.6, Math.max(-1.6, growthBias?.[key] ?? 0));
    const immediate = effect.ratings?.[key] ?? 0;
    let delta: number;
    if (base >= 0) {
      const w = archetype.growthWeights[key] ?? 0.78;
      const baseGrowth = base * w * (0.2 + rng() * 0.75);
      const talentGrowth = base * w * talentEdge * 3.7 * (0.5 + rng());
      delta = baseGrowth + talentGrowth + decision + immediate;
    } else {
      const w = DECLINE_WEIGHT[key] ?? 0.8;
      delta = base * w * (0.7 + rng() * 0.6) + decision + immediate;
    }
    next[key] = clamp(Math.round(next[key] + delta), 25, 99);
  }

  let athDelta: number;
  if (age <= 26) athDelta = 0.9 + rng() * 1.3;
  else if (age <= 30) athDelta = 0.0 + rng() * 0.5;
  else if (age <= 33) athDelta = -(0.3 + rng() * 0.6);
  else athDelta = -(1.2 + rng() * 1.5) * ((age - 32) / 6);

  const nextAth = clamp(Math.round(athleticism + athDelta + (effect.athleticism ?? 0)), 25, 99);

  return { ratings: next, athleticism: nextAth, durabilityDelta: durabilityAgeDelta(age, rng) };
}
