/**
 * `@chipy/engine` - the pure, framework-free NBA career simulation.
 *
 * Nothing here touches the network, the DOM, the filesystem, or the clock
 * (except `randomSeed`). `runCareer` replays an entire career deterministically
 * from `(seed, profile, choices)` - the browser runs it for instant play, the
 * API runs it as the source of truth.
 */

export {
  ENGINE_VERSION,
  POSITIONS,
  ARCHETYPE_IDS,
  MARKETS,
  CONFERENCES,
  RATING_KEYS,
  RATING_LABELS,
  ATTR_TAGS,
  ATTR_LABELS,
  RATING_FLOOR,
  RATING_CEIL,
  AWARD_IDS,
  STATUS_TIER_LABELS,
} from './types.js';

export type {
  Position,
  ArchetypeId,
  Market,
  Conference,
  RatingKey,
  Ratings,
  CountryRef,
  TeamRef,
  TeamWindow,
  TeamResult,
  Role,
  CareerPhase,
  ArchetypeDef,
  AwardAffinity,
  PlayerProfile,
  ChoiceSelection,
  GameOption,
  OptionEffect,
  OptionStance,
  OptionView,
  EffectChip,
  PrologueNodeView,
  SchoolRef,
  SchoolTier,
  CollegeStatLine,
  CollegeSeason,
  College,
  TeamOffer,
  SeasonDecisionNode,
  AwardId,
  AwardTally,
  SeasonStatLine,
  SeasonRecord,
  CareerTotals,
  GradeLetter,
  LegacyTier,
  Legacy,
  DraftResult,
  TimelineEntry,
  CareerSummary,
  League,
  PerkKind,
  PerkCategory,
  PerkEffect,
  PerkDef,
  ClubRef,
  ClubOffer,
  EuroResult,
  OverseasSeason,
  InjuryEntry,
  InjurySeverity,
  ValueMod,
  FranchiseTier,
  FranchiseStanding,
  NationalStanding,
  MomentKind,
  CareerMoment,
  Handedness,
  StatusTier,
} from './types.js';

export { mulberry32, normalizeSeed, randomSeed, type Rng } from './rng.js';

export { overallFor } from './ratings.js';
export { ARCHETYPE_DEFS, getArchetype, archetypesFor } from './archetypes.js';
export { TEAMS, getTeam, teamLabel } from './data/teams.js';
export { COUNTRIES, getCountry } from './data/countries.js';
export { SCHOOLS, getSchool, schoolsForTier } from './data/schools.js';
export { PERKS, getPerk, perkExists } from './data/perks.js';
export { EURO_CLUBS, getEuroClub } from './data/euro-clubs.js';
export { prologueViews } from './scenarios/index.js';
export { describeEffects, optionView } from './options.js';
export { SCENARIOS, buildScenarioIndex } from './season/scenarios/index.js';
export { SHOE_BRANDS } from './season/scenarios/shoe.js';
export { MIDSEASON_SCENARIOS, buildMidseasonIndex } from './season/midseason.js';
export { CHEMISTRY_SCENARIOS } from './season/chemistry.js';
export { FRANCHISE_TIER_LABELS, franchiseTier, franchiseProgress } from './season/franchise.js';
export { buildNationalStanding, nationalProgress } from './season/national.js';
export { eligibleScenarios } from './season/scenario-select.js';
export {
  INJURY_CATALOG,
  rollSeasonInjury,
  seasonInjuryChance,
  type InjuryRollCtx,
  type RolledInjury,
} from './season/injuries.js';
export { statusTier, statusRank, tradeChance } from './season/status.js';
export {
  buildPerkShop,
  perkHighlightKeys,
  perkEffectTags,
  type AggregatePerkEffect,
  type PerkShop,
  type PerkShopItem,
} from './season/perks.js';
export { describeChoice } from './describe.js';

export {
  playerProfileSchema,
  choiceSelectionSchema,
  runCareerInputSchema,
} from './input-schema.js';
export type { PlayerProfileInput, ChoiceSelectionInput, RunCareerInput } from './input-schema.js';

export {
  runCareer,
  type RunCareerArgs,
  type RunCareerResult,
  type PendingDecision,
  type SeasonPreview,
} from './simulate.js';
