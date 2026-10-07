import { clamp, int, weightedPick, type Rng } from '../rng.js';
import type { InjurySeverity } from '../types.js';

export interface InjuryRollCtx {
  age: number;
  /** 20 to 100. The biggest factor in how often you get hurt. */
  durability: number;
  /** Past injuries make new ones more likely. */
  injuryCount: number;
  /** 0 to 1 from perks. Lowers injury odds. */
  injuryResist: number;
}

export interface RolledInjury {
  type: string;
  severity: InjurySeverity;
  gamesMissed: number;
  /** True when the injury ends the season. */
  seasonEnding: boolean;
  /** Permanent athleticism loss. */
  athleticismHit: number;
  durabilityHit: number;
  /** Overall drop applied to every rating. */
  overallHit: number;
  /** Ends the career on the spot. */
  careerEnding: boolean;
  /** Lets the player choose to retire. */
  retirementEligible: boolean;
}

interface InjuryType {
  type: string;
  severity: InjurySeverity;
  /** How common this injury is compared to others. */
  weight: number;
  games: [number, number];
  athHit?: [number, number];
  durHit?: [number, number];
  /** Overall drop range. Only serious injuries have one. */
  ovrHit?: [number, number];
  /** true means always season-ending, a number is the chance it is. */
  seasonEnding?: true | number;
  /** Chance it ends the career. */
  endBase?: number;
}

/** All injuries. Minor ones cost a few games. Only the serious knee and achilles injuries drop your overall for good or can end a career. */
export const INJURY_CATALOG: readonly InjuryType[] = [
  { type: 'jammed finger', severity: 'knock', weight: 15, games: [1, 4] },
  { type: 'broken finger', severity: 'knock', weight: 8, games: [4, 11] },
  { type: 'sprained ankle', severity: 'strain', weight: 20, games: [4, 15], durHit: [0, 1] },
  { type: 'deep thigh bruise', severity: 'strain', weight: 7, games: [3, 9] },
  { type: 'calf strain', severity: 'strain', weight: 12, games: [7, 19], durHit: [0, 1] },
  { type: 'hamstring strain', severity: 'strain', weight: 12, games: [9, 24], durHit: [1, 2] },
  { type: 'groin strain', severity: 'strain', weight: 8, games: [7, 18], durHit: [0, 1] },
  { type: 'sprained wrist', severity: 'strain', weight: 6, games: [4, 12] },
  { type: 'high ankle sprain', severity: 'moderate', weight: 7, games: [14, 30], durHit: [1, 2] },
  { type: 'back spasms', severity: 'moderate', weight: 7, games: [6, 20], durHit: [1, 2] },
  {
    type: 'dislocated shoulder',
    severity: 'moderate',
    weight: 4,
    games: [12, 28],
    durHit: [1, 3],
  },
  {
    type: 'foot stress fracture',
    severity: 'moderate',
    weight: 5,
    games: [22, 42],
    athHit: [1, 3],
    durHit: [1, 3],
  },
  {
    type: 'torn meniscus',
    severity: 'moderate',
    weight: 5,
    games: [30, 55],
    athHit: [2, 4],
    durHit: [2, 4],
    ovrHit: [2, 3],
    seasonEnding: 0.55, // the surgery-vs-rehab call
  },
  {
    type: 'torn ACL',
    severity: 'severe',
    weight: 2.2,
    games: [82, 82],
    athHit: [3, 6],
    durHit: [3, 6],
    ovrHit: [2, 3],
    seasonEnding: true,
    endBase: 0.08,
  },
  {
    type: 'torn Achilles',
    severity: 'severe',
    weight: 1.6,
    games: [82, 82],
    athHit: [4, 8],
    durHit: [3, 7],
    ovrHit: [2, 3],
    seasonEnding: true,
    endBase: 0.16,
  },
  {
    type: 'ruptured patellar tendon',
    severity: 'severe',
    weight: 1.1,
    games: [82, 82],
    athHit: [4, 8],
    durHit: [4, 8],
    ovrHit: [2, 3],
    seasonEnding: true,
    endBase: 0.2,
  },
];

/** Chance of any injury this season, between 6% and 85%. Low durability matters most. */
export function seasonInjuryChance(c: InjuryRollCtx): number {
  const frail = (100 - clamp(c.durability, 20, 100)) / 100; // 0 (iron) .. 0.8
  const ageRisk = c.age <= 27 ? 0 : (c.age - 27) * 0.02;
  const wear = Math.min(0.12, c.injuryCount * 0.03);
  let p = 0.14 + frail * 0.5 + ageRisk + wear;
  p *= 1 - 0.6 * clamp(c.injuryResist, 0, 1);
  return clamp(p, 0.05, 0.8);
}

/** Older or fragile players get worse injuries. */
function severityScale(c: InjuryRollCtx): Record<InjurySeverity, number> {
  const frail = (100 - clamp(c.durability, 20, 100)) / 100; // 0..0.8
  const aged = clamp((c.age - 28) / 12, 0, 1); // 0..1
  const nasty = frail * 0.9 + aged * 0.7; // 0..~1.4
  return {
    knock: 1,
    strain: 1,
    moderate: 0.85 + nasty * 0.5,
    severe: 0.45 + nasty * 0.9,
  };
}

/** Rolls this season's injury, or null if healthy. */
export function rollSeasonInjury(rng: Rng, c: InjuryRollCtx): RolledInjury | null {
  if (rng() >= seasonInjuryChance(c)) return null;

  const scale = severityScale(c);
  const chosen = weightedPick(
    rng,
    INJURY_CATALOG.map((t) => [t, t.weight * scale[t.severity]] as const),
  );

  const seasonEnding =
    chosen.seasonEnding === true
      ? true
      : typeof chosen.seasonEnding === 'number'
        ? rng() < chosen.seasonEnding
        : false;

  const gamesMissed = seasonEnding ? 82 : int(rng, chosen.games[0], chosen.games[1]);
  const athleticismHit = chosen.athHit ? int(rng, chosen.athHit[0], chosen.athHit[1]) : 0;
  const durabilityHit = chosen.durHit ? int(rng, chosen.durHit[0], chosen.durHit[1]) : 0;
  const overallHit = chosen.ovrHit ? int(rng, chosen.ovrHit[0], chosen.ovrHit[1]) : 0;

  let careerEnding = false;
  if (chosen.endBase) {
    const ageMult = c.age >= 30 ? 1 + (c.age - 30) * 0.25 : 0.6;
    const wearMult = 1 + c.injuryCount * 0.15;
    careerEnding = rng() < Math.min(0.8, chosen.endBase * ageMult * wearMult);
  }
  const retirementEligible =
    !careerEnding && chosen.severity === 'severe' && c.age >= 29 && rng() < 0.5;

  return {
    type: chosen.type,
    severity: chosen.severity,
    gamesMissed,
    seasonEnding,
    athleticismHit,
    durabilityHit,
    overallHit,
    careerEnding,
    retirementEligible,
  };
}
