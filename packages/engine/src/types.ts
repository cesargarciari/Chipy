/** Bump when rule changes would change the result of a saved career. */
export const ENGINE_VERSION = '4.21.0';

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
export type Position = (typeof POSITIONS)[number];

export const MARKETS = ['small', 'mid', 'large'] as const;
export type Market = (typeof MARKETS)[number];

/** The eight skills, also used as the radar axes. */
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
  | 'play_in'
  | 'lottery'
  | 'missed_season';

export type Role = 'franchise' | 'starter' | 'rotation' | 'bench' | 'fringe';

/** Where the player ranks in the league. Affects trade leverage. */
export type StatusTier = 'fringe' | 'role_player' | 'star' | 'superstar' | 'generational';

export const STATUS_TIER_LABELS: Record<StatusTier, string> = {
  fringe: 'Fringe / rotation',
  role_player: 'Role player',
  star: 'Star',
  superstar: 'Superstar',
  generational: 'Generational talent',
};

export type CareerPhase = 'rookie' | 'rising' | 'prime' | 'veteran' | 'decline';

export interface CountryRef {
  id: string;
  name: string;
  flag: string;
  /** Basketball strength from 0 to 1. Affects medal odds. */
  pedigree: number;
}

export const ARCHETYPE_IDS = [
  // PG
  'floor_general',
  'scoring_pg',
  'two_way_pg',
  'combo_guard',
  'sharpshooting_pg',
  'pace_setter',
  // SG
  'movement_shooter',
  'slashing_wing',
  'three_and_d_guard',
  'shot_creator',
  'pure_sniper',
  'two_way_two_guard',
  // SF
  'point_forward',
  'three_and_d_wing',
  'three_level_wing',
  'athletic_finisher',
  'all_around_wing',
  'perimeter_stopper',
  // PF
  'stretch_four',
  'two_way_forward',
  'post_bully',
  'glass_cleaner',
  'combo_forward',
  'energy_forward',
  // C
  'rim_protector',
  'stretch_five',
  'back_to_basket_hub',
  'lob_threat',
  'mobile_big',
  'skilled_center',
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
  /** Extra starting athleticism for explosive builds. */
  athBias?: number;
}

/** What picking an option does, shown as chips. */
export interface OptionEffect {
  ratings?: Partial<Ratings>;
  athleticism?: number;
  durability?: number;
  hype?: number;
  draftStock?: number;
  /** One-off cash, like an endorsement or a perk purchase. */
  money?: number;
}

/** Play style settings, shown as a single tag. */
export interface OptionStance {
  roleBias?: number;
  impactMult?: number;
  teamMult?: number;
  awardMult?: Partial<AwardAffinity>;
  /** Extra growth per rating for a few seasons (3 by default). */
  growthBias?: Partial<Record<RatingKey, number>>;
  growthBiasSeasons?: number;
  /** Market value multiplier for a few seasons (3 by default). */
  valueMult?: number;
  valueMultSeasons?: number;
  /** Force a mid-season team change this year (mid-season scenarios). */
  forceTrade?: boolean;
  /** Games lost to injury this year (mid-season scenarios). */
  injuredGames?: number;
  tag?: string;
}

export interface GameOption {
  /** Unique across every option pool. Saved as the choice id. */
  id: string;
  label: string;
  blurb: string;
  effect: OptionEffect;
  stance?: OptionStance;
  /** Overrides the card watermark. */
  watermark?: string;
  /** A once-a-career breakthrough, shown in gold. */
  rare?: boolean;
}

/** One rendered effect chip: `+8 FINISHING`. */
export interface EffectChip {
  key: string;
  label: string;
  short: string;
  /** The actual change after capping ratings to 25 to 99. */
  delta: number;
  /** The original promised change, if it got capped. */
  nominal?: number;
}

/** The option as sent to the client. */
export interface OptionView {
  id: string;
  label: string;
  blurb: string;
  effects: EffectChip[];
  tag?: string;
  watermark: string;
  rare?: boolean;
  /** NBA team or overseas club id, used for the logo. */
  teamId?: string;
}

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
  /** For example highschool, recruiting, college1, landing, s1. */
  nodeId: string;
  choiceId: string;
}

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

export type SchoolTier = 'blue_blood' | 'mid_major' | 'overseas';

export interface SchoolRef {
  id: string;
  name: string;
  tier: SchoolTier;
  /** 0 to 1. Affects tournament runs and draft stock. */
  prestige: number;
  /** 0 to 1. Bonus to draft stock for schools that produce NBA players. */
  nbaPedigree: number;
  style: {
    /** 0 to 1. How much of the offense runs through you. */
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

export type League = 'nba' | 'overseas';

export type InjurySeverity = 'knock' | 'strain' | 'moderate' | 'severe';

export interface InjuryEntry {
  seasonIndex: number;
  /** For example torn ACL or hamstring strain. */
  type: string;
  gamesMissed: number;
  severity?: InjurySeverity;
}

export type PerkKind = 'yearly' | 'permanent';
export type PerkCategory = 'training' | 'body' | 'brand' | 'analytics' | 'facility';

/** How a perk changes the simulation while you own it. */
export interface PerkEffect {
  growthBias?: Partial<Record<RatingKey, number>>;
  durabilityPerYear?: number;
  /** 0 to 1. Fewer games lost to injury. */
  injuryResist?: number;
  impactMult?: number;
  awardMult?: Partial<AwardAffinity>;
  hypePerYear?: number;
  /** 0 to 1. Fewer bad in-season events. */
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
  /** In millions. One-off for permanent perks, yearly for yearly ones. */
  cost: number;
  /** Earliest season this can be bought. */
  minSeason?: number;
  effect: PerkEffect;
}

export interface ClubRef {
  id: string;
  name: string;
  country: string;
  /** 0 to 1. How strong the club is. */
  prestige: number;
}

export type EuroResult =
  | 'euroleague_champion'
  | 'euroleague_final_four'
  | 'domestic_title'
  | 'euro_playoffs'
  | 'euro_missed';

export interface OverseasSeason {
  /** Same numbering as SeasonRecord.index. */
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
  /** Season grade from awards, club success and stats. */
  grade: GradeLetter;
}

export interface ClubOffer {
  choiceId: string;
  club: ClubRef;
  years: number;
  salary: number;
  pitch: string;
}

export interface TeamOffer {
  choiceId: string;
  team: TeamRef;
  window: TeamWindow;
  projectedRole: Role;
  projectedMpg: number;
  years: number;
  /** $M/yr on the table. */
  salary: number;
  /** 0 to 1 chance of a title if you sign here. */
  contender: number;
  pitch: string;
}

export interface SeasonDecisionNode {
  nodeId: string;
  kind: 'scenario' | 'free_agency' | 'midseason' | 'chemistry';
  age: number;
  phase: CareerPhase;
  scenarioId: string;
  theme: string;
  title: string;
  prompt: string;
  options: OptionView[];
}

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
  'oly_gold',
  'oly_silver',
  'oly_bronze',
  'euroleague_champion',
  'euroleague_mvp',
  'euro_domestic_title',
] as const;
export type AwardId = (typeof AWARD_IDS)[number];

export type AwardTally = Partial<Record<AwardId, number>>;

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
  /** The mid-season situation this year, if any. */
  midseasonId: string | null;
  midseasonHeadline: string | null;
  /** How the Finals possession went, if the team got there. */
  finalsHeadline: string | null;
  stats: SeasonStatLine;
  teamResult: TeamResult;
  awards: AwardId[];
  overallAfter: number;
  ratingsAfter: Ratings;
  injuredGames: number;
  /** $M for this season. */
  salary: number;
  /** A one-line recap of the season. */
  recap: string;
  /** Conference finish, 1 is best and 15 is worst. */
  seed: number;
  /** Season grade from awards, team success and stats. */
  grade: GradeLetter;
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

export type FranchiseTier = 'none' | 'known' | 'favorite' | 'cornerstone' | 'idol' | 'legend';

export interface FranchiseStanding {
  teamId: string;
  seasons: number;
  rings: number;
  score: number;
  tier: FranchiseTier;
  /** 0 to 100 progress toward legend status. */
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
  /** Which season this belongs to. */
  seasonIndex: number;
  kind: MomentKind;
  /** Stable id used to pick the artwork, like mvp or champion. */
  id: string;
  title: string;
  subtitle: string;
  teamId?: string;
  awardId?: AwardId;
  /** The option the player picked, for mid-season moments. */
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
  /** Growth ceiling multiplier, from about 0.8 for role players to 1.3 for superstars. */
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
  /** True once the player has made the farewell choice. */
  farewellChosen: boolean;
  /** True during the farewell tour season. */
  onFarewellTour: boolean;
  /** Seasons left as a contender after a title (5 after each ring). */
  ringWindowLeft: number;
  /** True the season after a trade, so trades don't happen back to back. */
  justTraded: boolean;
  /** 0 to 100. How well you get along with teammates. */
  chemistry: number;
  /** An injury from this season, saved into the season record. */
  pendingInjury: InjuryEntry | null;
  peakOverall: number;
  // Money (in millions)
  salary: number;
  bank: number;
  marketValue: number;
  careerEarnings: number;
  peakSalary: number;
  // Perks
  ownedPerks: string[];
  yearlyPerks: string[];
  valueMods: ValueMod[];
  // Life
  shoeDeal: string | null;
  injuryHistory: InjuryEntry[];
  overseasSeasons: OverseasSeason[];
  // Franchise standing
  franchiseScore: Record<string, number>;
  franchiseSeasons: Record<string, number>;
  franchiseRings: Record<string, number>;
  franchiseTierSeen: Record<string, FranchiseTier>;
  seasonsWithTeam: number;
  // National team standing
  nationalRep: number;
  nationalCaps: number;
  nationalMedals: number;
  moments: CareerMoment[];
  seasons: SeasonRecord[];
  awards: AwardTally;
  timeline: TimelineEntry[];
  firedScenarioIds: string[];
  firedChemistryIds: string[];
  /** Season of the last chemistry question, to keep them spaced out. */
  lastChemistrySeason: number;
  growthBiases: GrowthBias[];
  lastPlayedStats: SeasonStatLine | null;
}

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
  careerEarnings: number;
  peakSalary: number;
  perks: string[];
  shoeDeal: string | null;
  overseasSeasons: OverseasSeason[];
  injuryHistory: InjuryEntry[];
  // Franchise standing and big moments
  franchises: FranchiseStanding[];
  moments: CareerMoment[];
  // National team standing
  nationalTeam: NationalStanding;
}
