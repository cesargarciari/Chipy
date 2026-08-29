import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { makeTestApp, type TestApp } from './helpers.js';

let ctx: TestApp;

beforeAll(async () => {
  ctx = await makeTestApp();
});
afterAll(() => ctx.cleanup());

describe('health routes', () => {
  it('GET / returns a friendly API index', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('chipy-api');
    expect(Array.isArray(res.json().endpoints)).toBe(true);
  });

  it('GET /healthz reports liveness', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
  });

  it('GET /readyz reports DynamoDB reachable', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/readyz' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', checks: { dynamodb: true } });
  });
});
