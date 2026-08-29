import type { AppConfig } from './config.js';
import type { CareerRepo } from './db/repo.js';

declare module 'fastify' {
  interface FastifyInstance {
    appConfig: AppConfig;
    repo: CareerRepo;
  }
}
