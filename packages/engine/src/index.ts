/**
 * `@chipy/engine` — the pure, framework-free NBA career simulation.
 *
 * Nothing here touches the network, the DOM, the filesystem, or the clock
 * (except `randomSeed`). `runCareer` replays an entire career deterministically
 * from `(seed, profile, choices)` — the browser runs it for instant play, the
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
  RATING_FLOOR,
  RATING_CEIL,
  AWARD_IDS,
} from './types.js';

export type {
  Position,
  ArchetypeId,
  Market,
  Conference,
  RatingKey,
  Ratings,
  TeamRef,
  TeamWindow,
  TeamResult,
  Role,
  CareerPhase,
  ArchetypeDef,
  AwardAffinity,
  PlayerProfile,
  ChoiceSelection,
  PrologueNodeView,
  TeamOffer,
  SeasonDecisionOption,
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
} from './types.js';

export { mulberry32, normalizeSeed, randomSeed, type Rng } from './rng.js';

export { overallFor } from './ratings.js';
export { ARCHETYPE_DEFS, getArchetype, archetypesFor } from './archetypes.js';
export { TEAMS, getTeam, teamLabel } from './data/teams.js';
export { prologueViews } from './scenarios/index.js';
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
