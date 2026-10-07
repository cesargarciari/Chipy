import awsLambdaFastify from '@fastify/aws-lambda';
import { loadConfig } from './config.js';
import { buildServer } from './server.js';

/** AWS Lambda entrypoint. The app is built once per cold start and reused while warm. */
const app = await buildServer({ config: loadConfig() });

export const handler = awsLambdaFastify(app);
