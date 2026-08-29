import { describe, expect, it } from 'vitest';
import { int, mulberry32, normalizeSeed, pick, weightedPick } from '../src/rng.js';

describe('mulberry32', () => {
  it('is repeatable for a given seed', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    expect(Array.from({ length: 8 }, () => a())).toEqual(Array.from({ length: 8 }, () => b()));
  });

  it('stays within [0, 1)', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 1000; i += 1) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('normalizeSeed', () => {
  it('is stable for the same string', () => {
    expect(normalizeSeed('kobe-2003')).toBe(normalizeSeed('kobe-2003'));
  });
  it('maps numbers to an unsigned 32-bit int', () => {
    expect(normalizeSeed(-42)).toBe(42);
    expect(normalizeSeed(7.9)).toBe(7);
  });
});

describe('helpers', () => {
  it('int() is inclusive of both bounds', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 400; i += 1) {
      const v = int(rng, 5, 9);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(9);
    }
  });
  it('pick() throws on an empty array', () => {
    expect(() => pick(mulberry32(1), [])).toThrow();
  });
  it('weightedPick() only returns provided values', () => {
    const rng = mulberry32(11);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      seen.add(
        weightedPick(rng, [
          ['a', 1],
          ['b', 3],
        ] as const),
      );
    }
    expect([...seen].sort()).toEqual(['a', 'b']);
  });
});
