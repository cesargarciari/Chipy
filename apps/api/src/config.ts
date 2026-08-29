import { z } from 'zod';

/**
 * All environment access lives here. The server refuses to start if the
 * environment is not what it expects — better a loud boot failure than a
 * mystery 500 later.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DYNAMODB_TABLE: z.string().min(1).default('chipy'),
  /** Set for DynamoDB Local; leave empty to use the real AWS endpoint. */
  DYNAMODB_ENDPOINT: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  AWS_REGION: z.string().default('ca-central-1'),
});

export type AppConfig = ReturnType<typeof loadConfig>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment:\n${issues}`);
  }
  const e = parsed.data;
  return {
    nodeEnv: e.NODE_ENV,
    isProduction: e.NODE_ENV === 'production',
    isTest: e.NODE_ENV === 'test',
    host: e.API_HOST,
    port: e.API_PORT,
    logLevel: e.LOG_LEVEL,
    corsOrigins: e.CORS_ORIGIN.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    dynamo: {
      table: e.DYNAMODB_TABLE,
      endpoint: e.DYNAMODB_ENDPOINT,
      region: e.AWS_REGION,
    },
  };
}
