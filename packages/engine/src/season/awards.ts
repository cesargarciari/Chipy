import type { ArchetypeDef, AwardId, Role, SeasonStatLine, TeamResult } from '../types.js';
import type { Rng } from '../rng.js';
import type { SeasonEffect } from './effects.js';

/**
 * "Lead the league" check: only one player wins these, so the bar is a high
 * floor plus a low base probability that rises the further past the floor the
 * player is.
 */
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
}

export function resolveAwards(args: AwardArgs): AwardId[] {
  const { rng, seasonIndex, stats, role, impact, defImpact, prevImpact, teamResult, archetype } =
    args;
  const out: AwardId[] = [];
  if (stats.gp === 0) return out;

  const aff = archetype.awardAffinity;
  const defScore = defImpact * (0.7 + aff.defense * 0.4) * (args.effect.awardMult?.defense ?? 1);

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

  // All-Defense + DPOY
  let allDef1 = false;
  if (defScore >= 11 + rng() * 2 && rng() < 0.5) {
    out.push('all_defense_1');
    allDef1 = true;
  } else if (defScore >= 9 + rng() * 2) {
    out.push('all_defense_2');
  }
  if (allDef1 && defScore >= 13.5 + rng() * 1.5 && rng() < 0.3) out.push('dpoy');

  // Stat titles
  if (leagueBest(rng, stats.ppg, 23.5, 5, 0.1)) out.push('scoring_title');
  if (leagueBest(rng, stats.rpg, 10.5, 3, 0.12)) out.push('rebounding_title');
  if (leagueBest(rng, stats.apg, 8.5, 2.5, 0.12)) out.push('assists_title');
  if (leagueBest(rng, stats.spg, 1.9, 0.5, 0.12)) out.push('steals_title');
  if (leagueBest(rng, stats.bpg, 2.3, 0.7, 0.12)) out.push('blocks_title');

  // MVP — the rarest
  const mvpScore =
    impact *
    (0.85 + (TEAM_SUCCESS[teamResult] ?? 0)) *
    (0.8 + aff.scoring * 0.18 + aff.playmaking * 0.14);
  if (isAllStar && leagueBest(rng, mvpScore, 24, 6, 0.04)) out.push('mvp');

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

  return out;
}
