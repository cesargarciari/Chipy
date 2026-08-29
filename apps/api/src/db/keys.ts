import type { CareerSummaryDto } from '@chipy/shared';

/**
 * Single-table design for the `chipy` table.
 *
 * Access patterns
 * ---------------
 *  1. Put / get one career by id
 *       PK = CAREER#<id>              SK = CAREER
 *  2. Top N careers for a month, highest legacy score first
 *       GSI1PK = LB#<yyyymm>          GSI1SK = <legacyScore:5>#<id>   (query desc, Limit N)
 *  3. Increment the counter for one (node, choice)
 *       PK = AGG#<nodeId>            SK = CHOICE#<choiceId>          (UpdateItem ADD)
 *  4. Read every choice counter for a node (turn counts into percentages)
 *       PK = AGG#<nodeId>            SK begins_with CHOICE#
 *
 * Only GSI1 is needed, and there are no scans on the hot path.
 */

export const GSI1 = 'gsi1';

export interface CareerItem {
  PK: string;
  SK: 'CAREER';
  gsi1pk: string;
  gsi1sk: string;
  type: 'career';
  id: string;
  createdAt: string;
  month: string;
  // Denormalised leaderboard columns (GSI1 projects ALL, so these ride along).
  name: string;
  position: CareerSummaryDto['profile']['position'];
  archetype: CareerSummaryDto['profile']['archetype'];
  legacyGrade: CareerSummaryDto['legacy']['grade'];
  legacyTier: CareerSummaryDto['legacy']['tier'];
  legacyScore: number;
  peakOverall: number;
  seasons: number;
  rings: number;
  mvps: number;
  // The full, authoritative simulation output.
  summary: CareerSummaryDto;
}

export interface ChoiceAggItem {
  PK: string;
  SK: string;
  type: 'choice_agg';
  nodeId: string;
  choiceId: string;
  count: number;
}

export function careerKey(id: string) {
  return { PK: `CAREER#${id}`, SK: 'CAREER' as const };
}

export function leaderboardIndexKey(month: string, legacyScore: number, id: string) {
  return {
    gsi1pk: `LB#${month}`,
    gsi1sk: `${String(Math.max(0, Math.trunc(legacyScore))).padStart(5, '0')}#${id}`,
  };
}

export function choiceAggKey(nodeId: string, choiceId: string) {
  return { PK: `AGG#${nodeId}`, SK: `CHOICE#${choiceId}` };
}

export function choiceAggPartition(nodeId: string) {
  return `AGG#${nodeId}`;
}
