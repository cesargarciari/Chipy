/** Seeded random numbers, so the same inputs always replay the same career. */

export type Rng = () => number;

/** Small, fast seeded generator that gives the same results in every JS runtime. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turns any input into a 32-bit seed. */
export function normalizeSeed(input: number | string): number {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return Math.abs(Math.trunc(input)) >>> 0;
  }
  // Hash the string (FNV-1a).
  let h = 2166136261 >>> 0;
  const str = String(input);
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A new seed for a new game. Not used inside the simulation. */
export function randomSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
}

/** Whole number from min to max. */
export function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** True with chance p. */
export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

/** Random item from a non-empty array. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('pick() called with an empty array');
  }
  return items[Math.floor(rng() * items.length)] as T;
}

/** Picks from [value, weight] pairs. */
export function weightedPick<T>(rng: Rng, entries: ReadonlyArray<readonly [T, number]>): T {
  if (entries.length === 0) {
    throw new Error('weightedPick() called with no entries');
  }
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = rng() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r < 0) return value;
  }
  return entries[entries.length - 1]![0];
}

/** Random whole number near 0, between -magnitude and magnitude. Big swings are rare. */
export function jitter(rng: Rng, magnitude: number): number {
  const n = (rng() + rng() + rng()) / 3;
  return Math.round((n - 0.5) * 2 * magnitude);
}

/** Keeps a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Rounds to n decimal places. */
export function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
