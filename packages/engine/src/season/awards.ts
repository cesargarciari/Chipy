import type {
  ArchetypeDef,
  AwardId,
  Position,
  Role,
  SeasonStatLine,
  StatusTier,
  TeamResult,
} from '../types.js';
import type { Rng } from '../rng.js';
import type { SeasonEffect } from './effects.js';

/** Checks for awards only one player can win, like scoring title. */
function leagueBest(
  rng: Rng,
  value: number,
  floor: number,
  spread: number,
  baseChance: number,
): boolean {
  const threshold = floor + rng() * spread;
  if (value < threshold) return false;
  const over = (value - threshold) / spread;
  return rng() < baseChance + over * baseChance * 2.5;
}

const TEAM_SUCCESS: Record<TeamResult, number> = {
  champion: 0.55,
  finals: 0.4,
  conf_finals: 0.28,
  second_round: 0.16,
  first_round: 0.07,
  play_in: -0.02,
  lottery: -0.15,
  missed_season: -0.5,
};

export interface AwardArgs {
  rng: Rng;
  seasonIndex: number;
  stats: SeasonStatLine;
  role: Role;
  impact: number;
  defImpact: number;
  prevImpact: number;
  teamResult: TeamResult;
  archetype: ArchetypeDef;
  effect: SeasonEffect;
  /** Bigs and wings win DPOY more often. */
  position: Position;
  /** Average of the two defense ratings. */
  defenseRating: number;
  /** Superstars win MVP more often. */
  status: StatusTier;
}

export function resolveAwards(args: AwardArgs): AwardId[] {
  const {
    rng,
    seasonIndex,
    stats,
    role,
    impact,
    defImpact,
    prevImpact,
    teamResult,
    archetype,
    position,
    defenseRating,
    status,
  } = args;
  const out: AwardId[] = [];
  if (stats.gp === 0) return out;

  const aff = archetype.awardAffinity;
  const defScore = defImpact * (0.7 + aff.defense * 0.4) * (args.effect.awardMult?.defense ?? 1);
  const elite = status === 'superstar' || status === 'generational';

  // Rookie honours
  if (seasonIndex === 0) {
    if (impact >= 10 + rng() * 4) out.push('all_rookie');
    if (impact >= 15.5 + rng() * 4 && stats.gp >= 50 && rng() < 0.4) out.push('roy');
  }

  // All-Star + All-NBA (one team only)
  const isAllStar =
    impact >= 18.5 + rng() * 3.5 && stats.gp >= 45 && (role === 'franchise' || role === 'starter');
  if (isAllStar) {
    out.push('all_star');
    if (impact >= 26 + rng() * 2 && rng() < 0.5) out.push('all_nba_1');
    else if (impact >= 23 + rng() * 2 && rng() < 0.55) out.push('all_nba_2');
    else if (impact >= 20.5 + rng() * 2) out.push('all_nba_3');
  }

  // All-Defense and DPOY. Bigs and wings are favoured, guards rarely win it.
  const dpoyPosBonus =
    position === 'C'
      ? 2
      : position === 'PF'
        ? 1.5
        : position === 'SF'
          ? 1.1
          : position === 'SG'
            ? 0.2
            : 0;
  const eliteDefender = defenseRating >= 85;
  const dpoyScore = defScore + dpoyPosBonus + (elite && eliteDefender ? 1.5 : 0);
  let allDef1 = false;
  if (dpoyScore >= 11 + rng() * 2 && rng() < 0.5) {
    out.push('all_defense_1');
    allDef1 = true;
  } else if (dpoyScore >= 9 + rng() * 2) {
    out.push('all_defense_2');
  }
  if (allDef1 && dpoyScore >= 13.5 + rng() * 1.5 && rng() < (eliteDefender ? 0.42 : 0.3)) {
    out.push('dpoy');
  }

  // Stat titles
  if (leagueBest(rng, stats.ppg, 23.5, 5, 0.1)) out.push('scoring_title');
  if (leagueBest(rng, stats.rpg, 10.5, 3, 0.12)) out.push('rebounding_title');
  if (leagueBest(rng, stats.apg, 8.5, 2.5, 0.12)) out.push('assists_title');
  if (leagueBest(rng, stats.spg, 1.9, 0.5, 0.12)) out.push('steals_title');
  if (leagueBest(rng, stats.bpg, 2.3, 0.7, 0.12)) out.push('blocks_title');

  // MVP. Superstars have a much better shot.
  const mvpScore =
    impact *
    (0.85 + (TEAM_SUCCESS[teamResult] ?? 0)) *
    (0.8 + aff.scoring * 0.18 + aff.playmaking * 0.14);
  const mvpBase = 0.055 + (status === 'generational' ? 0.05 : status === 'superstar' ? 0.03 : 0);
  if (isAllStar && leagueBest(rng, mvpScore, 22.5, 6, mvpBase)) out.push('mvp');

  // Most Improved
  if (
    seasonIndex >= 1 &&
    seasonIndex <= 5 &&
    impact - prevImpact >= 4.5 + rng() * 3 &&
    !out.includes('all_nba_1') &&
    rng() < 0.35
  ) {
    out.push('mip');
  }

  // Sixth Man
  if (
    (role === 'bench' || role === 'rotation') &&
    stats.mpg < 28 &&
    impact >= 12 + rng() * 3 &&
    rng() < 0.5
  ) {
    out.push('sixth_man');
  }

  // Clutch Player
  if (isAllStar && rng() < 0.04 + Math.max(0, (impact - 16) / 300)) out.push('clutch_poy');

  // Rings
  if (teamResult === 'champion') {
    out.push('champion');
    if (impact >= 19 + rng() * 3 && rng() < 0.6) out.push('finals_mvp');
  }

  // Keep awards consistent. An MVP is always First Team All-NBA and a DPOY is always First Team All-Defense.
  const setAllNba = (team: 'all_nba_1' | 'all_nba_2') => {
    for (const t of ['all_nba_1', 'all_nba_2', 'all_nba_3'] as const) {
      const i = out.indexOf(t);
      if (i >= 0) out.splice(i, 1);
    }
    out.push(team);
  };
  if (out.includes('mvp')) {
    setAllNba('all_nba_1');
  } else if (elite && isAllStar && !out.includes('all_nba_1') && !out.includes('all_nba_2')) {
    // Superstars make at least Second Team All-NBA.
    setAllNba(status === 'generational' && rng() < 0.7 ? 'all_nba_1' : 'all_nba_2');
  }
  if (out.includes('dpoy') && !out.includes('all_defense_1')) {
    const i = out.indexOf('all_defense_2');
    if (i >= 0) out.splice(i, 1);
    out.push('all_defense_1');
  }

  return out;
}
