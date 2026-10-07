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

/** Creates the table if it's missing, only on DynamoDB Local. Retries in case DynamoDB Local isn't ready yet. */
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
      // Another instance already created it.
      if (!(err instanceof ResourceInUseException)) throw err;
    }
  } finally {
    client.destroy();
  }
}
