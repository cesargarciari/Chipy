import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ARCHETYPE_DEFS, runCareer, type Position } from '../src/index.js';
import { autoPlay } from './helpers.js';

const profileArb = fc
  .record({
    idx: fc.integer({ min: 0, max: ARCHETYPE_DEFS.length - 1 }),
    name: fc.string({ minLength: 2, maxLength: 20 }),
    market: fc.constantFrom('small', 'mid', 'large'),
  })
  .map(({ idx, name, market }) => {
    const a = ARCHETYPE_DEFS[idx]!;
    return { name, position: a.position as Position, archetype: a.id, market };
  });

describe('simulation determinism', () => {
  it('same (seed, profile, choices) => byte-identical summary', () => {
    fc.assert(
      fc.property(fc.integer(), profileArb, (seed, profile) => {
        const first = autoPlay(seed, profile, 'random');
        // Replay from the recorded choices — must reproduce exactly.
        const replay = runCareer({ seed, profile, choices: first.choices });
        expect(replay.status).toBe('complete');
        if (replay.status === 'complete') expect(replay.summary).toEqual(first);
      }),
      { numRuns: 120 },
    );
  });

  it('summary is JSON round-trip stable (safe to persist and rehydrate)', () => {
    fc.assert(
      fc.property(fc.integer(), profileArb, (seed, profile) => {
        const summary = autoPlay(seed, profile, 'first');
        expect(JSON.parse(JSON.stringify(summary))).toEqual(summary);
      }),
      { numRuns: 60 },
    );
  });

  it('different choices change the outcome', () => {
    const profile = {
      name: 'Fork',
      position: 'SF' as const,
      archetype: 'point_forward' as const,
      market: 'mid' as const,
    };
    const a = autoPlay('fork-seed', profile, 'first');
    const b = autoPlay('fork-seed', profile, 'last');
    expect(a).not.toEqual(b);
  });
});
