import type { Market, TeamRef } from '../types.js';

/**
 * The 30 NBA franchises. Only static reference data lives here (city, name,
 * conference, and a coarse media-market tier used for hype and free-agency
 * weighting). Per-season team strength is rolled by the simulation, not stored
 * here, so the same team can be a contender in one playthrough and a lottery
 * club in another.
 *
 * Trademarks belong to their owners; this is a fan project (see README).
 */
const T = (
  id: string,
  city: string,
  name: string,
  conference: 'East' | 'West',
  market: Market,
): TeamRef => ({ id, city, name, conference, market });

export const TEAMS: readonly TeamRef[] = [
  // East
  T('BOS', 'Boston', 'Celtics', 'East', 'large'),
  T('BKN', 'Brooklyn', 'Nets', 'East', 'large'),
  T('NYK', 'New York', 'Knicks', 'East', 'large'),
  T('PHI', 'Philadelphia', '76ers', 'East', 'large'),
  T('TOR', 'Toronto', 'Raptors', 'East', 'large'),
  T('CHI', 'Chicago', 'Bulls', 'East', 'large'),
  T('CLE', 'Cleveland', 'Cavaliers', 'East', 'mid'),
  T('DET', 'Detroit', 'Pistons', 'East', 'mid'),
  T('IND', 'Indiana', 'Pacers', 'East', 'small'),
  T('MIL', 'Milwaukee', 'Bucks', 'East', 'small'),
  T('ATL', 'Atlanta', 'Hawks', 'East', 'mid'),
  T('CHA', 'Charlotte', 'Hornets', 'East', 'mid'),
  T('MIA', 'Miami', 'Heat', 'East', 'large'),
  T('ORL', 'Orlando', 'Magic', 'East', 'mid'),
  T('WAS', 'Washington', 'Wizards', 'East', 'mid'),
  // West
  T('DAL', 'Dallas', 'Mavericks', 'West', 'large'),
  T('DEN', 'Denver', 'Nuggets', 'West', 'mid'),
  T('GSW', 'Golden State', 'Warriors', 'West', 'large'),
  T('HOU', 'Houston', 'Rockets', 'West', 'mid'),
  T('LAC', 'LA', 'Clippers', 'West', 'large'),
  T('LAL', 'Los Angeles', 'Lakers', 'West', 'large'),
  T('MEM', 'Memphis', 'Grizzlies', 'West', 'small'),
  T('MIN', 'Minnesota', 'Timberwolves', 'West', 'mid'),
  T('NOP', 'New Orleans', 'Pelicans', 'West', 'small'),
  T('OKC', 'Oklahoma City', 'Thunder', 'West', 'small'),
  T('PHX', 'Phoenix', 'Suns', 'West', 'mid'),
  T('POR', 'Portland', 'Trail Blazers', 'West', 'mid'),
  T('SAC', 'Sacramento', 'Kings', 'West', 'mid'),
  T('SAS', 'San Antonio', 'Spurs', 'West', 'small'),
  T('UTA', 'Utah', 'Jazz', 'West', 'small'),
];

const BY_ID = new Map(TEAMS.map((t) => [t.id, t]));

export function getTeam(id: string): TeamRef {
  const team = BY_ID.get(id);
  if (!team) throw new Error(`Unknown team id "${id}"`);
  return team;
}

export function teamLabel(id: string): string {
  const t = BY_ID.get(id);
  return t ? `${t.city} ${t.name}` : id;
}
