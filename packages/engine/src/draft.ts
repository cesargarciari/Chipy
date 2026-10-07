import { clamp, int, type Rng } from './rng.js';
import type { CareerState, DraftResult } from './types.js';

/** Turns draft stock into a pick. Only top prospects go in the lottery, and there's a chance of a big rise or fall. */
export function simulateDraft(rng: Rng, state: CareerState): DraftResult {
  const stock = clamp(state.draftStock, 0, 100);
  let projected = Math.round((100 - stock) * 0.92) + 2;

  projected += int(rng, -16, 16);
  // Rising a bit is less likely than falling a lot.
  if (rng() < 0.24) projected += int(rng, -18, 24);

  if (projected > 58 || (projected > 44 && rng() < 0.5)) {
    return { undrafted: true, pick: null, round: null };
  }

  const pick = clamp(projected, 1, 60);
  return { undrafted: false, pick, round: pick <= 30 ? 1 : 2 };
}
