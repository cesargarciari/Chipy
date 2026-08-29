import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { AppConfig } from '../config.js';

/**
 * One `DynamoDBDocumentClient` for the process. Against AWS it uses the default
 * credential chain (in production: the Lambda execution role, no static keys).
 * Against DynamoDB Local it needs an explicit endpoint and dummy credentials.
 */
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
