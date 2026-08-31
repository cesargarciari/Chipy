import { CreateTableCommand, DeleteTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { runCareer, type PlayerProfile } from '@chipy/engine';
import type { CreateCareerRequest } from '@chipy/shared';
import type { FastifyInstance } from 'fastify';
import { loadConfig } from '../src/config.js';
import { tableInput } from '../src/db/table-schema.js';
import { buildServer } from '../src/server.js';

const ENDPOINT = process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000';
const REGION = process.env.AWS_REGION ?? 'ca-central-1';

export interface TestApp {
  app: FastifyInstance;
  table: string;
  cleanup: () => Promise<void>;
}

/**
 * Spin up the real Fastify app wired to a throwaway table in DynamoDB Local, so
 * each test file gets a clean, isolated dataset. Requires `docker compose up
 * dynamodb-local` (CI starts it as a service container).
 */
export async function makeTestApp(): Promise<TestApp> {
  const table = `chipy_test_${Math.random().toString(36).slice(2, 10)}`;
  const raw = new DynamoDBClient({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  });

  try {
    await raw.send(new CreateTableCommand(tableInput(table)));
  } catch (err) {
    raw.destroy();
    throw new Error(
      `Could not create test table on ${ENDPOINT}. Is DynamoDB Local running? ` +
        `(docker compose up -d dynamodb-local)`,
      { cause: err },
    );
  }

  const doc = DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: true },
  });

  const config = loadConfig({
    ...process.env,
    NODE_ENV: 'test',
    DYNAMODB_TABLE: table,
    DYNAMODB_ENDPOINT: ENDPOINT,
    AWS_REGION: REGION,
  });

  const app = await buildServer({ config, docClient: doc });
  await app.ready();

  return {
    app,
    table,
    cleanup: async () => {
      await app.close();
      await raw.send(new DeleteTableCommand({ TableName: table }));
      raw.destroy();
    },
  };
}

const PROFILE: PlayerProfile = {
  name: 'Test Player',
  position: 'SG',
  archetype: 'shot_creator',
  market: 'mid',
  jerseyNumber: 8,
  country: 'USA',
  handedness: 'right',
};

/** A full, finished career's request body — plays the engine to build `choices`. */
export function createCareerBody(
  overrides: {
    seed?: number | string;
    profile?: PlayerProfile;
    /** index of the option to pick at every node (default: 1st non-retire). */
    strategy?: 'first' | 'last';
  } = {},
): CreateCareerRequest {
  const seed = overrides.seed ?? 'test-seed';
  const profile = overrides.profile ?? PROFILE;
  const choices: CreateCareerRequest['choices'] = [];

  for (let i = 0; i < 500; i += 1) {
    const res = runCareer({ seed, profile, choices });
    if (res.status === 'complete') return { seed, profile, choices };
    const p = res.pending;
    const opts =
      p.kind === 'prologue'
        ? p.prologue!.options.map((o) => o.id)
        : p.kind === 'college_pick'
          ? p.collegePick!.schools.map((s) => s.id)
          : p.kind === 'college_year'
            ? p.collegeYear!.options.map((o) => o.id)
            : p.kind === 'landing'
              ? p.landing!.offers.map((o) => o.id)
              : p.kind === 'chemistry'
                ? p.chemistry!.decision.options.map((o) => o.id)
                : p.kind === 'midseason'
                  ? p.midseason!.decision.options.map((o) => o.id)
                  : p.kind === 'finals'
                    ? p.finals!.game.options.map((o) => o.id)
                    : p.kind === 'overseas_offer'
                      ? p.overseasOffer!.options.map((o) => o.id)
                      : p.kind === 'farewell'
                        ? p.farewell!.options.map((o) => o.id)
                        : p.season!.decision.options.map((o) => o.id);
    let idx = overrides.strategy === 'last' ? opts.length - 1 : 0;
    if (opts[idx] === 'retire' && opts.length > 1) idx = (idx + 1) % opts.length;
    if (p.kind === 'college_year') {
      const dc = opts.findIndex((o) => o.startsWith('cy_declare'));
      if (dc >= 0) idx = dc;
    }
    choices.push({ nodeId: p.nodeId, choiceId: opts[idx]! });
  }
  throw new Error('helper: career did not finish');
}
