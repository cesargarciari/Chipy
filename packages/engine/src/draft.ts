import { clamp, jitter, type Rng } from './rng.js';
import type { CareerState, DraftResult } from './types.js';

/**
 * Turn projected draft stock into an actual slot. Stock ~100 lands near pick 1;
 * stock in the teens slides toward the second round; low stock goes undrafted.
 * The landing-spot step (`season/teams-sim.ts`) turns the slot into a team.
 */
export function simulateDraft(rng: Rng, state: CareerState): DraftResult {
  const stock = clamp(state.draftStock + jitter(rng, 8), 0, 100);
  const projected = Math.round((100 - stock) * 0.62) + 1;

  if (projected > 60) {
    return { undrafted: true, pick: null, round: null };
  }

  const pick = clamp(projected, 1, 60);
  return { undrafted: false, pick, round: pick <= 30 ? 1 : 2 };
}
