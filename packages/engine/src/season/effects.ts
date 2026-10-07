import type { AwardAffinity, OptionStance, RatingKey, Ratings, Role } from '../types.js';

/** Everything a decision or event can change for one season. All fields are optional. */
export interface SeasonEffect {
  /** Extra growth per rating this season. */
  growth?: Partial<Record<RatingKey, number>>;
  /** Rating changes applied before growth. */
  ratings?: Partial<Ratings>;
  athleticism?: number;
  durability?: number;
  hype?: number;
  /** Change in team chemistry. */
  chemistry?: number;
  /** Overall drop, taken from every rating. */
  overallHit?: number;
  /** Moves the player's role up or down. */
  roleBias?: number;
  /** Adds to minutes per game. */
  mpgBias?: number;
  /** Scales the player's stats. */
  impactMult?: number;
  /** Scales the team's playoff chances. */
  teamMult?: number;
  /** Award odds multipliers. */
  awardMult?: Partial<AwardAffinity>;
  /** Games missed to injury this season. */
  injuredGames?: number;
  /** Forces a mid-season trade. */
  forceTrade?: boolean;
  /** Lets the player retire. */
  retirementEligible?: boolean;
  careerEnding?: boolean;
}

export function mergeEffects(a: SeasonEffect, b: SeasonEffect): SeasonEffect {
  const growth = { ...(a.growth ?? {}) };
  for (const [k, v] of Object.entries(b.growth ?? {})) {
    growth[k as RatingKey] = (growth[k as RatingKey] ?? 0) + (v ?? 0);
  }
  const ratings = { ...(a.ratings ?? {}) };
  for (const [k, v] of Object.entries(b.ratings ?? {})) {
    ratings[k as RatingKey] = (ratings[k as RatingKey] ?? 0) + (v ?? 0);
  }
  return {
    growth,
    ratings,
    athleticism: (a.athleticism ?? 0) + (b.athleticism ?? 0),
    durability: (a.durability ?? 0) + (b.durability ?? 0),
    hype: (a.hype ?? 0) + (b.hype ?? 0),
    chemistry: (a.chemistry ?? 0) + (b.chemistry ?? 0),
    overallHit: (a.overallHit ?? 0) + (b.overallHit ?? 0),
    roleBias: (a.roleBias ?? 0) + (b.roleBias ?? 0),
    mpgBias: (a.mpgBias ?? 0) + (b.mpgBias ?? 0),
    impactMult: (a.impactMult ?? 1) * (b.impactMult ?? 1),
    teamMult: (a.teamMult ?? 1) * (b.teamMult ?? 1),
    awardMult: {
      scoring: (a.awardMult?.scoring ?? 1) * (b.awardMult?.scoring ?? 1),
      playmaking: (a.awardMult?.playmaking ?? 1) * (b.awardMult?.playmaking ?? 1),
      defense: (a.awardMult?.defense ?? 1) * (b.awardMult?.defense ?? 1),
      rebounding: (a.awardMult?.rebounding ?? 1) * (b.awardMult?.rebounding ?? 1),
    },
    injuredGames: (a.injuredGames ?? 0) + (b.injuredGames ?? 0),
    forceTrade: a.forceTrade || b.forceTrade,
    retirementEligible: a.retirementEligible || b.retirementEligible,
    careerEnding: a.careerEnding || b.careerEnding,
  };
}

export const EMPTY_EFFECT: SeasonEffect = {};

/** Turns an option's play style into a season effect. */
export function stanceToEffect(stance: OptionStance | undefined): SeasonEffect {
  if (!stance) return {};
  return {
    roleBias: stance.roleBias,
    impactMult: stance.impactMult,
    teamMult: stance.teamMult,
    awardMult: stance.awardMult,
    forceTrade: stance.forceTrade,
    injuredGames: stance.injuredGames,
  };
}

export type { Role };
