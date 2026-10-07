import { int, pick, type Rng } from '../rng.js';
import type { OptionEffect, RatingKey } from '../types.js';

/** Rating groups for the prologue. Basketball IQ is left out because it's scaled down too much on the card. */
export const SCORING: RatingKey[] = ['finishing', 'midRange', 'threePoint'];
export const SLASHING: RatingKey[] = ['finishing', 'threePoint', 'playmaking'];
export const PLAYMAKING: RatingKey[] = ['playmaking', 'perimeterDefense', 'midRange'];
export const GLASS: RatingKey[] = ['rebounding', 'interiorDefense', 'finishing'];

/** Matches RATING_SCALE in options.ts. */
const RATING_SHOWN = 0.85;

/** Splits points evenly across two random ratings. */
export function rollSplit(
  rng: Rng,
  keys: readonly RatingKey[],
  total: number,
): Partial<Record<RatingKey, number>> {
  const a = keys[Math.floor(rng() * keys.length)]!;
  let b = keys[Math.floor(rng() * keys.length)]!;
  while (b === a) b = keys[Math.floor(rng() * keys.length)]!;
  const first = int(rng, Math.floor(total * 0.4), Math.ceil(total * 0.6));
  return { [a]: first, [b]: total - first };
}

/** Builds an effect worth about the same on the card, mixing ratings, athleticism, durability and draft stock. */
export function balancedEffect(
  rng: Rng,
  pool: readonly RatingKey[],
  shownTarget: number,
  meta: number,
): OptionEffect {
  const ratingPts = Math.max(2, Math.round((shownTarget - meta) / RATING_SHOWN));
  const eff: OptionEffect = {
    ratings: rollSplit(rng, pool, ratingPts),
    draftStock: int(rng, 3, 5),
  };
  if (meta > 0) {
    const ath = int(rng, 0, meta);
    if (ath > 0) eff.athleticism = ath;
    if (meta - ath > 0) eff.durability = meta - ath;
  }
  return eff;
}

/** Picks which option gets a small bonus this career. */
export function rollEdge(rng: Rng, count: number): { index: number; bump: number } {
  return { index: int(rng, 0, count - 1), bump: int(rng, 1, 2) };
}

export { pick };
