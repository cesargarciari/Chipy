import { clamp } from '../rng.js';
import type { FranchiseTier, Role, StatusTier } from '../types.js';

const RANK: Record<StatusTier, number> = {
  fringe: 0,
  role_player: 1,
  star: 2,
  superstar: 3,
  generational: 4,
};

export function statusRank(t: StatusTier): number {
  return RANK[t];
}

export interface StatusArgs {
  overall: number;
  peakOverall: number;
  mvps: number;
  allNba: number;
  allStars: number;
  hype: number;
}

/** Where the player ranks in the league. Mostly based on overall, but awards and fame help. */
export function statusTier(a: StatusArgs): StatusTier {
  let tier: StatusTier =
    a.overall >= 94
      ? 'generational'
      : a.overall >= 89
        ? 'superstar'
        : a.overall >= 85
          ? 'star'
          : a.overall >= 74
            ? 'role_player'
            : 'fringe';

  const lift = (to: StatusTier) => {
    if (RANK[tier] < RANK[to]) tier = to;
  };

  if (a.allStars >= 1 || a.hype >= 80) lift('star');
  if (a.mvps >= 1 || a.allNba >= 2) lift('superstar');
  if ((a.mvps >= 2 && a.peakOverall >= 91) || a.mvps >= 3) lift('generational');
  return tier;
}

export interface TradeChanceArgs {
  /** Team strength this season. */
  teamStrength: number;
  role: Role;
  contractYearsLeft: number;
  /** 0 to 100 standing with the current team. */
  franchiseProgress: number;
  franchiseTier: FranchiseTier;
  status: StatusTier;
  /** 0 to 100. Lower chemistry makes a trade more likely. */
  chemistry: number;
  /** True the season after a trade. */
  justTraded: boolean;
}

/** Rough 0 to 1 chance of being traded this season. Losing teams, contract years and bad chemistry raise it. Loyalty and long deals lower it. */
export function tradeChance(a: TradeChanceArgs): number {
  if (a.justTraded) return 0.03;

  let base = 0.02;
  base += clamp((0.5 - a.teamStrength) * 0.4, 0, 0.16); // bad team → fire sale
  base += a.role === 'fringe' || a.role === 'bench' ? 0.08 : a.role === 'rotation' ? 0.04 : 0;
  base += a.contractYearsLeft <= 1 ? 0.07 : 0;
  base += a.franchiseProgress < 18 ? 0.04 : 0;

  if (a.franchiseTier === 'idol' || a.franchiseTier === 'legend') base -= 0.2;
  else if (a.franchiseTier === 'cornerstone') base -= 0.1;
  else if (a.franchiseTier === 'favorite') base -= 0.04;

  if (a.status === 'generational') base -= 0.12;
  else if (a.status === 'superstar') base -= 0.05;

  // Bad chemistry can get anyone traded.
  const chem = clamp((52 - a.chemistry) / 100, 0, 0.4);
  const raw = clamp(clamp(base, 0.01, 0.24) + chem, 0.01, 0.6);

  // Superstars aren't traded unless they ask.
  if (a.status === 'superstar' || a.status === 'generational') {
    return clamp(raw, 0.01, a.status === 'generational' ? 0.02 : 0.04);
  }
  return raw;
}
