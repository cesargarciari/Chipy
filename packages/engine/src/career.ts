import {
  clampRatings,
  overallFor,
  rollStartingAthleticism,
  rollStartingDraftStock,
  rollStartingDurability,
  rollStartingHype,
  rollStartingRatings,
} from './ratings.js';
import { clamp, type Rng } from './rng.js';
import {
  RATING_KEYS,
  type AwardId,
  type AwardTally,
  type CareerState,
  type ChoiceOutcome,
  type PlayerProfile,
  type Ratings,
  type TimelineEntry,
} from './types.js';

export const START_AGE = 19;

/** Build the starting career state from the profile and the seeded RNG. */
export function createInitialState(rng: Rng, profile: PlayerProfile): CareerState {
  const ratings = rollStartingRatings(rng, profile.archetype);
  const overall = overallFor(profile.position, ratings);
  const athleticism = rollStartingAthleticism(rng, profile.position);
  const durability = rollStartingDurability(rng);
  const hype = rollStartingHype(rng, overall, profile.market);
  const draftStock = rollStartingDraftStock(rng, overall, hype);

  return {
    age: START_AGE,
    seasonIndex: 0,
    talent: 1,
    ratings,
    athleticism,
    durability,
    hype,
    draftStock,
    draft: null,
    team: null,
    contractYearsLeft: 0,
    retirementEligible: false,
    forcedRetire: false,
    careerEndingInjury: false,
    peakOverall: overall,
    seasons: [],
    awards: {},
    timeline: [],
  };
}

export function addRatings(base: Ratings, deltas: Partial<Ratings>): Ratings {
  const next = { ...base };
  for (const key of RATING_KEYS) {
    next[key] = base[key] + (deltas[key] ?? 0);
  }
  return clampRatings(next);
}

export function tallyAward(tally: AwardTally, id: AwardId): void {
  tally[id] = (tally[id] ?? 0) + 1;
}

/**
 * Apply a prologue choice outcome to the state, returning a new state (the
 * input is never mutated).
 */
export function applyPrologueOutcome(
  state: CareerState,
  entry: Omit<TimelineEntry, 'headline'>,
  outcome: ChoiceOutcome,
): CareerState {
  return {
    ...state,
    ratings: outcome.ratings ? addRatings(state.ratings, outcome.ratings) : state.ratings,
    athleticism: clamp(state.athleticism + (outcome.athleticism ?? 0), 0, 100),
    durability: clamp(state.durability + (outcome.durability ?? 0), 0, 100),
    hype: clamp(state.hype + (outcome.hype ?? 0), 0, 100),
    draftStock: clamp(state.draftStock + (outcome.draftStock ?? 0), 0, 100),
    timeline: [...state.timeline, { ...entry, headline: outcome.headline }],
  };
}
