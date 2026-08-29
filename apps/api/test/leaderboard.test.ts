import { monthKey } from '@chipy/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createCareerBody, makeTestApp, type TestApp } from './helpers.js';

let ctx: TestApp;

beforeAll(async () => {
  ctx = await makeTestApp();
  for (const seed of ['a', 'b', 'c', 'd', 'e']) {
    await ctx.app.inject({
      method: 'POST',
      url: '/api/careers',
      payload: createCareerBody({ seed }),
    });
  }
});
afterAll(() => ctx.cleanup());

describe('GET /api/leaderboard', () => {
  it('returns entries for the current month, highest legacy score first', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/leaderboard' });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.month).toBe(monthKey());
    expect(body.entries.length).toBe(5);

    const scores = body.entries.map((e: { legacyScore: number }) => e.legacyScore);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(body.entries[0]).toMatchObject({
      legacyGrade: expect.any(String),
      legacyTier: expect.any(String),
      seasons: expect.any(Number),
    });
  });

  it('honours the limit parameter', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/leaderboard?limit=2' });
    expect(res.json().entries).toHaveLength(2);
  });

  it('returns an empty list for a month with no careers', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/leaderboard?month=200001' });
    expect(res.json()).toEqual({ month: '200001', entries: [] });
  });

  it('rejects a malformed month', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/leaderboard?month=2020-01' });
    expect(res.statusCode).toBe(400);
  });
});
