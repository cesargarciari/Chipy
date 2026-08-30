import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  type DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { describeChoice, type ChoiceSelection } from '@chipy/engine';
import {
  monthKey,
  type CareerSummaryDto,
  type ChoiceStat,
  type LeaderboardEntry,
} from '@chipy/shared';
import {
  GSI1,
  careerKey,
  choiceAggKey,
  choiceAggPartition,
  leaderboardIndexKey,
  type CareerItem,
  type ChoiceAggItem,
} from './keys.js';

export class CareerConflictError extends Error {
  constructor(id: string) {
    super(`Career "${id}" already exists`);
    this.name = 'CareerConflictError';
  }
}

/** Just the slice of a pino/Fastify logger this module needs. */
export interface RepoLogger {
  warn(obj: unknown, msg?: string): void;
}

export interface SaveCareerInput {
  id: string;
  createdAt: string;
  summary: CareerSummaryDto;
}

export class CareerRepo {
  constructor(
    private readonly doc: DynamoDBDocumentClient,
    private readonly table: string,
    private readonly log: RepoLogger,
  ) {}

  /** Cheap round-trip used by the readiness probe. */
  async ping(): Promise<boolean> {
    try {
      await this.doc.send(
        new GetCommand({
          TableName: this.table,
          Key: careerKey('__ping__'),
          ProjectionExpression: 'PK',
        }),
      );
      return true;
    } catch (err) {
      this.log.warn({ err }, 'dynamodb ping failed');
      return false;
    }
  }

  async saveCareer({ id, createdAt, summary }: SaveCareerInput): Promise<CareerItem> {
    const month = monthKey(new Date(createdAt));
    const item: CareerItem = {
      ...careerKey(id),
      ...leaderboardIndexKey(month, summary.legacy.score, id),
      type: 'career',
      id,
      createdAt,
      month,
      name: summary.profile.name,
      position: summary.profile.position,
      archetype: summary.profile.archetype,
      legacyGrade: summary.legacy.grade,
      legacyTier: summary.legacy.tier,
      legacyScore: summary.legacy.score,
      peakOverall: summary.peakOverall,
      seasons: summary.careerTotals.seasons,
      rings: summary.awards.champion ?? 0,
      mvps: summary.awards.mvp ?? 0,
      earnings: Math.round(summary.careerEarnings),
      summary,
    };

    try {
      await this.doc.send(
        new PutCommand({
          TableName: this.table,
          Item: item,
          ConditionExpression: 'attribute_not_exists(PK)',
        }),
      );
    } catch (err) {
      if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
        throw new CareerConflictError(id);
      }
      throw err;
    }
    return item;
  }

  async getCareer(id: string): Promise<CareerItem | null> {
    const res = await this.doc.send(new GetCommand({ TableName: this.table, Key: careerKey(id) }));
    return (res.Item as CareerItem | undefined) ?? null;
  }

  /**
   * Best-effort: the career is already persisted by the time this runs, and a
   * social-proof counter that lags by one is not worth failing a request over.
   * Only "comparable" choices are counted — team offers vary per player, so
   * `describeChoice` returns null and they're skipped.
   */
  async bumpChoiceCounts(choices: ChoiceSelection[]): Promise<void> {
    const comparable = choices.filter((c) => describeChoice(c.nodeId, c.choiceId) !== null);
    const results = await Promise.allSettled(
      comparable.map((choice) =>
        this.doc.send(
          new UpdateCommand({
            TableName: this.table,
            Key: choiceAggKey(choice.nodeId, choice.choiceId),
            UpdateExpression:
              'ADD #count :one SET #type = :type, #nodeId = :nodeId, #choiceId = :choiceId',
            ExpressionAttributeNames: {
              '#count': 'count',
              '#type': 'type',
              '#nodeId': 'nodeId',
              '#choiceId': 'choiceId',
            },
            ExpressionAttributeValues: {
              ':one': 1,
              ':type': 'choice_agg',
              ':nodeId': choice.nodeId,
              ':choiceId': choice.choiceId,
            },
          }),
        ),
      ),
    );
    for (const r of results) {
      if (r.status === 'rejected') this.log.warn({ err: r.reason }, 'choice counter bump failed');
    }
  }

  /** Turn the raw counters into "N% of players also chose X" for each pick. */
  async getChoiceStats(choices: ChoiceSelection[]): Promise<ChoiceStat[]> {
    const comparable = choices.filter((c) => describeChoice(c.nodeId, c.choiceId) !== null);
    const nodeIds = [...new Set(comparable.map((c) => c.nodeId))];
    const totalsByNode = new Map<string, { total: number; counts: Map<string, number> }>();

    await Promise.all(
      nodeIds.map(async (nodeId) => {
        const res = await this.doc.send(
          new QueryCommand({
            TableName: this.table,
            KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
            ExpressionAttributeNames: { '#pk': 'PK', '#sk': 'SK' },
            ExpressionAttributeValues: { ':pk': choiceAggPartition(nodeId), ':sk': 'CHOICE#' },
          }),
        );
        const rows = (res.Items ?? []) as ChoiceAggItem[];
        const counts = new Map(rows.map((row) => [row.choiceId, row.count]));
        const total = rows.reduce((sum, row) => sum + row.count, 0);
        totalsByNode.set(nodeId, { total, counts });
      }),
    );

    return comparable.map((choice) => {
      const node = totalsByNode.get(choice.nodeId);
      const count = node?.counts.get(choice.choiceId) ?? 0;
      const total = node?.total ?? 0;
      return {
        nodeId: choice.nodeId,
        choiceId: choice.choiceId,
        label: describeChoice(choice.nodeId, choice.choiceId) ?? choice.choiceId,
        count,
        pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      };
    });
  }

  async leaderboard(month: string, limit: number): Promise<LeaderboardEntry[]> {
    const res = await this.doc.send(
      new QueryCommand({
        TableName: this.table,
        IndexName: GSI1,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: { '#pk': 'gsi1pk' },
        ExpressionAttributeValues: { ':pk': `LB#${month}` },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );
    return ((res.Items ?? []) as CareerItem[]).map((item) => ({
      id: item.id,
      name: item.name,
      position: item.position,
      archetype: item.archetype,
      legacyGrade: item.legacyGrade,
      legacyTier: item.legacyTier,
      legacyScore: item.legacyScore,
      peakOverall: item.peakOverall,
      seasons: item.seasons,
      rings: item.rings,
      mvps: item.mvps,
      earnings: item.earnings ?? Math.round(item.summary.careerEarnings ?? 0),
      createdAt: item.createdAt,
    }));
  }
}
