import { int, type Rng } from '../rng.js';
import type { CareerPhase, Role } from '../types.js';

export const ROOKIE_CONTRACT_YEARS = 4;

/** Career phase from age, with a hard override for the very first season. */
export function phaseFor(age: number, seasonIndex: number): CareerPhase {
  if (seasonIndex === 0) return 'rookie';
  if (age <= 24) return 'rising';
  if (age <= 30) return 'prime';
  if (age <= 33) return 'veteran';
  return 'decline';
}

/** Length of the next contract, in years. */
export function contractLenFor(rng: Rng, role: Role): number {
  if (role === 'franchise') return int(rng, 3, 5);
  if (role === 'starter') return int(rng, 3, 4);
  if (role === 'rotation') return int(rng, 2, 3);
  return int(rng, 1, 2);
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
