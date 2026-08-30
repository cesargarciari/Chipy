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

/**
 * Where the player sits in the league pecking order. Mostly a function of
 * current overall, but real accolades keep an ageing star's status up, and big
 * fame nudges a borderline case.
 */
export function statusTier(a: StatusArgs): StatusTier {
  let tier: StatusTier =
    a.overall >= 93
      ? 'generational'
      : a.overall >= 88
        ? 'superstar'
        : a.overall >= 82
          ? 'star'
          : a.overall >= 74
            ? 'role_player'
            : 'fringe';

  const lift = (to: StatusTier) => {
    if (RANK[tier] < RANK[to]) tier = to;
  };

  if (a.allStars >= 1 || a.hype >= 82) lift('star');
  if (a.mvps >= 1 || a.allNba >= 3) lift('superstar');
  if (a.mvps >= 2 && a.peakOverall >= 92) lift('generational');
  return tier;
}

export interface TradeChanceArgs {
  /** 0.05..0.96 - the team's own strength this season. */
  teamStrength: number;
  role: Role;
  contractYearsLeft: number;
  /** 0..100 idolatry with the current club. */
  franchiseProgress: number;
  franchiseTier: FranchiseTier;
  status: StatusTier;
  /** 0..100 team chemistry - the lower it is, the likelier a move. */
  chemistry: number;
  /** True the season after a trade - the dust has settled, leave it alone. */
  justTraded: boolean;
}

/**
 * A rough, RNG-free 0..1 estimate of getting moved this season - shown on the
 * HUD when it climbs, and rolled against once in the sim. A losing team shops
 * everyone; a contract year and a thin bench seat make it worse; real roots
 * (idolatry, a long deal) protect you, and nobody dumps a generational talent -
 * but a locker room that can't stand you will move anyone.
 */
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

  // Bad chemistry is a term of its own - it can move anyone, star or not.
  const chem = clamp((52 - a.chemistry) / 100, 0, 0.4);

  return clamp(clamp(base, 0.01, 0.24) + chem, 0.01, 0.6);
}
