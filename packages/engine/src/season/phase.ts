import { int, type Rng } from '../rng.js';
import type { CareerPhase, Role } from '../types.js';

export const ROOKIE_CONTRACT_YEARS = 4;

/** Career phase from age, with a hard override for the very first season. */
export function phaseFor(age: number, seasonIndex: number): CareerPhase {
  if (seasonIndex === 0) return 'rookie';
  if (age <= 25) return 'rising';
  if (age <= 33) return 'prime';
  if (age <= 36) return 'veteran';
  return 'decline';
}

/** Length of the next contract, in years - capped hard for older players. */
export function contractLenFor(rng: Rng, role: Role, age = 27, overall = 82): number {
  let years: number;
  if (role === 'franchise') years = int(rng, 3, 5);
  else if (role === 'starter') years = int(rng, 3, 4);
  else if (role === 'rotation') years = int(rng, 2, 3);
  else years = int(rng, 1, 2);

  // A modest-overall player past his development years is a journeyman: signed
  // a year or two at a time, not a pillar you build around. (Young players still
  // get room, and this never lengthens a deal.)
  const journeymanYears = int(rng, 1, 2);
  if (overall < 77 && age >= 24) years = Math.min(years, journeymanYears);

  // Nobody hands a 36-year-old a four-year deal. The cap tightens with age so
  // late-career contracts don't outrun the age-out cascade (which only fires at
  // a contract boundary).
  const cap = age >= 36 ? 1 : age >= 34 ? 2 : age >= 32 ? 3 : 5;
  return Math.max(1, Math.min(years, cap));
}

const ROLE_RANK: Record<Role, number> = {
  franchise: 4,
  starter: 3,
  rotation: 2,
  bench: 1,
  fringe: 0,
};

export function roleAtLeast(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
