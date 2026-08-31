import type {
  AwardId,
  EuroResult,
  FranchiseStanding,
  FranchiseTier,
  Role,
  TeamResult,
} from '../types.js';

export const FRANCHISE_TIER_LABELS: Record<FranchiseTier, string> = {
  none: 'Passing through',
  known: 'Known quantity',
  favorite: 'Fan favorite',
  cornerstone: 'Franchise cornerstone',
  idol: 'Idol',
  legend: 'Legend',
};

/** Rep a single award adds to the standing with the team you won it on. */
const AWARD_REP: Partial<Record<AwardId, number>> = {
  mvp: 32,
  dpoy: 16,
  finals_mvp: 22,
  roy: 10,
  mip: 6,
  sixth_man: 6,
  clutch_poy: 6,
  all_nba_1: 10,
  all_nba_2: 7,
  all_nba_3: 5,
  all_defense_1: 6,
  all_defense_2: 4,
  all_star: 4,
  scoring_title: 6,
  rebounding_title: 4,
  assists_title: 4,
  steals_title: 3,
  blocks_title: 3,
  champion: 40,
};

const ROLE_REP: Record<Role, number> = {
  franchise: 9,
  starter: 5,
  rotation: 2,
  bench: 1,
  fringe: 0,
};

const RESULT_REP: Partial<Record<TeamResult, number>> = {
  champion: 14,
  finals: 8,
  conf_finals: 4,
  second_round: 2,
  first_round: 1,
  play_in: 0.5,
};

export interface SeasonRepArgs {
  role: Role;
  teamResult: TeamResult;
  awards: readonly AwardId[];
  /** Consecutive seasons with this team, including the one just played. */
  seasonsWithTeam: number;
  /** Did the player suit up at all this year? A lost season barely moves the needle. */
  played: boolean;
}

/** Rep earned with a team for one season played there. */
export function seasonFranchiseRep(a: SeasonRepArgs): number {
  if (!a.played) return 2;
  let pts = 6 + ROLE_REP[a.role] + (RESULT_REP[a.teamResult] ?? 0);
  for (const id of a.awards) pts += AWARD_REP[id] ?? 0;
  // Loyalty compounds - a few years in one place and the city adopts you.
  if (a.seasonsWithTeam >= 4) pts += Math.min(a.seasonsWithTeam - 3, 6) * 2;
  return pts;
}

const EURO_RESULT_REP: Record<EuroResult, number> = {
  euroleague_champion: 16,
  euroleague_final_four: 7,
  domestic_title: 6,
  euro_playoffs: 2,
  euro_missed: 0,
};

export interface OverseasRepArgs {
  awards: readonly AwardId[];
  result: EuroResult;
  /** Consecutive seasons with this club, including the one just played. */
  seasonsWithClub: number;
  played: boolean;
}

/**
 * Rep earned with an overseas club for one season - you're always the marquee
 * name there, so the role term is fixed high and the club silverware carries
 * its own weight.
 */
export function overseasFranchiseRep(a: OverseasRepArgs): number {
  if (!a.played) return 2;
  let pts = 6 + ROLE_REP.franchise + EURO_RESULT_REP[a.result];
  for (const id of a.awards) pts += AWARD_REP[id] ?? 0;
  if (a.seasonsWithClub >= 3) pts += Math.min(a.seasonsWithClub - 2, 6) * 2;
  return pts;
}

export interface FranchiseTierArgs {
  rings: number;
  seasons: number;
  /** A genuinely historic overall career (roughly all-timer or better). */
  historic: boolean;
}

/**
 * Where a team's fans place you. `cornerstone` is tenure + production;
 * `idol` needs a ring *with them*; `legend` needs a historic career and years.
 */
export function franchiseTier(score: number, a: FranchiseTierArgs): FranchiseTier {
  if (score >= 210 && a.seasons >= 6 && (a.historic || a.rings >= 2)) return 'legend';
  if (score >= 145 && a.rings >= 1) return 'idol';
  if (score >= 145) return 'cornerstone';
  if (score >= 70) return 'favorite';
  if (score >= 25) return 'known';
  return 'none';
}

const TIER_RANK: Record<FranchiseTier, number> = {
  none: 0,
  known: 1,
  favorite: 2,
  cornerstone: 3,
  idol: 4,
  legend: 5,
};

export function tierRank(t: FranchiseTier): number {
  return TIER_RANK[t];
}

const LEGEND_SCORE = 210;

/** 0..100 fill for an "idolatry" bar - 100 once the standing is legend-level. */
export function franchiseProgress(score: number): number {
  return Math.max(0, Math.min(100, Math.round((score / LEGEND_SCORE) * 100)));
}

export interface BuildStandingsArgs {
  score: Record<string, number>;
  seasons: Record<string, number>;
  rings: Record<string, number>;
  historic: boolean;
}

/** Final per-team standings, best first. */
export function buildFranchiseStandings(a: BuildStandingsArgs): FranchiseStanding[] {
  return Object.keys(a.score)
    .filter((teamId) => (a.seasons[teamId] ?? 0) > 0)
    .map((teamId) => {
      const score = Math.round(a.score[teamId] ?? 0);
      const seasons = a.seasons[teamId] ?? 0;
      const rings = a.rings[teamId] ?? 0;
      return {
        teamId,
        seasons,
        rings,
        score,
        tier: franchiseTier(score, { rings, seasons, historic: a.historic }),
        progress: franchiseProgress(score),
      };
    })
    .sort((x, y) => y.score - x.score);
}
