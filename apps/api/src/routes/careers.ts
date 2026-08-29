import { runCareer } from '@chipy/engine';
import { careerParamsSchema, careerResponseSchema, createCareerRequestSchema } from '@chipy/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { nanoid } from 'nanoid';
import { CareerConflictError } from '../db/repo.js';

export const careerRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * Persist a finished career. The client sends only the *inputs* (seed,
   * profile, choices); the server replays the whole simulation itself and
   * stores that result, so a tampered or stale client can't write bogus stats.
   */
  app.post(
    '/careers',
    {
      schema: {
        tags: ['careers'],
        body: createCareerRequestSchema,
        response: { 201: careerResponseSchema },
      },
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const { seed, profile, choices } = req.body;

      let result;
      try {
        result = runCareer({ seed, profile, choices });
      } catch (err) {
        throw app.httpErrors.badRequest((err as Error).message);
      }
      if (result.status !== 'complete') {
        throw app.httpErrors.badRequest('career is not finished — keep playing before saving');
      }
      const summary = result.summary;
      const createdAt = new Date().toISOString();

      let id = nanoid(12);
      for (let attempt = 0; ; attempt += 1) {
        try {
          await app.repo.saveCareer({ id, createdAt, summary });
          break;
        } catch (err) {
          if (err instanceof CareerConflictError && attempt < 2) {
            id = nanoid(12);
            continue;
          }
          throw err;
        }
      }

      await app.repo.bumpChoiceCounts(summary.choices);
      const choiceStats = await app.repo.getChoiceStats(summary.choices);

      return reply.code(201).send({ id, createdAt, summary, choiceStats });
    },
  );

  /** Fetch a stored career for the legacy / share page. */
  app.get(
    '/careers/:id',
    {
      schema: {
        tags: ['careers'],
        params: careerParamsSchema,
        response: { 200: careerResponseSchema },
      },
    },
    async (req) => {
      const item = await app.repo.getCareer(req.params.id);
      if (!item) throw app.httpErrors.notFound('career not found');

      const choiceStats = await app.repo.getChoiceStats(item.summary.choices);
      return { id: item.id, createdAt: item.createdAt, summary: item.summary, choiceStats };
    },
  );
};
