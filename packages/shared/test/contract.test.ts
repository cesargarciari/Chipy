import { runCareer, type CareerSummary, type PlayerProfile } from '@chipy/engine';
import { describe, expect, it } from 'vitest';
import { careerSummarySchema } from '../src/career-summary.js';
import { createCareerRequestSchema, idSchema, monthKey } from '../src/api.js';

function autoPlay(seed: string, profile: PlayerProfile): CareerSummary {
  const choices: Array<{ nodeId: string; choiceId: string }> = [];
  for (let i = 0; i < 100; i += 1) {
    const res = runCareer({ seed, profile, choices });
    if (res.status === 'complete') return res.summary;
    const p = res.pending;
    const opts =
      p.kind === 'prologue'
        ? p.prologue!.choices.map((c) => c.id)
        : p.kind === 'landing'
          ? p.landing!.offers.map((o) => o.choiceId)
          : p.season!.decision.options.map((o) => o.id);
    const id = opts.find((o) => o !== 'retire') ?? opts[0]!;
    choices.push({ nodeId: p.nodeId, choiceId: id });
  }
  throw new Error('career did not finish');
}

const PROFILE: PlayerProfile = {
  name: 'Ada Ríos',
  position: 'PG',
  archetype: 'floor_general',
  market: 'mid',
};

describe('career summary contract', () => {
  it('accepts a real engine summary unchanged', () => {
    const summary = autoPlay('contract-1', PROFILE);
    const parsed = careerSummarySchema.parse(summary);
    expect(parsed).toEqual(JSON.parse(JSON.stringify(summary)));
  });

  it('holds for several archetypes', () => {
    for (const [position, archetype] of [
      ['C', 'rim_protector'],
      ['SF', 'three_level_wing'],
      ['PF', 'stretch_four'],
    ] as const) {
      const summary = autoPlay(`contract-${archetype}`, {
        name: 'Test Player',
        position,
        archetype,
        market: 'large',
      });
      expect(() => careerSummarySchema.parse(summary)).not.toThrow();
    }
  });
});

describe('create-career request', () => {
  it('requires a full career (>= 5 choices)', () => {
    const base = { seed: 1, profile: PROFILE };
    expect(
      createCareerRequestSchema.safeParse({
        ...base,
        choices: [{ nodeId: 'highschool', choiceId: 'skills_camp' }],
      }).success,
    ).toBe(false);
  });
});

describe('helpers', () => {
  it('monthKey formats UTC YYYYMM', () => {
    expect(monthKey(new Date('2026-08-01T00:00:00Z'))).toBe('202608');
  });
  it('idSchema matches nanoid(12)', () => {
    expect(idSchema.safeParse('abc123_-XYZ0').success).toBe(true);
    expect(idSchema.safeParse('too-short').success).toBe(false);
  });
});
