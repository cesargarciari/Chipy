import { runCareerInputSchema } from '@chipy/engine';
import { z } from 'zod';
import { careerSummarySchema, legacySchema } from './career-summary.js';

/** nanoid(12) with the URL-safe alphabet. */
export const ID_REGEX = /^[A-Za-z0-9_-]{12}$/;
export const idSchema = z.string().regex(ID_REGEX, 'invalid career id');

/** `POST /api/careers` body — the exact inputs the engine needs to replay a
 *  *finished* career. `.min(3)` is only a sanity floor (2 prologue + landing);
 *  the engine returning `status: 'complete'` is the real completeness check. */
export const createCareerRequestSchema = runCareerInputSchema.extend({
  choices: runCareerInputSchema.shape.choices.min(3),
});
export type CreateCareerRequest = z.infer<typeof createCareerRequestSchema>;

export const choiceStatSchema = z.object({
  nodeId: z.string(),
  choiceId: z.string(),
  label: z.string().min(1),
  count: z.number().int().nonnegative(),
  /** This pick's share of all careers that reached this node, 0..100. */
  pct: z.number().min(0).max(100),
});
export type ChoiceStat = z.infer<typeof choiceStatSchema>;

export const careerResponseSchema = z.object({
  id: idSchema,
  createdAt: z.iso.datetime(),
  summary: careerSummarySchema,
  choiceStats: z.array(choiceStatSchema),
});
export type CareerResponse = z.infer<typeof careerResponseSchema>;

export const careerParamsSchema = z.object({ id: idSchema });

export const leaderboardQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

export const leaderboardEntrySchema = z.object({
  id: idSchema,
  name: z.string(),
  position: careerSummarySchema.shape.profile.shape.position,
  archetype: careerSummarySchema.shape.profile.shape.archetype,
  legacyGrade: legacySchema.shape.grade,
  legacyTier: legacySchema.shape.tier,
  legacyScore: z.number().int(),
  peakOverall: z.number().int(),
  seasons: z.number().int(),
  rings: z.number().int(),
  mvps: z.number().int(),
  /** Career earnings in $M — denormalised for the board. */
  earnings: z.number().nonnegative(),
  createdAt: z.iso.datetime(),
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

export const leaderboardResponseSchema = z.object({
  month: z.string().regex(/^\d{6}$/),
  entries: z.array(leaderboardEntrySchema),
});
export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number().nonnegative(),
  version: z.string(),
});

export const readyResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  checks: z.object({ dynamodb: z.boolean() }),
});

export const apiErrorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** UTC `YYYYMM`, the partition for a month's leaderboard. */
export function monthKey(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}${m}`;
}

/** Client-side route for a shared career. */
export function buildSharePath(id: string): string {
  return `/c/${id}`;
}
