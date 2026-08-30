import { clamp, int, type Rng } from './rng.js';
import type { CareerState, DraftResult } from './types.js';

/**
 * Turn projected draft stock into an actual slot. Only a genuine blue-chip
 * prospect (stock in the high 80s+) projects into the lottery - everyone else
 * maps down the board on a steep slope, so a solid-but-not-special run lands in
 * the 20s, 30s or the second round. On top of that: a flat ±16 spread, plus a
 * ~1-in-4 chance of a real swing (a team reaches, or you slide out of the first
 * round entirely). The tail runs undrafted.
 */
export function simulateDraft(rng: Rng, state: CareerState): DraftResult {
  const stock = clamp(state.draftStock, 0, 100);
  let projected = Math.round((100 - stock) * 0.92) + 2;

  projected += int(rng, -16, 16);
  // A reach pulls up a little; a slide pushes down harder and more often.
  if (rng() < 0.24) projected += int(rng, -18, 24);

  if (projected > 58 || (projected > 44 && rng() < 0.5)) {
    return { undrafted: true, pick: null, round: null };
  }

  const pick = clamp(projected, 1, 60);
  return { undrafted: false, pick, round: pick <= 30 ? 1 : 2 };
}
