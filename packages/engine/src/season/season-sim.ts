import { clamp, int, jitter, mulberry32, normalizeSeed, roundTo, type Rng } from '../rng.js';
import type { Position, Ratings, Role, SeasonStatLine, TeamResult, TeamWindow } from '../types.js';
import type { SeasonEffect } from './effects.js';

/** A stable PRNG derived from the career seed + arbitrary parts (does not touch the main stream). */
export function derivedRng(seed: number | string, ...parts: Array<string | number>): Rng {
  return mulberry32(normalizeSeed(`${seed}::${parts.join(':')}`));
}

// ---------------------------------------------------------------------------
// Team strength
// ---------------------------------------------------------------------------

/** 0..1 strength for a team in a given season — a fixed base tier plus a per-season wobble. */
export function teamStrengthFor(
  seed: number | string,
  teamId: string,
  seasonIndex: number,
): number {
  const base = derivedRng(seed, 'team-base', teamId)();
  const wobble = derivedRng(seed, 'team-year', teamId, seasonIndex)();
  return clamp(base * 0.55 + 0.22 + (wobble - 0.5) * 0.5, 0.05, 0.96);
}

export function windowFromStrength(s: number): TeamWindow {
  if (s >= 0.72) return 'contender';
  if (s >= 0.55) return 'playoff';
  if (s >= 0.38) return 'mid';
  return 'rebuild';
}

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

const ROLE_ORDER: Role[] = ['fringe', 'bench', 'rotation', 'starter', 'franchise'];

function roleFromOverall(overall: number): Role {
  if (overall >= 89) return 'franchise';
  if (overall >= 83) return 'starter';
  if (overall >= 74) return 'rotation';
  if (overall >= 65) return 'bench';
  return 'fringe';
}

function shiftRole(role: Role, ranks: number): Role {
  const i = clamp(ROLE_ORDER.indexOf(role) + Math.round(ranks), 0, ROLE_ORDER.length - 1);
  return ROLE_ORDER[i]!;
}

export function roleRank(role: Role): number {
  return ROLE_ORDER.indexOf(role);
}

export function roleFor(args: {
  overall: number;
  teamStrength: number;
  isRookie: boolean;
  effect: SeasonEffect;
  /** Last season's role — the result can't move more than one rank from it. */
  previousRole?: Role;
  /** Bypass the momentum clamp (big overall jump, or a lost season). */
  allowJump?: boolean;
}): Role {
  let role = roleFromOverall(args.overall);
  if (args.isRookie && args.overall < 84) role = shiftRole(role, -1);
  if (args.teamStrength >= 0.7 && args.overall < 85) role = shiftRole(role, -1);
  if (args.teamStrength <= 0.35 && args.overall >= 70) role = shiftRole(role, 1);
  role = shiftRole(role, args.effect.roleBias ?? 0);

  // Role momentum: don't jump/crash more than one tier a year.
  if (args.previousRole && !args.allowJump && !args.isRookie) {
    const prev = roleRank(args.previousRole);
    const target = roleRank(role);
    const clamped = clamp(target, prev - 1, prev + 1);
    role = ROLE_ORDER[clamped]!;
  }
  return role;
}

// ---------------------------------------------------------------------------
// Stat line
// ---------------------------------------------------------------------------

const MPG_TARGET: Record<Role, number> = {
  franchise: 35,
  starter: 32,
  rotation: 22,
  bench: 13,
  fringe: 6,
};
const USAGE: Record<Role, number> = {
  franchise: 0.9,
  starter: 0.74,
  rotation: 0.58,
  bench: 0.46,
  fringe: 0.36,
};
const REB_POS: Record<Position, number> = { PG: 0.55, SG: 0.65, SF: 1.0, PF: 1.35, C: 1.6 };
const AST_POS: Record<Position, number> = { PG: 1.7, SG: 1.05, SF: 0.85, PF: 0.6, C: 0.55 };
const BLK_POS: Record<Position, number> = { PG: 0.4, SG: 0.5, SF: 0.85, PF: 1.35, C: 1.9 };

export interface SeasonSimArgs {
  ratings: Ratings;
  athleticism: number;
  position: Position;
  role: Role;
  age: number;
  durability: number;
  effect: SeasonEffect;
  /** Last *played* season's line — the new line is smoothed toward it. */
  previousStats?: SeasonStatLine | null;
  previousRole?: Role;
}

export interface SeasonSimResult {
  stats: SeasonStatLine;
  /** Games missed this season — always exactly `82 - stats.gp`. */
  gamesMissed: number;
  /** Overall on-court value (drives MVP / All-NBA / All-Star). */
  impact: number;
  /** Defensive value (drives DPOY / All-Defense). */
  defImpact: number;
}

export function simulateSeason(rng: Rng, args: SeasonSimArgs): SeasonSimResult {
  const { ratings: r, athleticism, position, role, age, durability, effect } = args;

  const injuredGames = effect.injuredGames ?? 0;
  const absences = int(rng, 0, 7) + Math.round((100 - durability) / 12);
  const gp = clamp(82 - injuredGames - absences, 0, 82);

  const mpg = clamp(MPG_TARGET[role] + (effect.mpgBias ?? 0) + jitter(rng, 3), 4, 38);
  const impactMult = effect.impactMult ?? 1;

  if (gp === 0) {
    return {
      stats: { gp: 0, mpg: 0, ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, tsPct: 0 },
      gamesMissed: 82,
      impact: 0,
      defImpact: 0,
    };
  }

  // Continuity: pull each stat toward last played season so a role change can't
  // crater a scoring average (24 → 6). `w` is how much the fresh number counts.
  const prev = args.previousStats;
  const roleDelta =
    args.previousRole !== undefined ? roleRank(role) - roleRank(args.previousRole) : 0;
  let w = 0.6 + (age <= 24 ? 0.15 : 0) + (roleDelta > 0 ? 0.12 : 0) + (roleDelta < 0 ? -0.1 : 0);
  w = clamp(w, 0.45, 0.9);
  const upBand = age <= 23 ? 1.7 : 1.5;
  const smooth = (raw: number, was: number | undefined, floorAllowed = true): number => {
    if (was === undefined || was <= 0) return raw;
    const blended = raw * w + was * (1 - w);
    return clamp(blended, floorAllowed ? was * 0.62 : 0, was * upBand);
  };

  const scoringRate = (r.finishing * 0.4 + r.midRange * 0.28 + r.threePoint * 0.32) / 100;
  const ppg = clamp(
    roundTo(
      smooth(
        mpg * scoringRate * USAGE[role] * impactMult * (0.88 + rng() * 0.22) + jitter(rng, 1),
        prev?.ppg,
      ),
      1,
    ),
    0,
    33,
  );

  const rebRate = (r.rebounding * 0.6 + r.interiorDefense * 0.25 + athleticism * 0.15) / 100;
  const rpg = clamp(roundTo(smooth(mpg * rebRate * REB_POS[position] * 0.21, prev?.rpg), 1), 0, 16);

  const astRate = (r.playmaking * 0.75 + r.basketballIQ * 0.25) / 100;
  const apg = clamp(
    roundTo(smooth(mpg * astRate * AST_POS[position] * 0.185, prev?.apg), 1),
    0,
    12,
  );

  const stlRate = (r.perimeterDefense * 0.6 + r.basketballIQ * 0.4) / 100;
  const spg = clamp(roundTo(smooth(mpg * stlRate * 0.048, prev?.spg), 1), 0, 3.2);

  const blkRate = (r.interiorDefense * 0.55 + athleticism * 0.3 + r.rebounding * 0.15) / 100;
  const bpg = clamp(roundTo(smooth(mpg * blkRate * BLK_POS[position] * 0.047, prev?.bpg), 1), 0, 4);

  const rawTs =
    0.5 +
    (r.threePoint - 60) / 450 +
    (r.finishing - 60) / 500 +
    (r.basketballIQ - 60) / 700 +
    jitter(rng, 2) / 100;
  const tsPct = clamp(roundTo(prev?.tsPct ? rawTs * 0.7 + prev.tsPct * 0.3 : rawTs, 3), 0.44, 0.7);

  const availability = clamp(gp / 72, 0.45, 1.04);
  const impact =
    (ppg * 0.45 + rpg * 0.4 + apg * 0.5 + spg * 1.2 + bpg * 1.0 + (tsPct - 0.52) * 15) *
    availability;
  const defImpact =
    ((r.perimeterDefense * 0.4 +
      r.interiorDefense * 0.35 +
      r.rebounding * 0.15 +
      r.basketballIQ * 0.1) /
      12 +
      spg * 1.4 +
      bpg * 1.8) *
    availability;

  return {
    stats: { gp, mpg: roundTo(mpg, 1), ppg, rpg, apg, spg, bpg, tsPct },
    gamesMissed: 82 - gp,
    impact: roundTo(impact, 2),
    defImpact: roundTo(defImpact, 2),
  };
}

// ---------------------------------------------------------------------------
// Playoffs
// ---------------------------------------------------------------------------

export function simulatePlayoffs(
  rng: Rng,
  teamStrength: number,
  playerImpact: number,
  effect: SeasonEffect,
): TeamResult {
  const boost = clamp(playerImpact / 22, 0, 1.3) * 0.08;
  const p = clamp(teamStrength * (effect.teamMult ?? 1) + boost + jitter(rng, 1) / 70, 0.02, 0.97);

  if (p < 0.44 || rng() > p + 0.04) return 'lottery';

  const run = rng();
  if (p > 0.76 && run < (p - 0.64) * 0.7) return 'champion';
  if (p > 0.68 && run < (p - 0.54) * 0.72) return 'finals';
  if (p > 0.58 && run < (p - 0.44) * 0.78) return 'conf_finals';
  if (p > 0.5 && run < 0.5) return 'second_round';
  return 'first_round';
}
