/**
 * Bump when the simulation math changes in a way that would alter results for an
 * existing `(seed, profile, choices)` tuple. Stored on every `CareerSummary` so
 * the API can tell whether a persisted career predates the current rules.
 */
export const ENGINE_VERSION = '4.6.0';

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

/** Radar-axis labels. */
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

/** Compact tags used for effect chips and card watermarks. */
export const ATTR_TAGS: Record<string, string> = {
  finishing: 'FIN',
  midRange: 'MID',
  threePoint: '3PT',
  playmaking: 'PLY',
  perimeterDefense: 'DEF',
  interiorDefense: 'RIM',
  rebounding: 'REB',
  basketballIQ: 'IQ',
  athleticism: 'ATH',
  durability: 'DUR',
  hype: 'FAME',
};

/** Human labels for effect chips. */
export const ATTR_LABELS: Record<string, string> = {
  finishing: 'FINISHING',
  midRange: 'MID-RANGE',
  threePoint: 'THREE-POINT',
  playmaking: 'PLAYMAKING',
  perimeterDefense: 'PERIMETER D',
  interiorDefense: 'INTERIOR D',
  rebounding: 'REBOUNDING',
  basketballIQ: 'BASKETBALL IQ',
  athleticism: 'ATHLETICISM',
  durability: 'DURABILITY',
  hype: 'FAME',
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

export interface CountryRef {
  id: string;
  name: string;
  flag: string;
  /** Basketball pedigree 0..1 — weights national-team medal odds. */
  pedigree: number;
}

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
  ratingBias: Partial<Ratings>;
  growthWeights: Partial<Record<RatingKey, number>>;
  awardAffinity: AwardAffinity;
}

// ---------------------------------------------------------------------------
// The one option model (prologue, college, season scenarios all use it)
// ---------------------------------------------------------------------------

/** Deterministic, player-visible effect of choosing an option — shown as chips. */
export interface OptionEffect {
  ratings?: Partial<Ratings>;
  athleticism?: number;
  durability?: number;
  hype?: number;
  draftStock?: number;
  /** One-off cash: `+$18M` (endorsement) or `-$2M` (a perk purchase). */
  money?: number;
}

/** Strategy knobs — shown as a one-word tag, not chips. */
export interface OptionStance {
  roleBias?: number;
  impactMult?: number;
  teamMult?: number;
  awardMult?: Partial<AwardAffinity>;
  /** Ongoing per-rating growth nudge; lasts `growthBiasSeasons` seasons (default 3). */
  growthBias?: Partial<Record<RatingKey, number>>;
  growthBiasSeasons?: number;
  /** Multiplier folded into market value for `valueMultSeasons` seasons (default 3). */
  valueMult?: number;
  valueMultSeasons?: number;
  /** Force a mid-season team change this year (mid-season scenarios). */
  forceTrade?: boolean;
  /** Games lost to injury this year (mid-season scenarios). */
  injuredGames?: number;
  tag?: string;
}

export interface GameOption {
  /** Globally unique across all option pools — stored as the `choiceId`. */
  id: string;
  label: string;
  blurb: string;
  effect: OptionEffect;
  stance?: OptionStance;
  /** Watermark override; otherwise derived from the biggest effect. */
  watermark?: string;
  /** A once-a-career breakthrough — the client renders it gold. */
  rare?: boolean;
}

/** One rendered effect chip: `+8 FINISHING`. */
export interface EffectChip {
  key: string;
  label: string;
  short: string;
  /** The delta the player will *actually* get (clamped to the 25–99 band). */
  delta: number;
  /** What the option nominally promised, if `delta` had to be trimmed at the cap. */
  nominal?: number;
}

/** The serialisable view of an option for the client. */
export interface OptionView {
  id: string;
  label: string;
  blurb: string;
  effects: EffectChip[];
  tag?: string;
  watermark: string;
  rare?: boolean;
}

// ---------------------------------------------------------------------------
// Profile / inputs
// ---------------------------------------------------------------------------

export type Handedness = 'left' | 'right';

export interface PlayerProfile {
  name: string;
  position: Position;
  archetype: ArchetypeId;
  market: Market;
  jerseyNumber: number;
  country: string;
  handedness: Handedness;
}

export interface ChoiceSelection {
  /** `highschool` | `recruiting` | `college1..3` | `cy1..3` | `landing` | `s1..` */
  nodeId: string;
  choiceId: string;
}

// ---------------------------------------------------------------------------
// Prologue scenario nodes (high school, recruiting)
// ---------------------------------------------------------------------------

export interface PrologueNode {
  id: 'highschool' | 'recruiting';
  stage: string;
  title: string;
  prompt: string;
  options: GameOption[];
}

export interface PrologueNodeView {
  id: string;
  stage: string;
  title: string;
  prompt: string;
  options: OptionView[];
}

// ---------------------------------------------------------------------------
// College
// ---------------------------------------------------------------------------

export type SchoolTier = 'blue_blood' | 'mid_major' | 'overseas';

export interface SchoolRef {
  id: string;
  name: string;
  tier: SchoolTier;
  /** 0..1 — tournament ceiling + draft-stock pedigree. */
  prestige: number;
  /** 0..1 — "NBA factory" bonus to draft stock. */
  nbaPedigree: number;
  style: {
    /** 0..1 — how much of the offense runs through you. */
    usage: number;
    dev: Partial<Record<RatingKey, number>>;
  };
}

export interface CollegeStatLine {
  gp: number;
  ppg: number;
  rpg: number;
  apg: number;
  fgPct: number;
}

export interface CollegeSeason {
  year: number;
  school: string;
  stats: CollegeStatLine;
  result: string;
  headline: string;
}

export interface College {
  finalSchool: string;
  tier: SchoolTier;
  years: CollegeSeason[];
}

// ---------------------------------------------------------------------------
// Economy · perks · overseas
// ---------------------------------------------------------------------------

export type League = 'nba' | 'overseas';

export type InjurySeverity = 'knock' | 'strain' | 'moderate' | 'severe';

export interface InjuryEntry {
  seasonIndex: number;
  /** Human name — `torn ACL`, `hamstring strain`, `broken finger`, … */
  type: string;
  gamesMissed: number;
  severity?: InjurySeverity;
}

export type PerkKind = 'yearly' | 'permanent';
export type PerkCategory = 'training' | 'body' | 'brand' | 'analytics' | 'facility';

/** How a perk changes the sim while owned (yearly) or forever (permanent). */
export interface PerkEffect {
  growthBias?: Partial<Record<RatingKey, number>>;
  durabilityPerYear?: number;
  /** 0..1 — scales injury games + injury-event odds down. */
  injuryResist?: number;
  impactMult?: number;
  awardMult?: Partial<AwardAffinity>;
  hypePerYear?: number;
  /** 0..1 — cuts the odds of bad in-season events. */
  slumpResist?: number;
  /** Multiplier on market value. */
  valueMult?: number;
}

export interface PerkDef {
  id: string;
  name: string;
  blurb: string;
  category: PerkCategory;
  kind: PerkKind;
  /** $M — one-off for permanent, per-year for yearly. */
  cost: number;
  /** Earliest season this can be bought. */
  minSeason?: number;
  effect: PerkEffect;
}

export interface ClubRef {
  id: string;
  name: string;
  country: string;
  /** 0..1 — EuroLeague / domestic ceiling. */
  prestige: number;
}

export type EuroResult =
  | 'euroleague_champion'
  | 'euroleague_final_four'
  | 'domestic_title'
  | 'euro_playoffs'
  | 'euro_missed';

export interface OverseasSeason {
  /** 1-based, on the same scale as `SeasonRecord.index` (counts every pro year). */
  index: number;
  age: number;
  club: string;
  country: string;
  stats: SeasonStatLine;
  result: EuroResult;
  awards: AwardId[];
  /** $M for this season. */
  salary: number;
  headline: string;
}

export interface ClubOffer {
  choiceId: string;
  club: ClubRef;
  years: number;
  salary: number;
  pitch: string;
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
  /** $M/yr on the table. */
  salary: number;
  pitch: string;
}

// ---------------------------------------------------------------------------
// Season decision node (public view)
// ---------------------------------------------------------------------------

export interface SeasonDecisionNode {
  nodeId: string;
  kind: 'scenario' | 'free_agency' | 'midseason';
  age: number;
  phase: CareerPhase;
  scenarioId: string;
  theme: string;
  title: string;
  prompt: string;
  options: OptionView[];
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
  'euroleague_champion',
  'euroleague_mvp',
  'euro_domestic_title',
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
  league: League;
  teamId: string;
  role: Role;
  phase: CareerPhase;
  scenarioId: string;
  decisionId: string;
  decisionHeadline: string;
  eventId: string;
  eventHeadline: string;
  /** Interactive mid-season situation, if one fired this year. */
  midseasonId: string | null;
  midseasonHeadline: string | null;
  stats: SeasonStatLine;
  teamResult: TeamResult;
  awards: AwardId[];
  overallAfter: number;
  ratingsAfter: Ratings;
  injuredGames: number;
  /** $M for this season. */
  salary: number;
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

// ---------------------------------------------------------------------------
// Franchise standing (how much one team's fans love you)
// ---------------------------------------------------------------------------

export type FranchiseTier = 'none' | 'known' | 'favorite' | 'cornerstone' | 'idol' | 'legend';

export interface FranchiseStanding {
  teamId: string;
  seasons: number;
  rings: number;
  score: number;
  tier: FranchiseTier;
  /** 0..100 toward legend — for an "idolatry" progress bar. */
  progress: number;
}

export interface NationalStanding {
  country: string;
  caps: number;
  medals: number;
  score: number;
  tier: FranchiseTier;
  progress: number;
}

// ---------------------------------------------------------------------------
// Career moments — the big end-of-season beats that get their own display
// ---------------------------------------------------------------------------

export type MomentKind =
  | 'award'
  | 'ring'
  | 'trade'
  | 'signing'
  | 'franchise'
  | 'shoe'
  | 'milestone'
  | 'midseason'
  | 'injury';

export interface CareerMoment {
  /** `SeasonRecord.index` of the season it belongs to. */
  seasonIndex: number;
  kind: MomentKind;
  /** Stable id for slotting artwork later (`mvp`, `champion`, `franchise_idol`, `shoe_apex`…). */
  id: string;
  title: string;
  subtitle: string;
  teamId?: string;
  awardId?: AwardId;
  /** For `midseason` — the option label the player chose. */
  choice?: string;
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

export interface GrowthBias {
  ratings: Partial<Record<RatingKey, number>>;
  seasonsLeft: number;
}

export interface ValueMod {
  mult: number;
  seasonsLeft: number;
}

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
  college: College | null;
  league: League;
  team: TeamRef | null;
  club: ClubRef | null;
  contractYearsLeft: number;
  retirementEligible: boolean;
  forcedRetire: boolean;
  careerEndingInjury: boolean;
  /** Set once the player has answered the pre-retirement farewell node. */
  farewellChosen: boolean;
  /** True during the single ceremonial season a "farewell tour" grants. */
  onFarewellTour: boolean;
  /** An injury rolled this season — consumed when the season record is written. */
  pendingInjury: InjuryEntry | null;
  peakOverall: number;
  // economy ($M)
  salary: number;
  bank: number;
  marketValue: number;
  careerEarnings: number;
  peakSalary: number;
  // perks
  ownedPerks: string[];
  yearlyPerks: string[];
  valueMods: ValueMod[];
  // life
  shoeDeal: string | null;
  injuryHistory: InjuryEntry[];
  overseasSeasons: OverseasSeason[];
  // franchise standing
  franchiseScore: Record<string, number>;
  franchiseSeasons: Record<string, number>;
  franchiseRings: Record<string, number>;
  franchiseTierSeen: Record<string, FranchiseTier>;
  seasonsWithTeam: number;
  // national team standing
  nationalRep: number;
  nationalCaps: number;
  nationalMedals: number;
  moments: CareerMoment[];
  seasons: SeasonRecord[];
  awards: AwardTally;
  timeline: TimelineEntry[];
  firedScenarioIds: string[];
  growthBiases: GrowthBias[];
  lastPlayedStats: SeasonStatLine | null;
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
  college: College | null;
  rookieTeam: TeamRef;
  seasons: SeasonRecord[];
  finalRatings: Ratings;
  finalOverall: number;
  peakOverall: number;
  awards: AwardTally;
  careerTotals: CareerTotals;
  legacy: Legacy;
  timeline: TimelineEntry[];
  // v4
  careerEarnings: number;
  peakSalary: number;
  perks: string[];
  shoeDeal: string | null;
  overseasSeasons: OverseasSeason[];
  injuryHistory: InjuryEntry[];
  // v4.2 — franchise standing + the career's big moments
  franchises: FranchiseStanding[];
  moments: CareerMoment[];
  // v4.4 — national-team standing
  nationalTeam: NationalStanding;
}
