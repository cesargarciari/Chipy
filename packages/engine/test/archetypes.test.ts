import { describe, expect, it } from 'vitest';
import {
  ARCHETYPE_DEFS,
  ARCHETYPE_IDS,
  POSITIONS,
  archetypesFor,
  getArchetype,
} from '../src/index.js';

describe('archetypes', () => {
  it('defines exactly one entry per id, matching ARCHETYPE_IDS', () => {
    expect(ARCHETYPE_DEFS.map((a) => a.id)).toEqual([...ARCHETYPE_IDS]);
  });

  it('gives every position several locked archetypes and buckets each one', () => {
    for (const pos of POSITIONS) {
      const list = archetypesFor(pos);
      expect(list.length).toBeGreaterThanOrEqual(4);
      expect(list.every((a) => a.position === pos)).toBe(true);
    }
    // Every archetype belongs to exactly one position bucket.
    expect(POSITIONS.flatMap((p) => archetypesFor(p)).length).toBe(ARCHETYPE_IDS.length);
  });

  it('a PG never sees a centre-only archetype', () => {
    const pgIds = archetypesFor('PG').map((a) => a.id);
    expect(pgIds).not.toContain('rim_protector');
    expect(pgIds).not.toContain('lob_threat');
  });

  it('has sane growth weights and affinities', () => {
    for (const id of ARCHETYPE_IDS) {
      const a = getArchetype(id);
      for (const w of Object.values(a.growthWeights)) {
        expect(w).toBeGreaterThan(0);
        expect(w).toBeLessThanOrEqual(2);
      }
      for (const v of Object.values(a.awardAffinity)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(2);
      }
      expect(a.label.length).toBeGreaterThan(2);
      expect(a.comps.length).toBeGreaterThan(2);
    }
  });
});
