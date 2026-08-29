/**
 * Deterministic pseudo-random number generation.
 *
 * The whole simulation is a pure function of `(seed, profile, choices)`. That is
 * what lets the API re-run a career from its stored inputs and get a
 * byte-identical result — the basis of the "server never trusts client stats"
 * integrity check.
 */

export type Rng = () => number;

/**
 * Mulberry32: a tiny, fast 32-bit generator. Same seed produces the same stream
 * of `[0, 1)` values in every JavaScript runtime (browser and Node alike).
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Coerce arbitrary input into a stable unsigned 32-bit seed. */
export function normalizeSeed(input: number | string): number {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return Math.abs(Math.trunc(input)) >>> 0;
  }
  // FNV-1a over the string form.
  let h = 2166136261 >>> 0;
  const str = String(input);
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A fresh seed for a new playthrough. Not used inside the deterministic core. */
export function randomSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
}

/** Inclusive integer in `[min, max]`. */
export function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** True with probability `p` (0..1). */
export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

/** Uniform pick from a non-empty array. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('pick() called with an empty array');
  }
  return items[Math.floor(rng() * items.length)] as T;
}

/** Pick from `[value, weight]` pairs; weights need not sum to 1. */
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

/**
 * Approximately-normal integer jitter in `[-magnitude, magnitude]`, centred on 0.
 * Averaging three uniforms pushes outcomes toward the middle, so extreme swings
 * stay rare.
 */
export function jitter(rng: Rng, magnitude: number): number {
  const n = (rng() + rng() + rng()) / 3;
  return Math.round((n - 0.5) * 2 * magnitude);
}

/** Clamp a number into `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Round to `n` decimal places (deterministic given the inputs). */
export function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
