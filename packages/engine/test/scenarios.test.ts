import { describe, expect, it } from 'vitest';
import { SCENARIOS, buildScenarioIndex, eligibleScenarios } from '../src/index.js';
import type { CareerPhase, Role } from '../src/index.js';

describe('scenario pack', () => {
  it('validates: unique ids, 2–4 options, a fallback exists', () => {
    expect(() => buildScenarioIndex()).not.toThrow();
    for (const s of SCENARIOS) {
      expect(s.options.length).toBeGreaterThanOrEqual(2);
      expect(s.options.length).toBeLessThanOrEqual(4);
    }
  });

  it('option ids are globally unique across the whole pack', () => {
    const seen = new Set<string>();
    for (const s of SCENARIOS) {
      for (const o of s.options) {
        expect(seen.has(o.id)).toBe(false);
        seen.add(o.id);
      }
    }
    expect(seen.size).toBeGreaterThan(40);
  });

  it('there is always an eligible scenario for any phase/age/role', () => {
    const phases: CareerPhase[] = ['rookie', 'rising', 'prime', 'veteran', 'decline'];
    const roles: Role[] = ['fringe', 'bench', 'rotation', 'starter', 'franchise'];
    for (const phase of phases) {
      for (const role of roles) {
        for (const age of [19, 24, 29, 33, 37]) {
          const list = eligibleScenarios({
            seasonNumber: Math.max(1, age - 18),
            age,
            phase,
            role,
            overall: 80,
            market: 'mid',
            hype: 50,
            durability: 70,
            hasAward: () => false,
            firedScenarioIds: new Set(),
          });
          expect(list.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('effect deltas are small, deterministic integers', () => {
    for (const s of SCENARIOS) {
      for (const o of s.options) {
        for (const v of Object.values(o.effect.ratings ?? {})) {
          expect(Number.isInteger(v)).toBe(true);
          expect(Math.abs(v!)).toBeLessThanOrEqual(20);
        }
      }
    }
  });
});
