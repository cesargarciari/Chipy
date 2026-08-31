import { getArchetype } from './archetypes.js';
import {
  overallFor,
  rollStartingAthleticism,
  rollStartingDraftStock,
  rollStartingDurability,
  rollStartingHype,
  rollStartingRatings,
} from './ratings.js';
import type { Rng } from './rng.js';
import type { AwardId, AwardTally, CareerState, PlayerProfile } from './types.js';

export const START_AGE = 19;

/** Build the starting career state from the profile and the seeded RNG. */
export function createInitialState(rng: Rng, profile: PlayerProfile): CareerState {
  const ratings = rollStartingRatings(rng, profile.archetype);
  const overall = overallFor(profile.position, ratings);
  const athleticism = rollStartingAthleticism(
    rng,
    profile.position,
    getArchetype(profile.archetype).athBias,
  );
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
    college: null,
    league: 'nba',
    team: null,
    club: null,
    contractYearsLeft: 0,
    retirementEligible: false,
    forcedRetire: false,
    careerEndingInjury: false,
    farewellChosen: false,
    onFarewellTour: false,
    ringWindowLeft: 0,
    justTraded: false,
    chemistry: 40 + Math.round(rng() * 30), // 40..70 - earned over a career
    pendingInjury: null,
    peakOverall: overall,
    salary: 0,
    bank: 0,
    marketValue: 0,
    careerEarnings: 0,
    peakSalary: 0,
    ownedPerks: [],
    yearlyPerks: [],
    valueMods: [],
    shoeDeal: null,
    injuryHistory: [],
    overseasSeasons: [],
    franchiseScore: {},
    franchiseSeasons: {},
    franchiseRings: {},
    franchiseTierSeen: {},
    seasonsWithTeam: 0,
    nationalRep: 0,
    nationalCaps: 0,
    nationalMedals: 0,
    moments: [],
    seasons: [],
    awards: {},
    timeline: [],
    firedScenarioIds: [],
    firedChemistryIds: [],
    lastChemistrySeason: 0,
    growthBiases: [],
    lastPlayedStats: null,
  };
}

export function tallyAward(tally: AwardTally, id: AwardId): void {
  tally[id] = (tally[id] ?? 0) + 1;
}
