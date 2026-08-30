import { clamp, int, type Rng } from './rng.js';
import type { CareerState, DraftResult } from './types.js';

/**
 * Turn projected draft stock into an actual slot. The night is genuinely
 * random: a flat ±12 spread on top of the projection, plus a ~1-in-6 chance of a
 * real swing - a team reaches for you, or you slide out of the lottery - so the
 * same college run can land anywhere from the mid-lottery to the second round.
 */
export function simulateDraft(rng: Rng, state: CareerState): DraftResult {
  const stock = clamp(state.draftStock, 0, 100);
  let projected = Math.round((100 - stock) * 0.62) + 1;

  projected += int(rng, -13, 13);
  if (rng() < 0.18) projected += int(rng, -22, 22); // a reach or a slide

  if (projected > 58 || (projected > 42 && rng() < 0.42)) {
    return { undrafted: true, pick: null, round: null };
  }

  const pick = clamp(projected, 1, 60);
  return { undrafted: false, pick, round: pick <= 30 ? 1 : 2 };
}
