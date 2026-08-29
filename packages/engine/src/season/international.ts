import { clamp, type Rng } from '../rng.js';
import type { AwardId } from '../types.js';

export interface IntlContext {
  seasonIndex: number;
  age: number;
  overall: number;
  impact: number;
  hype: number;
}

type Cycle = 'wc' | 'oly' | null;

/** World Cup on odd off-Olympic summers, Olympics every four years. */
function cycleFor(seasonIndex: number): Cycle {
  if (seasonIndex % 4 === 3) return 'oly';
  if (seasonIndex % 4 === 1) return 'wc';
  return null;
}

/** Returns the medal award (if any) earned representing the national team this summer. */
export function maybeInternational(rng: Rng, c: IntlContext): AwardId[] {
  const cycle = cycleFor(c.seasonIndex);
  if (!cycle || c.age > 35) return [];

  const selected = (c.overall >= 78 || (c.hype >= 70 && c.overall >= 74)) && rng() < 0.82;
  if (!selected) return [];

  const p = clamp(
    0.5 + (c.overall - 78) / 55 + (c.impact - 18) / 120 + (rng() - 0.5) * 0.3,
    0.1,
    0.95,
  );
  const r = rng();

  let medal: 'gold' | 'silver' | 'bronze' | null = null;
  if (p > 0.7 && r < p - 0.52) medal = 'gold';
  else if (p > 0.55 && r < p - 0.36) medal = 'silver';
  else if (p > 0.42 && r < 0.5) medal = 'bronze';
  if (!medal) return [];

  const key = `${cycle === 'oly' ? 'oly' : 'wc'}_${medal}` as AwardId;
  return [key];
}
