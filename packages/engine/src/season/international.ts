import { clamp, type Rng } from '../rng.js';
import type { AwardId, StatusTier } from '../types.js';
import { statusRank } from './status.js';

export interface IntlContext {
  seasonIndex: number;
  age: number;
  overall: number;
  impact: number;
  hype: number;
  /** Birth country's basketball pedigree, 0..1. */
  countryPedigree: number;
  /** True for the USA - a bottomless talent pool, so only stars make the 12. */
  deepPool?: boolean;
  /** The player's league status tier, used with `deepPool`. */
  status?: StatusTier;
}

export interface IntlResult {
  /** True on a national-team call-up summer (whether or not a medal followed). */
  selected: boolean;
  /** A medal-tournament summer with no call-up doesn't count against you. */
  tournamentSummer: boolean;
  awards: AwardId[];
}

type Cycle = 'oly' | null;

/**
 * The Olympics every four years - the only international basketball that moves
 * the needle. (The World Cup is deliberately not modelled as a trophy.)
 */
function cycleFor(seasonIndex: number): Cycle {
  return seasonIndex % 4 === 3 ? 'oly' : null;
}

/**
 * The national-team summer: whether the player was called up, and any medal
 * won. A strong basketball nation contends for gold; a weak one is lucky to
 * medal at all - `countryPedigree` shifts the whole distribution.
 */
export function maybeInternational(rng: Rng, c: IntlContext): IntlResult {
  const cycle = cycleFor(c.seasonIndex);
  if (!cycle || c.age > 35) return { selected: false, tournamentSummer: false, awards: [] };

  // Team USA: the roster is 12 of the best 30 players alive - you need genuine
  // star status to be on it. Everyone else: a strong player carries their
  // country, and a weaker nation leans on whoever it has.
  if (c.deepPool && statusRank(c.status ?? 'fringe') < statusRank('star')) {
    return { selected: false, tournamentSummer: true, awards: [] };
  }

  // A star from a small nation still gets called up; a role player from a
  // powerhouse might not make the 12.
  const selected =
    (c.overall >= 76 + (1 - c.countryPedigree) * 6 || (c.hype >= 70 && c.overall >= 74)) &&
    rng() < 0.55 + c.countryPedigree * 0.35;
  if (!selected) return { selected: false, tournamentSummer: true, awards: [] };

  const p = clamp(
    0.18 +
      c.countryPedigree * 0.55 +
      (c.overall - 82) / 90 +
      (c.impact - 18) / 140 +
      (rng() - 0.5) * 0.28,
    0.05,
    0.96,
  );
  const r = rng();

  let medal: 'gold' | 'silver' | 'bronze' | null = null;
  if (p > 0.68 && r < p - 0.5) medal = 'gold';
  else if (p > 0.52 && r < p - 0.34) medal = 'silver';
  else if (p > 0.4 && r < 0.45) medal = 'bronze';

  return {
    selected: true,
    tournamentSummer: true,
    awards: medal ? [`${cycle}_${medal}` as AwardId] : [],
  };
}
