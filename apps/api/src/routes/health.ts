import { healthResponseSchema, readyResponseSchema } from '@chipy/shared';
import { ENGINE_VERSION } from '@chipy/engine';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

/**
 * `/` is a human-friendly index (this is an API, the web app is elsewhere).
 * `/healthz` is liveness (is the process up?), `/readyz` is readiness (can it
 * serve traffic, i.e. reach DynamoDB?). Load balancers and uptime checks want
 * the distinction.
 */
export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', { schema: { hide: true } }, async () => ({
    name: 'chipy-api',
    engineVersion: ENGINE_VERSION,
    docs: app.appConfig.isProduction ? null : '/docs',
    endpoints: ['/healthz', '/readyz', 'POST /api/careers', '/api/careers/:id', '/api/leaderboard'],
  }));

  app.get(
    '/healthz',
    { schema: { tags: ['health'], response: { 200: healthResponseSchema } } },
    async () => ({ status: 'ok' as const, uptime: process.uptime(), version: ENGINE_VERSION }),
  );

  app.get(
    '/readyz',
    {
      schema: {
        tags: ['health'],
        response: { 200: readyResponseSchema, 503: readyResponseSchema },
      },
    },
    async (_req, reply) => {
      const dynamodb = await app.repo.ping();
      const body = {
        status: dynamodb ? ('ok' as const) : ('degraded' as const),
        checks: { dynamodb },
      };
      return reply.code(dynamodb ? 200 : 503).send(body);
    },
  );
};
