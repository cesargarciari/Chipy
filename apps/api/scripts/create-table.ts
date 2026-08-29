/**
 * Create the single `chipy` table in DynamoDB Local. Idempotent — safe to run
 * on every `docker compose up` or before the test suite. The real table is
 * created by Terraform in Milestone 2 with this exact key schema.
 */
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb';
import { loadConfig } from '../src/config.js';
import { tableInput } from '../src/db/table-schema.js';

async function main(): Promise<void> {
  const { dynamo } = loadConfig();
  if (!dynamo.endpoint) {
    throw new Error('DYNAMODB_ENDPOINT is not set — refusing to run against real AWS');
  }

  const client = new DynamoDBClient({
    region: dynamo.region,
    endpoint: dynamo.endpoint,
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  });

  try {
    await client.send(new DescribeTableCommand({ TableName: dynamo.table }));
    console.log(`✓ table "${dynamo.table}" already exists`);
    return;
  } catch (err) {
    if (!(err instanceof ResourceNotFoundException)) throw err;
  }

  await client.send(new CreateTableCommand(tableInput(dynamo.table)));
  console.log(`✓ created table "${dynamo.table}" with GSI "gsi1"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
