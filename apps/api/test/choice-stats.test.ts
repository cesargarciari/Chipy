import type { PlayerProfile } from '@chipy/engine';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createCareerBody, makeTestApp, type TestApp } from './helpers.js';

// Uses its own table since it checks exact percentages.
let ctx: TestApp;

beforeAll(async () => {
  ctx = await makeTestApp();
});
afterAll(() => ctx.cleanup());

const PROFILE: PlayerProfile = {
  name: 'Stat Tester',
  position: 'SF',
  archetype: 'point_forward',
  market: 'mid',
  jerseyNumber: 14,
  country: 'USA',
  handedness: 'right',
};

describe('choice stats', () => {
  it('reflect the share of players who made each pick at a prologue node', async () => {
    // Three players pick the first option at high school, one picks the last.
    let last;
    for (const seed of ['s1', 's2', 's3']) {
      last = await ctx.app.inject({
        method: 'POST',
        url: '/api/careers',
        payload: createCareerBody({ seed, profile: PROFILE, strategy: 'first' }),
      });
      expect(last.statusCode).toBe(201);
    }
    last = await ctx.app.inject({
      method: 'POST',
      url: '/api/careers',
      payload: createCareerBody({ seed: 's4', profile: PROFILE, strategy: 'last' }),
    });
    expect(last.statusCode).toBe(201);

    const stats = last.json().choiceStats as Array<{
      nodeId: string;
      choiceId: string;
      label: string;
      pct: number;
    }>;

    // Only comparable choices show up, no team offers.
    expect(stats.every((s) => !s.choiceId.startsWith('offer_'))).toBe(true);
    expect(stats.every((s) => s.label.length > 0)).toBe(true);

    const hs = stats.find((s) => s.nodeId === 'highschool');
    expect(hs).toBeDefined();
    // This player was 1 of 4 to make this pick.
    expect(hs!.pct).toBe(25);
  });
});
