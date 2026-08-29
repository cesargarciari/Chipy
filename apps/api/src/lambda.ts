import awsLambdaFastify from '@fastify/aws-lambda';
import { loadConfig } from './config.js';
import { buildServer } from './server.js';

/**
 * AWS entrypoint (Milestone 2). API Gateway HTTP API -> Lambda -> this handler.
 * The Fastify app is built once per cold start (top-level await) and the proxy
 * is reused across warm invocations.
 */
const app = await buildServer({ config: loadConfig() });
await app.ready();

export const handler = awsLambdaFastify(app);
