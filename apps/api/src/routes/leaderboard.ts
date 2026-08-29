import { leaderboardQuerySchema, leaderboardResponseSchema, monthKey } from '@chipy/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const leaderboardRoutes: FastifyPluginAsyncZod = async (app) => {
  /** Top careers for a month (defaults to the current UTC month). */
  app.get(
    '/leaderboard',
    {
      schema: {
        tags: ['leaderboard'],
        querystring: leaderboardQuerySchema,
        response: { 200: leaderboardResponseSchema },
      },
    },
    async (req) => {
      const month = req.query.month ?? monthKey();
      const entries = await app.repo.leaderboard(month, req.query.limit);
      return { month, entries };
    },
  );
};
