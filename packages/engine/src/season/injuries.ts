import { clamp, int, weightedPick, type Rng } from '../rng.js';
import type { InjurySeverity } from '../types.js';

export interface InjuryRollCtx {
  age: number;
  /** 20..100 — the single biggest lever on how often you get hurt. */
  durability: number;
  /** Prior entries on the injury record — wear compounds. */
  injuryCount: number;
  /** 0..1 from perks (medical team, recovery staff) — cuts the odds down. */
  injuryResist: number;
}

export interface RolledInjury {
  type: string;
  severity: InjurySeverity;
  gamesMissed: number;
  /** Permanent hit applied through the season `effect`. */
  athleticismHit: number;
  durabilityHit: number;
  /** Ends the career on the spot. */
  careerEnding: boolean;
  /** Makes the player retirement-eligible (they can choose to walk). */
  retirementEligible: boolean;
}

interface InjuryType {
  type: string;
  severity: InjurySeverity;
  /** Base relative likelihood among all injuries. */
  weight: number;
  games: [number, number];
  athHit?: [number, number];
  durHit?: [number, number];
  /** Per-injury chance it ends the career (before age scaling / wear). */
  endBase?: number;
}

/**
 * The catalogue. Minor knocks are common; the ligament ruptures sit at the
 * bottom with small weights and only they carry an `endBase`. Nothing here is
 * impossible — a healthy 24-year-old can still tear an ACL, just rarely.
 */
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
    type: 'shoulder subluxation',
    severity: 'moderate',
    weight: 4,
    games: [12, 28],
    durHit: [1, 3],
  },
  {
    type: 'foot stress fracture',
    severity: 'moderate',
    weight: 5,
    games: [18, 36],
    athHit: [1, 3],
    durHit: [1, 3],
  },
  {
    type: 'torn meniscus',
    severity: 'moderate',
    weight: 5,
    games: [20, 40],
    athHit: [1, 3],
    durHit: [2, 4],
  },
  {
    type: 'torn ACL',
    severity: 'severe',
    weight: 2.2,
    games: [45, 68],
    athHit: [2, 5],
    durHit: [3, 6],
    endBase: 0.06,
  },
  {
    type: 'torn Achilles',
    severity: 'severe',
    weight: 1.6,
    games: [50, 78],
    athHit: [3, 6],
    durHit: [3, 7],
    endBase: 0.12,
  },
  {
    type: 'ruptured patellar tendon',
    severity: 'severe',
    weight: 1.1,
    games: [52, 80],
    athHit: [3, 6],
    durHit: [4, 8],
    endBase: 0.16,
  },
];

/**
 * Chance the player picks up *some* injury this season. Low durability is the
 * dominant term; age and a long injury record add to it; medical perks cut it.
 * Floored at 6% so nobody is truly indestructible, capped at 85%.
 */
export function seasonInjuryChance(c: InjuryRollCtx): number {
  const frail = (100 - clamp(c.durability, 20, 100)) / 100; // 0 (iron) .. 0.8
  const ageRisk = c.age <= 27 ? 0 : (c.age - 27) * 0.02;
  const wear = Math.min(0.12, c.injuryCount * 0.03);
  let p = 0.14 + frail * 0.5 + ageRisk + wear;
  p *= 1 - 0.6 * clamp(c.injuryResist, 0, 1);
  return clamp(p, 0.05, 0.8);
}

/** Frail / older bodies skew the *type* toward the nastier end of the catalogue. */
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

/** Roll this season's injury, or `null` for a clean bill of health. */
export function rollSeasonInjury(rng: Rng, c: InjuryRollCtx): RolledInjury | null {
  if (rng() >= seasonInjuryChance(c)) return null;

  const scale = severityScale(c);
  const chosen = weightedPick(
    rng,
    INJURY_CATALOG.map((t) => [t, t.weight * scale[t.severity]] as const),
  );

  const gamesMissed = int(rng, chosen.games[0], chosen.games[1]);
  const athleticismHit = chosen.athHit ? int(rng, chosen.athHit[0], chosen.athHit[1]) : 0;
  const durabilityHit = chosen.durHit ? int(rng, chosen.durHit[0], chosen.durHit[1]) : 0;

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
    athleticismHit,
    durabilityHit,
    careerEnding,
    retirementEligible,
  };
}
