import { clamp, int, jitter, mulberry32, normalizeSeed, roundTo, type Rng } from '../rng.js';
import { getTeam, TEAMS } from '../data/teams.js';
import type { Position, Ratings, Role, SeasonStatLine, TeamResult, TeamWindow } from '../types.js';
import type { SeasonEffect } from './effects.js';

/** A stable PRNG derived from the career seed + arbitrary parts (does not touch the main stream). */
export function derivedRng(seed: number | string, ...parts: Array<string | number>): Rng {
  return mulberry32(normalizeSeed(`${seed}::${parts.join(':')}`));
}

// ---------------------------------------------------------------------------
// Team strength
// ---------------------------------------------------------------------------

/**
 * The glamour franchises: free agents want to play there, ownership spends, and
 * a real player joining almost always finds talent already in the building. They
 * carry a standing edge to their strength every season.
 */
export const GLAMOUR_TEAMS: ReadonlySet<string> = new Set(['LAL', 'GSW', 'NYK', 'BOS', 'MIA']);
const GLAMOUR_EDGE = 0.06;

/**
 * The perennial cellar-dwellers: small-market, badly run, rebuilding on a loop.
 * They start every season a tier down, so they live in the lottery unless the
 * player himself drags them up.
 */
export const BOTTOM_TEAMS: ReadonlySet<string> = new Set(['SAC', 'WAS', 'BKN']);
const BOTTOM_EDGE = -0.11;

/** 0..1 strength for a team in a given season - a fixed base tier plus a per-season wobble. */
export function teamStrengthFor(
  seed: number | string,
  teamId: string,
  seasonIndex: number,
): number {
  const base = derivedRng(seed, 'team-base', teamId)();
  const wobble = derivedRng(seed, 'team-year', teamId, seasonIndex)();
  const standing = GLAMOUR_TEAMS.has(teamId)
    ? GLAMOUR_EDGE
    : BOTTOM_TEAMS.has(teamId)
      ? BOTTOM_EDGE
      : 0;
  // Centred a touch higher so the median team is a play-in / playoff club, not
  // a lottery one - most rosters around a real player are competitive.
  return clamp(base * 0.5 + 0.33 + standing + (wobble - 0.5) * 0.44, 0.06, 0.96);
}

/**
 * Where the player's team finishes its own conference this season, 1 (best) ..
 * 15 (worst). Every conference rival's roster strength is ranked against the
 * player's team - and the player's own presence lifts his team (a superstar is
 * worth a few seeds).
 */
export function conferenceSeed(
  seed: number | string,
  teamId: string,
  seasonIndex: number,
  playerImpact: number,
): number {
  const conf = getTeam(teamId).conference;
  const lift = clamp(playerImpact / 20, 0, 1.4) * 0.06; // superstar ~ +0.08 (a couple of seeds)
  const mine = teamStrengthFor(seed, teamId, seasonIndex) + lift;
  let rank = 1;
  for (const t of TEAMS) {
    if (t.conference !== conf || t.id === teamId) continue;
    if (teamStrengthFor(seed, t.id, seasonIndex) > mine) rank += 1;
  }
  return clamp(rank, 1, 15);
}

export function windowFromStrength(s: number): TeamWindow {
  if (s >= 0.72) return 'contender';
  if (s >= 0.55) return 'playoff';
  if (s >= 0.38) return 'mid';
  return 'rebuild';
}

/**
 * How likely a title becomes if this player signs here: the roster's own
 * strength, lifted by what the player brings (a star drags a middling team up a
 * tier; he can't do much for one already at the top).
 */
export function contenderOdds(teamStrength: number, playerOverall: number): number {
  const lift = clamp((playerOverall - 76) / 100, 0, 0.24);
  return clamp(teamStrength + lift * (1 - teamStrength), 0.05, 0.97);
}

export function contenderLabel(odds: number): string {
  if (odds >= 0.75) return 'Title favorite';
  if (odds >= 0.62) return 'Real contender';
  if (odds >= 0.48) return 'Playoff team';
  if (odds >= 0.34) return 'On the fringe';
  return 'Rebuild';
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
  /** Last season's role - the result can't move more than one rank from it. */
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
  /** Last *played* season's line - the new line is smoothed toward it. */
  previousStats?: SeasonStatLine | null;
  previousRole?: Role;
}

export interface SeasonSimResult {
  stats: SeasonStatLine;
  /** Games missed this season - always exactly `82 - stats.gp`. */
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

/**
 * Turn a conference seed (1..15) into how far the team runs. Seeds 11-15 are in
 * the lottery; 7-10 fight through the play-in; 1-6 are in the bracket and the
 * deeper rounds scale hard with the seed - a 1-seed is a real title threat, a
 * 6-seed almost never is - lifted by a superstar and by an open ring window.
 */
export function simulatePlayoffs(
  rng: Rng,
  args: { seed: number; playerImpact: number; effect: SeasonEffect },
): TeamResult {
  const { seed, playerImpact, effect } = args;
  const star = clamp(playerImpact / 20, 0, 1.4); // 0 .. 1.4
  const windowBoost = (effect.teamMult ?? 1) - 1; // ~0 .. 0.12 during a ring window

  if (seed >= 11) return 'lottery';

  if (seed >= 7) {
    // Play-in: 7-8 are favoured to punch into the bracket, 9-10 are long shots.
    const winP = clamp(0.6 - (seed - 7) * 0.15 + star * 0.06 + windowBoost, 0.06, 0.9);
    if (rng() < winP) return 'first_round';
    return rng() < 0.55 ? 'play_in' : 'lottery';
  }

  // Bracket, seeds 1-6. `p` is "title-calibre" - built from the seed, lifted by
  // the player and a ring window, with a little variance.
  const seedStrength = (7 - seed) / 6; // 1-seed 1.0 ... 6-seed ~0.17
  const p = clamp(
    seedStrength * 0.82 + star * 0.13 + windowBoost * 1.6 + jitter(rng, 1) / 46,
    0.06,
    0.99,
  );
  const run = rng();
  if (p > 0.72 && run < (p - 0.6) * 0.6) return 'champion';
  if (p > 0.59 && run < (p - 0.47) * 0.64) return 'finals';
  if (p > 0.46 && run < (p - 0.34) * 0.74) return 'conf_finals';
  if (p > 0.34 && run < 0.52) return 'second_round';
  return 'first_round';
}
