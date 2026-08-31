import { clamp, jitter, type Rng } from './rng.js';
import { getArchetype } from './archetypes.js';
import {
  RATING_CEIL,
  RATING_FLOOR,
  RATING_KEYS,
  type ArchetypeId,
  type Market,
  type Position,
  type Ratings,
} from './types.js';

/** Per-position weights (each column sums to 1) for collapsing ratings to an overall. */
const POSITION_WEIGHTS: Record<Position, Ratings> = {
  PG: {
    playmaking: 0.24,
    basketballIQ: 0.16,
    threePoint: 0.16,
    perimeterDefense: 0.14,
    finishing: 0.1,
    midRange: 0.1,
    interiorDefense: 0.06,
    rebounding: 0.04,
  },
  SG: {
    threePoint: 0.22,
    perimeterDefense: 0.16,
    midRange: 0.14,
    finishing: 0.14,
    playmaking: 0.12,
    basketballIQ: 0.1,
    rebounding: 0.06,
    interiorDefense: 0.06,
  },
  SF: {
    finishing: 0.16,
    threePoint: 0.16,
    perimeterDefense: 0.16,
    midRange: 0.12,
    playmaking: 0.12,
    basketballIQ: 0.1,
    rebounding: 0.1,
    interiorDefense: 0.08,
  },
  PF: {
    finishing: 0.18,
    interiorDefense: 0.18,
    rebounding: 0.18,
    threePoint: 0.12,
    perimeterDefense: 0.1,
    basketballIQ: 0.1,
    midRange: 0.08,
    playmaking: 0.06,
  },
  C: {
    interiorDefense: 0.24,
    rebounding: 0.22,
    finishing: 0.2,
    basketballIQ: 0.12,
    perimeterDefense: 0.08,
    threePoint: 0.06,
    midRange: 0.04,
    playmaking: 0.04,
  },
};

const BASELINE_RATING = 62;
const MARKET_HYPE_BONUS: Record<Market, number> = { small: 0, mid: 4, large: 9 };
const POSITION_ATHLETICISM_BIAS: Record<Position, number> = { PG: 3, SG: 3, SF: 2, PF: 0, C: -3 };

export function emptyRatings(fill = 0): Ratings {
  return RATING_KEYS.reduce((acc, key) => {
    acc[key] = fill;
    return acc;
  }, {} as Ratings);
}

export function overallFor(position: Position, ratings: Ratings): number {
  const weights = POSITION_WEIGHTS[position];
  // A per-position weighted average of the eight skills - so a big bump to one
  // rating only nudges the overall (weights sum to 1). The card's per-axis chips
  // predict the *tile* change, not this overall.
  const raw = RATING_KEYS.reduce((sum, key) => sum + ratings[key] * weights[key], 0);
  // Being genuinely elite at your craft counts for a bit more than the average
  // implies - but the top-end bonus is capped so a 92+ overall (a genuine
  // "generational" tier) stays rare rather than routine.
  let eliteBonus = 0;
  for (const key of RATING_KEYS) {
    if (ratings[key] >= 88) eliteBonus += 1;
    if (ratings[key] >= 94) eliteBonus += 1;
  }
  return clamp(Math.round(raw + Math.min(eliteBonus, 4)), RATING_FLOOR, RATING_CEIL);
}

/**
 * A single "defense" number from the two D ratings, weighted toward the stronger
 * one - a true specialist (elite on one end, ordinary on the other) still reads
 * as an elite defender, and a genuine two-way stopper can push into the 90s.
 * Used for the merged DEFENSE tile and the DPOY consideration bar.
 */
export function defenseRatingOf(interiorDefense: number, perimeterDefense: number): number {
  const hi = Math.max(interiorDefense, perimeterDefense);
  const lo = Math.min(interiorDefense, perimeterDefense);
  return clamp(Math.round(hi * 0.66 + lo * 0.34), RATING_FLOOR, RATING_CEIL);
}

export function clampRatings(ratings: Ratings): Ratings {
  return RATING_KEYS.reduce((acc, key) => {
    acc[key] = clamp(Math.round(ratings[key]), RATING_FLOOR, RATING_CEIL);
    return acc;
  }, {} as Ratings);
}

/** Starting ratings: flat baseline + archetype identity + small seeded jitter. */
export function rollStartingRatings(rng: Rng, archetypeId: ArchetypeId): Ratings {
  const bias = getArchetype(archetypeId).ratingBias;
  return RATING_KEYS.reduce((acc, key) => {
    acc[key] = clamp(
      BASELINE_RATING + (bias[key] ?? 0) + jitter(rng, 4),
      RATING_FLOOR,
      RATING_CEIL,
    );
    return acc;
  }, {} as Ratings);
}

export function rollStartingAthleticism(rng: Rng, position: Position, athBias = 0): number {
  return clamp(72 + POSITION_ATHLETICISM_BIAS[position] + athBias + jitter(rng, 9), 45, 99);
}

export function rollStartingDurability(rng: Rng): number {
  return clamp(66 + jitter(rng, 10), 35, 96);
}

export function rollStartingHype(rng: Rng, overall: number, market: Market): number {
  const base = (overall - 52) * 1.3 + MARKET_HYPE_BONUS[market] + 28;
  return clamp(Math.round(base + jitter(rng, 6)), 0, 100);
}

export function rollStartingDraftStock(rng: Rng, overall: number, hype: number): number {
  return clamp(Math.round((overall - 46) * 1.9 + hype * 0.3 + jitter(rng, 6)), 0, 100);
}
