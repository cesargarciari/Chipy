import { clamp, type Rng } from '../rng.js';
import type { AwardId, StatusTier } from '../types.js';
import { statusRank } from './status.js';

export interface IntlContext {
  seasonIndex: number;
  age: number;
  overall: number;
  impact: number;
  hype: number;
  /** How strong the home country is at basketball, 0 to 1. */
  countryPedigree: number;
  /** True for the USA, where only stars make the team. */
  deepPool?: boolean;
  /** The player's league status. */
  status?: StatusTier;
}

export interface IntlResult {
  /** True if the player was called up this summer. */
  selected: boolean;
  /** True if there was a tournament this summer. */
  tournamentSummer: boolean;
  awards: AwardId[];
}

type Cycle = 'oly' | null;

/** Only the Olympics count, every four years. */
function cycleFor(seasonIndex: number): Cycle {
  return seasonIndex % 4 === 3 ? 'oly' : null;
}

/** Whether the player gets called up for the national team, and any medal. Stronger countries win more. */
export function maybeInternational(rng: Rng, c: IntlContext): IntlResult {
  const cycle = cycleFor(c.seasonIndex);
  if (!cycle || c.age > 35) return { selected: false, tournamentSummer: false, awards: [] };

  // Team USA only takes stars. Other countries lean on their best players.
  if (c.deepPool && statusRank(c.status ?? 'fringe') < statusRank('star')) {
    return { selected: false, tournamentSummer: true, awards: [] };
  }

  // Stars from small countries make the team, role players from strong ones might not.
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
