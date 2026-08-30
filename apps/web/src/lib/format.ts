import {
  FRANCHISE_TIER_LABELS,
  getArchetype,
  getCountry,
  getPerk,
  perkExists,
  teamLabel,
  type ArchetypeId,
  type AwardId,
  type FranchiseTier,
} from '@chipy/engine';
import type { CareerSummaryDto } from '@chipy/shared';

type EuroResult = CareerSummaryDto['overseasSeasons'][number]['result'];

export { FRANCHISE_TIER_LABELS };
export type { FranchiseTier };

/** How prominent a franchise tier should read — drives colour on the legacy card. */
export const FRANCHISE_TIER_TONE: Record<FranchiseTier, string> = {
  none: 'text-ink-dim',
  known: 'text-ink-dim',
  favorite: 'text-sky-400',
  cornerstone: 'text-emerald-400',
  idol: 'text-amber',
  legend: 'text-amber',
};

type LegacyTier = CareerSummaryDto['legacy']['tier'];
type Role = CareerSummaryDto['seasons'][number]['role'];
type TeamResult = CareerSummaryDto['seasons'][number]['teamResult'];
type Phase = CareerSummaryDto['seasons'][number]['phase'];
type GradeLetter = CareerSummaryDto['legacy']['grade'];
type SchoolTier = NonNullable<CareerSummaryDto['college']>['tier'];

export function archetypeLabel(id: ArchetypeId): string {
  return getArchetype(id).label;
}

export function teamName(id: string): string {
  return teamLabel(id);
}

export function countryLabel(id: string): string {
  const c = getCountry(id);
  return `${c.flag} ${c.name}`;
}

export function countryName(id: string): string {
  return getCountry(id).name;
}

export const SCHOOL_TIER_LABELS: Record<SchoolTier, string> = {
  blue_blood: 'Blue-blood program',
  mid_major: 'Mid-major',
  overseas: 'Overseas / G League',
};

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function pctText(pct: number): string {
  return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

/** `$18M`, `$1.5M`, `$1.2B` — the game's money unit is $M. */
export function moneyM(m: number): string {
  if (m >= 1000) return `$${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)}B`;
  return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
}

/** Human name for a perk id (`shooting_trainer` → "Shooting trainer"). */
export function perkLabel(id: string): string {
  return perkExists(id) ? getPerk(id).name : id;
}

export const EURO_RESULT_LABELS: Record<EuroResult, string> = {
  euroleague_champion: 'EuroLeague Champion',
  euroleague_final_four: 'EuroLeague Final Four',
  domestic_title: 'Domestic Title',
  euro_playoffs: 'EuroLeague Playoffs',
  euro_missed: 'No silverware',
};

export function draftLabel(draft: CareerSummaryDto['draft']): string {
  if (draft.undrafted || draft.pick === null) return 'Undrafted';
  return `Round ${draft.round}, ${ordinal(draft.pick)} pick`;
}

export const GRADE_TONE: Record<GradeLetter, string> = {
  S: 'text-amber',
  A: 'text-emerald-400',
  B: 'text-sky-400',
  C: 'text-ink-dim',
  D: 'text-rose-400',
};

export const LEGACY_TIER_LABELS: Record<LegacyTier, string> = {
  inner_circle: 'Inner-Circle All-Timer',
  all_timer: 'All-Timer',
  hall_of_famer: 'Hall of Famer',
  franchise_great: 'Franchise Great',
  quality_starter: 'Quality Starter',
  solid_pro: 'Solid Pro',
  journeyman: 'Journeyman',
  cup_of_coffee: 'Cup of Coffee',
};

export const ROLE_LABELS: Record<Role, string> = {
  franchise: 'Franchise player',
  starter: 'Starter',
  rotation: 'Rotation',
  bench: 'Bench',
  fringe: 'Fringe',
};

export const PHASE_LABELS: Record<Phase, string> = {
  rookie: 'Rookie',
  rising: 'Rising',
  prime: 'Prime',
  veteran: 'Veteran',
  decline: 'Twilight',
};

export const TEAM_RESULT_LABELS: Record<TeamResult, string> = {
  champion: 'Champion',
  finals: 'Finals',
  conf_finals: 'Conf. Finals',
  second_round: 'Round 2',
  first_round: 'Round 1',
  lottery: 'Lottery',
  missed_season: 'Missed season',
};

export const AWARD_LABELS: Record<AwardId, string> = {
  roy: 'Rookie of the Year',
  all_rookie: 'All-Rookie Team',
  all_star: 'All-Star',
  all_nba_1: 'All-NBA First Team',
  all_nba_2: 'All-NBA Second Team',
  all_nba_3: 'All-NBA Third Team',
  all_defense_1: 'All-Defensive First Team',
  all_defense_2: 'All-Defensive Second Team',
  scoring_title: 'Scoring Title',
  rebounding_title: 'Rebounding Title',
  assists_title: 'Assists Title',
  steals_title: 'Steals Title',
  blocks_title: 'Blocks Title',
  mip: 'Most Improved Player',
  sixth_man: 'Sixth Man of the Year',
  clutch_poy: 'Clutch Player of the Year',
  dpoy: 'Defensive Player of the Year',
  mvp: 'Most Valuable Player',
  champion: 'NBA Champion',
  finals_mvp: 'Finals MVP',
  wc_gold: 'World Cup Gold',
  wc_silver: 'World Cup Silver',
  wc_bronze: 'World Cup Bronze',
  oly_gold: 'Olympic Gold',
  oly_silver: 'Olympic Silver',
  oly_bronze: 'Olympic Bronze',
  euroleague_champion: 'EuroLeague Champion',
  euroleague_mvp: 'EuroLeague MVP',
  euro_domestic_title: 'Domestic League Title',
};

/** Big-ticket awards, in the order a trophy case should show them. */
export const TROPHY_ORDER: AwardId[] = [
  'mvp',
  'finals_mvp',
  'champion',
  'dpoy',
  'roy',
  'scoring_title',
  'all_nba_1',
  'all_nba_2',
  'all_nba_3',
  'all_defense_1',
  'all_defense_2',
  'all_star',
  'oly_gold',
  'wc_gold',
  'mip',
  'sixth_man',
  'clutch_poy',
  'rebounding_title',
  'assists_title',
  'steals_title',
  'blocks_title',
  'euroleague_champion',
  'euroleague_mvp',
  'euro_domestic_title',
  'oly_silver',
  'oly_bronze',
  'wc_silver',
  'wc_bronze',
  'all_rookie',
];
