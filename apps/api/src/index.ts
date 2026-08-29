import { loadConfig } from './config.js';
import { ensureTable } from './db/ensure-table.js';
import { buildServer } from './server.js';

/** Local / container entrypoint. On AWS the Lambda handler in `lambda.ts` is used instead. */
async function main(): Promise<void> {
  const config = loadConfig();
  await ensureTable(config.dynamo);
  const app = await buildServer({ config });

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutting down');
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  await app.listen({ host: config.host, port: config.port });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
