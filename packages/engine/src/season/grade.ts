import type { AwardId, EuroResult, GradeLetter, Role, TeamResult } from '../types.js';
import { clamp } from '../rng.js';

/**
 * Per-award value toward a season grade. The individual hardware is worth the
 * most; the team-wide honours (`champion`) and the lesser lists are lighter.
 */
const AWARD_POINTS: Partial<Record<AwardId, number>> = {
  mvp: 46,
  dpoy: 28,
  finals_mvp: 24,
  roy: 16,
  mip: 11,
  sixth_man: 11,
  clutch_poy: 12,
  champion: 26,
  all_nba_1: 20,
  all_nba_2: 14,
  all_nba_3: 10,
  all_defense_1: 10,
  all_defense_2: 6,
  all_star: 12,
  scoring_title: 12,
  rebounding_title: 8,
  assists_title: 8,
  steals_title: 6,
  blocks_title: 6,
  all_rookie: 6,
  oly_gold: 10,
  oly_silver: 6,
  oly_bronze: 4,
  euroleague_champion: 22,
  euroleague_mvp: 22,
  euro_domestic_title: 9,
};

const NBA_RESULT_POINTS: Record<TeamResult, number> = {
  champion: 24,
  finals: 16,
  conf_finals: 10,
  second_round: 5,
  first_round: 2,
  play_in: -1,
  lottery: -6,
  missed_season: -16,
};

const EURO_RESULT_POINTS: Record<EuroResult, number> = {
  euroleague_champion: 20,
  euroleague_final_four: 12,
  domestic_title: 8,
  euro_playoffs: 3,
  euro_missed: -6,
};

function toLetter(points: number): GradeLetter {
  if (points >= 92) return 'S';
  if (points >= 66) return 'A';
  if (points >= 44) return 'B';
  if (points >= 24) return 'C';
  return 'D';
}

export interface SeasonGradeArgs {
  awards: readonly AwardId[];
  teamResult: TeamResult;
  /** Conference seed 1..15 (0 when there is no NBA seeding - e.g. overseas). */
  seed: number;
  /** This season's `impact` (0 if injured out). */
  impact: number;
  role: Role;
  gamesPlayed: number;
}

/** Grade one NBA season: accolades + team success + seed + individual production. */
export function gradeSeason(a: SeasonGradeArgs): GradeLetter {
  let pts = 30;
  for (const id of a.awards) pts += AWARD_POINTS[id] ?? 0;
  pts += NBA_RESULT_POINTS[a.teamResult] ?? 0;
  if (a.seed >= 1 && a.seed <= 3) pts += 6;
  else if (a.seed >= 4 && a.seed <= 6) pts += 2;
  else if (a.seed >= 11) pts -= 4;
  pts += clamp((a.impact - 14) * 1.5, -14, 28);
  if (a.gamesPlayed > 0 && a.gamesPlayed < 45) pts -= 12;
  if (a.role === 'fringe') pts -= 6;
  return toLetter(pts);
}

export interface OverseasGradeArgs {
  awards: readonly AwardId[];
  result: EuroResult;
  impact: number;
  gamesPlayed: number;
}

/** Grade one overseas season: club silverware + accolades + production. */
export function gradeOverseasSeason(a: OverseasGradeArgs): GradeLetter {
  let pts = 32;
  for (const id of a.awards) pts += AWARD_POINTS[id] ?? 0;
  pts += EURO_RESULT_POINTS[a.result] ?? 0;
  pts += clamp((a.impact - 15) * 1.4, -12, 26);
  if (a.gamesPlayed > 0 && a.gamesPlayed < 30) pts -= 10;
  return toLetter(pts);
}
