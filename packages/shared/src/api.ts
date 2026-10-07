import { runCareerInputSchema } from '@chipy/engine';
import { z } from 'zod';
import { careerSummarySchema, legacySchema } from './career-summary.js';

/** nanoid(12) with the URL-safe alphabet. */
export const ID_REGEX = /^[A-Za-z0-9_-]{12}$/;
export const idSchema = z.string().regex(ID_REGEX, 'invalid career id');

/** Body for saving a finished career. The server replays it to check it's complete. */
export const createCareerRequestSchema = runCareerInputSchema.extend({
  choices: runCareerInputSchema.shape.choices.min(3),
});
export type CreateCareerRequest = z.infer<typeof createCareerRequestSchema>;

export const choiceStatSchema = z.object({
  nodeId: z.string(),
  choiceId: z.string(),
  label: z.string().min(1),
  count: z.number().int().nonnegative(),
  /** Percent of careers at this node that made this pick. */
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
  /** Career earnings in millions. */
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

/** UTC year and month, used to group the monthly leaderboard. */
export function monthKey(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}${m}`;
}

/** Web route for a shared career. */
export function buildSharePath(id: string): string {
  return `/c/${id}`;
}
