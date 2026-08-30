import type { AwardId, NationalStanding } from '../types.js';
import { franchiseTier } from './franchise.js';

const MEDAL_REP: Partial<Record<AwardId, number>> = {
  oly_gold: 46,
  oly_silver: 24,
  oly_bronze: 15,
  wc_gold: 34,
  wc_silver: 18,
  wc_bronze: 11,
};

/** Rep from one national-team summer — a call-up alone is worth something. */
export function nationalSummerRep(args: { selected: boolean; awards: readonly AwardId[] }): number {
  if (!args.selected) return 0;
  let pts = 7;
  for (const a of args.awards) pts += MEDAL_REP[a] ?? 0;
  return pts;
}

const LEGEND_SCORE = 200;

export function nationalProgress(score: number): number {
  return Math.max(0, Math.min(100, Math.round((score / LEGEND_SCORE) * 100)));
}

export type { NationalStanding };

export function buildNationalStanding(a: {
  country: string;
  caps: number;
  medals: number;
  score: number;
}): NationalStanding {
  const score = Math.round(a.score);
  return {
    country: a.country,
    caps: a.caps,
    medals: a.medals,
    score,
    tier: franchiseTier(score, { rings: a.medals, seasons: a.caps, historic: a.medals >= 2 }),
    progress: nationalProgress(score),
  };
}
