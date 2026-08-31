import { offerSalary, rookieScale } from '../data/contracts.js';
import { getTeam, TEAMS } from '../data/teams.js';
import { clamp, int, roundTo, weightedPick, type Rng } from '../rng.js';
import type { DraftResult, Market, Role, TeamOffer, TeamRef, TeamWindow } from '../types.js';
import { contractLenFor, ROOKIE_CONTRACT_YEARS } from './phase.js';
import {
  contenderOdds,
  derivedRng,
  GLAMOUR_TEAMS,
  teamStrengthFor,
  windowFromStrength,
} from './season-sim.js';

const MARKET_ADJACENCY: Record<Market, Record<Market, number>> = {
  small: { small: 2.4, mid: 1.3, large: 0.7 },
  mid: { small: 1.2, mid: 2.0, large: 1.2 },
  large: { small: 0.7, mid: 1.3, large: 2.4 },
};

function sampleTeams(rng: Rng, weightOf: (t: TeamRef) => number, count: number): TeamRef[] {
  const pool = TEAMS.map((t) => [t, Math.max(0.01, weightOf(t))] as const);
  const picked: TeamRef[] = [];
  const used = new Set<string>();
  while (picked.length < count && used.size < pool.length) {
    const available = pool.filter(([t]) => !used.has(t.id));
    const t = weightedPick(rng, available);
    used.add(t.id);
    picked.push(t);
  }
  return picked;
}

function projectRole(overall: number, strength: number, floor: Role = 'fringe'): Role {
  const order: Role[] = ['fringe', 'bench', 'rotation', 'starter', 'franchise'];
  let idx = overall >= 86 ? 4 : overall >= 80 ? 3 : overall >= 72 ? 2 : overall >= 63 ? 1 : 0;
  if (strength >= 0.72 && overall < 84) idx = Math.max(0, idx - 1);
  if (strength <= 0.38 && overall >= 68) idx = Math.min(4, idx + 1);
  return order[Math.max(idx, order.indexOf(floor))]!;
}

const MPG_BY_ROLE: Record<Role, number> = {
  franchise: 34,
  starter: 31,
  rotation: 21,
  bench: 13,
  fringe: 7,
};

function windowPitch(window: TeamWindow, team: TeamRef, role: Role): string {
  const w =
    window === 'contender'
      ? 'a title window right now'
      : window === 'playoff'
        ? 'a playoff core to grow with'
        : window === 'mid'
          ? 'a roster in the middle, going either way'
          : 'a full rebuild built around its young players';
  const r =
    role === 'franchise'
      ? 'They want you as the franchise cornerstone.'
      : role === 'starter'
        ? 'You slot in as a day-one starter.'
        : role === 'rotation'
          ? 'You compete for rotation minutes.'
          : 'It’s a chance to earn a spot.';
  return `${team.city} is ${w}. ${r}`;
}

// ---------------------------------------------------------------------------

export interface OfferArgs {
  seed: number | string;
  overall: number;
  market: Market;
  draft: DraftResult;
}

/** Three post-draft landing spots, weighted by home market and draft slot. */
export function landingOffers({ seed, overall, market, draft }: OfferArgs): TeamOffer[] {
  const rng = derivedRng(seed, 'landing');
  const highPick = !draft.undrafted && draft.pick !== null && draft.pick <= 8;

  const teams = sampleTeams(
    rng,
    (t) => {
      const strength = teamStrengthFor(seed, t.id, 0);
      let w = MARKET_ADJACENCY[market][t.market];
      if (draft.undrafted) w *= strength < 0.5 ? 1.6 : 0.6;
      else if (highPick) w *= strength < 0.55 ? 1.7 : 0.7;
      else w *= strength > 0.55 ? 1.5 : 0.8;
      return w;
    },
    3,
  );

  const years = draft.undrafted ? 2 : ROOKIE_CONTRACT_YEARS;
  // Rookie pay is slot-based - every landing spot offers the same scale money.
  const salary = roundTo(rookieScale(draft), 1);
  return teams.map((team, i) => {
    const strength = teamStrengthFor(seed, team.id, 0);
    const window = windowFromStrength(strength);
    const role = projectRole(overall, strength, draft.undrafted ? 'fringe' : 'bench');
    return {
      choiceId: `offer_${i}`,
      team,
      window,
      projectedRole: role,
      projectedMpg: MPG_BY_ROLE[role],
      years,
      salary,
      contender: contenderOdds(strength, overall),
      pitch: windowPitch(window, team, role),
    };
  });
}

/**
 * The NBA teams that would take a chance on a EuroLeague returnee. Weighted
 * toward rebuilders with a roster spot open; deterministic for `(seed,
 * seasonIndex)` so the two options replay identically.
 */
export function nbaReturnTeams(seed: number | string, seasonIndex: number, count = 2): TeamRef[] {
  const rng = derivedRng(seed, 'nba-return', seasonIndex);
  return sampleTeams(
    rng,
    (t) => {
      const strength = teamStrengthFor(seed, t.id, seasonIndex);
      return strength < 0.48 ? 1.5 : strength < 0.62 ? 1 : 0.45;
    },
    count,
  );
}

export interface FreeAgencyArgs {
  seed: number | string;
  seasonIndex: number;
  overall: number;
  age: number;
  market: Market;
  currentTeamId: string;
  /** Drives the dollar figure on each offer. */
  marketValue: number;
}

/**
 * How many teams come calling when the contract is up. A fringe / role player
 * gets a couple of looks; a star draws a real market; a bona fide superstar has
 * most of the league in the room.
 */
export function suitorCount(rng: Rng, overall: number): number {
  if (overall >= 94) return int(rng, 16, 20); // generational
  if (overall >= 89) return int(rng, 12, 17); // superstar
  if (overall >= 85) return int(rng, 7, 8); // star
  if (overall >= 80) return int(rng, 4, 5); // solid starter
  return 2; // role player - just the incumbent + one look
}

/**
 * Free-agency offers. `[0]` is always re-signing with the current team; the rest
 * are ranked by how good a title shot they give you (best destinations first).
 * Stars and up draw a crowd, and the glamour markets punch above their record.
 */
export function freeAgencyOffers({
  seed,
  seasonIndex,
  overall,
  age,
  market,
  currentTeamId,
  marketValue,
}: FreeAgencyArgs): TeamOffer[] {
  const rng = derivedRng(seed, 'fa', seasonIndex);
  const star = overall >= 85;
  const count = suitorCount(rng, overall);

  const others = sampleTeams(
    rng,
    (t) => {
      if (t.id === currentTeamId) return 0;
      const strength = teamStrengthFor(seed, t.id, seasonIndex);
      let w = MARKET_ADJACENCY[market][t.market];
      w *= star ? (strength > 0.6 ? 1.8 : 0.7) : strength > 0.45 ? 1.1 : 1.0;
      // Free agents chase rings and bright lights - the glamour teams always
      // get a seat at the table.
      if (GLAMOUR_TEAMS.has(t.id)) w *= star ? 1.6 : 1.25;
      return w;
    },
    count,
  );

  const make = (team: TeamRef, resign: boolean): Omit<TeamOffer, 'choiceId'> => {
    const strength = teamStrengthFor(seed, team.id, seasonIndex);
    const window = windowFromStrength(strength);
    const role = projectRole(overall, strength);
    const years = clamp(contractLenFor(rng, role, age, overall), 1, 5);
    // Bird rights - the incumbent can always offer a touch more.
    const salary = roundTo(offerSalary(rng, marketValue, strength, years) * (resign ? 1.08 : 1), 1);
    return {
      team,
      window,
      projectedRole: role,
      projectedMpg: MPG_BY_ROLE[role],
      years,
      salary,
      contender: contenderOdds(strength, overall),
      pitch: resign
        ? `Run it back in ${team.city}. ${windowPitch(window, team, role).split('. ')[1] ?? ''}`.trim()
        : windowPitch(window, team, role),
    };
  };

  const resign = make(getTeam(currentTeamId), true);
  const rest = others.map((t) => make(t, false)).sort((a, b) => b.contender - a.contender);

  return [resign, ...rest].map((o, i) => ({ ...o, choiceId: `offer_${i}` }));
}
