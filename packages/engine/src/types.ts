import type { Rng } from './rng.js';

/**
 * Bump when the simulation math changes in a way that would alter results for an
 * existing `(seed, profile, choices)` tuple. Stored on every `CareerSummary` so
 * the API can tell whether a persisted career predates the current rules.
 */
export const ENGINE_VERSION = '2.0.0';

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
export type Position = (typeof POSITIONS)[number];

export const MARKETS = ['small', 'mid', 'large'] as const;
export type Market = (typeof MARKETS)[number];

/** The eight rated skills — also the radar axes. */
export const RATING_KEYS = [
  'finishing',
  'midRange',
  'threePoint',
  'playmaking',
  'perimeterDefense',
  'interiorDefense',
  'rebounding',
  'basketballIQ',
] as const;
export type RatingKey = (typeof RATING_KEYS)[number];
export type Ratings = Record<RatingKey, number>;

export const RATING_FLOOR = 25;
export const RATING_CEIL = 99;

/** Short radar labels. */
export const RATING_LABELS: Record<RatingKey, string> = {
  finishing: 'FIN',
  midRange: 'MID',
  threePoint: '3PT',
  playmaking: 'PLY',
  perimeterDefense: 'PER D',
  interiorDefense: 'INT D',
  rebounding: 'REB',
  basketballIQ: 'IQ',
};

export const CONFERENCES = ['East', 'West'] as const;
export type Conference = (typeof CONFERENCES)[number];

export interface TeamRef {
  id: string;
  city: string;
  name: string;
  conference: Conference;
  market: Market;
}

export type TeamWindow = 'contender' | 'playoff' | 'mid' | 'rebuild';

export type TeamResult =
  | 'champion'
  | 'finals'
  | 'conf_finals'
  | 'second_round'
  | 'first_round'
  | 'lottery'
  | 'missed_season';

export type Role = 'franchise' | 'starter' | 'rotation' | 'bench' | 'fringe';

export type CareerPhase = 'rookie' | 'rising' | 'prime' | 'veteran' | 'decline';

// ---------------------------------------------------------------------------
// Archetypes (position-locked)
// ---------------------------------------------------------------------------

export const ARCHETYPE_IDS = [
  // PG
  'floor_general',
  'scoring_pg',
  'two_way_pg',
  'combo_guard',
  // SG
  'movement_shooter',
  'slashing_wing',
  'three_and_d_guard',
  'shot_creator',
  // SF
  'point_forward',
  'three_and_d_wing',
  'three_level_wing',
  'athletic_finisher',
  // PF
  'stretch_four',
  'two_way_forward',
  'post_bully',
  'glass_cleaner',
  // C
  'rim_protector',
  'stretch_five',
  'back_to_basket_hub',
  'lob_threat',
] as const;
export type ArchetypeId = (typeof ARCHETYPE_IDS)[number];

/** Which award families an archetype is built to chase. */
export interface AwardAffinity {
  scoring: number;
  playmaking: number;
  defense: number;
  rebounding: number;
}

export interface ArchetypeDef {
  id: ArchetypeId;
  label: string;
  position: Position;
  comps: string;
  blurb: string;
  /** Starting deltas from the flat baseline. */
  ratingBias: Partial<Ratings>;
  /** Relative growth rate per rating (1 = average). */
  growthWeights: Partial<Record<RatingKey, number>>;
  awardAffinity: AwardAffinity;
}

// ---------------------------------------------------------------------------
// Profile / inputs
// ---------------------------------------------------------------------------

export interface PlayerProfile {
  name: string;
  position: Position;
  archetype: ArchetypeId;
  market: Market;
}

export interface ChoiceSelection {
  /** `highschool` | `recruiting` | `landing` | `s1` | `s2` | ... */
  nodeId: string;
  choiceId: string;
}

// ---------------------------------------------------------------------------
// Prologue scenario nodes (high school, recruiting)
// ---------------------------------------------------------------------------

export interface ChoiceOutcome {
  ratings?: Partial<Ratings>;
  athleticism?: number;
  durability?: number;
  hype?: number;
  draftStock?: number;
  headline: string;
}

export interface PrologueContext {
  rng: Rng;
  profile: PlayerProfile;
  state: CareerState;
}

export interface PrologueChoice {
  id: string;
  label: string;
  blurb: string;
  resolve: (ctx: PrologueContext) => ChoiceOutcome;
}

export interface PrologueNode {
  id: 'highschool' | 'recruiting';
  stage: string;
  title: string;
  prompt: string;
  choices: PrologueChoice[];
}

export interface PrologueNodeView {
  id: string;
  stage: string;
  title: string;
  prompt: string;
  choices: Array<{ id: string; label: string; blurb: string }>;
}

// ---------------------------------------------------------------------------
// Offers (landing spot, free agency)
// ---------------------------------------------------------------------------

export interface TeamOffer {
  choiceId: string;
  team: TeamRef;
  window: TeamWindow;
  projectedRole: Role;
  projectedMpg: number;
  years: number;
  pitch: string;
}

// ---------------------------------------------------------------------------
// Season decisions & events
// ---------------------------------------------------------------------------

export interface SeasonDecisionOption {
  id: string;
  label: string;
  blurb: string;
}

export interface SeasonDecisionNode {
  /** `s1`, `s2`, ... */
  nodeId: string;
  kind: 'offseason' | 'free_agency';
  age: number;
  phase: CareerPhase;
  title: string;
  prompt: string;
  options: SeasonDecisionOption[];
}

// ---------------------------------------------------------------------------
// Awards
// ---------------------------------------------------------------------------

export const AWARD_IDS = [
  'roy',
  'all_rookie',
  'all_star',
  'all_nba_1',
  'all_nba_2',
  'all_nba_3',
  'all_defense_1',
  'all_defense_2',
  'scoring_title',
  'rebounding_title',
  'assists_title',
  'steals_title',
  'blocks_title',
  'mip',
  'sixth_man',
  'clutch_poy',
  'dpoy',
  'mvp',
  'champion',
  'finals_mvp',
  'wc_gold',
  'wc_silver',
  'wc_bronze',
  'oly_gold',
  'oly_silver',
  'oly_bronze',
] as const;
export type AwardId = (typeof AWARD_IDS)[number];

export type AwardTally = Partial<Record<AwardId, number>>;

// ---------------------------------------------------------------------------
// Season & career records
// ---------------------------------------------------------------------------

export interface SeasonStatLine {
  gp: number;
  mpg: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  /** True shooting, 0..1. */
  tsPct: number;
}

export interface SeasonRecord {
  index: number;
  age: number;
  teamId: string;
  role: Role;
  phase: CareerPhase;
  decisionId: string;
  decisionHeadline: string;
  eventId: string;
  eventHeadline: string;
  stats: SeasonStatLine;
  teamResult: TeamResult;
  awards: AwardId[];
  overallAfter: number;
  ratingsAfter: Ratings;
  injuredGames: number;
}

export interface CareerTotals {
  seasons: number;
  games: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  ppg: number;
  rpg: number;
  apg: number;
}

export type GradeLetter = 'S' | 'A' | 'B' | 'C' | 'D';

export type LegacyTier =
  | 'inner_circle'
  | 'all_timer'
  | 'hall_of_famer'
  | 'franchise_great'
  | 'quality_starter'
  | 'solid_pro'
  | 'journeyman'
  | 'cup_of_coffee';

export interface Legacy {
  score: number;
  grade: GradeLetter;
  tier: LegacyTier;
  hallOfFame: boolean;
  jerseyRetired: boolean;
  jerseyRetiredBy: string | null;
  verdict: string;
}

export interface DraftResult {
  undrafted: boolean;
  pick: number | null;
  round: 1 | 2 | null;
}

export interface TimelineEntry {
  nodeId: string;
  choiceId: string;
  stage: string;
  headline: string;
}

// ---------------------------------------------------------------------------
// Live simulation state
// ---------------------------------------------------------------------------

export interface CareerState {
  age: number;
  seasonIndex: number;
  /** Per-career development ceiling multiplier (~0.8 role player … ~1.3 superstar). */
  talent: number;
  ratings: Ratings;
  athleticism: number;
  durability: number;
  hype: number;
  draftStock: number;
  draft: DraftResult | null;
  team: TeamRef | null;
  contractYearsLeft: number;
  retirementEligible: boolean;
  forcedRetire: boolean;
  careerEndingInjury: boolean;
  peakOverall: number;
  seasons: SeasonRecord[];
  awards: AwardTally;
  timeline: TimelineEntry[];
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export interface CareerSummary {
  engineVersion: string;
  seed: number;
  profile: PlayerProfile;
  choices: ChoiceSelection[];
  draft: DraftResult;
  rookieTeam: TeamRef;
  seasons: SeasonRecord[];
  finalRatings: Ratings;
  finalOverall: number;
  peakOverall: number;
  awards: AwardTally;
  careerTotals: CareerTotals;
  legacy: Legacy;
  timeline: TimelineEntry[];
}
