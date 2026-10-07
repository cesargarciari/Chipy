import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { AppConfig } from '../config.js';

/** One DynamoDB client for the process. DynamoDB Local needs an endpoint and dummy credentials. */
export function createDocClient(config: AppConfig['dynamo']): DynamoDBDocumentClient {
  const base = new DynamoDBClient({
    region: config.region,
    ...(config.endpoint
      ? {
          endpoint: config.endpoint,
          credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
        }
      : {}),
  });

  return DynamoDBDocumentClient.from(base, {
    marshallOptions: { removeUndefinedValues: true, convertClassInstanceToMap: true },
  });
}
