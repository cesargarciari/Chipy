import { randomUUID } from 'node:crypto';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { apiErrorSchema } from '@chipy/shared';
import Fastify, { type FastifyInstance } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { loadConfig, type AppConfig } from './config.js';
import { createDocClient } from './db/client.js';
import { CareerConflictError, CareerRepo } from './db/repo.js';
import { loggerOptions } from './lib/logger.js';
import { careerRoutes } from './routes/careers.js';
import { healthRoutes } from './routes/health.js';
import { leaderboardRoutes } from './routes/leaderboard.js';

void apiErrorSchema; // keeps the error contract discoverable from this module

export interface BuildServerOptions {
  config?: AppConfig;
  /** Inject a client in tests; otherwise one is created from config. */
  docClient?: DynamoDBDocumentClient;
}

export async function buildServer(opts: BuildServerOptions = {}): Promise<FastifyInstance> {
  const config = opts.config ?? loadConfig();

  const app = Fastify({
    logger: loggerOptions(config),
    trustProxy: true,
    genReqId: () => randomUUID(),
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: config.corsOrigins, methods: ['GET', 'POST'] });
  await app.register(sensible);
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

  if (!config.isProduction) {
    await app.register(swagger, {
      openapi: {
        info: { title: 'Chipy API', version: '0.1.0', description: 'NBA career simulator API' },
      },
      transform: jsonSchemaTransform,
    });
    await app.register(swaggerUi, { routePrefix: '/docs' });
  }

  const doc = opts.docClient ?? createDocClient(config.dynamo);
  app.decorate('appConfig', config);
  app.decorate('repo', new CareerRepo(doc, config.dynamo.table, app.log));
  app.addHook('onClose', async () => {
    if (!opts.docClient) doc.destroy();
  });

  app.setErrorHandler((err, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: err.validation.map((v) => `${v.instancePath} ${v.message}`.trim()).join('; '),
      });
    }
    if (err instanceof CareerConflictError) {
      return reply.code(409).send({ statusCode: 409, error: 'Conflict', message: err.message });
    }

    const e = err as { statusCode?: number; name?: string; message?: string };
    const status = e.statusCode ?? 500;
    if (status >= 500) req.log.error({ err }, 'unhandled error');
    return reply.code(status).send({
      statusCode: status,
      error: e.name ?? 'Error',
      message:
        status >= 500 && config.isProduction ? 'Internal Server Error' : (e.message ?? 'Error'),
    });
  });

  await app.register(healthRoutes);
  await app.register(
    async (api) => {
      await api.register(careerRoutes);
      await api.register(leaderboardRoutes);
    },
    { prefix: '/api' },
  );

  return app;
}
