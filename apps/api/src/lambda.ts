import awsLambdaFastify from '@fastify/aws-lambda';
import { loadConfig } from './config.js';
import { buildServer } from './server.js';

/**
 * AWS entrypoint (Milestone 2). CloudFront -> Lambda Function URL -> this handler.
 * The Fastify app is built once per cold start (top-level await); the proxy calls
 * `app.ready()` itself on the first invocation and is reused while warm.
 */
const app = await buildServer({ config: loadConfig() });

export const handler = awsLambdaFastify(app);
