import { int, pick, type Rng } from '../rng.js';
import type { OptionEffect, RatingKey } from '../types.js';

/**
 * Non-IQ rating keys only. Basketball IQ is scaled so hard on the card
 * (`IQ_SCALE` in `options.ts`) that spending a prologue budget on it would make
 * that option look strictly worse — so the summer-circuit / recruiting splits
 * never touch it. IQ still shows up through `growthBias`, which is a separate
 * long-term channel.
 */
export const SCORING: RatingKey[] = ['finishing', 'midRange', 'threePoint'];
export const SLASHING: RatingKey[] = ['finishing', 'threePoint', 'playmaking'];
export const PLAYMAKING: RatingKey[] = ['playmaking', 'perimeterDefense', 'midRange'];
export const GLASS: RatingKey[] = ['rebounding', 'interiorDefense', 'finishing'];

/** Roughly the card-visible fraction of a non-IQ rating point (mirrors RATING_SCALE). */
const RATING_SHOWN = 0.85;

/** Split `total` nominal points across two distinct keys from `keys`, ~evenly. */
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

/**
 * An effect worth ~`shownTarget` *card-visible* points: `meta` of them as
 * unscaled athleticism / durability (split at random), the rest as a scaled
 * rating pair from `pool`, plus a small random draft-stock bump. Because ratings
 * are scaled on the card and ath/dur are not, this keeps options with very
 * different shapes reading as equal value.
 */
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

/** Pick which of `count` options gets this career's small edge, and by how much. */
export function rollEdge(rng: Rng, count: number): { index: number; bump: number } {
  return { index: int(rng, 0, count - 1), bump: int(rng, 1, 2) };
}

export { pick };
