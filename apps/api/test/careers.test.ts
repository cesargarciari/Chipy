import { runCareer } from '@chipy/engine';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createCareerBody, makeTestApp, type TestApp } from './helpers.js';

let ctx: TestApp;

beforeAll(async () => {
  ctx = await makeTestApp();
});
afterAll(() => ctx.cleanup());

describe('POST /api/careers', () => {
  it('creates a career and stores the server-computed summary', async () => {
    const body = createCareerBody({ seed: 'abc' });
    const res = await ctx.app.inject({ method: 'POST', url: '/api/careers', payload: body });

    expect(res.statusCode).toBe(201);
    const json = res.json();
    expect(json.id).toMatch(/^[A-Za-z0-9_-]{12}$/);

    const replay = runCareer(body);
    expect(replay.status).toBe('complete');
    if (replay.status === 'complete') {
      expect(json.summary).toEqual(JSON.parse(JSON.stringify(replay.summary)));
    }
    expect(json.summary.engineVersion).toBe('4.14.0');
    expect(json.summary.seasons.length).toBeGreaterThan(0);
    expect(json.summary.careerEarnings).toBeGreaterThan(0);
  });

  it('rejects a body with too few choices', async () => {
    const body = createCareerBody({ seed: 'short' });
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/careers',
      payload: { ...body, choices: body.choices.slice(0, 2) },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a corrupted choice id with 400', async () => {
    const body = createCareerBody({ seed: 'corrupt' });
    const bad = body.choices.map((c, i) => (i === 3 ? { ...c, choiceId: 'not_real' } : c));
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/careers',
      payload: { ...body, choices: bad },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/careers/:id', () => {
  it('round-trips a created career', async () => {
    const create = await ctx.app.inject({
      method: 'POST',
      url: '/api/careers',
      payload: createCareerBody({ seed: 'roundtrip' }),
    });
    const { id, summary } = create.json();

    const get = await ctx.app.inject({ method: 'GET', url: `/api/careers/${id}` });
    expect(get.statusCode).toBe(200);
    expect(get.json().summary).toEqual(summary);
    expect(Array.isArray(get.json().choiceStats)).toBe(true);
    expect(get.json().choiceStats.length).toBeGreaterThan(0);
  });

  it('404s for an unknown id', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/careers/aaaaaaaaaaaa' });
    expect(res.statusCode).toBe(404);
  });

  it('400s for a malformed id', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/careers/nope' });
    expect(res.statusCode).toBe(400);
  });
});
