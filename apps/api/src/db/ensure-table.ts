import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceInUseException,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb';
import type { AppConfig } from '../config.js';
import { tableInput } from './table-schema.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Create the single table if it is missing. Runs only against DynamoDB Local
 * (guarded by an explicit endpoint) — on AWS the table is Terraform's job.
 *
 * Retries the first connection: in `docker compose` the API can win the race
 * against DynamoDB Local accepting requests.
 */
export async function ensureTable(
  dynamo: AppConfig['dynamo'],
  { attempts = 10, delayMs = 1000 }: { attempts?: number; delayMs?: number } = {},
): Promise<void> {
  if (!dynamo.endpoint) return;

  const client = new DynamoDBClient({
    region: dynamo.region,
    endpoint: dynamo.endpoint,
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  });

  try {
    for (let attempt = 1; ; attempt += 1) {
      try {
        await client.send(new DescribeTableCommand({ TableName: dynamo.table }));
        return;
      } catch (err) {
        if (err instanceof ResourceNotFoundException) break;
        if (attempt >= attempts) throw err;
        await sleep(delayMs);
      }
    }

    try {
      await client.send(new CreateTableCommand(tableInput(dynamo.table)));
    } catch (err) {
      // Another instance created it first — fine.
      if (!(err instanceof ResourceInUseException)) throw err;
    }
  } finally {
    client.destroy();
  }
}
