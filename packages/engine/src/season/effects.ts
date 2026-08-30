import type { AwardAffinity, OptionStance, RatingKey, Ratings, Role } from '../types.js';

/**
 * The knobs an offseason decision or an in-season event turns for one season.
 * Everything is optional and additive; the season pipeline reads them in
 * `growth.ts`, `season-sim.ts`, `awards.ts`, and `simulate.ts`.
 */
export interface SeasonEffect {
  /** Flat per-rating growth added on top of the age-curve growth this season. */
  growth?: Partial<Record<RatingKey, number>>;
  /** Immediate rating deltas applied before growth (injuries, breakouts). */
  ratings?: Partial<Ratings>;
  athleticism?: number;
  durability?: number;
  hype?: number;
  /** Delta to team chemistry (0..100). Negative from drama, positive from bonding. */
  chemistry?: number;
  /** A flat overall drop - subtracted from every rating so the OVR falls by ~this. */
  overallHit?: number;
  /** Nudges playing-time role up/down (in role ranks). */
  roleBias?: number;
  /** Adds to minutes-per-game target. */
  mpgBias?: number;
  /** Scales personal box-score impact (usage / shot volume). */
  impactMult?: number;
  /** Scales the team's playoff ceiling this season. */
  teamMult?: number;
  /** Multipliers layered onto the archetype's award affinity. */
  awardMult?: Partial<AwardAffinity>;
  /** Games missed to injury this season. */
  injuredGames?: number;
  /** Force a mid-season team change (event only). */
  forceTrade?: boolean;
  /** Mark the player retirement-eligible / career over (event only). */
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

/** An option's strategy knobs → a one-season `SeasonEffect` (growth bias is handled elsewhere). */
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
